import { readJson } from "./read-json.mjs";

// Cross-domain consistency: catches drift that per-domain validators cannot,
// where two domains independently encode the same shared concept. Each per-domain
// validator already enforces references into its dependencies; this guards the
// few places where the SAME vocabulary is duplicated across domains.

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });
const eq = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// 1) domain-object lifecycle statuses appear in two places by design:
//    commerce core.statuses (canonical enum registry) and platform.frontmatter
//    (richer field contract). Guard that they agree for every domain object.
const platformDocs = readJson("contracts/platform/v1/frontmatter.json").documents ?? [];
const platformStatusByObj = new Map(platformDocs.map((d) => [d.documentType, d.statuses ?? []]));
const commerceStatuses = readJson("contracts/v1/base.json").core?.statuses ?? {};
for (const obj of ["product", "order", "claim", "settlement"]) {
  const platform = platformStatusByObj.get(obj);
  const commerce = commerceStatuses[obj];
  if (!platform) fail("domain-status", `platform.frontmatter must define lifecycle object '${obj}'.`);
  if (!commerce) fail("domain-status", `commerce core.statuses must define '${obj}'.`);
  if (platform && commerce && !eq(platform, commerce)) {
    fail("domain-status", `'${obj}' statuses differ between commerce core.statuses and platform.frontmatter.`);
  }
}

// 2) governance is the single source of operational risk levels. gameops must not
//    redefine its own risk-level enum (it should only reference governance's).
const gameopsBase = readJson("contracts/gameops/v1/base.json");
if ("riskLevels" in gameopsBase) {
  fail("risk-levels", "gameops must not define riskLevels; reference governance.riskLevels instead.");
}

// 3) governance.model-routing target statuses must be a subset of the benchmarks
//    model-status vocabulary (defence-in-depth; governance validator also checks
//    that a model actually exists for each).
const benchStatuses = new Set(readJson("contracts/benchmarks/v1/base.json").modelStatuses ?? []);
const routing = readJson("contracts/governance/v1/model-routing.json").riskModelStatus ?? [];
for (const r of routing) {
  if (!benchStatuses.has(r.modelStatus)) {
    fail("model-routing", `governance routes ${r.riskLevel}→${r.modelStatus}, not a benchmarks model status.`);
  }
}

// 4) gameops playbook risk levels + approval policies must resolve in governance.
const govRisk = new Set(readJson("contracts/governance/v1/base.json").riskLevels ?? []);
const govPolicies = new Set(readJson("contracts/governance/v1/base.json").approvalPolicies ?? []);
for (const pb of readJson("contracts/gameops/v1/playbooks.json").playbooks ?? []) {
  if (!govRisk.has(pb.riskLevel)) fail(`playbook:${pb.playbookId}`, `riskLevel '${pb.riskLevel}' not in governance.`);
  for (const step of pb.steps ?? []) {
    if (step.approvalPolicy && !govPolicies.has(step.approvalPolicy)) {
      fail(`playbook:${pb.playbookId}`, `approvalPolicy '${step.approvalPolicy}' not in governance.`);
    }
  }
}

if (failures.length) {
  console.error("cross-domain consistency validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}
console.log("cross-domain consistency validation passed");
