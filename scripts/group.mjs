import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./read-json.mjs";

// Business-unit splitting: large collections are stored as a folder of unit
// files — contracts/<domain>-<contract>/<unit>.json (e.g.
// contracts/commerce-review-rules/settlement.json). Small collections stay a
// single contracts/<domain>-<contract>.json file. readContract reads either
// shape transparently; the build re-assembles everything into dist artifacts.

export const safeUnit = (u) => String(u).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Contract-type layout: every contract folder lives under its contract-role root
// — tool/ (Tool & API), agent/ (Agent capability), task/ (Task & delegation),
// governance/ (Behavioral & governance), foundation/ (shared vocabulary). The
// folder name keeps its <domain>-<contract> logical id so the source system stays
// legible. benchmarks is a measurement layer, not a contract role, so it stays at
// the repo root as benchmarks/<collection>/. This map is the single source of
// truth for placement; see docs/CONTRACT-GLOSSARY.md and docs/CONTRACT-TAXONOMY.md.
export const TYPE_OF = {
  // tool — how to call tools, APIs, and wire protocols
  "skills-base": "tool", "skills-catalog": "tool", "skills-categories": "tool",
  "skills-credentials": "tool", "skills-data-sources": "tool", "skills-mcp": "tool",
  "skills-packages": "tool", "skills-proxy": "tool", "skills-proxy-routes": "tool",
  "skills-upstreams": "tool",
  "protocol-base": "tool", "protocol-endpoints": "tool", "protocol-payloads": "tool",
  "protocol-sync-event": "tool", "protocol-telegram": "tool",
  "gameops-adapters": "tool",
  // agent — what an agent is and what it can do
  "gameops-base": "agent", "gameops-agents": "agent", "gameops-playbooks": "agent",
  "gameops-fields": "agent",
  // task — what work runs, under what recipe and safety profile
  "commerce-presets": "task", "commerce-workflows": "task", "distribution-presets": "task",
  // governance — rules, roles, lifecycle, recovery the agent must obey
  "governance-base": "governance", "governance-roles": "governance",
  "governance-approval": "governance", "governance-execution-lifecycle": "governance",
  "governance-model-routing": "governance",
  "commerce-review-rules": "governance", "distribution-experimental-rules": "governance",
  // transaction — machine payment/settlement: budgets, commission, refund, proof
  "transaction-base": "transaction", "transaction-budgets": "transaction",
  "transaction-settlement": "transaction",
  // legal — legal document contracts: ToS, privacy, disclosure, partner, refund
  "legal-base": "legal", "legal-documents": "legal", "legal-disclosures": "legal",
  // foundation — shared vocabulary (not a contract role itself)
  "commerce-base": "foundation", "distribution-base": "foundation", "distribution-fields": "foundation",
  "platform-base": "foundation", "platform-frontmatter": "foundation",
  "platform-event-types": "foundation", "platform-error-codes": "foundation",
};

// All contract roles live under contracts/<role>/ to keep the repo root tidy.
function folderFor(name) {
  const [domain, ...rest] = name.split("-");
  if (domain === "benchmarks") return path.join(repoRoot, "contracts", "benchmarks", rest.join("-"));
  const type = TYPE_OF[name];
  if (!type) throw new Error(`group.mjs: no contract-type mapping for "${name}" (add it to TYPE_OF)`);
  return path.join(repoRoot, "contracts", type, name);
}
// Every contract is foldered, so there is no flat single file to prefer.
const singleFor = () => null;

// Read a collection's items, whether a single <name>.json file or a folder of
// per-unit files. Returns the concatenated array under `key`.
export function readContract(name, key) {
  const single = singleFor(name);
  if (single && fs.existsSync(single)) return JSON.parse(fs.readFileSync(single, "utf8"))[key] ?? [];
  const folder = folderFor(name);
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(folder, f), "utf8"))[key] ?? []);
}

// Like readContract, but preserves which file each item came from. Returns
// [{ unit, items }] where unit is the file stem (the business unit / category
// the file is named for). Used to enforce folder-placement invariants.
export function readGroups(name, key) {
  const folder = folderFor(name);
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({
      unit: f.replace(/\.json$/, ""),
      items: JSON.parse(fs.readFileSync(path.join(folder, f), "utf8"))[key] ?? [],
    }));
}

const innerName = (name) => name.split("-").slice(1).join("-");

// Read a single-object (config) contract — either a flat <name>.json file or the
// one file inside its contracts/<name>/ folder.
export function readDoc(name) {
  const single = singleFor(name);
  if (single && fs.existsSync(single)) return JSON.parse(fs.readFileSync(single, "utf8"));
  const folder = folderFor(name);
  const file = fs.readdirSync(folder).find((f) => f.endsWith(".json"));
  return JSON.parse(fs.readFileSync(path.join(folder, file), "utf8"));
}

// Write a single-object contract as the one file inside contracts/<name>/.
export function writeDoc(name, obj) {
  const dir = folderFor(name);
  fs.mkdirSync(dir, { recursive: true });
  const inner = `${innerName(name)}.json`;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".json") && f !== inner) fs.rmSync(path.join(dir, f));
  }
  fs.writeFileSync(path.join(dir, inner), `${JSON.stringify(obj, null, 2)}\n`);
}

// Write a collection split by business unit into its folder, pruning stale files.
export function writeGroup(name, key, items, unitOf) {
  const dir = folderFor(name);
  fs.mkdirSync(dir, { recursive: true });
  const groups = {};
  for (const item of items) {
    const unit = safeUnit(unitOf(item)) || "general";
    (groups[unit] ??= []).push(item);
  }
  const keep = new Set(Object.keys(groups).map((u) => `${u}.json`));
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".json") && !keep.has(f)) fs.rmSync(path.join(dir, f));
  }
  for (const [unit, group] of Object.entries(groups)) {
    fs.writeFileSync(path.join(dir, `${unit}.json`), `${JSON.stringify({ schemaVersion: "1.0.0", [key]: group }, null, 2)}\n`);
  }
  return Object.keys(groups).length;
}
