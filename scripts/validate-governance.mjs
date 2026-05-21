import { diff, readJson, unique } from "./read-json.mjs";

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });
const requireArray = (scope, value, field) => {
  if (!Array.isArray(value)) {
    fail(scope, `${field} must be an array.`);
    return [];
  }
  return value;
};
const assertUnique = (scope, field, values) => {
  if (!unique(values)) fail(scope, `${field} has duplicate values.`);
};

const base = readJson("contracts/governance/v1/base.json");
const rolesDoc = readJson("contracts/governance/v1/roles.json");
const approval = readJson("contracts/governance/v1/approval.json");
const lifecycle = readJson("contracts/governance/v1/execution-lifecycle.json");
const routing = readJson("contracts/governance/v1/model-routing.json");

// benchmarks baseline (read-only)
const benchModelStatuses = new Set(readJson("contracts/benchmarks/v1/base.json").modelStatuses ?? []);
const benchModelStatusesPresent = new Set((readJson("contracts/benchmarks/v1/models.json").models ?? []).map((m) => m.status));

const riskLevels = base.riskLevels ?? [];
const roles = base.roles ?? [];
const approvalPolicies = base.approvalPolicies ?? [];
const executionStates = base.executionStates ?? [];
const commandStates = base.commandStates ?? [];

for (const [field, values] of Object.entries({
  riskLevels, roles, approvalPolicies,
  approvalStatuses: base.approvalStatuses ?? [], approvalChannels: base.approvalChannels ?? [],
  executionStates, commandStates,
})) {
  assertUnique("base", field, values);
}

const riskSet = new Set(riskLevels);
const roleSet = new Set(roles);
const policySet = new Set(approvalPolicies);

// ---- roles ----
assertUnique("roles", "role", rolesDoc.roles.map((r) => r.role));
for (const r of rolesDoc.roles ?? []) {
  const scope = `role:${r.role ?? "(missing)"}`;
  if (!roleSet.has(r.role)) fail(scope, `role not in base.roles: ${r.role}`);
  if (typeof r.rank !== "number" || !Number.isInteger(r.rank)) fail(scope, "rank must be an integer.");
}
if (diff(roles, rolesDoc.roles.map((r) => r.role)).length) fail("roles", "base.roles and roles.json disagree.");
for (const cap of rolesDoc.approvalCapability ?? []) {
  const scope = `approvalCapability:${cap.riskLevel ?? "(missing)"}`;
  if (!riskSet.has(cap.riskLevel)) fail(scope, `Unknown riskLevel: ${cap.riskLevel}`);
  const unknown = requireArray(scope, cap.allowedRoles, "allowedRoles").filter((x) => !roleSet.has(x));
  if (unknown.length) fail(scope, `allowedRoles not in base.roles: ${unknown.join(", ")}`);
}
if (diff(riskLevels, (rolesDoc.approvalCapability ?? []).map((c) => c.riskLevel)).length) {
  fail("roles", "approvalCapability missing a riskLevel.");
}

// ---- approval ----
assertUnique("approval", "policy", approval.policies.map((p) => p.policy));
const channelSet = new Set(base.approvalChannels ?? []);
for (const p of approval.policies ?? []) {
  const scope = `approval-policy:${p.policy ?? "(missing)"}`;
  if (!policySet.has(p.policy)) fail(scope, `policy not in base.approvalPolicies: ${p.policy}`);
  if (typeof p.requiredApprovals !== "number" || p.requiredApprovals < 1) fail(scope, "requiredApprovals must be >= 1.");
  const badChannels = (p.allowedChannels ?? []).filter((c) => !channelSet.has(c));
  if (badChannels.length) fail(scope, `allowedChannels not in base.approvalChannels: ${badChannels.join(", ")}`);
  if (!(p.allowedChannels ?? []).length) fail(scope, "allowedChannels must not be empty.");
}
if (diff(approvalPolicies, approval.policies.map((p) => p.policy)).length) fail("approval", "base.approvalPolicies and approval.json disagree.");
for (const rp of approval.riskPolicy ?? []) {
  const scope = `risk-policy:${rp.riskLevel ?? "(missing)"}`;
  if (!riskSet.has(rp.riskLevel)) fail(scope, `Unknown riskLevel: ${rp.riskLevel}`);
  if (typeof rp.requiresApproval !== "boolean") fail(scope, "requiresApproval must be a boolean.");
  if (rp.approvalPolicy !== null && !policySet.has(rp.approvalPolicy)) fail(scope, `Unknown approvalPolicy: ${rp.approvalPolicy}`);
  if (rp.requiresApproval && !rp.approvalPolicy) fail(scope, "requiresApproval=true needs an approvalPolicy.");
}
if (diff(riskLevels, (approval.riskPolicy ?? []).map((r) => r.riskLevel)).length) fail("approval", "riskPolicy missing a riskLevel.");

// ---- execution lifecycle (state machine integrity) ----
const execStateSet = new Set(executionStates);
for (const [from, targets] of Object.entries(lifecycle.transitions ?? {})) {
  if (!execStateSet.has(from)) fail("execution-lifecycle", `transition from-state not in states: ${from}`);
  for (const to of requireArray("execution-lifecycle", targets, `transitions.${from}`)) {
    if (!execStateSet.has(to)) fail("execution-lifecycle", `transition to-state not in states: ${from} → ${to}`);
  }
}
if (diff(executionStates, Object.keys(lifecycle.transitions ?? {})).length) {
  fail("execution-lifecycle", "every execution state must have a transitions entry.");
}
const cmdStateSet = new Set(commandStates);
for (const [from, targets] of Object.entries(lifecycle.commandTransitions ?? {})) {
  if (!cmdStateSet.has(from)) fail("execution-lifecycle", `command transition from-state not in states: ${from}`);
  for (const to of targets) if (!cmdStateSet.has(to)) fail("execution-lifecycle", `command transition to-state not in states: ${from} → ${to}`);
}
const stepNames = (lifecycle.executionSteps ?? []).map((s) => s.step);
assertUnique("execution-lifecycle", "executionSteps", stepNames);
for (const s of lifecycle.executionSteps ?? []) {
  if (typeof s.required !== "boolean") fail(`execution-step:${s.step}`, "required must be a boolean.");
}

// ---- model routing (resolves against benchmarks) ----
if (!benchModelStatuses.has(routing.fallbackStatus)) fail("model-routing", `fallbackStatus not a benchmarks model status: ${routing.fallbackStatus}`);
assertUnique("model-routing", "riskLevel", (routing.riskModelStatus ?? []).map((r) => r.riskLevel));
for (const r of routing.riskModelStatus ?? []) {
  const scope = `model-routing:${r.riskLevel ?? "(missing)"}`;
  if (!riskSet.has(r.riskLevel)) fail(scope, `Unknown riskLevel: ${r.riskLevel}`);
  if (!benchModelStatuses.has(r.modelStatus)) fail(scope, `modelStatus not in benchmarks modelStatuses: ${r.modelStatus}`);
  if (!benchModelStatusesPresent.has(r.modelStatus)) fail(scope, `no benchmarks model has status '${r.modelStatus}' (routing would not resolve)`);
}
if (diff(riskLevels, (routing.riskModelStatus ?? []).map((r) => r.riskLevel)).length) fail("model-routing", "riskModelStatus missing a riskLevel.");

if (failures.length) {
  console.error("governance contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}
console.log("governance contract validation passed");
