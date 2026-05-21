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
