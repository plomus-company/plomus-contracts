import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  createContractsFixture,
  mutateFixtureItem,
  readFixtureCollection,
  readFixtureJson,
  repoRoot,
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
  // duplicate a presetId across two business-unit files within the presets folder
  const firstId = readFixtureCollection(fixtureRoot, "commerce-presets", "presets")[0].presetId;
  const ok = mutateFixtureItem(
    fixtureRoot,
    "commerce-presets",
    "presets",
    (p) => p.presetId !== firstId,
    (p) => {
      p.presetId = firstId;
    },
  );
  assert.ok(ok, "fixture needs at least two presets");

  const result = runNodeScript("scripts/validate.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /presetId has duplicate values/);
});

test("commerce validator rejects workflow rule references that are not registered", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const ok = mutateFixtureItem(
    fixtureRoot,
    "commerce-workflows",
    "workflows",
    (w) => Array.isArray(w.enabledRuleIds),
    (w) => w.enabledRuleIds.push("UNKNOWN_RULE_FOR_TEST"),
  );
  assert.ok(ok, "fixture needs a workflow with enabledRuleIds");

  const result = runNodeScript("scripts/validate.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /Unknown enabledRuleIds: UNKNOWN_RULE_FOR_TEST/);
});

test("commerce validator rejects a rule placed in the wrong business-unit file", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const ok = mutateFixtureItem(
    fixtureRoot,
    "commerce-review-rules",
    "reviewRules",
    (r) => typeof r.businessUnit === "string",
    (r) => {
      // placement holds in the fixture, so businessUnit == file stem; move it to
      // a different (still canonical) unit to force a placement mismatch.
      r.businessUnit = r.businessUnit === "order" ? "product" : "order";
    },
  );
  assert.ok(ok, "fixture needs a review rule with a businessUnit");

  const result = runNodeScript("scripts/validate.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /does not match its folder file/);
});

test("doc validator rejects a stale count in the docs", (t) => {
  const fixtureRoot = createContractsFixture(t);
  // counts come from the fixture's (real) contracts; corrupt the matching token
  // in a copied README so the rendered needle is no longer found.
  const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
  assert.match(readme, /카탈로그\(\d+\)/, "README needs the skills catalog count token");
  fs.writeFileSync(
    path.join(fixtureRoot, "README.md"),
    readme.replace(/카탈로그\(\d+\)/, "카탈로그(999)"),
  );

  const result = runNodeScript("scripts/validate-docs.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /카탈로그/);
});

test("placement validator rejects an item filed under the wrong split key", (t) => {
  const fixtureRoot = createContractsFixture(t);
  // a protocol endpoint splits by `kind`; changing it without moving the file
  // leaves the item misfiled relative to its folder stem.
  const ok = mutateFixtureItem(
    fixtureRoot,
    "protocol-endpoints",
    "endpoints",
    (e) => typeof e.kind === "string",
    (e) => {
      e.kind = "wrong-kind-for-test";
    },
  );
  assert.ok(ok, "fixture needs a protocol endpoint with a kind");

  const result = runNodeScript("scripts/validate-placement.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /belongs in/);
});

test("skills validator rejects proxy route mismatches", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const ok = mutateFixtureItem(
    fixtureRoot,
    "skills-catalog",
    "skills",
    (s) => s.usesProxy && s.proxyRoutes.length > 0,
    (s) => {
      s.usesProxy = false;
    },
  );
  assert.ok(ok, "fixture needs at least one proxy-backed skill");

  const result = runNodeScript("scripts/validate-skills.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /proxyRoutes is non-empty but usesProxy is false/);
});

test("benchmarks validator rejects results for unknown targets", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const ok = mutateFixtureItem(
    fixtureRoot,
    "benchmarks-results",
    "results",
    () => true,
    (r) => {
      r.targetId = "missing-target-for-test";
    },
  );
  assert.ok(ok, "fixture needs at least one benchmark result");

  const result = runNodeScript("scripts/validate-benchmarks.mjs", { registryRoot: fixtureRoot });
  assertScriptFails(result, /Unknown targetId: missing-target-for-test/);
});

test("build scripts can write artifacts in an isolated registry root", (t) => {
  const fixtureRoot = createContractsFixture(t);
  const result = runNodeScript("scripts/build-tool.mjs", { registryRoot: fixtureRoot });
  assert.equal(result.status, 0, scriptOutput(result));

  const dist = readFixtureJson(fixtureRoot, "dist/plomus-tool.json");
  assert.equal(dist.name, "plomus-tool");
  assert.ok(dist.members.skills.contracts.skills.length > 0);
});
