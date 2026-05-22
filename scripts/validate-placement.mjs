import { readContract, readGroups, safeUnit } from "./group.mjs";
import { FOLDER_SPLIT, folderPlacementErrors } from "./taxonomy.mjs";

// Folder coherence across every domain: each item in a foldered collection must
// live in the file named for the safeUnit() of its split field (see
// FOLDER_SPLIT). This generalizes the businessUnit/category placement enforced
// per-domain to all collections, so no item can be silently misfiled. See
// docs/CONTRACT-TAXONOMY.md.

const failures = [];
const fail = (scope, message) => failures.push(`[${scope}] ${message}`);

for (const [name, [key, field]] of Object.entries(FOLDER_SPLIT)) {
  for (const [scope, message] of folderPlacementErrors(name, key, field)) fail(scope, message);
}

// benchmarks-results splits by the *derived* domain of each result's target.
const targetDomain = new Map(readContract("benchmarks-targets", "targets").map((t) => [t.targetId, t.domain]));
for (const { unit, items } of readGroups("benchmarks-results", "results")) {
  for (const r of items) {
    const domain = targetDomain.get(r.targetId);
    // unknown targetId is a separate failure owned by validate-benchmarks.mjs
    if (domain === undefined) continue;
    if (safeUnit(domain) !== unit) {
      fail(`benchmarks-results:${r.targetId}`, `target domain "${domain}" belongs in "${safeUnit(domain)}.json", not "${unit}.json"`);
    }
  }
}

if (failures.length) {
  console.error("folder placement validation failed");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log("folder placement validation passed");
