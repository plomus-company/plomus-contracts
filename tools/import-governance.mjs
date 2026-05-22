import path from "node:path";
import { writeJson } from "../scripts/read-json.mjs";

// Single source of truth for the `governance` contract domain.
//
// Captures cross-cutting "safe operation" controls observed in
// plomus-gameops-ai-os that any AI ops OS (commerce/distribution/gameops) can
// reuse but that are not yet contracted:
//   A1. risk → model routing (ties into the benchmarks model registry)
//   A2. execution lifecycle state machine (dry-run → approve → execute → verify → rollback)
//   A3. RBAC roles + multi-party approval policy (risk-gated)
//
// The benchmarks domain is referenced READ-ONLY by the validator (model-routing
// must resolve to a real model status). Run with: pnpm run import:governance

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRepo = process.env.PLOMUS_GAMEOPS_AI_OS_PATH ?? path.resolve(repoRoot, "../plomus-gameops-ai-os");
const generatedAt = new Date().toISOString();

const RISK_LEVELS = ["low", "medium", "high", "critical"];
const ROLES = ["owner", "admin", "operation_pm", "operator", "viewer", "bot"];
const APPROVAL_POLICIES = ["admin_multi", "operation_pm", "single"];
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];
const APPROVAL_CHANNELS = ["WEB", "TELEGRAM"];

// packages/core/src/states.ts
const EXECUTION_STATES = ["created", "dry_run_required", "dry_running", "dry_run_succeeded", "dry_run_failed", "approval_required", "approved", "execution_queued", "executing", "execution_succeeded", "execution_failed", "verification_running", "verified", "verification_failed", "completed", "rollback_required", "rollback_running", "rollback_succeeded", "rollback_failed"];
const COMMAND_STATES = ["created", "parsed", "permission_checked", "approval_required", "approved", "queued", "claimed", "running", "succeeded", "failed", "synced", "archived", "rejected"];

// packages/core/src/lifecycle.ts
const EXECUTION_TRANSITIONS = {
  created: ["dry_run_required"],
  dry_run_required: ["dry_running"],
  dry_running: ["dry_run_succeeded", "dry_run_failed"],
  dry_run_succeeded: ["approval_required", "execution_queued"],
  dry_run_failed: [],
  approval_required: ["approved"],
  approved: ["execution_queued"],
  execution_queued: ["executing"],
  executing: ["execution_succeeded", "execution_failed"],
  execution_succeeded: ["verification_running"],
  execution_failed: ["rollback_required"],
  verification_running: ["verified", "verification_failed"],
  verified: ["completed"],
  verification_failed: ["rollback_required"],
  completed: [],
  rollback_required: ["rollback_running"],
  rollback_running: ["rollback_succeeded", "rollback_failed"],
  rollback_succeeded: [],
  rollback_failed: [],
};
const COMMAND_TRANSITIONS = {
  created: ["parsed"],
  parsed: ["permission_checked"],
  permission_checked: ["approval_required", "queued", "rejected"],
  approval_required: ["approved", "rejected"],
  approved: ["queued"],
  queued: ["claimed"],
  claimed: ["running"],
  running: ["succeeded", "failed"],
  succeeded: ["synced"],
  failed: ["synced", "archived"],
  synced: ["archived"],
  rejected: ["archived"],
  archived: [],
};
// packages/execution/src/execution.types.ts — adapter step contract + result fields
const EXECUTION_STEPS = [
  { step: "validate", required: true, resultFields: ["ok"] },
  { step: "dryRun", required: true, resultFields: ["ok", "summary", "estimatedImpact", "warnings", "rollbackSupported", "rollbackPlan"] },
  { step: "execute", required: true, resultFields: ["ok", "externalExecutionId", "summary", "result"] },
  { step: "verify", required: true, resultFields: ["ok", "expected", "actual", "summary", "errors"] },
  { step: "rollback", required: false, resultFields: ["ok", "externalExecutionId", "summary", "result"] },
];

// packages/core/src/rbac.ts — canApprove(role, risk)
const ABOVE_OPERATOR = ["operator", "operation_pm", "admin", "owner"];
const APPROVAL_CAPABILITY = [
  { riskLevel: "critical", allowedRoles: ["owner", "admin"] },
  { riskLevel: "high", allowedRoles: ["owner", "admin", "operation_pm"] },
  { riskLevel: "medium", allowedRoles: ABOVE_OPERATOR },
  { riskLevel: "low", allowedRoles: ABOVE_OPERATOR },
];
// packages/core/src/approval.ts + risk.ts
const APPROVAL_THRESHOLDS = { admin_multi: 2, operation_pm: 1, single: 1 };
const RISK_POLICY = [
  { riskLevel: "critical", requiresApproval: true, approvalPolicy: "admin_multi" },
  { riskLevel: "high", requiresApproval: true, approvalPolicy: "operation_pm" },
  { riskLevel: "medium", requiresApproval: false, approvalPolicy: null },
  { riskLevel: "low", requiresApproval: false, approvalPolicy: null },
];
// packages/registry/src/index.ts — RISK_MODEL_STATUS (consumes benchmarks model status)
const RISK_MODEL_STATUS = [
  { riskLevel: "critical", modelStatus: "frontier" },
  { riskLevel: "high", modelStatus: "frontier" },
  { riskLevel: "medium", modelStatus: "balanced" },
  { riskLevel: "low", modelStatus: "fast" },
];

writeJson("contracts/governance-base.json", {
  schemaVersion: "1.0.0",
  source: "plomus-gameops-ai-os",
  sourceImportedAt: generatedAt,
  builtOnBenchmarks: "benchmarks",
  riskLevels: RISK_LEVELS,
  roles: ROLES,
  approvalPolicies: APPROVAL_POLICIES,
  approvalStatuses: APPROVAL_STATUSES,
  approvalChannels: APPROVAL_CHANNELS,
  executionStates: EXECUTION_STATES,
  commandStates: COMMAND_STATES,
});
writeJson("contracts/governance-roles.json", {
  schemaVersion: "1.0.0",
  roles: [
    { role: "owner", rank: 5 },
    { role: "admin", rank: 4 },
    { role: "operation_pm", rank: 3 },
    { role: "operator", rank: 2 },
    { role: "viewer", rank: 1 },
    { role: "bot", rank: 0 },
  ],
  approvalCapability: APPROVAL_CAPABILITY,
});
writeJson("contracts/governance-approval.json", {
  schemaVersion: "1.0.0",
  policies: Object.entries(APPROVAL_THRESHOLDS).map(([policy, requiredApprovals]) => ({ policy, requiredApprovals, allowedChannels: APPROVAL_CHANNELS })),
  riskPolicy: RISK_POLICY,
});
writeJson("contracts/governance-execution-lifecycle.json", {
  schemaVersion: "1.0.0",
  states: EXECUTION_STATES,
  transitions: EXECUTION_TRANSITIONS,
  commandStates: COMMAND_STATES,
  commandTransitions: COMMAND_TRANSITIONS,
  executionSteps: EXECUTION_STEPS,
});
writeJson("contracts/governance-model-routing.json", {
  schemaVersion: "1.0.0",
  note: "risk_level → preferred benchmarks model status; resolves against contracts/benchmarks-models.json.",
  fallbackStatus: "frontier",
  riskModelStatus: RISK_MODEL_STATUS,
});

console.log(`imported governance contracts (source: ${sourceRepo})`);
console.log(`  roles: ${ROLES.length}, execution states: ${EXECUTION_STATES.length}, risk levels: ${RISK_LEVELS.length}`);
