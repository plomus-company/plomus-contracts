import { readDoc } from "../scripts/group.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const run = (script) => execFileSync("pnpm", ["run", script], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("transaction registry validates and builds a distributable artifact", () => {
  assert.match(run("validate:transaction"), /transaction contract validation passed/);
  assert.match(run("build:transaction"), /built dist\/plomus-transaction.json/);

  const bundle = JSON.parse(fs.readFileSync(path.join(repoRoot, "dist/plomus-transaction.json"), "utf8"));
  assert.equal(bundle.schemaVersion, "1.0.0");
  assert.equal(bundle.type, "transaction");
  const tx = bundle.members.transaction;
  assert.ok(tx.contracts.budgets.length >= 1);
  assert.ok(tx.contracts.settlements.length >= 1);

  // every spending budget's approval gate resolves to a real governance policy
  const govPolicies = new Set(readDoc("governance-base").approvalPolicies);
  for (const b of tx.contracts.budgets) {
    assert.ok(govPolicies.has(b.approvalPolicy), `budget ${b.budgetId} approvalPolicy ${b.approvalPolicy} not in governance`);
  }
});
