import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./read-json.mjs";

// Business-unit splitting: large collections are stored as a folder of unit
// files — contracts/<domain>-<contract>/<unit>.json (e.g.
// contracts/commerce-review-rules/settlement.json). Small collections stay a
// single contracts/<domain>-<contract>.json file. readContract reads either
// shape transparently; the build re-assembles everything into dist artifacts.

export const safeUnit = (u) => String(u).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Some contracts live in their own top-level folder at the repo root rather than
// under contracts/. ROOT_DIRS maps a single contract to a root folder
// (workflows); ROOT_DOMAINS places a whole domain at the root as
// <domain>/<contract>/ (benchmarks, skills).
const ROOT_DIRS = { "commerce-workflows": "workflows" };
const ROOT_DOMAINS = new Set(["benchmarks", "skills"]);
function folderFor(name) {
  if (ROOT_DIRS[name]) return path.join(repoRoot, ROOT_DIRS[name]);
  const [domain, ...rest] = name.split("-");
  if (ROOT_DOMAINS.has(domain)) return path.join(repoRoot, domain, rest.join("-"));
  return path.join(repoRoot, "contracts", name);
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
