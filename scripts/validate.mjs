import { readContract, readDoc } from "./group.mjs";
import { diff, readJson, unique } from "./read-json.mjs";

const failures = [];

function fail(scope, message) {
  failures.push({ scope, message });
}

function requireArray(scope, value, field) {
  if (!Array.isArray(value)) {
    fail(scope, `${field} must be an array.`);
    return [];
  }
  return value;
}

function requireString(scope, value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(scope, `${field} must be a non-empty string.`);
    return "";
  }
  return value;
}

function assertUnique(scope, field, values) {
  if (!unique(values)) fail(scope, `${field} has duplicate values.`);
}

function assertPattern(scope, field, value, pattern, label) {
  if (typeof value === "string" && !pattern.test(value)) {
    fail(scope, `${field} must use ${label}: ${value}`);
  }
}

const base = readDoc("commerce-base");
const presets = readContract("commerce-presets", "presets");
const reviewRules = readContract("commerce-review-rules", "reviewRules");
const workflows = readContract("commerce-workflows", "workflows");

const presetIds = presets.map((preset) => preset.presetId);
const reviewRuleIds = reviewRules.map((rule) => rule.ruleId);
const workflowIds = workflows.map((workflow) => workflow.workflowId);
const documentTypes = [
  ...(base.documentTypes ?? []),
  ...(base.core?.markdownObjectTypes ?? []),
];
const folderIds = [
  ...(base.systemFolders ?? []),
  ...(base.watchFolders ?? []),
];

assertUnique("presets", "presetId", presetIds);
assertUnique("review-rules", "ruleId", reviewRuleIds);
assertUnique("workflows", "workflowId", workflowIds);
assertUnique("base", "systemFolders", base.systemFolders ?? []);
assertUnique("base", "documentTypes", base.documentTypes ?? []);
assertUnique("base", "watchFolders", base.watchFolders ?? []);

for (const required of [
  "schemaVersion",
  "systemFolders",
  "documentTypes",
  "approvalRequired",
  "autoApplyAllowed",
  "watchFolders",
  "core",
]) {
  if (!(required in base)) fail("base", `Missing ${required}.`);
}
requireString("base", base.schemaVersion, "schemaVersion");

for (const rule of reviewRules) {
  const scope = `review-rule:${rule.ruleId ?? "(missing)"}`;
  requireString(scope, rule.ruleId, "ruleId");
  assertPattern(scope, "ruleId", rule.ruleId, /^[A-Z][A-Z0-9_]*$/, "upper snake case");
  requireString(scope, rule.domain, "domain");
  requireString(scope, rule.status, "status");
  requireString(scope, rule.description, "description");
  if (!["ACTIVE", "EXPERIMENTAL", "DEPRECATED", "REMOVED"].includes(rule.status)) {
    fail(scope, `Unknown status: ${rule.status}`);
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(rule.severity)) {
    fail(scope, `Unknown severity: ${rule.severity}`);
  }
}

const executionClasses = new Set([
  "READ_ONLY",
  "LOCAL_WRITE",
  "LOCAL_APPLY",
  "REMOTE_SYNC",
  "EXTERNAL_TOKEN",
]);
const riskLevels = new Set(["LOW", "MEDIUM", "HIGH"]);
const externalAccess = new Set(["NONE", "NETWORK", "TOKEN"]);

for (const workflow of workflows) {
  const scope = `workflow:${workflow.workflowId ?? "(missing)"}`;
  requireString(scope, workflow.workflowId, "workflowId");
  assertPattern(scope, "workflowId", workflow.workflowId, /^[a-z][a-z0-9-]*$/, "lower kebab case");
  requireString(scope, workflow.label, "label");
  requireString(scope, workflow.reviewScope, "reviewScope");
  requireString(scope, workflow.reviewType, "reviewType");

  const enabledRuleIds = requireArray(scope, workflow.enabledRuleIds ?? [], "enabledRuleIds");
  const missingRules = diff(enabledRuleIds, reviewRuleIds);
  if (missingRules.length) fail(scope, `Unknown enabledRuleIds: ${missingRules.join(", ")}`);

  const targetFolders = requireArray(scope, workflow.targetFolders ?? [], "targetFolders");
  const missingFolders = diff(targetFolders, folderIds);
  if (missingFolders.length) fail(scope, `Unknown targetFolders: ${missingFolders.join(", ")}`);

  const safety = workflow.safety ?? {};
  if (!executionClasses.has(safety.executionClass)) {
    fail(scope, `Unknown executionClass: ${safety.executionClass}`);
  }
  if (!riskLevels.has(safety.riskLevel)) {
    fail(scope, `Unknown riskLevel: ${safety.riskLevel}`);
  }
  if (!externalAccess.has(safety.externalAccess)) {
    fail(scope, `Unknown externalAccess: ${safety.externalAccess}`);
  }
  if (!Array.isArray(safety.sideEffects) || safety.sideEffects.length === 0) {
    fail(scope, "safety.sideEffects must not be empty.");
  }
}

