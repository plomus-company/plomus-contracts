import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("platform registry validates and builds a distributable artifact", () => {
  assert.match(run("validate:platform"), /platform contract validation passed/);
  assert.match(run("build:platform"), /built dist\/plomus-platform.json/);

  const dist = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-platform.json"), "utf8"));
  assert.equal(dist.schemaVersion, "1.0.0");
  // P2/A2: domain-object frontmatter statuses
  assert.ok(dist.contracts.frontmatter.some((d) => d.documentType === "order" && d.statuses.includes("SHIPPED")));
  // P4: error codes
  assert.ok(dist.contracts.errorCodes.length >= 20);

  // P3: every grouped event type is a real commerce sync event type
  const commerceEvents = new Set(
    JSON.parse(fs.readFileSync(path.join(repoRoot, "contracts/commerce-base.json"), "utf8")).core.syncEventTypes,
  );
  for (const group of dist.contracts.eventTypes) {
    for (const ev of group.events) {
      assert.ok(commerceEvents.has(ev), `event ${ev} missing from commerce syncEventTypes`);
    }
  }
});
