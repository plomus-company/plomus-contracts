import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("protocol registry validates and builds a distributable artifact", () => {
  assert.match(run("validate:protocol"), /protocol contract validation passed/);
  assert.match(run("build:protocol"), /built dist\/plomus-protocol.json/);

  const dist = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-protocol.json"), "utf8"));
  assert.equal(dist.schemaVersion, "1.0.0");
  assert.ok(dist.contracts.endpoints.some((e) => e.name === "sync-events" && e.method === "POST"));
  assert.ok(dist.contracts.syncEvent.fields.some((f) => f.field === "event_id"));

  // every sync payload object type resolves against the commerce baseline
  const commercePayloadTypes = new Set(
    JSON.parse(fs.readFileSync(path.join(repoRoot, "contracts/commerce-base.json"), "utf8")).core.syncPayloadObjectTypes,
  );
  for (const p of dist.contracts.payloads) {
    assert.ok(commercePayloadTypes.has(p.objectType), `payload ${p.objectType} missing from commerce baseline`);
  }
});
