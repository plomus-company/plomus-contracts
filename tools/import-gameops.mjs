import path from "node:path";
import { writeJson } from "../scripts/read-json.mjs";

// Single source of truth for the `gameops` contract domain.
//
// GameOps-specific vocabularies from plomus-gameops-ai-os: LiveOps execution
// adapters, operator intents, agents, playbooks, and game-domain taxonomies
// (sanctions, incident severities, CS classification, notice types, data
// pipeline entities). The governance domain is referenced READ-ONLY by the
// validator (risk levels + approval policies must resolve there).
//
// Run with: pnpm run import:gameops

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRepo = process.env.PLOMUS_GAMEOPS_AI_OS_PATH ?? path.resolve(repoRoot, "../plomus-gameops-ai-os");
const generatedAt = new Date().toISOString();

// packages/core/src/intent.ts
const INTENTS = ["status.check", "report.today.brief", "report.daily.generate", "cs.summary", "notice.draft", "notice.publish", "incident.create", "reward.grant", "sanction.apply", "playbook.run", "approval.queue.list", "approval.approve", "approval.reject", "account.link", "ai.command", "help.show"];
const AGENT_IDS = ["cs", "notice", "incident", "dashboard"];
const PLAYBOOK_STEP_TYPES = ["query", "analyze", "draft", "approval"];
const SANCTION_TYPES = ["ban", "mute", "warn"];
const INCIDENT_SEVERITIES = ["S1", "S2", "S3", "S4"];
const CS_CATEGORIES = ["payment", "general"];
const CS_STATUSES = ["open", "assigned", "in_progress", "resolved", "closed"];
const CS_PRIORITIES = ["low", "normal", "high", "urgent"];
const CS_SENTIMENTS = ["negative", "neutral", "positive"];
const NOTICE_TYPES = ["incident", "general"];
const PIPELINE_ENTITY_TYPES = ["PAYMENT", "STABILITY", "SESSION", "CS", "GENERIC"];
const COMMAND_SOURCES = ["telegram", "desktop", "web", "system"];
const DASHBOARD_STATUS_LEVELS = ["normal", "warning", "critical"];

// apps/desktop/src/modules/.../incident-agent.ts — severity by CS ticket count.
const INCIDENT_SEVERITY_THRESHOLDS = [
  { severity: "S2", minTickets: 30 },
  { severity: "S3", minTickets: 10 },
  { severity: "S4", minTickets: 0 },
];

// Frontmatter field -> controlled vocabulary binding for gameops documents.
const FIELDS = [
  { documentType: "cs_ticket", field: "category", enum: "csCategories", required: true },
  { documentType: "cs_ticket", field: "status", enum: "csStatuses", required: true },
  { documentType: "cs_ticket", field: "priority", enum: "csPriorities", required: false },
  { documentType: "cs_ticket", field: "sentiment", enum: "csSentiments", required: false },
  { documentType: "incident", field: "severity", enum: "incidentSeverities", required: true },
  { documentType: "notice", field: "notice_type", enum: "noticeTypes", required: true },
];

// packages/execution/src/catalog.ts
const ADAPTERS = [
  { adapterId: "notice.cms", executionTypes: ["notice.publish"], capabilities: ["publish", "unpublish"], dryRunSupported: true, rollbackSupported: true, requiresConfig: [] },
  { adapterId: "reward.grant", executionTypes: ["reward.grant"], capabilities: ["grant", "revoke"], dryRunSupported: true, rollbackSupported: true, requiresConfig: [] },
  { adapterId: "coupon.issue", executionTypes: ["coupon.issue"], capabilities: ["issue", "invalidate"], dryRunSupported: true, rollbackSupported: true, requiresConfig: [] },
  { adapterId: "sanction.apply", executionTypes: ["sanction.apply"], capabilities: ["apply", "lift"], dryRunSupported: true, rollbackSupported: true, requiresConfig: [] },
  { adapterId: "push.send", executionTypes: ["push.send"], capabilities: ["send"], dryRunSupported: true, rollbackSupported: false, requiresConfig: [] },
  { adapterId: "event.config", executionTypes: ["event.config", "event.update"], capabilities: ["apply", "restore"], dryRunSupported: true, rollbackSupported: true, requiresConfig: [] },
  { adapterId: "webhook.custom", executionTypes: ["reward.grant", "sanction.apply", "event.update", "notice.publish"], capabilities: ["http-post"], dryRunSupported: true, rollbackSupported: false, requiresConfig: ["endpoint"] },
];

