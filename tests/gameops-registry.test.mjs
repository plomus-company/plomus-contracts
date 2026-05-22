import { readDoc } from "../scripts/group.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("gameops splits across the tool (adapters) and agent (agents/playbooks) bundles", () => {
  assert.match(run("validate:gameops"), /gameops contract validation passed/);
  assert.match(run("build:tool"), /built dist\/plomus-tool.json/);
  assert.match(run("build:agent"), /built dist\/plomus-agent.json/);

  // adapters are a tool surface (LiveOps execution adapters)
  const tool = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-tool.json"), "utf8"));
  assert.ok(tool.members.gameopsAdapters.contracts.adapters.some((a) => a.adapterId === "sanction.apply"));

  // agents, playbooks, and the gameops enums are an agent-capability surface
  const agent = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-agent.json"), "utf8"));
  assert.equal(agent.schemaVersion, "1.0.0");
  assert.equal(agent.type, "agent");
  const gameops = agent.members.gameops;
  assert.ok(gameops.enums.incidentSeverities.includes("S2"));

  // playbook risk levels resolve against the governance domain
  const govRisks = new Set(
    readDoc("governance-base").riskLevels,
  );
  for (const p of gameops.contracts.playbooks) {
    assert.ok(govRisks.has(p.riskLevel), `playbook ${p.playbookId} risk ${p.riskLevel} not in governance`);
  }
});
