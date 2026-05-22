import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./read-json.mjs";

const checkOnly = process.argv.includes("--check");
const targets = [
  "contracts/commerce-base.json",
  "contracts/commerce-presets.json",
  "contracts/commerce-review-rules.json",
  "contracts/commerce-workflows.json",
  "examples/preset.add.json",
  "examples/review-rule.add.json",
  "examples/workflow.add.json",
  "contracts/skills-base.json",
  "contracts/skills-catalog.json",
  "contracts/skills-proxy-routes.json",
  "contracts/skills-credentials.json",
  "contracts/skills-data-sources.json",
  "contracts/skills-categories.json",
  "contracts/skills-upstreams.json",
  "contracts/skills-packages.json",
  "contracts/skills-mcp.json",
  "contracts/skills-proxy.json",
  "contracts/benchmarks-base.json",
  "contracts/benchmarks-models.json",
  "contracts/benchmarks-metrics.json",
  "contracts/benchmarks-targets.json",
  "contracts/benchmarks-results.json",
  "contracts/benchmarks-rollups.json",
  "contracts/distribution-base.json",
  "contracts/distribution-presets.json",
  "contracts/distribution-fields.json",
  "contracts/distribution-experimental-rules.json",
  "contracts/protocol-base.json",
  "contracts/protocol-endpoints.json",
  "contracts/protocol-sync-event.json",
  "contracts/protocol-payloads.json",
  "contracts/protocol-telegram.json",
  "contracts/platform-base.json",
  "contracts/platform-frontmatter.json",
  "contracts/platform-event-types.json",
  "contracts/platform-error-codes.json",
  "contracts/governance-base.json",
  "contracts/governance-roles.json",
  "contracts/governance-approval.json",
  "contracts/governance-execution-lifecycle.json",
  "contracts/governance-model-routing.json",
  "contracts/gameops-base.json",
  "contracts/gameops-adapters.json",
  "contracts/gameops-agents.json",
  "contracts/gameops-playbooks.json",
  "contracts/gameops-fields.json",
];

const changed = [];

for (const relativePath of targets) {
  const target = path.join(repoRoot, relativePath);
  const parsed = JSON.parse(fs.readFileSync(target, "utf8"));
  const formatted = `${JSON.stringify(parsed, null, 2)}\n`;
  const current = fs.readFileSync(target, "utf8");
  if (current !== formatted) {
    changed.push(relativePath);
    if (!checkOnly) fs.writeFileSync(target, formatted);
  }
}

if (changed.length && checkOnly) {
  console.error("contract JSON format check failed");
  for (const file of changed) console.error(`- ${file}`);
  process.exit(1);
}

if (changed.length) {
  console.log(`formatted ${changed.length} contract files`);
} else {
  console.log("contract JSON format passed");
}
