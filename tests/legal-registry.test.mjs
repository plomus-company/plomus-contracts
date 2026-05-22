import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("legal registry validates and builds a distributable artifact", () => {
  assert.match(run("validate:legal"), /legal contract validation passed/);
  assert.match(run("build:legal"), /built dist\/plomus-legal.json/);

  const bundle = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-legal.json"), "utf8"));
  assert.equal(bundle.schemaVersion, "1.0.0");
  assert.equal(bundle.type, "legal");
  const legal = bundle.members.legal;
  assert.ok(legal.contracts.documents.some((d) => d.documentType === "ECOMMERCE_DISCLOSURE"));
  assert.ok(legal.contracts.disclosures.length >= 1);

  // every document's type is declared in the legal vocabulary
  const documentTypes = new Set(legal.enums.documentTypes);
  for (const d of legal.contracts.documents) {
    assert.ok(documentTypes.has(d.documentType), `document ${d.documentId} type ${d.documentType} not in vocab`);
  }
});
