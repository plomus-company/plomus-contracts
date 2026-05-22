import assert from "node:assert/strict";
import test from "node:test";
import {
  createContractsFixture,
  readFixtureJson,
  runNodeScript,
  scriptOutput,
  writeFixtureJson,
} from "./helpers/registry-test-utils.mjs";

function assertScriptFails(result, pattern) {
  const output = scriptOutput(result);
  assert.notEqual(result.status, 0, output);
  assert.match(output, pattern);
}

test("commerce validator rejects duplicate preset ids", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const presets = readFixtureJson(fixtureRoot, "contracts/commerce-presets.json");
  presets.presets[1].presetId = presets.presets[0].presetId;
  writeFixtureJson(fixtureRoot, "contracts/commerce-presets.json", presets);

  const result = runNodeScript("scripts/validate.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /presetId has duplicate values/);
});

test("commerce validator rejects workflow rule references that are not registered", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const workflows = readFixtureJson(fixtureRoot, "contracts/commerce-workflows.json");
  workflows.workflows[0].enabledRuleIds.push("UNKNOWN_RULE_FOR_TEST");
  writeFixtureJson(fixtureRoot, "contracts/commerce-workflows.json", workflows);

  const result = runNodeScript("scripts/validate.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /Unknown enabledRuleIds: UNKNOWN_RULE_FOR_TEST/);
});

test("skills validator rejects proxy route mismatches", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const catalog = readFixtureJson(fixtureRoot, "contracts/skills-catalog.json");
  const skill = catalog.skills.find((entry) => entry.usesProxy && entry.proxyRoutes.length > 0);
  assert.ok(skill, "fixture needs at least one proxy-backed skill");
  skill.usesProxy = false;
  writeFixtureJson(fixtureRoot, "contracts/skills-catalog.json", catalog);

  const result = runNodeScript("scripts/validate-skills.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /proxyRoutes is non-empty but usesProxy is false/);
});

test("benchmarks validator rejects results for unknown targets", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const results = readFixtureJson(fixtureRoot, "contracts/benchmarks-results.json");
  results.results[0].targetId = "missing-target-for-test";
  writeFixtureJson(fixtureRoot, "contracts/benchmarks-results.json", results);

  const result = runNodeScript("scripts/validate-benchmarks.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /Unknown targetId: missing-target-for-test/);
});

test("build scripts can write artifacts in an isolated registry root", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const result = runNodeScript("scripts/build-skills.mjs", { registryRoot: fixtureRoot });
  assert.equal(result.status, 0, scriptOutput(result));

  const dist = readFixtureJson(fixtureRoot, "dist/plomus-skills.json");
  assert.equal(dist.name, "plomus-skills");
  assert.ok(dist.contracts.skills.length > 0);
});
