import fs from "node:fs";
import path from "node:path";
import { repoRoot, writeJson } from "./read-json.mjs";
import { readDoc } from "./group.mjs";

// Top-level manifest of every contract domain: location, dependency edges, and
// the contract folders each ships. Lets a consumer discover the whole registry
// and its cross-domain dependency graph from one file.

const DOMAINS = [
  { name: "commerce", root: "contracts", dependsOn: [], source: "plomus-commerce-ai-os" },
  { name: "skills", root: "skills", dependsOn: [], source: "k-skill" },
  { name: "benchmarks", root: "benchmarks", dependsOn: ["skills", "commerce"], source: "skills+commerce" },
  { name: "distribution", root: "contracts", dependsOn: ["commerce"], source: "plomus-distribution-ai-os" },
  { name: "protocol", root: "contracts", dependsOn: ["commerce"], source: "plomus-commerce-ai-os" },
  { name: "platform", root: "contracts", dependsOn: ["commerce"], source: "plomus-commerce-ai-os" },
  { name: "governance", root: "contracts", dependsOn: ["benchmarks"], source: "plomus-gameops-ai-os" },
  { name: "gameops", root: "contracts", dependsOn: ["governance"], source: "plomus-gameops-ai-os" },
];

// Every contract is a folder. Domains live under contracts/<domain>-<contract>/,
// except skills and benchmarks which are split out to <domain>/<contract>/.
const folders = (rel) => fs.readdirSync(path.join(repoRoot, rel), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const domains = DOMAINS.map((d) => {
  const collections = d.root === "contracts"
    ? folders("contracts").filter((f) => f.startsWith(`${d.name}-`)).map((f) => `contracts/${f}/`)
    : folders(d.root).map((f) => `${d.root}/${f}/`);
  // workflows are separated into a top-level workflows/ folder (commerce concern)
  if (d.name === "commerce" && fs.existsSync(path.join(repoRoot, "workflows"))) {
    collections.push("workflows/");
  }
  let schemaVersion = null;
  try {
    schemaVersion = readDoc(`${d.name}-base`).schemaVersion ?? null;
  } catch {
    schemaVersion = "1.0.0";
  }
  return { name: d.name, dependsOn: d.dependsOn, source: d.source, schemaVersion, collections };
});

writeJson("dist/plomus-contracts-index.json", {
  schemaVersion: "1.0.0",
  name: "plomus-contracts",
  generatedAt: new Date().toISOString(),
  domainCount: domains.length,
  domains,
});
console.log(`built dist/plomus-contracts-index.json (${domains.length} domains)`);
