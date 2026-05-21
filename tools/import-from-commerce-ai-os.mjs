import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRoot =
  process.env.PLOMUS_COMMERCE_AI_OS_PATH ??
  path.resolve(repoRoot, "../plomus-commerce-ai-os");

function tsxJson(code) {
  const output = execFileSync("pnpm", ["exec", "tsx", "-e", code], {
    cwd: sourceRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
}

function writeJson(relativePath, value) {
  const target = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

const base = tsxJson(`
import {
  BASE_SYSTEM_FOLDERS,
  BASE_DOCUMENT_TYPES,
  BASE_WORKFLOWS,
  BASE_APPROVAL_REQUIRED,
  BASE_AUTO_APPLY_ALLOWED,
  COMMERCE_PRESET_REGISTRY,
} from "./apps/desktop/src/modules/onboarding/commerce-presets";
import { listAutoOperateWatchFolders } from "./apps/desktop/src/modules/auto-operate/workflow-router";
import {
  AI_RECOMMENDATION_STATUSES,
  CHANGE_PLAN_STATUSES,
  CHANGE_PLAN_TYPES,
  CLOUD_COMMAND_STATUSES,
  CLOUD_COMMAND_TYPES,
  COMMERCE_DOMAINS,
  COMMERCE_PRESET_IDS,
  COMMERCE_REVIEW_STATUSES,
  COMMERCE_TYPES,
  HERMES_COMMAND_STATUSES,
  HERMES_WORKFLOWS,
  MARKDOWN_OBJECT_TYPES,
  MVP_HERMES_WORKFLOWS,
  ONBOARDING_STATUSES,
  ONBOARDING_STEPS,
  OPERATION_MODES,
  PATCH_MODES,
  PLOMUS_OBJECT_TYPES,
  PRIORITIES,
  PRODUCT_TYPES,
  REVIEW_RULE_IDS,
  RISK_LEVELS,
  SALES_CHANNELS,
  SOURCE_OF_TRUTH_VALUES,
  SYNC_EVENT_STATUSES,
  SYNC_EVENT_TYPES,
  SYNC_OPERATIONS,
  SYNC_STATUSES,
  TASK_ACTION_TYPES,
  TASK_STATUSES,
  APPROVAL_RULE_IDS,
} from "@plomus/core";
import { frontmatterSchemas } from "@plomus/schemas";
import { REVIEW_RULE_REGISTRY } from "./apps/desktop/src/modules/commerce-review/rules";

const union = (...groups) => [...new Set(groups.flat())];
const presetIds = Object.keys(COMMERCE_PRESET_REGISTRY);

console.log(JSON.stringify({
  schemaVersion: "1.0.0",
  source: "plomus-commerce-ai-os",
  sourceImportedAt: new Date().toISOString(),
  systemFolders: BASE_SYSTEM_FOLDERS,
  documentTypes: union(BASE_DOCUMENT_TYPES, [
    "product",
    "order",
    "stock",
    "claim",
    "settlement",
    "app",
    "app_listing",
    "app_release",
    "meeting",
    "meeting_action",
    "expense",
    "expense_report",
    "employee_onboarding",
    "hr_process",
    "leave_request",
    "probation_review",
    "employee_review",
    "purchase_request",
    "procurement",
    "accounts_receivable",
    "accounts_payable",
    "finance_item",
    "invoice",
    "vendor_bill",
    "finance_close",
    "monthly_close",
    "recurring_task",
    "periodic_task",
    "checklist",
    "periodic_report",
    "report",
    "ops_request",
    "service_request",
    "support_ticket",
    "incident",
    "ops_incident",
    "si_project",
    "contract",
    "deliverable",
    "maintenance",
    "partner",
    "match",
    "commission",
    "dispute",
    "legal_policy",
  ]),
  baseWorkflows: BASE_WORKFLOWS,
  approvalRequired: BASE_APPROVAL_REQUIRED,
  autoApplyAllowed: BASE_AUTO_APPLY_ALLOWED,
  watchFolders: listAutoOperateWatchFolders(),
  core: {
    commercePresetIds: union(COMMERCE_PRESET_IDS, presetIds),
    commerceTypes: union(COMMERCE_TYPES, ["GENERAL_COMPANY"]),
    salesChannels: union(SALES_CHANNELS, ["PARTNER_CHANNEL", "INTERNAL"]),
    productTypes: union(PRODUCT_TYPES, [
      "PARTNER_PRODUCT",
      "STOCKED_PRODUCT",
      "DIGITAL_PRODUCT",
      "MAINTENANCE_SERVICE",
      "INTERNAL_OPERATIONS",
    ]),
    operationModes: union(OPERATION_MODES, [
      "SMALL_COMMERCE",
      "PARTNER_OPERATED",
      "INVENTORY_CONTROLLED",
      "DIGITAL_DISTRIBUTION",
      "PROJECT_BASED",
      "PARTNER_MATCHING",
      "GENERAL_OPERATIONS",
    ]),
    commerceDomains: union(COMMERCE_DOMAINS, [
      "GENERAL_OPERATIONS",
      "FINANCE",
      "HR",
      "PROCUREMENT",
      "ALWAYS_ON",
      "RECURRING",
    ]),
    legacyReviewRuleIds: REVIEW_RULE_IDS,
    reviewRuleIds: Object.keys(REVIEW_RULE_REGISTRY).sort(),
    approvalRuleIds: APPROVAL_RULE_IDS,
    cloudCommandTypes: CLOUD_COMMAND_TYPES,
    hermesWorkflows: HERMES_WORKFLOWS,
    mvpHermesWorkflows: MVP_HERMES_WORKFLOWS,
    objectTypes: PLOMUS_OBJECT_TYPES,
    markdownObjectTypes: MARKDOWN_OBJECT_TYPES,
    onboardingSteps: ONBOARDING_STEPS,
    syncOperations: SYNC_OPERATIONS,
    priorities: PRIORITIES,
    sourceOfTruthValues: SOURCE_OF_TRUTH_VALUES,
    syncEventTypes: SYNC_EVENT_TYPES,
    frontmatterTypes: Object.keys(frontmatterSchemas),
    syncPayloadObjectTypes: [
      "COMMERCE_PROFILE",
      "WORKFLOW_PROFILE",
      "REVIEW_POLICY",
      "APPROVAL_POLICY",
      "DOCUMENT_PROFILE",
      "COMMERCE_REVIEW",
      "AI_RECOMMENDATION",
      "CHANGE_PLAN",
      "TASK",
    ],
    taskActionTypes: TASK_ACTION_TYPES,
    changePlanTypes: CHANGE_PLAN_TYPES,
    patchModes: PATCH_MODES,
    riskLevels: RISK_LEVELS,
    statuses: {
      commerceReview: COMMERCE_REVIEW_STATUSES,
      aiRecommendation: AI_RECOMMENDATION_STATUSES,
      changePlan: CHANGE_PLAN_STATUSES,
      task: TASK_STATUSES,
      sync: SYNC_STATUSES,
      syncEvent: SYNC_EVENT_STATUSES,
      cloudCommand: CLOUD_COMMAND_STATUSES,
      hermesCommand: HERMES_COMMAND_STATUSES,
      onboarding: ONBOARDING_STATUSES,
    },
  },
}));
`);

const presets = tsxJson(`
import { COMMERCE_PRESET_REGISTRY } from "./apps/desktop/src/modules/onboarding/commerce-presets";
console.log(JSON.stringify({
  schemaVersion: "1.0.0",
  presets: Object.values(COMMERCE_PRESET_REGISTRY),
}));
`);

const reviewRules = tsxJson(`
import { REVIEW_RULE_REGISTRY } from "./apps/desktop/src/modules/commerce-review/rules";

function domainOf(ruleId) {
  if (ruleId.startsWith("PRODUCT_")) return "PRODUCT";
  if (ruleId.startsWith("ORDER_")) return "ORDER";
  if (ruleId.startsWith("INVENTORY_")) return "INVENTORY";
  if (ruleId.startsWith("CLAIM_")) return "CLAIM";
  if (ruleId.startsWith("SETTLEMENT_")) return "SETTLEMENT";
  if (ruleId.startsWith("APP_")) return "APP_DISTRIBUTION";
  if (ruleId.startsWith("SI_")) return "SI_PROJECT";
  if (ruleId.startsWith("PARTNER_")) return "PARTNER";
  if (ruleId.includes("LEGAL") || ruleId.includes("PRIVACY") || ruleId.includes("TERMS")) return "LEGAL_POLICY";
  if (ruleId.startsWith("FINANCE_") || ruleId.startsWith("EXPENSE_")) return "FINANCE";
  if (ruleId.startsWith("HR_")) return "HR";
  if (ruleId.startsWith("MEETING_")) return "ALWAYS_ON";
  if (ruleId.startsWith("PROCUREMENT_")) return "PROCUREMENT";
  if (ruleId.startsWith("OPERATIONS_") || ruleId.startsWith("INCIDENT_")) return "GENERAL_OPERATIONS";
  if (ruleId.startsWith("RECURRING_") || ruleId.startsWith("PERIODIC_")) return "RECURRING";
  return "SYSTEM";
}

console.log(JSON.stringify({
  schemaVersion: "1.0.0",
  reviewRules: Object.keys(REVIEW_RULE_REGISTRY).sort().map((ruleId) => ({
    ruleId,
    domain: domainOf(ruleId),
    status: "ACTIVE",
  })),
}));
`);

// severity/title are runtime literals inside each rule's build fn (not on the
// registry object), so block-parse the source: from each quoted ruleId site to
// the next, take the first severity/title.
const rulesSource = fs.readFileSync(
  path.join(sourceRoot, "apps/desktop/src/modules/commerce-review/rules.ts"),
  "utf8",
);
const ruleIdSet = new Set(reviewRules.reviewRules.map((r) => r.ruleId));
const sites = [];
const seenIds = new Set();
for (const match of rulesSource.matchAll(/"([A-Z][A-Z0-9_]+)"/g)) {
  if (ruleIdSet.has(match[1]) && !seenIds.has(match[1])) {
    seenIds.add(match[1]);
    sites.push({ id: match[1], pos: match.index });
  }
}
sites.sort((a, b) => a.pos - b.pos);
const ruleMeta = {};
for (let i = 0; i < sites.length; i += 1) {
  const block = rulesSource.slice(sites[i].pos, sites[i + 1]?.pos ?? rulesSource.length);
  ruleMeta[sites[i].id] = {
    severity: block.match(/severity:\s*"(LOW|MEDIUM|HIGH)"/)?.[1] ?? null,
    title: block.match(/title:\s*"([^"]+)"/)?.[1] ?? null,
  };
}
for (const rule of reviewRules.reviewRules) {
  const meta = ruleMeta[rule.ruleId];
  if (meta) {
    rule.severity = meta.severity;
    rule.description = meta.title;
  }
}

const workflows = tsxJson(`
import { listHermesReviewWorkflowDefinitions } from "./apps/desktop/src/modules/hermes/workflow-definitions";

const applyWorkflow = {
  workflowId: "apply-change-plan",
  label: "승인된 변경 계획 적용",
  reviewScope: "CHANGE_PLAN",
  reviewType: "APPLY",
  targetFolders: ["65-change-plans", "70-tasks"],
  enabledRuleIds: [],
  safety: {
    executionClass: "LOCAL_APPLY",
    riskLevel: "HIGH",
    externalAccess: "NONE",
    requiresApprovalBeforeApply: true,
    sideEffects: [
      "CREATE_BACKUP",
      "APPLY_APPROVED_CHANGE_PLAN",
      "UPDATE_TASK_STATUS",
      "CREATE_SYNC_EVENT"
    ],
    notes: "승인된 변경 계획만 적용하며 적용 전 백업을 생성합니다.",
  },
};

const workflows = [
  applyWorkflow,
  ...listHermesReviewWorkflowDefinitions(),
].sort((a, b) => a.workflowId.localeCompare(b.workflowId));

console.log(JSON.stringify({
  schemaVersion: "1.0.0",
  workflows,
}));
`);

writeJson("contracts/v1/base.json", base);
writeJson("contracts/v1/presets.json", presets);
writeJson("contracts/v1/review-rules.json", reviewRules);
writeJson("contracts/v1/workflows.json", workflows);

console.log(`imported contracts from ${sourceRoot}`);
