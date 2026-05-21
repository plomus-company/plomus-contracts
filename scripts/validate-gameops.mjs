import { readJson, unique } from "./read-json.mjs";

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });
const requireString = (scope, value, field) => {
  if (typeof value !== "string" || value.trim() === "") fail(scope, `${field} must be a non-empty string.`);
};
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

const base = readJson("contracts/gameops/v1/base.json");
const adapters = readJson("contracts/gameops/v1/adapters.json").adapters ?? [];
const agents = readJson("contracts/gameops/v1/agents.json").agents ?? [];
const playbooks = readJson("contracts/gameops/v1/playbooks.json").playbooks ?? [];

// governance baseline (read-only)
const governanceBase = readJson("contracts/governance/v1/base.json");
const govRiskLevels = new Set(governanceBase.riskLevels ?? []);
const govApprovalPolicies = new Set(governanceBase.approvalPolicies ?? []);

const intents = base.intents ?? [];
const agentIds = base.agentIds ?? [];
const playbookStepTypes = base.playbookStepTypes ?? [];

for (const [field, values] of Object.entries({
  intents, agentIds, playbookStepTypes,
  sanctionTypes: base.sanctionTypes ?? [], incidentSeverities: base.incidentSeverities ?? [],
  csCategories: base.csCategories ?? [], csStatuses: base.csStatuses ?? [], csPriorities: base.csPriorities ?? [],
  csSentiments: base.csSentiments ?? [], noticeTypes: base.noticeTypes ?? [],
  pipelineEntityTypes: base.pipelineEntityTypes ?? [], commandSources: base.commandSources ?? [],
})) {
  assertUnique("base", field, values);
}

const intentSet = new Set(intents);
const agentIdSet = new Set(agentIds);
const stepTypeSet = new Set(playbookStepTypes);

// ---- adapters ----
assertUnique("adapters", "adapterId", adapters.map((a) => a.adapterId));
for (const a of adapters) {
  const scope = `adapter:${a.adapterId ?? "(missing)"}`;
  requireString(scope, a.adapterId, "adapterId");
  if (requireArray(scope, a.executionTypes, "executionTypes").length === 0) fail(scope, "executionTypes must not be empty.");
  if (requireArray(scope, a.capabilities, "capabilities").length === 0) fail(scope, "capabilities must not be empty.");
  if (typeof a.dryRunSupported !== "boolean") fail(scope, "dryRunSupported must be a boolean.");
  if (typeof a.rollbackSupported !== "boolean") fail(scope, "rollbackSupported must be a boolean.");
  requireArray(scope, a.requiresConfig, "requiresConfig");
}

// ---- agents ----
assertUnique("agents", "agentId", agents.map((a) => a.agentId));
for (const a of agents) {
  const scope = `agent:${a.agentId ?? "(missing)"}`;
  if (!agentIdSet.has(a.agentId)) fail(scope, `agentId not in base.agentIds: ${a.agentId}`);
  const unknown = requireArray(scope, a.intents, "intents").filter((i) => !intentSet.has(i));
  if (unknown.length) fail(scope, `intents not in base.intents: ${unknown.join(", ")}`);
}

// ---- playbooks (risk + approval resolve against governance) ----
assertUnique("playbooks", "playbookId", playbooks.map((p) => p.playbookId));
for (const p of playbooks) {
  const scope = `playbook:${p.playbookId ?? "(missing)"}`;
  requireString(scope, p.playbookId, "playbookId");
  const unknownTriggers = requireArray(scope, p.triggers, "triggers").filter((t) => !intentSet.has(t));
  if (unknownTriggers.length) fail(scope, `triggers not in base.intents: ${unknownTriggers.join(", ")}`);
  if (!govRiskLevels.has(p.riskLevel)) fail(scope, `riskLevel not in governance riskLevels: ${p.riskLevel}`);
  if (typeof p.requiresApproval !== "boolean") fail(scope, "requiresApproval must be a boolean.");
  const steps = requireArray(scope, p.steps, "steps");
  if (steps.length === 0) fail(scope, "steps must not be empty.");
  for (const step of steps) {
    if (!stepTypeSet.has(step.type)) fail(scope, `step type not in base.playbookStepTypes: ${step.type}`);
    if (step.approvalPolicy && !govApprovalPolicies.has(step.approvalPolicy)) {
      fail(scope, `step approvalPolicy not in governance approvalPolicies: ${step.approvalPolicy}`);
    }
  }
  // a playbook requiring approval should have an approval step
  if (p.requiresApproval && !steps.some((s) => s.type === "approval")) {
    fail(scope, "requiresApproval=true but no approval step.");
  }
}

if (failures.length) {
  console.error("gameops contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}
console.log("gameops contract validation passed");
