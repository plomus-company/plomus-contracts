import fs from "node:fs";
import path from "node:path";
import { repoRoot, writeJson } from "./read-json.mjs";

// Top-level manifest of the contract registry, organised by contract type. Each
// type ships one dist bundle assembled from one or more source domains; the
// dependsOn edges are read-only cross-references between types. Lets a consumer
// discover the whole registry and its dependency graph from one file. See
// docs/CONTRACT-GLOSSARY.md and docs/CONTRACT-TAXONOMY.md.

const TYPES = [
  { type: "foundation", artifact: "dist/plomus-foundation.json", domains: ["commerce", "distribution", "platform"], dependsOn: [] },
  { type: "tool", artifact: "dist/plomus-tool.json", domains: ["skills", "protocol", "gameops"], dependsOn: ["foundation"] },
  { type: "governance", artifact: "dist/plomus-governance.json", domains: ["governance", "commerce", "distribution"], dependsOn: ["foundation", "benchmarks"] },
  { type: "agent", artifact: "dist/plomus-agent.json", domains: ["gameops"], dependsOn: ["governance", "foundation"] },
  { type: "task", artifact: "dist/plomus-task.json", domains: ["commerce", "distribution"], dependsOn: ["foundation", "governance"] },
  { type: "benchmarks", artifact: "dist/plomus-benchmarks.json", domains: ["benchmarks"], dependsOn: ["tool", "task"] },
];

const ROOT_OF = { benchmarks: "benchmarks" }; // benchmarks stays at the repo root

const folders = (type) => {
  const root = path.join(repoRoot, ROOT_OF[type] ?? type);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => `${ROOT_OF[type] ?? type}/${e.name}/`)
    .sort();
};

const types = TYPES.map((t) => ({
  type: t.type,
  artifact: t.artifact,
  domains: t.domains,
  dependsOn: t.dependsOn,
  folders: folders(t.type),
}));

writeJson("dist/plomus-contracts-index.json", {
  schemaVersion: "1.0.0",
  name: "plomus-contracts",
  layout: "contract-type",
  generatedAt: new Date().toISOString(),
  typeCount: types.length,
  types,
});
console.log(`built dist/plomus-contracts-index.json (${types.length} contract types)`);