// packages/agents/src/gameops/*
const AGENTS = [
  { agentId: "cs", intents: ["cs.summary"], description: "CS 문의 요약·분류(category/sentiment/priority)", outputs: { category: "csCategories", sentiment: "csSentiments", priority: "csPriorities" } },
  { agentId: "notice", intents: ["notice.draft", "notice.publish"], description: "공지 초안 작성·검토", outputs: { notice_type: "noticeTypes" } },
  { agentId: "incident", intents: ["incident.create"], description: "인시던트 생성·심각도 분류(S1–S4)", outputs: { severity: "incidentSeverities" } },
  { agentId: "dashboard", intents: ["report.today.brief", "report.daily.generate"], description: "운영 대시보드 인사이트·일일 브리핑", outputs: { status_level: "dashboardStatusLevels" } },
];

// apps/web/prisma/seed-playbooks.json
const PLAYBOOKS = [
  { playbookId: "payment_missing_response_v1", triggers: ["cs.summary", "incident.create"], riskLevel: "high", requiresApproval: true, steps: [{ type: "query" }, { type: "analyze" }, { type: "draft" }, { type: "approval", approvalPolicy: "operation_pm" }] },
  { playbookId: "daily_ops_brief_v1", triggers: ["report.today.brief", "report.daily.generate"], riskLevel: "low", requiresApproval: false, steps: [{ type: "query" }, { type: "analyze" }, { type: "draft" }] },
];

writeJson("contracts/gameops-base.json", {
  schemaVersion: "1.0.0",
  source: "plomus-gameops-ai-os",
  sourceImportedAt: generatedAt,
  builtOnGovernance: "governance",
  intents: INTENTS,
  agentIds: AGENT_IDS,
  playbookStepTypes: PLAYBOOK_STEP_TYPES,
  sanctionTypes: SANCTION_TYPES,
  incidentSeverities: INCIDENT_SEVERITIES,
  csCategories: CS_CATEGORIES,
  csStatuses: CS_STATUSES,
  csPriorities: CS_PRIORITIES,
  csSentiments: CS_SENTIMENTS,
  noticeTypes: NOTICE_TYPES,
  pipelineEntityTypes: PIPELINE_ENTITY_TYPES,
  commandSources: COMMAND_SOURCES,
  dashboardStatusLevels: DASHBOARD_STATUS_LEVELS,
  incidentSeverityThresholds: INCIDENT_SEVERITY_THRESHOLDS,
});
writeJson("contracts/gameops-adapters.json", { schemaVersion: "1.0.0", adapters: ADAPTERS });
writeJson("contracts/gameops-agents.json", { schemaVersion: "1.0.0", agents: AGENTS });
writeJson("contracts/gameops-playbooks.json", { schemaVersion: "1.0.0", playbooks: PLAYBOOKS });
writeJson("contracts/gameops-fields.json", { schemaVersion: "1.0.0", note: "GameOps document fields and the controlled vocabulary each binds to.", fields: FIELDS });

console.log(`imported gameops contracts (source: ${sourceRepo})`);
console.log(`  intents: ${INTENTS.length}, adapters: ${ADAPTERS.length}, agents: ${AGENTS.length}, playbooks: ${PLAYBOOKS.length}, fields: ${FIELDS.length}`);
