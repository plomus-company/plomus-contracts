import { readJson, unique } from "./read-json.mjs";

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });

function requireString(scope, value, field) {
  if (typeof value !== "string" || value.trim() === "") fail(scope, `${field} must be a non-empty string.`);
}
function requireNumber(scope, value, field, { min = -Infinity, integer = false } = {}) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(scope, `${field} must be a number.`);
    return;
  }
  if (value < min) fail(scope, `${field} must be >= ${min}.`);
  if (integer && !Number.isInteger(value)) fail(scope, `${field} must be an integer.`);
}
const assertUnique = (scope, field, values) => {
  if (!unique(values)) fail(scope, `${field} has duplicate values.`);
};

const base = readJson("contracts/benchmarks/base.json");
const models = readJson("contracts/benchmarks/models.json").models ?? [];
const metrics = readJson("contracts/benchmarks/metrics.json").metrics ?? [];
const targets = readJson("contracts/benchmarks/targets.json").targets ?? [];
const results = readJson("contracts/benchmarks/results.json").results ?? [];
const rollups = readJson("contracts/benchmarks/rollups.json").rollups ?? [];

// referenced contracts (cross-domain integrity)
const skillIds = new Set((readJson("contracts/skills/catalog.json").skills ?? []).map((s) => s.skillId));
const workflowIds = new Set((readJson("contracts/commerce/workflows.json").workflows ?? []).map((w) => w.workflowId));
const agentIds = new Set((readJson("contracts/gameops/agents.json").agents ?? []).map((a) => a.agentId));
const playbookIds = new Set((readJson("contracts/gameops/playbooks.json").playbooks ?? []).map((p) => p.playbookId));
const presetIds = new Set((readJson("contracts/distribution/presets.json").presets ?? []).map((p) => p.presetId));

const vendors = base.modelVendors ?? [];
const modalities = base.modalities ?? [];
const modelStatuses = base.modelStatuses ?? [];
const metricCategories = base.metricCategories ?? [];
const metricDirections = base.metricDirections ?? [];
const units = base.units ?? [];
const targetKinds = base.targetKinds ?? [];
const targetDomains = base.targetDomains ?? [];
const dataSources = base.dataSources ?? [];
const seedModels = base.seedModels ?? [];

for (const required of [
  "modelVendors", "modalities", "modelStatuses", "metricCategories",
  "metricDirections", "units", "targetKinds", "targetDomains", "dataSources",
]) {
  if (!(required in base)) fail("base", `Missing ${required}.`);
}
for (const [field, values] of Object.entries({
  modelVendors: vendors, modalities, modelStatuses, metricCategories,
  metricDirections, units, targetKinds, targetDomains, dataSources,
})) {
  assertUnique("base", field, values);
}

// ---- models ----
const modelIds = models.map((m) => m.modelId);
assertUnique("models", "modelId", modelIds);
const modelIdSet = new Set(modelIds);
for (const model of models) {
  const scope = `model:${model.modelId ?? "(missing)"}`;
  requireString(scope, model.modelId, "modelId");
  requireString(scope, model.displayName, "displayName");
  if (!vendors.includes(model.vendor)) fail(scope, `Unknown vendor: ${model.vendor}`);
  if (!modalities.includes(model.modality)) fail(scope, `Unknown modality: ${model.modality}`);
  if (!modelStatuses.includes(model.status)) fail(scope, `Unknown status: ${model.status}`);
  requireNumber(scope, model.contextWindow, "contextWindow", { min: 1, integer: true });
  requireNumber(scope, model.maxOutputTokens, "maxOutputTokens", { min: 1, integer: true });
  const pricing = model.pricing ?? {};
  requireNumber(scope, pricing.inputPerMTok, "pricing.inputPerMTok", { min: 0 });
  requireNumber(scope, pricing.outputPerMTok, "pricing.outputPerMTok", { min: 0 });
  requireString(scope, pricing.currency, "pricing.currency");
}

// ---- metrics ----
const metricIds = metrics.map((m) => m.metricId);
assertUnique("metrics", "metricId", metricIds);
const metricById = new Map(metrics.map((m) => [m.metricId, m]));
for (const metric of metrics) {
  const scope = `metric:${metric.metricId ?? "(missing)"}`;
  requireString(scope, metric.metricId, "metricId");
  requireString(scope, metric.label, "label");
  if (!metricCategories.includes(metric.category)) fail(scope, `Unknown category: ${metric.category}`);
  if (!metricDirections.includes(metric.direction)) fail(scope, `Unknown direction: ${metric.direction}`);
  if (!units.includes(metric.unit)) fail(scope, `Unknown unit: ${metric.unit}`);
}

