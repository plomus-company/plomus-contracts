import { readDoc } from "../scripts/group.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("protocol registry validates and builds into the tool bundle", () => {
  assert.match(run("validate:protocol"), /protocol contract validation passed/);
  assert.match(run("build:tool"), /built dist\/plomus-tool.json/);

  const bundle = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-tool.json"), "utf8"));
  assert.equal(bundle.schemaVersion, "1.0.0");
  const protocol = bundle.members.protocol;
  assert.ok(protocol.contracts.endpoints.some((e) => e.name === "sync-events" && e.method === "POST"));
  assert.ok(protocol.contracts.syncEvent.fields.some((f) => f.field === "event_id"));

  // every sync payload object type resolves against the commerce baseline
  const commercePayloadTypes = new Set(
    readDoc("commerce-base").core.syncPayloadObjectTypes,
  );
  for (const p of protocol.contracts.payloads) {
    assert.ok(commercePayloadTypes.has(p.objectType), `payload ${p.objectType} missing from commerce baseline`);
  }
});
