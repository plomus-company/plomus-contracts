import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { repoRoot, runNodeScript, scriptOutput } from "./helpers/registry-test-utils.mjs";

// Locks in the external-consumption contract (see README "외부 애플리케이션에서 활용"):
// every package export resolves to a self-describing built artifact, the role
// bundles share a uniform descriptor, and the index manifest discovers them all.
//
// Builds into an ISOLATED registry root via the package-manager-agnostic
// build-all.mjs — the same node-only path `prepare` runs on a git/SHA install — so
// it both proves that path works and avoids racing the shared dist/ that other
// test files rebuild in parallel.

const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const ROLES = ["tool", "agent", "task", "governance", "transaction", "legal", "foundation"];

let root; // isolated fixture root
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "plomus-consume-"));
  fs.cpSync(path.join(repoRoot, "contracts"), path.join(root, "contracts"), { recursive: true });
  fs.mkdirSync(path.join(root, "dist"), { recursive: true });
  // dist/ is git-ignored; build-all.mjs is what `prepare` runs to materialise it.
  const res = runNodeScript("scripts/build-all.mjs", { registryRoot: root });
  assert.equal(res.status, 0, scriptOutput(res));
});

after(() => root && fs.rmSync(root, { force: true, recursive: true }));

test("every JSON export resolves to a built, self-describing artifact", () => {
  for (const [key, target] of Object.entries(pkg.exports)) {
    if (key === "./package.json" || typeof target !== "string" || !target.endsWith(".json")) continue;
    assert.ok(fs.existsSync(path.join(root, target)), `export ${key} → ${target} not built`);
    const o = read(target);
    assert.equal(o.schemaVersion, "1.0.0", `${target} missing schemaVersion`);
    assert.ok(typeof o.name === "string" && o.name.length > 0, `${target} missing name`);
  }
});

test("role bundles share a uniform descriptor (type + members); benchmarks is the measurement layer", () => {
  for (const r of ROLES) {
    const o = read(`dist/plomus-${r}.json`);
    assert.equal(o.type, r, `plomus-${r}.json type`);
    assert.ok(o.members && Object.keys(o.members).length > 0, `plomus-${r}.json has members`);
  }
  const b = read("dist/plomus-benchmarks.json");
  assert.equal(b.type, "benchmarks");
  assert.ok(b.contracts.models.length > 0, "benchmarks ships measured contracts");
});

test("the default export is the discovery manifest", () => {
  assert.match(pkg.exports["."], /plomus-contracts-index\.json$/);
  assert.match(pkg.exports["./index"], /plomus-contracts-index\.json$/);
});

test("index manifest discovers every exported role with an existing artifact and valid deps", () => {
  const idx = read("dist/plomus-contracts-index.json");
  assert.equal(idx.layout, "contract-type");
  const types = new Set(idx.types.map((t) => t.type));

  // every role export (./tool … ./benchmarks, excluding ./index) is a manifest type
  const exportRoles = Object.keys(pkg.exports)
    .filter((k) => /^\.\/[a-z]+$/.test(k) && k !== "./index")
    .map((k) => k.slice(2));
  for (const r of exportRoles) assert.ok(types.has(r), `export ./${r} absent from manifest`);

  for (const t of idx.types) {
    assert.ok(fs.existsSync(path.join(root, t.artifact)), `manifest artifact ${t.artifact} missing`);
    assert.ok(t.folders.length > 0, `${t.type} lists no folders`);
    assert.ok(t.folders.every((f) => f.startsWith("contracts/")), `${t.type} folders not under contracts/`);
    for (const dep of t.dependsOn) assert.ok(types.has(dep), `${t.type} dependsOn unknown ${dep}`);
  }
});

test("prepare is package-manager-agnostic so git/SHA installs build dist", () => {
  assert.match(pkg.scripts.prepare, /node scripts\/build-all\.mjs/);
});

// The downstream products (../plomus-{gameops,distribution,commerce}-ai-os) pin
// these exact deep bundle paths to vendor/sync our contracts. They are the de-facto
// consumer interface, so lock them here: a refactor that renames a member key would
// silently break those products, and this test catches it first.
test("downstream consumer (*-ai-os) bundle paths are stable", () => {
  const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const consumed = {
    "dist/plomus-tool.json": ["members.skills.contracts.skills", "members.gameopsAdapters.contracts.adapters"],
    "dist/plomus-governance.json": [
      "members.governance.enums",
      "members.governance.contracts.roles",
      "members.governance.contracts.approval",
      "members.governance.contracts.modelRouting",
      "members.governance.contracts.executionLifecycle",
    ],
    "dist/plomus-agent.json": [
      "members.gameops.enums",
      "members.gameops.incidentSeverityThresholds",
      "members.gameops.contracts.agents",
      "members.gameops.contracts.playbooks",
    ],
    "dist/plomus-benchmarks.json": ["contracts.models"],
  };
  for (const [bundle, paths] of Object.entries(consumed)) {
    const o = read(bundle);
    for (const p of paths) {
      assert.ok(get(o, p) != null, `${bundle}#${p} is consumed by a *-ai-os product and must stay present`);
    }
  }
});
