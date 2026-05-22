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

test("distribution registry validates and builds a distributable artifact", () => {
  assert.match(run("validate:distribution"), /distribution contract validation passed/);
  assert.match(run("build:distribution"), /built dist\/plomus-distribution.json/);

  const dist = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "dist/plomus-distribution.json"), "utf8"),
  );
  assert.equal(dist.schemaVersion, "1.0.0");

  // A1: the PLOMUS_DISTRIBUTION preset is present
  assert.ok(dist.contracts.presets.some((p) => p.presetId === "PLOMUS_DISTRIBUTION"));
  // C: experimental rules captured
  assert.ok(dist.contracts.experimentalRules.length >= 8);

  // every preset enabledRule resolves against the public commerce review-rules
  // contract (split by business unit into a folder of files)
  const rulesDir = path.join(repoRoot, "contracts/commerce-review-rules");
  const commerceRules = new Set(
    fs
      .readdirSync(rulesDir)
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => JSON.parse(fs.readFileSync(path.join(rulesDir, f), "utf8")).reviewRules.map((r) => r.ruleId)),
  );
  for (const preset of dist.contracts.presets) {
    for (const ruleId of preset.enabledRules) {
      assert.ok(commerceRules.has(ruleId), `preset rule ${ruleId} missing from commerce baseline`);
    }
  }
  // experimental rules must be additive (not already ACTIVE in commerce)
  for (const rule of dist.contracts.experimentalRules) {
    assert.ok(!commerceRules.has(rule.ruleId), `experimental rule ${rule.ruleId} collides with commerce baseline`);
  }
});
