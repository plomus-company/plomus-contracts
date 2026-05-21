import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { repoRoot, runPnpm } from "./helpers/registry-test-utils.mjs";

test("skills registry validates and builds a distributable artifact", () => {
  assert.match(runPnpm("validate:skills"), /skills contract validation passed/);
  assert.match(runPnpm("build:skills"), /built dist\/plomus-skills.json/);

  const dist = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "dist/plomus-skills.json"), "utf8"),
  );
  assert.equal(dist.schemaVersion, "1.0.0");
  assert.ok(dist.contracts.skills.length >= 80);
  assert.ok(dist.contracts.proxyRoutes.length >= 40);
  assert.ok(dist.enums.categories.length >= 10);

  // every proxy-using skill maps to at least one declared route
  const routeSkills = new Set(dist.contracts.proxyRoutes.flatMap((r) => r.skills));
  for (const skill of dist.contracts.skills) {
    assert.equal(skill.usesProxy, routeSkills.has(skill.skillId), `usesProxy mismatch for ${skill.skillId}`);
  }
});
