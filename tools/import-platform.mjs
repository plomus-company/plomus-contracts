import path from "node:path";
import { writeJson } from "../scripts/read-json.mjs";

// Single source of truth for the `platform` contract domain.
//
// Captures shared commerce-platform vocabularies that plomus-commerce-ai-os
// defines but the commerce import tool does not extract: per-document-type
// frontmatter status/field contracts, the per-object event-type taxonomy, and
// the error-code taxonomy.
//
// Commerce contracts are referenced READ-ONLY by the validator. These are
// candidates for promotion into the commerce baseline (would require updating
// import-from-commerce-ai-os). Run with: pnpm run import:platform

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRepo = process.env.PLOMUS_COMMERCE_AI_OS_PATH ?? path.resolve(repoRoot, "../plomus-commerce-ai-os");
const generatedAt = new Date().toISOString();

// packages/schemas/src/{domain,profile,workflow}.schema.ts — status enums + required fields.
// Domain objects carry a lifecycle status enum; profile/review documents do not
// (statusField/statuses omitted), so the contract models status as optional.
const FRONTMATTER = [
  { documentType: "product", localIdPrefix: "PROD-", statusField: "status", statuses: ["DRAFT", "ACTIVE", "PAUSED", "SOLD_OUT", "ARCHIVED"], extraEnums: { content_quality_status: ["GOOD", "NEEDS_SUPPLEMENT", "MISSING_REQUIRED_INFO"], image_status: ["READY", "MISSING", "NEEDS_REVIEW"] }, requiredFields: ["type", "local_id", "product_name", "status"] },
  { documentType: "order", localIdPrefix: "ORDER-", statusField: "order_status", statuses: ["PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"], extraEnums: {}, requiredFields: ["type", "local_id", "order_number", "order_status", "payment_amount"] },
  { documentType: "claim", localIdPrefix: "CLAIM-", statusField: "claim_status", statuses: ["RECEIVED", "IN_REVIEW", "WAITING_CUSTOMER", "RESOLVED", "REJECTED"], extraEnums: { claim_type: ["CANCEL", "RETURN", "EXCHANGE", "REFUND", "CS"] }, requiredFields: ["type", "local_id", "claim_type", "claim_status"] },
  { documentType: "settlement", localIdPrefix: "SETTLE-", statusField: "settlement_status", statuses: ["EXPECTED", "RECEIVED", "MISMATCH", "NEEDS_CHECK", "CONFIRMED"], extraEnums: {}, requiredFields: ["type", "local_id", "settlement_period", "expected_amount", "settlement_status"] },
  // commerce_review carries a free-string status (no enum); profiles have no lifecycle status.
  { documentType: "commerce_review", localIdPrefix: "REV-", statusField: "status", statuses: [], extraEnums: {}, requiredFields: ["type", "local_id", "review_scope", "review_type", "status"] },
  { documentType: "commerce_profile", localIdPrefix: "PROFILE-COMMERCE", statusField: null, statuses: [], extraEnums: {}, requiredFields: ["type", "local_id", "commerce_types", "sales_channels", "product_types", "operation_mode", "enabled_domains"] },
  { documentType: "workflow_profile", localIdPrefix: "PROFILE-WORKFLOW", statusField: null, statuses: [], extraEnums: {}, requiredFields: ["type", "local_id", "enabled_workflows"] },
  { documentType: "review_policy", localIdPrefix: "PROFILE-REVIEW-POLICY", statusField: null, statuses: [], extraEnums: {}, requiredFields: ["type", "local_id", "enabled_rules"] },
  { documentType: "approval_policy", localIdPrefix: "PROFILE-APPROVAL-POLICY", statusField: null, statuses: [], extraEnums: {}, requiredFields: ["type", "local_id", "require_approval_for"] },
  { documentType: "document_profile", localIdPrefix: "PROFILE-DOCUMENT", statusField: null, statuses: [], extraEnums: {}, requiredFields: ["type", "local_id", "enabled_folders", "enabled_document_types"] },
];

