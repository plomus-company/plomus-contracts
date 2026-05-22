import { diff, readJson, unique } from "./read-json.mjs";

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

// ---- distribution domain ----
const base = readJson("contracts/distribution/base.json");
const presets = readJson("contracts/distribution/presets.json").presets ?? [];
const fields = readJson("contracts/distribution/fields.json").fields ?? [];
const experimentalRules = readJson("contracts/distribution/experimental-rules.json").rules ?? [];

// ---- commerce baseline (read-only cross-reference) ----
const commerceBase = readJson("contracts/commerce/base.json");
const commerceRuleIds = new Set((readJson("contracts/commerce/review-rules.json").reviewRules ?? []).map((r) => r.ruleId));
const commerceWorkflowIds = new Set((readJson("contracts/commerce/workflows.json").workflows ?? []).map((w) => w.workflowId));
const commerceDomains = new Set(commerceBase.core?.commerceDomains ?? []);
const commerceTypes = new Set(commerceBase.core?.commerceTypes ?? []);
const salesChannels = new Set(commerceBase.core?.salesChannels ?? []);
const productTypes = new Set(commerceBase.core?.productTypes ?? []);
const operationModes = new Set(commerceBase.core?.operationModes ?? []);
const commerceFolders = new Set([...(commerceBase.systemFolders ?? []), ...(commerceBase.watchFolders ?? [])]);
const commerceDocTypes = new Set([...(commerceBase.documentTypes ?? []), ...(commerceBase.core?.markdownObjectTypes ?? [])]);

const distributionDocTypes = base.documentTypes ?? [];
const allDocTypes = new Set([...commerceDocTypes, ...distributionDocTypes]);
const ENUM_KEYS = {
  partnerTypes: base.partnerTypes ?? [],
  paymentTerms: base.paymentTerms ?? [],
  priceTiers: base.priceTiers ?? [],
  receivableAgingBuckets: base.receivableAgingBuckets ?? [],
  purchaseOrderStatuses: base.purchaseOrderStatuses ?? [],
  returnReasons: base.returnReasons ?? [],
};

// ---- base enums unique ----
for (const [field, values] of Object.entries({ ...ENUM_KEYS, ruleStatuses: base.ruleStatuses ?? [], documentTypes: distributionDocTypes })) {
  assertUnique("base", field, values);
}

// ---- A1. preset cross-references the commerce baseline ----
assertUnique("presets", "presetId", presets.map((p) => p.presetId));
for (const preset of presets) {
  const scope = `preset:${preset.presetId ?? "(missing)"}`;
  requireString(scope, preset.presetId, "presetId");
  requireString(scope, preset.label, "label");
  requireString(scope, preset.description, "description");

  for (const value of requireArray(scope, preset.commerceTypes, "commerceTypes")) {
    if (!commerceTypes.has(value)) fail(scope, `Unknown commerceType: ${value}`);
  }
  for (const value of requireArray(scope, preset.salesChannels, "salesChannels")) {
    if (!salesChannels.has(value)) fail(scope, `Unknown salesChannel: ${value}`);
  }
  for (const value of requireArray(scope, preset.productTypes, "productTypes")) {
    if (!productTypes.has(value)) fail(scope, `Unknown productType: ${value}`);
  }
  if (!operationModes.has(preset.operationMode)) fail(scope, `Unknown operationMode: ${preset.operationMode}`);
  for (const value of requireArray(scope, preset.enabledDomains, "enabledDomains")) {
    if (!commerceDomains.has(value)) fail(scope, `Unknown domain: ${value}`);
  }

  const enabledRules = requireArray(scope, preset.enabledRules, "enabledRules");
  const unknownRules = enabledRules.filter((r) => !commerceRuleIds.has(r));
  if (unknownRules.length) fail(scope, `enabledRules not in commerce baseline: ${unknownRules.join(", ")}`);
  const highMissing = diff(preset.highPriorityRules ?? [], enabledRules);
  if (highMissing.length) fail(scope, `highPriorityRules not enabled: ${highMissing.join(", ")}`);

  const unknownWf = requireArray(scope, preset.enabledWorkflows, "enabledWorkflows").filter((w) => !commerceWorkflowIds.has(w));
  if (unknownWf.length) fail(scope, `enabledWorkflows not in commerce baseline: ${unknownWf.join(", ")}`);

  const unknownFolders = requireArray(scope, preset.enabledFolders, "enabledFolders").filter((f) => !commerceFolders.has(f));
  if (unknownFolders.length) fail(scope, `enabledFolders not in commerce baseline: ${unknownFolders.join(", ")}`);

  const unknownDoc = requireArray(scope, preset.enabledDocumentTypes, "enabledDocumentTypes").filter((d) => !allDocTypes.has(d));
  if (unknownDoc.length) fail(scope, `enabledDocumentTypes unknown: ${unknownDoc.join(", ")}`);
}

// A2. domain-object statuses are owned by platform/frontmatter (not duplicated here).

// ---- B. fields bind to a known vocabulary or a primitive type ----
const validValueTypes = new Set(["number", "string", "boolean", "date"]);
for (const field of fields) {
  const scope = `field:${field.documentType ?? "?"}.${field.field ?? "?"}`;
  requireString(scope, field.documentType, "documentType");
  requireString(scope, field.field, "field");
  if (!allDocTypes.has(field.documentType)) fail(scope, `documentType unknown: ${field.documentType}`);
  if (field.enum) {
    if (!(field.enum in ENUM_KEYS)) fail(scope, `enum not defined in base: ${field.enum}`);
  } else if (field.valueType) {
    if (!validValueTypes.has(field.valueType)) fail(scope, `Unknown valueType: ${field.valueType}`);
  } else {
    fail(scope, "field must declare either enum or valueType.");
  }
}

// ---- C. experimental rules: new, distribution-relevant, valid domain ----
assertUnique("experimental-rules", "ruleId", experimentalRules.map((r) => r.ruleId));
const ruleStatuses = new Set(base.ruleStatuses ?? []);
for (const rule of experimentalRules) {
  const scope = `experimental-rule:${rule.ruleId ?? "(missing)"}`;
  requireString(scope, rule.ruleId, "ruleId");
  if (!commerceDomains.has(rule.domain)) fail(scope, `domain not in commerce baseline: ${rule.domain}`);
  if (!ruleStatuses.has(rule.status)) fail(scope, `Unknown status: ${rule.status}`);
  // Must NOT collide with an ACTIVE commerce rule (these are additive proposals).
  if (commerceRuleIds.has(rule.ruleId)) {
    fail(scope, `ruleId already exists in commerce baseline (not an extension): ${rule.ruleId}`);
  }
}

if (failures.length) {
  console.error("distribution contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}

console.log("distribution contract validation passed");
