import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { repoRoot, runPnpm } from "./helpers/registry-test-utils.mjs";

test("benchmarks registry validates and builds a distributable artifact", () => {
  assert.match(runPnpm("validate:benchmarks"), /benchmarks contract validation passed/);
  assert.match(runPnpm("build:benchmarks"), /built dist\/plomus-benchmarks.json/);

  const dist = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "dist/plomus-benchmarks.json"), "utf8"),
  );
  assert.equal(dist.schemaVersion, "1.0.0");
  assert.ok(dist.contracts.models.length >= 8);
  assert.ok(dist.contracts.metrics.length >= 6);
  assert.ok(dist.contracts.targets.length >= 100);
  assert.ok(dist.contracts.results.length > 0);

  // every benchmark target references a real skill or workflow id
  const targetIds = new Set(dist.contracts.targets.map((t) => t.targetId));
  for (const result of dist.contracts.results) {
    assert.ok(targetIds.has(result.targetId), `result targets unknown ${result.targetId}`);
  }
});
