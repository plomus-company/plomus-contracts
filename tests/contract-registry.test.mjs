import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { repoRoot, runPnpm } from "./helpers/registry-test-utils.mjs";

test("registry validates and builds a distributable artifact", () => {
  assert.match(runPnpm("format:check"), /contract JSON format passed/);
  assert.match(runPnpm("validate"), /contract validation passed/);
  assert.match(runPnpm("summary"), /built dist\/contract-summary.md/);
  assert.match(runPnpm("build"), /built dist\/plomus-contracts.json/);

  const dist = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "dist/plomus-contracts.json"), "utf8"),
  );
  assert.equal(dist.schemaVersion, "1.0.0");
  assert.ok(dist.contracts.presets.length >= 8);
  assert.ok(dist.contracts.reviewRules.length >= 37);
  assert.ok(
    dist.contracts.workflows.some(
      (workflow) => workflow.workflowId === "apply-change-plan",
    ),
  );

  const summary = fs.readFileSync(
    path.join(repoRoot, "dist/contract-summary.md"),
    "utf8",
  );
  assert.match(summary, /Plomus Contract Summary/);
  assert.match(summary, /Review rules/);
});

test("GitHub update examples are parseable JSON", () => {
  for (const file of [
    "examples/preset.add.json",
    "examples/review-rule.add.json",
    "examples/workflow.add.json",
  ]) {
    const parsed = JSON.parse(fs.readFileSync(path.join(repoRoot, file), "utf8"));
    assert.equal(typeof parsed, "object");
  }
});
