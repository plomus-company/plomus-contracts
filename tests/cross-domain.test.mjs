import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("cross-domain consistency holds and the registry index builds", () => {
  assert.match(run("validate:cross-domain"), /cross-domain consistency validation passed/);
  assert.match(run("build:index"), /built dist\/plomus-contracts-index.json/);

  const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-contracts-index.json"), "utf8"));
  assert.equal(index.layout, "contract-type");
  assert.equal(index.typeCount, 8);
  // every contract type ships at least one folder
  assert.ok(index.types.every((t) => t.folders.length > 0));

  // dependency edges only reference declared contract types (manifest sanity)
  const names = new Set(index.types.map((t) => t.type));
  for (const t of index.types) {
    for (const dep of t.dependsOn) assert.ok(names.has(dep), `${t.type} depends on unknown ${dep}`);
  }
});
