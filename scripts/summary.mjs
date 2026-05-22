import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/commerce/base.json");
const presets = readJson("contracts/commerce/presets.json").presets ?? [];
const reviewRules = readJson("contracts/commerce/review-rules.json").reviewRules ?? [];
const workflows = readJson("contracts/commerce/workflows.json").workflows ?? [];

function countBy(values, field) {
  return values.reduce((acc, value) => {
    const key = value[field] ?? "UNKNOWN";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function table(rows) {
  return rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
}

const ruleStatus = countBy(reviewRules, "status");
const workflowRisk = countBy(
  workflows.map((workflow) => ({
    riskLevel: workflow.safety?.riskLevel ?? "UNKNOWN",
  })),
  "riskLevel",
);

const summary = {
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  counts: {
    presets: presets.length,
    reviewRules: reviewRules.length,
    workflows: workflows.length,
    systemFolders: base.systemFolders?.length ?? 0,
    documentTypes: base.documentTypes?.length ?? 0,
    watchFolders: base.watchFolders?.length ?? 0,
    baseWorkflows: base.baseWorkflows?.length ?? 0,
  },
  reviewRuleStatus: ruleStatus,
  workflowRisk,
  presetIds: presets.map((preset) => preset.presetId),
  workflowIds: workflows.map((workflow) => workflow.workflowId),
};

const markdown = [
  "# Plomus Contract Summary",
  "",
  `Generated at: ${summary.generatedAt}`,
  "",
  "## Counts",
  "",
  table([
    ["Item", "Count"],
    ["---", "---:"],
    ["Presets", String(summary.counts.presets)],
    ["Review rules", String(summary.counts.reviewRules)],
    ["Workflows", String(summary.counts.workflows)],
    ["System folders", String(summary.counts.systemFolders)],
    ["Document types", String(summary.counts.documentTypes)],
    ["Watch folders", String(summary.counts.watchFolders)],
  ]),
  "",
  "## Review Rule Status",
  "",
  table([
    ["Status", "Count"],
    ["---", "---:"],
    ...Object.entries(ruleStatus).map(([status, count]) => [
      status,
      String(count),
    ]),
  ]),
  "",
  "## Workflow Risk",
  "",
  table([
    ["Risk", "Count"],
    ["---", "---:"],
    ...Object.entries(workflowRisk).map(([risk, count]) => [
      risk,
      String(count),
    ]),
  ]),
  "",
  "## Presets",
  "",
  presets.map((preset) => `- \`${preset.presetId}\`: ${preset.label}`).join("\n"),
  "",
  "## Workflows",
  "",
  workflows
    .map(
      (workflow) =>
        `- \`${workflow.workflowId}\`: ${workflow.label} (${workflow.safety?.riskLevel ?? "UNKNOWN"})`,
    )
    .join("\n"),
  "",
].join("\n");

writeJson("dist/contract-summary.json", summary);
writeJson("dist/plomus-contract-summary.json", summary);
await import("node:fs").then((fs) =>
  fs.writeFileSync(new URL("../dist/contract-summary.md", import.meta.url), markdown),
);

console.log("built dist/contract-summary.md");
