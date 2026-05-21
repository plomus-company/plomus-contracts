import fs from "node:fs";
import path from "node:path";
import { readJson, repoRoot, writeJson } from "./read-json.mjs";

// Top-level manifest of every contract domain: location, dependency edges, and
// the JSON artifacts each ships. Lets a consumer discover the whole registry and
// its cross-domain dependency graph from one file.

const DOMAINS = [
  { name: "commerce", dir: "contracts/commerce/v1", dependsOn: [], source: "plomus-commerce-ai-os" },
  { name: "skills", dir: "contracts/skills/v1", dependsOn: [], source: "k-skill" },
  { name: "benchmarks", dir: "contracts/benchmarks/v1", dependsOn: ["skills", "commerce"], source: "skills+commerce" },
  { name: "distribution", dir: "contracts/distribution/v1", dependsOn: ["commerce"], source: "plomus-distribution-ai-os" },
  { name: "protocol", dir: "contracts/protocol/v1", dependsOn: ["commerce"], source: "plomus-commerce-ai-os" },
  { name: "platform", dir: "contracts/platform/v1", dependsOn: ["commerce"], source: "plomus-commerce-ai-os" },
  { name: "governance", dir: "contracts/governance/v1", dependsOn: ["benchmarks"], source: "plomus-gameops-ai-os" },
  { name: "gameops", dir: "contracts/gameops/v1", dependsOn: ["governance"], source: "plomus-gameops-ai-os" },
];

const domains = DOMAINS.map((d) => {
  const abs = path.join(repoRoot, d.dir);
  const files = fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".json"))
    .sort();
  let schemaVersion = null;
  try {
    schemaVersion = readJson(path.join(d.dir, "base.json")).schemaVersion ?? null;
  } catch {
    schemaVersion = readJson(path.join(d.dir, files[0])).schemaVersion ?? null;
  }
  return { ...d, schemaVersion, files };
});

writeJson("dist/plomus-contracts-index.json", {
  schemaVersion: "1.0.0",
  name: "plomus-contracts",
  generatedAt: new Date().toISOString(),
  domainCount: domains.length,
  domains,
});
console.log(`built dist/plomus-contracts-index.json (${domains.length} domains)`);
