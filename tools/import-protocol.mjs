import path from "node:path";
import { writeJson } from "../scripts/read-json.mjs";

// Single source of truth for the `protocol` contract domain.
//
// Captures the desktop↔web integration surface of plomus-commerce-ai-os that the
// commerce import tool does not extract: the HTTP sync/approval API, the sync
// event wire schema (incl. its own protocol schema_version), the sync payload
// object-type registry, and the inbound Telegram command taxonomy.
//
// Commerce contracts are referenced READ-ONLY by the validator; this tool never
// edits them. Run with: pnpm run import:protocol

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRepo = process.env.PLOMUS_COMMERCE_AI_OS_PATH ?? path.resolve(repoRoot, "../plomus-commerce-ai-os");
const generatedAt = new Date().toISOString();

const EVENT_SOURCES = ["LOCAL", "CLOUD", "TELEGRAM", "SYSTEM"];
const HTTP_METHODS = ["GET", "POST"];
const PROTOCOL_VERSION = "2.0";
const TELEGRAM_COMMAND_KINDS = ["run_workflow", "apply_change_plan", "status", "help"];
const TELEGRAM_COMMAND_STATUSES = ["CREATED", "NOOP", "REJECTED"];

// apps/web/app/api/* (HTTP method confirmed from each route handler)
const ENDPOINTS = [
  { name: "sync-events", path: "/api/sync/events", method: "POST", kind: "sync", transport: "json", description: "desktop가 로컬 sync event를 web으로 push" },
  { name: "sync-pull", path: "/api/sync/pull", method: "GET", kind: "sync", transport: "json", description: "desktop가 cloud 상태/명령 변경을 pull" },
  { name: "sync-commands-stream", path: "/api/sync/commands/stream", method: "GET", kind: "sync", transport: "sse", description: "cloud command를 SSE로 스트리밍" },
  { name: "change-plan-approve", path: "/api/change-plans/:id/approve", method: "POST", kind: "approval", transport: "json", description: "변경 계획 승인" },
  { name: "change-plan-reject", path: "/api/change-plans/:id/reject", method: "POST", kind: "approval", transport: "json", description: "변경 계획 반려" },
  { name: "settings-profile", path: "/api/settings/profile", method: "GET", kind: "settings", transport: "json", description: "활성 commerce profile 조회" },
  { name: "health", path: "/api/health", method: "GET", kind: "health", transport: "json", description: "헬스 체크" },
];

// packages/schemas/src/sync-event.schema.ts → syncEventApiBodySchema
const SYNC_EVENT_FIELDS = [
  { field: "event_id", type: "string", required: true, prefix: "EVT-" },
  { field: "event_type", type: "string", required: true },
  { field: "source", type: "enum", enum: "eventSources", required: true },
  { field: "device_id", type: "string", required: true },
  { field: "object_type", type: "string", required: true },
  { field: "object_id", type: "string", required: true },
  { field: "operation", type: "string", required: true },
  { field: "payload", type: "object", required: true },
  { field: "payload_hash", type: "string", required: false },
  { field: "local_version", type: "number", required: false, default: 0 },
  { field: "cloud_version", type: "number", required: false, default: 0 },
  { field: "schema_version", type: "string", required: false, default: PROTOCOL_VERSION },
  { field: "occurred_at", type: "string", required: false },
];

// packages/schemas/src/{profile-payload,workflow}.schema.ts — required = non-optional, non-default
const PAYLOADS = [
  { objectType: "COMMERCE_PROFILE", localIdPrefix: "PROFILE-COMMERCE", requiredFields: ["local_id", "commerce_types", "sales_channels", "product_types", "operation_mode", "enabled_domains"] },
  { objectType: "WORKFLOW_PROFILE", localIdPrefix: "PROFILE-WORKFLOW", requiredFields: ["local_id", "enabled_workflows", "default_review_workflow", "default_apply_workflow"] },
  { objectType: "REVIEW_POLICY", localIdPrefix: "PROFILE-REVIEW-POLICY", requiredFields: ["local_id", "enabled_rules"] },
  { objectType: "APPROVAL_POLICY", localIdPrefix: "PROFILE-APPROVAL-POLICY", requiredFields: ["local_id", "require_approval_for"] },
  { objectType: "DOCUMENT_PROFILE", localIdPrefix: "PROFILE-DOCUMENT", requiredFields: ["local_id", "enabled_folders", "enabled_document_types"] },
  { objectType: "COMMERCE_REVIEW", localIdPrefix: "REV-", requiredFields: ["local_id", "review_scope", "review_type", "status"] },
  { objectType: "AI_RECOMMENDATION", localIdPrefix: "AIR-", requiredFields: ["local_id", "recommendation_type", "target_type", "target_id", "title", "status", "confidence_score"] },
  { objectType: "CHANGE_PLAN", localIdPrefix: "PLAN-", requiredFields: ["local_id", "plan_type", "change_type", "status", "target_file", "title"] },
  { objectType: "TASK", localIdPrefix: "TASK-", requiredFields: ["local_id", "task_type", "title", "status"] },
];

// apps/desktop/src/modules/telegram/telegram-command.service.ts
const TELEGRAM_COMMANDS = [
  { kind: "run_workflow", verbs: ["/review", "review", "리뷰", "검토", "/run", "run", "실행"], mapsToCloudCommand: "RUN_WORKFLOW" },
  { kind: "apply_change_plan", verbs: ["/apply", "apply", "적용", "/approve", "approve", "승인"], mapsToCloudCommand: "APPLY_CHANGE_PLAN" },
  { kind: "status", verbs: ["/status", "status", "상태"], mapsToCloudCommand: null },
  { kind: "help", verbs: ["/help", "help", "도움말"], mapsToCloudCommand: null },
];

writeJson("contracts/protocol-base.json", {
  schemaVersion: "1.0.0",
  source: "plomus-commerce-ai-os",
  sourceImportedAt: generatedAt,
  builtOnCommerce: "commerce",
  protocolVersion: PROTOCOL_VERSION,
  eventSources: EVENT_SOURCES,
  httpMethods: HTTP_METHODS,
  telegramCommandKinds: TELEGRAM_COMMAND_KINDS,
  telegramCommandStatuses: TELEGRAM_COMMAND_STATUSES,
});
writeJson("contracts/protocol-endpoints.json", { schemaVersion: "1.0.0", endpoints: ENDPOINTS });
writeJson("contracts/protocol-sync-event.json", { schemaVersion: "1.0.0", protocolVersion: PROTOCOL_VERSION, fields: SYNC_EVENT_FIELDS });
writeJson("contracts/protocol-payloads.json", { schemaVersion: "1.0.0", payloads: PAYLOADS });
writeJson("contracts/protocol-telegram.json", { schemaVersion: "1.0.0", commandStatuses: TELEGRAM_COMMAND_STATUSES, commands: TELEGRAM_COMMANDS });

console.log(`imported protocol contracts (source: ${sourceRepo})`);
console.log(`  endpoints: ${ENDPOINTS.length}, sync-event fields: ${SYNC_EVENT_FIELDS.length}, payloads: ${PAYLOADS.length}, telegram kinds: ${TELEGRAM_COMMANDS.length}`);
