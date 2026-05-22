import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./read-json.mjs";

const checkOnly = process.argv.includes("--check");

// Every contract JSON under contracts/<role>/ (tool/agent/task/governance/
// transaction/legal/foundation + the benchmarks measurement layer), plus the
// example payloads.
function listJson(relDir) {
  const abs = path.join(repoRoot, relDir);
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) out.push(...listJson(rel));
    else if (entry.name.endsWith(".json")) out.push(rel);
  }
  return out;
}
const ROOTS = ["contracts", "examples"];
const targets = ROOTS.flatMap((root) => listJson(root)).sort();

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
