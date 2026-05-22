import { readDoc } from "../scripts/group.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("gameops registry validates and builds a distributable artifact", () => {
  assert.match(run("validate:gameops"), /gameops contract validation passed/);
  assert.match(run("build:gameops"), /built dist\/plomus-gameops.json/);

  const dist = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-gameops.json"), "utf8"));
  assert.equal(dist.schemaVersion, "1.0.0");
  assert.ok(dist.contracts.adapters.some((a) => a.adapterId === "sanction.apply"));
  assert.ok(dist.enums.incidentSeverities.includes("S2"));

  // playbook risk levels resolve against the governance domain
  const govRisks = new Set(
    readDoc("governance-base").riskLevels,
  );
  for (const p of dist.contracts.playbooks) {
    assert.ok(govRisks.has(p.riskLevel), `playbook ${p.playbookId} risk ${p.riskLevel} not in governance`);
  }
});
