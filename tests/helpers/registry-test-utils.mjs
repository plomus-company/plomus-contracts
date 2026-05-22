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

export function createContractsFixture(t) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plomus-contracts-test-"));
  fs.cpSync(path.join(repoRoot, "contracts"), path.join(fixtureRoot, "contracts"), {
    recursive: true,
  });
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

// Mutate the first matching item of a collection in the fixture, whether it is a
// single contracts/<name>.json file or a contracts/<name>/ folder of
// business-unit files. Returns true if an item was mutated.
export function mutateFixtureItem(fixtureRoot, name, key, matchFn, mutateFn) {
  const apply = (file) => {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    const item = (doc[key] ?? []).find(matchFn);
    if (!item) return false;
    mutateFn(item, doc[key]);
    fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
    return true;
  };
  const single = path.join(fixtureRoot, "contracts", `${name}.json`);
  if (fs.existsSync(single)) return apply(single);
  const dir = path.join(fixtureRoot, "contracts", name);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    if (apply(path.join(dir, f))) return true;
  }
  return false;
}
