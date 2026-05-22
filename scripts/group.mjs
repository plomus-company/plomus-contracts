import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./read-json.mjs";

// Business-unit splitting: large collections are stored as a folder of unit
// files — contracts/<domain>-<contract>/<unit>.json (e.g.
// contracts/commerce-review-rules/settlement.json). Small collections stay a
// single contracts/<domain>-<contract>.json file. readContract reads either
// shape transparently; the build re-assembles everything into dist artifacts.

const contractsDir = () => path.join(repoRoot, "contracts");
export const safeUnit = (u) => String(u).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Read a collection's items, whether a single <name>.json file or a <name>/
// folder of per-unit files. Returns the concatenated array under `key`.
export function readContract(name, key) {
  const dir = contractsDir();
  const single = path.join(dir, `${name}.json`);
  if (fs.existsSync(single)) return JSON.parse(fs.readFileSync(single, "utf8"))[key] ?? [];
  const folder = path.join(dir, name);
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(folder, f), "utf8"))[key] ?? []);
}

// Write a collection split by business unit into contracts/<name>/<unit>.json,
// pruning stale unit files.
export function writeGroup(name, key, items, unitOf) {
  const dir = path.join(contractsDir(), name);
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
