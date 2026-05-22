import { readContract, readDoc } from "./group.mjs";
import { unique } from "./read-json.mjs";
import { BUSINESS_UNITS, placementErrors } from "./taxonomy.mjs";

// Transaction (payment) contract: machine spending budgets + settlement/commission
// terms. Budgets cross-reference governance approval policies and risk levels
// (read-only), so an agent's spend gate resolves to a real governance policy.

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });
const requireString = (scope, value, field) => {
  if (typeof value !== "string" || value.trim() === "") fail(scope, `${field} must be a non-empty string.`);
};
const assertUnique = (scope, field, values) => {
  if (!unique(values)) fail(scope, `${field} has duplicate values.`);
};
const inSet = (scope, value, set, field) => {
  if (!set.has(value)) fail(scope, `Unknown ${field}: ${value}`);
};

const base = readDoc("transaction-base");
const budgets = readContract("transaction-budgets", "budgets");
const settlements = readContract("transaction-settlement", "settlements");

const rails = new Set(base.paymentRails ?? []);
const currencies = new Set(base.currencies ?? []);
const budgetScopes = new Set(base.budgetScopes ?? []);
const settlementCycles = new Set(base.settlementCycles ?? []);
const proofTypes = new Set(base.proofTypes ?? []);
const refundReasons = new Set(base.refundReasons ?? []);
const onFailureActions = new Set(base.onFailureActions ?? []);
const statuses = new Set(base.statuses ?? []);

// governance baseline (read-only cross-reference)
const govPolicies = new Set(readDoc("governance-base").approvalPolicies ?? []);
const govRisks = new Set(readDoc("governance-base").riskLevels ?? []);

// ---- base enums unique ----
for (const [field, values] of Object.entries({
  paymentRails: base.paymentRails ?? [],
  budgetScopes: base.budgetScopes ?? [],
  settlementCycles: base.settlementCycles ?? [],
  proofTypes: base.proofTypes ?? [],
  refundReasons: base.refundReasons ?? [],
})) {
  assertUnique("base", field, values);
}

// ---- budgets: x402-style spending governance, gated by a governance policy ----
assertUnique("budgets", "budgetId", budgets.map((b) => b.budgetId));
for (const b of budgets) {
  const scope = `budget:${b.budgetId ?? "(missing)"}`;
  requireString(scope, b.budgetId, "budgetId");
  inSet(scope, b.scope, budgetScopes, "scope");
  inSet(scope, b.currency, currencies, "currency");
  if (typeof b.limit !== "number" || b.limit <= 0) fail(scope, "limit must be a positive number.");
  for (const rail of b.rails ?? []) inSet(scope, rail, rails, "rail");
  if (b.requiresProof) inSet(scope, b.proofType, proofTypes, "proofType");
  inSet(scope, b.approvalPolicy, govPolicies, "approvalPolicy (not a governance policy)");
  inSet(scope, b.riskLevel, govRisks, "riskLevel (not a governance risk level)");
  inSet(scope, b.onFailure, onFailureActions, "onFailure");
  inSet(scope, b.status, statuses, "status");
}

// ---- settlement/commission terms, filed by business unit ----
for (const [scope, message] of placementErrors("transaction-settlement", "settlements", "businessUnit", BUSINESS_UNITS)) {
  fail(scope, message);
}
assertUnique("settlements", "settlementId", settlements.map((s) => s.settlementId));
for (const s of settlements) {
  const scope = `settlement:${s.settlementId ?? "(missing)"}`;
  requireString(scope, s.settlementId, "settlementId");
  if (typeof s.commissionRateBps !== "number" || s.commissionRateBps < 0 || s.commissionRateBps > 10000) {
    fail(scope, "commissionRateBps must be 0–10000 (basis points).");
  }
  inSet(scope, s.cycle, settlementCycles, "cycle");
  inSet(scope, s.payoutRail, rails, "payoutRail");
  inSet(scope, s.currency, currencies, "currency");
  for (const r of s.refundReasons ?? []) inSet(scope, r, refundReasons, "refundReason");
  inSet(scope, s.onPaymentFailure, onFailureActions, "onPaymentFailure");
  inSet(scope, s.status, statuses, "status");
}

if (failures.length) {
  console.error("transaction contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}

console.log("transaction contract validation passed");
