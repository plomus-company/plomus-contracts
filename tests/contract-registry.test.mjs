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

test("registry validates and builds a distributable artifact", () => {
  assert.match(run("validate"), /contract validation passed/);
  assert.match(run("build"), /built dist\/plomus-contracts.json/);

  const dist = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "dist/plomus-contracts.json"), "utf8"),
  );
  assert.equal(dist.schemaVersion, "1.0.0");
  assert.ok(dist.contracts.presets.length >= 8);
  assert.ok(dist.contracts.reviewRules.length >= 37);
  assert.ok(dist.contracts.workflows.some((workflow) => workflow.workflowId === "apply-change-plan"));
});
