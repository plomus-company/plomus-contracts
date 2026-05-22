import fs from "node:fs";
import path from "node:path";
import { readJson, repoRoot, writeJson } from "./read-json.mjs";

// Top-level manifest of every contract domain: location, dependency edges, and
// the JSON artifacts each ships. Lets a consumer discover the whole registry and
// its cross-domain dependency graph from one file.

const DOMAINS = [
  { name: "commerce", dir: "commerce", dependsOn: [], source: "plomus-commerce-ai-os" },
  { name: "skills", dir: "skills", dependsOn: [], source: "k-skill" },
  { name: "benchmarks", dir: "benchmarks", dependsOn: ["skills", "commerce"], source: "skills+commerce" },
  { name: "distribution", dir: "distribution", dependsOn: ["commerce"], source: "plomus-distribution-ai-os" },
  { name: "protocol", dir: "protocol", dependsOn: ["commerce"], source: "plomus-commerce-ai-os" },
  { name: "platform", dir: "platform", dependsOn: ["commerce"], source: "plomus-commerce-ai-os" },
  { name: "governance", dir: "governance", dependsOn: ["benchmarks"], source: "plomus-gameops-ai-os" },
  { name: "gameops", dir: "gameops", dependsOn: ["governance"], source: "plomus-gameops-ai-os" },
];

// Contracts live in one flat folder: <domain>-<contract>.json files plus
// <domain>-<contract>/ folders (business-unit-split collections).
const entries = fs.readdirSync(path.join(repoRoot, "contracts"), { withFileTypes: true });
const allFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => e.name).sort();
const allFolders = entries.filter((e) => e.isDirectory()).map((e) => `${e.name}/`).sort();

const domains = DOMAINS.map((d) => {
  const files = allFiles.filter((f) => f.startsWith(`${d.name}-`));
  const collections = allFolders.filter((f) => f.startsWith(`${d.name}-`));
  let schemaVersion = null;
  try {
    schemaVersion = readJson(`contracts/${d.name}-base.json`).schemaVersion ?? null;
  } catch {
    schemaVersion = files[0] ? readJson(`contracts/${files[0]}`).schemaVersion ?? null : null;
  }
  return { name: d.name, dependsOn: d.dependsOn, source: d.source, schemaVersion, files, collections };
});

writeJson("dist/plomus-contracts-index.json", {
  schemaVersion: "1.0.0",
  name: "plomus-contracts",
  generatedAt: new Date().toISOString(),
  domainCount: domains.length,
  domains,
});
console.log(`built dist/plomus-contracts-index.json (${domains.length} domains)`);
