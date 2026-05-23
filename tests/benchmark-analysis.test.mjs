import assert from "node:assert/strict";
import test from "node:test";
import { runNodeScript, scriptOutput } from "./helpers/registry-test-utils.mjs";

// Smoke test for the experiment debugging/analysis tool: it must read the committed
// run records and emit every report section without error.
test("analyze:benchmarks reads run records and reports all analysis sections", () => {
  const res = runNodeScript("scripts/analyze-benchmarks.mjs");
  const out = scriptOutput(res);
  assert.equal(res.status, 0, out);
  for (const section of [
    /# Benchmark experiment analysis/,
    /## Runs/,
    /## Coverage \(committed measured results\)/,
    /## Failures/,
    /## Reproducibility & latency stability/,
    /## Regression/,
    /## Improvement candidates/,
  ]) {
    assert.match(out, section);
  }
});
