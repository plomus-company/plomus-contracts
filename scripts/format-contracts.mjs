import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./read-json.mjs";

const checkOnly = process.argv.includes("--check");
const targets = [
  "contracts/v1/base.json",
  "contracts/v1/presets.json",
  "contracts/v1/review-rules.json",
  "contracts/v1/workflows.json",
  "examples/preset.add.json",
  "examples/review-rule.add.json",
  "examples/workflow.add.json",
  "contracts/skills/v1/base.json",
  "contracts/skills/v1/catalog.json",
  "contracts/skills/v1/proxy-routes.json",
  "contracts/skills/v1/credentials.json",
  "contracts/skills/v1/data-sources.json",
  "contracts/benchmarks/v1/base.json",
  "contracts/benchmarks/v1/models.json",
  "contracts/benchmarks/v1/metrics.json",
  "contracts/benchmarks/v1/targets.json",
  "contracts/benchmarks/v1/results.json",
  "contracts/benchmarks/v1/rollups.json",
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
