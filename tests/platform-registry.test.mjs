import { readDoc } from "../scripts/group.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("platform registry validates and builds into the foundation bundle", () => {
  assert.match(run("validate:platform"), /platform contract validation passed/);
  assert.match(run("build:foundation"), /built dist\/plomus-foundation.json/);

  const bundle = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-foundation.json"), "utf8"));
  assert.equal(bundle.schemaVersion, "1.0.0");
  const platform = bundle.members.platform;
  // P2/A2: domain-object frontmatter statuses
  assert.ok(platform.contracts.frontmatter.some((d) => d.documentType === "order" && d.statuses.includes("SHIPPED")));
  // P4: error codes
  assert.ok(platform.contracts.errorCodes.length >= 20);

  // P3: every grouped event type is a real commerce sync event type
  const commerceEvents = new Set(
    readDoc("commerce-base").core.syncEventTypes,
  );
  for (const group of platform.contracts.eventTypes) {
    for (const ev of group.events) {
      assert.ok(commerceEvents.has(ev), `event ${ev} missing from commerce syncEventTypes`);
    }
  }
});