// packages/core/src/event-types.ts (per-object event taxonomy; union ⊆ commerce syncEventTypes)
const EVENT_TYPES = [
  { object: "profile", events: ["COMMERCE_PROFILE_CREATED", "COMMERCE_PROFILE_UPDATED", "WORKFLOW_PROFILE_CREATED", "WORKFLOW_PROFILE_UPDATED", "REVIEW_POLICY_CREATED", "REVIEW_POLICY_UPDATED", "APPROVAL_POLICY_CREATED", "APPROVAL_POLICY_UPDATED", "DOCUMENT_PROFILE_CREATED", "DOCUMENT_PROFILE_UPDATED", "ONBOARDING_COMPLETED"] },
  { object: "commerceReview", events: ["COMMERCE_REVIEW_CREATED", "COMMERCE_REVIEW_STARTED", "COMMERCE_REVIEW_COMPLETED", "COMMERCE_REVIEW_FAILED", "COMMERCE_REVIEW_PARTIAL"] },
  { object: "aiRecommendation", events: ["AI_RECOMMENDATION_CREATED", "AI_RECOMMENDATION_ACCEPTED", "AI_RECOMMENDATION_REJECTED"] },
  { object: "changePlan", events: ["CHANGE_PLAN_CREATED", "CHANGE_PLAN_APPROVED", "CHANGE_PLAN_REJECTED", "CHANGE_PLAN_APPLYING", "CHANGE_PLAN_APPLIED", "CHANGE_PLAN_FAILED", "CHANGE_PLAN_SUPERSEDED"] },
  { object: "task", events: ["TASK_CREATED", "TASK_APPROVED", "TASK_REJECTED", "TASK_COMPLETED", "TASK_STATUS_CHANGED"] },
  { object: "system", events: ["SYNC_CONFLICT_FOUND", "VALIDATION_ERROR_FOUND", "HERMES_RUN_COMPLETED", "HERMES_RUN_FAILED", "AGENT_HEARTBEAT_RECEIVED"] },
];

// packages/core/src/errors.ts → PLOMUS_ERROR_CODES (21)
const ERROR_CATEGORIES = ["config", "document", "validation", "workflow", "changePlan", "patch", "sync", "task"];
const ERROR_CODES = [
  { code: "INVALID_CONFIG", category: "config" },
  { code: "WORKSPACE_NOT_FOUND", category: "config" },
  { code: "DOCUMENT_NOT_FOUND", category: "document" },
  { code: "TARGET_FILE_NOT_FOUND", category: "document" },
  { code: "INVALID_FRONTMATTER", category: "document" },
  { code: "VALIDATION_FAILED", category: "validation" },
  { code: "UNSUPPORTED_WORKFLOW", category: "workflow" },
  { code: "COMMERCE_REVIEW_FAILED", category: "workflow" },
  { code: "UNSUPPORTED_CHANGE_PLAN_TYPE", category: "changePlan" },
  { code: "CHANGE_PLAN_NOT_FOUND", category: "changePlan" },
  { code: "CHANGE_PLAN_ALREADY_APPLIED", category: "changePlan" },
  { code: "CHANGE_PLAN_NOT_APPROVED", category: "changePlan" },
  { code: "PATCH_PARSE_FAILED", category: "patch" },
  { code: "PATCH_APPLY_FAILED", category: "patch" },
  { code: "SYNC_AUTH_FAILED", category: "sync" },
  { code: "SYNC_EVENT_CONFLICT", category: "sync" },
  { code: "SYNC_PUSH_FAILED", category: "sync" },
  { code: "SYNC_PULL_FAILED", category: "sync" },
  { code: "TASK_NOT_FOUND", category: "task" },
  { code: "TASK_ALREADY_CLOSED", category: "task" },
  { code: "TASK_NOT_APPROVED", category: "task" },
];

writeJson("contracts/platform/v1/base.json", {
  schemaVersion: "1.0.0",
  source: "plomus-commerce-ai-os",
  sourceImportedAt: generatedAt,
  builtOnCommerce: "contracts/v1",
  lifecycleObjects: FRONTMATTER.filter((f) => (f.statuses ?? []).length > 0).map((f) => f.documentType),
  eventObjects: EVENT_TYPES.map((e) => e.object),
  errorCategories: ERROR_CATEGORIES,
});
writeJson("contracts/platform/v1/frontmatter.json", { schemaVersion: "1.0.0", documents: FRONTMATTER });
writeJson("contracts/platform/v1/event-types.json", { schemaVersion: "1.0.0", groups: EVENT_TYPES });
writeJson("contracts/platform/v1/error-codes.json", { schemaVersion: "1.0.0", errorCodes: ERROR_CODES });

console.log(`imported platform contracts (source: ${sourceRepo})`);
console.log(`  frontmatter docs: ${FRONTMATTER.length}, event groups: ${EVENT_TYPES.length}, error codes: ${ERROR_CODES.length}`);
