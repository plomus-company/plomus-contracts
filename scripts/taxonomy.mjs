// Canonical operational "business unit" vocabulary and the mappings from each
// source taxonomy onto it. This is the single source of truth for how
// task-style contracts (review rules, workflows, distribution rules) are
// classified into folders. See docs/CONTRACT-TAXONOMY.md.

import { readGroups, safeUnit } from "./group.mjs";

// 15 canonical units (kebab-case). Order is the conventional operational flow.
export const BUSINESS_UNITS = [
  "product",
  "order",
  "inventory",
  "claim",
  "settlement",
  "finance",
  "hr",
  "procurement",
  "partner",
  "legal-policy",
  "app-distribution",
  "si-project",
  "recurring",
  "operations",
  "system",
];

const UNITS = new Set(BUSINESS_UNITS);
export const isBusinessUnit = (u) => UNITS.has(u);

// commerce review-rule `domain` → business unit
export const RULE_DOMAIN_TO_UNIT = {
  PRODUCT: "product",
  ORDER: "order",
  INVENTORY: "inventory",
  CLAIM: "claim",
  SETTLEMENT: "settlement",
  FINANCE: "finance",
  HR: "hr",
  PROCUREMENT: "procurement",
  PARTNER: "partner",
  LEGAL_POLICY: "legal-policy",
  APP_DISTRIBUTION: "app-distribution",
  SI_PROJECT: "si-project",
  RECURRING: "recurring",
  GENERAL_OPERATIONS: "operations",
  ALWAYS_ON: "operations",
  SYSTEM: "system",
};

// commerce workflow `reviewScope` → business unit
export const REVIEW_SCOPE_TO_UNIT = {
  PRODUCT: "product",
  ORDER_DELAY: "order",
  INVENTORY: "inventory",
  CLAIM: "claim",
  SETTLEMENT: "settlement",
  FINANCE: "finance",
  HR: "hr",
  PARTNER: "partner",
  LEGAL_POLICY: "legal-policy",
  CONTRACT: "legal-policy",
  APP_RELEASE: "app-distribution",
  APP_STORE: "app-distribution",
  SI_PROJECT: "si-project",
  RECURRING: "recurring",
  OPERATIONS: "operations",
  TASK: "operations",
  WORKSPACE: "operations",
  DAILY_BRIEFING: "operations",
  GENERAL_COMPANY: "operations",
  CHANGE_PLAN: "system",
};

// distribution experimental-rule `domain` → business unit (SUPPLIER folds into partner)
export const DIST_DOMAIN_TO_UNIT = {
  PRODUCT: "product",
  ORDER: "order",
  INVENTORY: "inventory",
  CLAIM: "claim",
  SETTLEMENT: "settlement",
  SUPPLIER: "partner",
};

// Resolve via a mapping table, defaulting unknowns to "operations" (the
// catch-all). Throwing would be stricter, but a default keeps imports resilient
// to new source values; the validator flags genuinely unknown units.
export function unitFrom(map, key) {
  return map[key] ?? "operations";
}

const idOf = (it) =>
  it.ruleId ?? it.workflowId ?? it.skillId ?? it.presetId ?? it.upstreamId ?? it.agentId ??
  it.adapterId ?? it.playbookId ?? it.targetId ?? it.modelId ?? it.metricId ?? it.code ??
  it.budgetId ?? it.settlementId ?? it.documentId ?? it.disclosureId ??
  it.objectType ?? it.documentType ?? it.object ?? it.id ?? "(unknown)";

// Folder-placement invariant: in a foldered contract, every item's taxonomy
// field (`businessUnit` for task contracts, `category` for skills) must be one
// of `allowed` AND equal to the file stem it lives under. Returns [scope,
// message] pairs so each domain validator routes them through its own fail()
// collector. This is what makes the migration's classification enforceable in
// CI; see docs/CONTRACT-TAXONOMY.md.
export function placementErrors(name, key, field, allowed) {
  const allow = new Set(allowed);
  const errors = [];
  for (const { unit, items } of readGroups(name, key)) {
    for (const it of items) {
      const scope = `${name}:${idOf(it)}`;
      const value = it[field];
      if (value === undefined || value === null || value === "") {
        errors.push([scope, `missing ${field}`]);
      } else if (!allow.has(value)) {
        errors.push([scope, `unknown ${field} "${value}" (not a canonical unit)`]);
      } else if (value !== unit) {
        errors.push([scope, `${field} "${value}" does not match its folder file "${unit}.json"`]);
      }
    }
  }
  return errors;
}

// Every multi-file foldered collection and the field its filename is the
// safeUnit() of. `businessUnit`/`category` are controlled-vocab axes (also
// membership-checked by their domain validators); the rest split by their own
// natural id/type. benchmarks-results is omitted here — it splits by the
// *derived* domain of its target, checked specially in validate-placement.mjs.
// [contract name, [collection key, split field]]. See docs/CONTRACT-TAXONOMY.md.
export const FOLDER_SPLIT = {
  "commerce-presets": ["presets", "presetId"],
  "commerce-review-rules": ["reviewRules", "businessUnit"],
  "commerce-workflows": ["workflows", "businessUnit"],
  "distribution-experimental-rules": ["rules", "businessUnit"],
  "transaction-budgets": ["budgets", "scope"],
  "transaction-settlement": ["settlements", "businessUnit"],
  "legal-documents": ["documents", "documentType"],
  "legal-disclosures": ["disclosures", "businessUnit"],
  "distribution-fields": ["fields", "documentType"],
  "platform-frontmatter": ["documents", "documentType"],
  "platform-event-types": ["groups", "object"],
  "platform-error-codes": ["errorCodes", "category"],
  "protocol-endpoints": ["endpoints", "kind"],
  "protocol-payloads": ["payloads", "objectType"],
  "gameops-adapters": ["adapters", "adapterId"],
  "gameops-agents": ["agents", "agentId"],
  "gameops-playbooks": ["playbooks", "playbookId"],
  "gameops-fields": ["fields", "documentType"],
  "skills-catalog": ["skills", "category"],
  "skills-data-sources": ["sources", "category"],
  "skills-packages": ["packages", "category"],
  "skills-categories": ["categories", "category"],
  "skills-credentials": ["credentials", "upstream"],
  "skills-proxy-routes": ["routes", "upstream"],
  "skills-upstreams": ["upstreams", "upstreamId"],
  "benchmarks-models": ["models", "vendor"],
  "benchmarks-metrics": ["metrics", "category"],
  "benchmarks-targets": ["targets", "domain"],
  "benchmarks-rollups": ["rollups", "domain"],
};

// Generic folder coherence: every item must live in the file named for the
// safeUnit() of its split field. Unlike placementErrors this enforces no
// controlled vocabulary (the "vocab" is the open set of ids/types themselves);
// it only checks that nothing is misfiled. Returns [scope, message] pairs.
export function folderPlacementErrors(name, key, field) {
  const errors = [];
  for (const { unit, items } of readGroups(name, key)) {
    for (const it of items) {
      const scope = `${name}:${idOf(it)}`;
      const value = it[field];
      if (value === undefined || value === null || value === "") {
        errors.push([scope, `missing split field ${field}`]);
      } else if (safeUnit(value) !== unit) {
        errors.push([scope, `${field} "${value}" belongs in "${safeUnit(value)}.json", not "${unit}.json"`]);
      }
    }
  }
  return errors;
}
