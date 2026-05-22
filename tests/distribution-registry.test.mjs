import { readContract } from "../scripts/group.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

function run(script) {
  return execFileSync("pnpm", ["run", script], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("distribution validates and splits across the task (preset) and governance (rules) bundles", () => {
  assert.match(run("validate:distribution"), /distribution contract validation passed/);
  assert.match(run("build:task"), /built dist\/plomus-task.json/);
  assert.match(run("build:governance"), /built dist\/plomus-governance.json/);

  // A1: the PLOMUS_DISTRIBUTION onboarding preset ships in the task bundle
  const task = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-task.json"), "utf8"));
  const presets = task.members.distribution.contracts.presets;
  assert.ok(presets.some((p) => p.presetId === "PLOMUS_DISTRIBUTION"));

  // C: experimental rules are governance and ship in the governance bundle
  const governance = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-governance.json"), "utf8"));
  const experimentalRules = governance.members.distribution.contracts.experimentalRules;
  assert.ok(experimentalRules.length >= 8);

  // every preset enabledRule resolves against the public commerce review-rules
  const commerceRules = new Set(
    readContract("commerce-review-rules", "reviewRules").map((r) => r.ruleId),
  );
  for (const preset of presets) {
    for (const ruleId of preset.enabledRules) {
      assert.ok(commerceRules.has(ruleId), `preset rule ${ruleId} missing from commerce baseline`);
    }
  }
  // experimental rules must be additive (not already ACTIVE in commerce)
  for (const rule of experimentalRules) {
    assert.ok(!commerceRules.has(rule.ruleId), `experimental rule ${rule.ruleId} collides with commerce baseline`);
  }
});