// ---- targets (must reference real contracts) ----
const targetIds = targets.map((t) => t.targetId);
assertUnique("targets", "targetId", targetIds);
const targetById = new Map(targets.map((t) => [t.targetId, t]));
for (const target of targets) {
  const scope = `target:${target.targetId ?? "(missing)"}`;
  requireString(scope, target.targetId, "targetId");
  requireString(scope, target.ref, "ref");
  if (!targetKinds.includes(target.kind)) fail(scope, `Unknown kind: ${target.kind}`);
  if (!targetDomains.includes(target.domain)) fail(scope, `Unknown domain: ${target.domain}`);
  if (target.kind === "skill") {
    if (target.domain !== "skills") fail(scope, "skill targets must be in the skills domain.");
    if (!skillIds.has(target.ref)) fail(scope, `ref is not a known skill: ${target.ref}`);
  } else if (target.kind === "workflow") {
    if (target.domain !== "commerce") fail(scope, "workflow targets must be in the commerce domain.");
    if (!workflowIds.has(target.ref)) fail(scope, `ref is not a known workflow: ${target.ref}`);
  } else if (target.kind === "agent") {
    if (target.domain !== "gameops") fail(scope, "agent targets must be in the gameops domain.");
    if (!agentIds.has(target.ref)) fail(scope, `ref is not a known gameops agent: ${target.ref}`);
  } else if (target.kind === "playbook") {
    if (target.domain !== "gameops") fail(scope, "playbook targets must be in the gameops domain.");
    if (!playbookIds.has(target.ref)) fail(scope, `ref is not a known gameops playbook: ${target.ref}`);
  } else if (target.kind === "preset") {
    if (target.domain !== "distribution") fail(scope, "preset targets must be in the distribution domain.");
    if (!presetIds.has(target.ref)) fail(scope, `ref is not a known distribution preset: ${target.ref}`);
  }
}

// ---- results ----
const seenResultKeys = [];
for (const result of results) {
  const scope = `result:${result.targetId ?? "?"}@${result.modelId ?? "?"}`;
  if (!targetById.has(result.targetId)) fail(scope, `Unknown targetId: ${result.targetId}`);
  if (!modelIdSet.has(result.modelId)) fail(scope, `Unknown modelId: ${result.modelId}`);
  if (!dataSources.includes(result.dataSource)) fail(scope, `Unknown dataSource: ${result.dataSource}`);
  requireNumber(scope, result.sampleSize, "sampleSize", { min: 0, integer: true });
  seenResultKeys.push(`${result.targetId}|${result.modelId}|${result.dataSource}`);

  const metricValues = result.metrics ?? {};
  for (const [metricId, value] of Object.entries(metricValues)) {
    if (!metricById.has(metricId)) {
      fail(scope, `Unknown metric: ${metricId}`);
      continue;
    }
    requireNumber(scope, value, metricId, { min: 0 });
    if (metricById.get(metricId).unit === "percent" && (value < 0 || value > 100)) {
      fail(scope, `${metricId} percent value out of range: ${value}`);
    }
  }
}
assertUnique("results", "(targetId,modelId,dataSource)", seenResultKeys);

// ---- rollups ----
for (const rollup of rollups) {
  const scope = `rollup:${rollup.domain ?? "?"}@${rollup.modelId ?? "?"}`;
  if (!targetDomains.includes(rollup.domain)) fail(scope, `Unknown domain: ${rollup.domain}`);
  if (!modelIdSet.has(rollup.modelId)) fail(scope, `Unknown modelId: ${rollup.modelId}`);
  if (!dataSources.includes(rollup.dataSource)) fail(scope, `Unknown dataSource: ${rollup.dataSource}`);
  requireNumber(scope, rollup.targetCount, "targetCount", { min: 1, integer: true });
  for (const metricId of Object.keys(rollup.metrics ?? {})) {
    if (!metricById.has(metricId)) fail(scope, `Unknown metric: ${metricId}`);
  }
}

// ---- coverage ----
const unknownSeedModels = seedModels.filter((id) => !modelIdSet.has(id));
if (unknownSeedModels.length) fail("base", `seedModels not in registry: ${unknownSeedModels.join(", ")}`);

if (failures.length) {
  console.error("benchmarks contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}

console.log("benchmarks contract validation passed");
