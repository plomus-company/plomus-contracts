import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const helperDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(helperDir, "../..");

export function runPnpm(script, { env = {} } = {}) {
  return execFileSync("pnpm", ["run", script], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function runNodeScript(relativePath, { env = {}, registryRoot } = {}) {
  const scriptPath = path.join(repoRoot, relativePath);
  const runEnv = { ...process.env, ...env };
  if (registryRoot) runEnv.PLOMUS_CONTRACTS_ROOT = registryRoot;

  return spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: "utf8",
    env: runEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

// Contracts that live at the repo root rather than under contracts/: a single
// contract mapped to a folder (workflows), or a whole domain (benchmarks, skills).
const ROOT_DIRS = { "commerce-workflows": "workflows" };
const ROOT_DOMAINS = new Set(["benchmarks", "skills"]);
const ROOT_TOP = ["workflows", "benchmarks", "skills"];

// Resolve a contract's folder inside a fixture, mirroring scripts/group.mjs.
function fixtureFolderFor(fixtureRoot, name) {
  if (ROOT_DIRS[name]) return path.join(fixtureRoot, ROOT_DIRS[name]);
  const [domain, ...rest] = name.split("-");
  if (ROOT_DOMAINS.has(domain)) return path.join(fixtureRoot, domain, rest.join("-"));
  return path.join(fixtureRoot, "contracts", name);
}

export function createContractsFixture(t) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plomus-contracts-test-"));
  fs.cpSync(path.join(repoRoot, "contracts"), path.join(fixtureRoot, "contracts"), {
    recursive: true,
  });
  for (const dir of ROOT_TOP) {
    const src = path.join(repoRoot, dir);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(fixtureRoot, dir), { recursive: true });
  }
  fs.mkdirSync(path.join(fixtureRoot, "dist"), { recursive: true });

  t.after(() => fs.rmSync(fixtureRoot, { force: true, recursive: true }));
  return fixtureRoot;
}

export function readFixtureJson(fixtureRoot, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(fixtureRoot, relativePath), "utf8"));
}

export function writeFixtureJson(fixtureRoot, relativePath, value) {
  const target = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

export function scriptOutput(result) {
  return [result.stdout, result.stderr].filter(Boolean).join("\n");
}

// Read a collection's items from the fixture folder.
export function readFixtureCollection(fixtureRoot, name, key) {
  const dir = fixtureFolderFor(fixtureRoot, name);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))[key] ?? []);
}

// Mutate the first matching item of a collection in the fixture's <name>/ folder.
// Returns true if an item was mutated.
export function mutateFixtureItem(fixtureRoot, name, key, matchFn, mutateFn) {
  const apply = (file) => {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    const item = (doc[key] ?? []).find(matchFn);
    if (!item) return false;
    mutateFn(item, doc[key]);
    fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
    return true;
  };
  const dir = fixtureFolderFor(fixtureRoot, name);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    if (apply(path.join(dir, f))) return true;
  }
  return false;
}
