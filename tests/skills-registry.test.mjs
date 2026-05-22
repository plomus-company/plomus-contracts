import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { repoRoot, runPnpm } from "./helpers/registry-test-utils.mjs";

test("skills registry validates and builds into the tool bundle", () => {
  assert.match(runPnpm("validate:skills"), /skills contract validation passed/);
  assert.match(runPnpm("build:tool"), /built dist\/plomus-tool.json/);

  const bundle = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "dist/plomus-tool.json"), "utf8"),
  );
  assert.equal(bundle.schemaVersion, "1.0.0");
  assert.equal(bundle.type, "tool");
  const skills = bundle.members.skills;
  assert.ok(skills.contracts.skills.length >= 80);
  assert.ok(skills.contracts.proxyRoutes.length >= 40);
  assert.ok(skills.enums.categories.length >= 10);

  // every proxy-using skill maps to at least one declared route
  const routeSkills = new Set(skills.contracts.proxyRoutes.flatMap((r) => r.skills));
  for (const skill of skills.contracts.skills) {
    assert.equal(skill.usesProxy, routeSkills.has(skill.skillId), `usesProxy mismatch for ${skill.skillId}`);
  }
});
