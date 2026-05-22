import { readContract } from "../scripts/group.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("governance registry validates and builds a distributable artifact", () => {
  assert.match(run("validate:governance"), /governance contract validation passed/);
  assert.match(run("build:governance"), /built dist\/plomus-governance.json/);

  const dist = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-governance.json"), "utf8"));
  assert.equal(dist.schemaVersion, "1.0.0");
  // A2: execution state machine
  assert.ok(dist.enums.executionStates.includes("rollback_required"));
  // A3: multi-party approval policy
  assert.ok(dist.contracts.approval.policies.some((p) => p.policy === "admin_multi" && p.requiredApprovals === 2));

  // A1: every risk→model status resolves to a real benchmarks model status
  const benchStatuses = new Set(
    readContract("benchmarks-models", "models").map((m) => m.status),
  );
  for (const r of dist.contracts.modelRouting.riskModelStatus) {
    assert.ok(benchStatuses.has(r.modelStatus), `risk ${r.riskLevel} → ${r.modelStatus} has no model`);
  }
});