for (const preset of presets) {
  const scope = `preset:${preset.presetId ?? "(missing)"}`;
  requireString(scope, preset.presetId, "presetId");
  assertPattern(scope, "presetId", preset.presetId, /^[A-Z][A-Z0-9_]*$/, "upper snake case");
  requireString(scope, preset.label, "label");
  requireString(scope, preset.description, "description");

  for (const field of [
    "commerceTypes",
    "salesChannels",
    "productTypes",
    "enabledDomains",
    "enabledRules",
    "highPriorityRules",
    "enabledFolders",
    "enabledDocumentTypes",
    "enabledWorkflows",
    "requireApprovalFor",
    "autoApplyAllowed",
  ]) {
    const values = requireArray(scope, preset[field], field);
    assertUnique(scope, field, values);
  }

  const missingRules = diff(preset.enabledRules ?? [], reviewRuleIds);
  if (missingRules.length) fail(scope, `Unknown enabledRules: ${missingRules.join(", ")}`);

  const highPriorityMissing = diff(preset.highPriorityRules ?? [], preset.enabledRules ?? []);
  if (highPriorityMissing.length) {
    fail(scope, `highPriorityRules not enabled: ${highPriorityMissing.join(", ")}`);
  }

  const missingWorkflows = diff(preset.enabledWorkflows ?? [], workflowIds);
  if (missingWorkflows.length) {
    fail(scope, `Unknown enabledWorkflows: ${missingWorkflows.join(", ")}`);
  }

  const missingBaseFolders = diff(base.systemFolders ?? [], preset.enabledFolders ?? []);
  if (missingBaseFolders.length) {
    fail(scope, `Missing base system folders: ${missingBaseFolders.join(", ")}`);
  }

  const unknownFolders = diff(preset.enabledFolders ?? [], folderIds);
  if (unknownFolders.length) fail(scope, `Unknown enabledFolders: ${unknownFolders.join(", ")}`);

  const unknownDocumentTypes = diff(preset.enabledDocumentTypes ?? [], documentTypes);
  if (unknownDocumentTypes.length) {
    fail(scope, `Unknown enabledDocumentTypes: ${unknownDocumentTypes.join(", ")}`);
  }

  const unknownApprovalRequired = diff(
    preset.requireApprovalFor ?? [],
    base.core?.approvalRuleIds ?? [],
  );
  if (unknownApprovalRequired.length) {
    fail(scope, `Unknown requireApprovalFor: ${unknownApprovalRequired.join(", ")}`);
  }

  const unknownAutoApplyAllowed = diff(
    preset.autoApplyAllowed ?? [],
    base.core?.approvalRuleIds ?? [],
  );
  if (unknownAutoApplyAllowed.length) {
    fail(scope, `Unknown autoApplyAllowed: ${unknownAutoApplyAllowed.join(", ")}`);
  }
}

const baseWorkflowMissing = diff(base.baseWorkflows ?? [], workflowIds);
if (baseWorkflowMissing.length) {
  fail("base", `baseWorkflows missing from workflows: ${baseWorkflowMissing.join(", ")}`);
}

const basePresetMissing = diff(presetIds, base.core?.commercePresetIds ?? []);
if (basePresetMissing.length) {
  fail("base", `core.commercePresetIds missing registry presets: ${basePresetMissing.join(", ")}`);
}
const staleBasePresetIds = diff(base.core?.commercePresetIds ?? [], presetIds);
if (staleBasePresetIds.length) {
  fail("base", `core.commercePresetIds has no preset entry: ${staleBasePresetIds.join(", ")}`);
}

const baseReviewRuleMissing = diff(reviewRuleIds, base.core?.reviewRuleIds ?? []);
if (baseReviewRuleMissing.length) {
  fail("base", `core.reviewRuleIds missing registry rules: ${baseReviewRuleMissing.join(", ")}`);
}
const staleBaseReviewRuleIds = diff(base.core?.reviewRuleIds ?? [], reviewRuleIds);
if (staleBaseReviewRuleIds.length) {
  fail("base", `core.reviewRuleIds has no rule entry: ${staleBaseReviewRuleIds.join(", ")}`);
}

const baseWorkflowIds = base.core?.hermesWorkflows ?? [];
const workflowMissingInCore = diff(workflowIds, baseWorkflowIds);
if (workflowMissingInCore.length) {
  fail("base", `core.hermesWorkflows missing registry workflows: ${workflowMissingInCore.join(", ")}`);
}
const staleBaseWorkflowIds = diff(baseWorkflowIds, workflowIds);
if (staleBaseWorkflowIds.length) {
  fail("base", `core.hermesWorkflows has no workflow entry: ${staleBaseWorkflowIds.join(", ")}`);
}

if (failures.length) {
  console.error("contract validation failed");
  for (const failure of failures) {
    console.error(`- [${failure.scope}] ${failure.message}`);
  }
  process.exit(1);
}

console.log("contract validation passed");
