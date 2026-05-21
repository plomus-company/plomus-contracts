import { readJson } from "./read-json.mjs";

// Cross-domain consistency: catches drift that per-domain validators cannot,
// where two domains independently encode the same shared concept. Each per-domain
// validator already enforces references into its dependencies; this guards the
// few places where the SAME vocabulary is duplicated across domains.

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });
const eq = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// 1) domain-object statuses must agree between platform.frontmatter (canonical)
//    and distribution.domain-statuses (duplicate). They are both derived from the
//    same product Zod schemas, so any divergence is a drift bug.
const platformDocs = readJson("contracts/platform/v1/frontmatter.json").documents ?? [];
const distObjects = readJson("contracts/distribution/v1/domain-statuses.json").objects ?? [];
const platformByObj = new Map(platformDocs.map((d) => [d.documentType, d]));
const distByObj = new Map(distObjects.map((o) => [o.object, o]));

for (const obj of distByObj.keys()) {
  const scope = `domain-status:${obj}`;
  const p = platformByObj.get(obj);
  const d = distByObj.get(obj);
  if (!p) {
    fail(scope, `distribution defines '${obj}' statuses but platform.frontmatter does not (platform is canonical).`);
    continue;
  }
  if (!eq(p.statuses, d.statuses)) {
    fail(scope, `statuses differ between platform.frontmatter and distribution.domain-statuses.`);
  }
  if (p.statusField !== d.statusField) {
    fail(scope, `statusField differs: platform='${p.statusField}' distribution='${d.statusField}'.`);
  }
  if (!eq(p.extraEnums ?? {}, d.extraEnums ?? {})) {
    fail(scope, `extraEnums differ between platform.frontmatter and distribution.domain-statuses.`);
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
