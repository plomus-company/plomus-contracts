import { readJson, writeJson } from "../scripts/read-json.mjs";

// Single source of truth for the benchmarks contract domain.
//
// Benchmarks let each executable contract (skill / commerce workflow) be scored
// against well-known models on performance, cost, and quality metrics. This tool
// curates the model and metric registries, reads the skills + commerce contracts
// to build the target list, and emits a DETERMINISTIC, clearly-synthetic
// ("illustrative") seed of results and domain rollups. Replace illustrative rows
// with measured rows (dataSource: "measured") as real benchmarks are run.
//
// Run with: pnpm run generate:benchmarks

// ---- controlled vocabularies ----
const MODEL_VENDORS = ["anthropic", "openai", "google", "meta", "alibaba", "deepseek", "mistral"];
const MODALITIES = ["text", "text+vision"];
const MODEL_STATUSES = ["frontier", "balanced", "fast", "legacy"];
const METRIC_CATEGORIES = ["performance", "cost", "quality", "reliability"];
const METRIC_DIRECTIONS = ["higher-better", "lower-better"];
const UNITS = ["ms", "usd", "tokens", "percent", "tokens-per-sec"];
const TARGET_KINDS = ["skill", "workflow", "agent", "playbook", "preset"];
const TARGET_DOMAINS = ["skills", "commerce", "gameops", "distribution"];
const DATA_SOURCES = ["measured", "illustrative", "pending"];

// ---- model registry (pricing is indicative list price per 1M tokens, USD) ----
const PRICING_AS_OF = "2026-05";
const MODELS = [
  { modelId: "claude-opus-4-7", vendor: "anthropic", family: "Claude", displayName: "Claude Opus 4.7", modality: "text+vision", contextWindow: 200000, maxOutputTokens: 64000, status: "frontier", pricing: { inputPerMTok: 15, outputPerMTok: 75, currency: "USD" } },
  { modelId: "claude-sonnet-4-6", vendor: "anthropic", family: "Claude", displayName: "Claude Sonnet 4.6", modality: "text+vision", contextWindow: 200000, maxOutputTokens: 64000, status: "balanced", pricing: { inputPerMTok: 3, outputPerMTok: 15, currency: "USD" } },
  { modelId: "claude-haiku-4-5", vendor: "anthropic", family: "Claude", displayName: "Claude Haiku 4.5", modality: "text+vision", contextWindow: 200000, maxOutputTokens: 32000, status: "fast", pricing: { inputPerMTok: 1, outputPerMTok: 5, currency: "USD" } },
  { modelId: "gpt-4o", vendor: "openai", family: "GPT", displayName: "GPT-4o", modality: "text+vision", contextWindow: 128000, maxOutputTokens: 16384, status: "frontier", pricing: { inputPerMTok: 2.5, outputPerMTok: 10, currency: "USD" } },
  { modelId: "gpt-4o-mini", vendor: "openai", family: "GPT", displayName: "GPT-4o mini", modality: "text+vision", contextWindow: 128000, maxOutputTokens: 16384, status: "fast", pricing: { inputPerMTok: 0.15, outputPerMTok: 0.6, currency: "USD" } },
  { modelId: "o3-mini", vendor: "openai", family: "o-series", displayName: "OpenAI o3-mini", modality: "text", contextWindow: 200000, maxOutputTokens: 100000, status: "balanced", pricing: { inputPerMTok: 1.1, outputPerMTok: 4.4, currency: "USD" } },
  { modelId: "gemini-2.5-pro", vendor: "google", family: "Gemini", displayName: "Gemini 2.5 Pro", modality: "text+vision", contextWindow: 1000000, maxOutputTokens: 65536, status: "frontier", pricing: { inputPerMTok: 1.25, outputPerMTok: 10, currency: "USD" } },
  { modelId: "gemini-2.5-flash", vendor: "google", family: "Gemini", displayName: "Gemini 2.5 Flash", modality: "text+vision", contextWindow: 1000000, maxOutputTokens: 65536, status: "fast", pricing: { inputPerMTok: 0.3, outputPerMTok: 2.5, currency: "USD" } },
  { modelId: "llama-3.3-70b", vendor: "meta", family: "Llama", displayName: "Llama 3.3 70B", modality: "text", contextWindow: 128000, maxOutputTokens: 32000, status: "balanced", pricing: { inputPerMTok: 0.6, outputPerMTok: 0.6, currency: "USD" } },
  { modelId: "qwen-2.5-72b", vendor: "alibaba", family: "Qwen", displayName: "Qwen 2.5 72B", modality: "text", contextWindow: 131072, maxOutputTokens: 32000, status: "balanced", pricing: { inputPerMTok: 0.4, outputPerMTok: 0.4, currency: "USD" } },
  { modelId: "deepseek-v3", vendor: "deepseek", family: "DeepSeek", displayName: "DeepSeek V3", modality: "text", contextWindow: 128000, maxOutputTokens: 8000, status: "balanced", pricing: { inputPerMTok: 0.27, outputPerMTok: 1.1, currency: "USD" } },
  { modelId: "mixtral-8x22b", vendor: "mistral", family: "Mixtral", displayName: "Mixtral 8x22B", modality: "text", contextWindow: 64000, maxOutputTokens: 16000, status: "fast", pricing: { inputPerMTok: 2, outputPerMTok: 6, currency: "USD" } },
  // Local Ollama models — measured via tools/run-experiment.mjs. Monetary cost is 0 (local compute).
  { modelId: "qwen3.6-27b", vendor: "alibaba", family: "Qwen", displayName: "Qwen3.6 27B (Ollama Q4_K_M)", modality: "text+vision", contextWindow: 262144, maxOutputTokens: 32768, status: "balanced", pricing: { inputPerMTok: 0, outputPerMTok: 0, currency: "USD" } },
  { modelId: "qwen-2.5-0.5b", vendor: "alibaba", family: "Qwen", displayName: "Qwen2.5 0.5B (Ollama)", modality: "text", contextWindow: 32768, maxOutputTokens: 8000, status: "fast", pricing: { inputPerMTok: 0, outputPerMTok: 0, currency: "USD" } },
];

// ---- metric registry ----
const METRICS = [
  { metricId: "latency_p50_ms", label: "지연 p50", category: "performance", unit: "ms", direction: "lower-better", description: "단일 실행 응답 지연 중앙값." },
  { metricId: "latency_p95_ms", label: "지연 p95", category: "performance", unit: "ms", direction: "lower-better", description: "단일 실행 응답 지연 95퍼센타일." },
  { metricId: "throughput_tps", label: "출력 처리량", category: "performance", unit: "tokens-per-sec", direction: "higher-better", description: "출력 토큰 생성 속도." },
  { metricId: "cost_per_run_usd", label: "실행당 비용", category: "cost", unit: "usd", direction: "lower-better", description: "입력+출력 토큰 기준 1회 실행 비용." },
  { metricId: "input_tokens", label: "입력 토큰", category: "cost", unit: "tokens", direction: "lower-better", description: "1회 실행 평균 입력 토큰." },
  { metricId: "output_tokens", label: "출력 토큰", category: "cost", unit: "tokens", direction: "lower-better", description: "1회 실행 평균 출력 토큰." },
  { metricId: "success_rate", label: "성공률", category: "quality", unit: "percent", direction: "higher-better", description: "유효 산출물을 반환한 실행 비율." },
  { metricId: "accuracy", label: "정확도", category: "quality", unit: "percent", direction: "higher-better", description: "골드 기준 대비 정답/유효 항목 비율." },
  { metricId: "error_rate", label: "오류율", category: "reliability", unit: "percent", direction: "lower-better", description: "실패/예외로 종료한 실행 비율." },
];

// Models used for the illustrative seed (one flagship per requested family).
const SEED_MODELS = ["claude-opus-4-7", "gpt-4o", "gemini-2.5-pro", "deepseek-v3"];
// Synthetic per-model factors used ONLY to derive illustrative numbers.
const SIM = {
  "claude-opus-4-7": { tps: 62, quality: 92, success: 99.0 },
  "gpt-4o": { tps: 90, quality: 88, success: 98.0 },
  "gemini-2.5-pro": { tps: 100, quality: 87, success: 97.0 },
  "deepseek-v3": { tps: 70, quality: 83, success: 96.0 },
};

// ---- deterministic hash so the illustrative seed is stable across runs ----
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const round = (n, d = 2) => Number(n.toFixed(d));

// ---- build targets from the skills + commerce contracts ----
const skills = readJson("contracts/skills-catalog.json").skills ?? [];
const workflows = readJson("contracts/commerce-workflows.json").workflows ?? [];
// newly added domains contribute their LLM-executed entities as benchmark targets
const gameopsAgents = readJson("contracts/gameops-agents.json").agents ?? [];
const gameopsPlaybooks = readJson("contracts/gameops-playbooks.json").playbooks ?? [];
const distributionPresets = readJson("contracts/distribution-presets.json").presets ?? [];

const targets = [
  ...skills.map((s) => ({
    targetId: `skill:${s.skillId}`,
    kind: "skill",
    domain: "skills",
    ref: s.skillId,
    label: s.skillId,
    group: s.category,
  })),
  ...workflows.map((w) => ({
    targetId: `workflow:${w.workflowId}`,
    kind: "workflow",
    domain: "commerce",
    ref: w.workflowId,
    label: w.label,
    group: w.reviewScope,
  })),
  ...gameopsAgents.map((a) => ({
    targetId: `agent:${a.agentId}`,
    kind: "agent",
    domain: "gameops",
    ref: a.agentId,
    label: a.agentId,
    group: "agent",
  })),
  ...gameopsPlaybooks.map((p) => ({
    targetId: `playbook:${p.playbookId}`,
    kind: "playbook",
    domain: "gameops",
    ref: p.playbookId,
    label: p.playbookId,
    group: p.riskLevel,
  })),
  ...distributionPresets.map((p) => ({
    targetId: `preset:${p.presetId}`,
    kind: "preset",
    domain: "distribution",
    ref: p.presetId,
    label: p.label,
    group: "preset",
  })),
];

// ---- derive illustrative results ----
const modelById = new Map(MODELS.map((m) => [m.modelId, m]));
const results = [];
for (const target of targets) {
  const complexity = target.kind === "workflow" || target.kind === "playbook" ? 1.4 : 1.0;
  for (const modelId of SEED_MODELS) {
    const model = modelById.get(modelId);
    const sim = SIM[modelId];
    const h = hash(`${target.targetId}|${modelId}`);
    const inputTokens = Math.round((1500 + (h % 1500)) * complexity);
    const outputTokens = Math.round((500 + ((h >>> 4) % 900)) * complexity);
    const cost = inputTokens / 1e6 * model.pricing.inputPerMTok + outputTokens / 1e6 * model.pricing.outputPerMTok;
    const latencyP50 = Math.round(300 + (outputTokens / sim.tps) * 1000);
    const successRate = round(sim.success - (h % 15) / 10);
    results.push({
      targetId: target.targetId,
      modelId,
      dataSource: "illustrative",
      sampleSize: 50,
      metrics: {
        latency_p50_ms: latencyP50,
        latency_p95_ms: Math.round(latencyP50 * 1.8),
        throughput_tps: sim.tps,
        cost_per_run_usd: round(cost, 5),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        success_rate: successRate,
        accuracy: round(sim.quality - (h % 40) / 10),
        error_rate: round(100 - successRate),
      },
    });
  }
}

// ---- derive domain rollups (mean per metric over each domain x seed model) ----
const metricIds = METRICS.map((m) => m.metricId);
const rollups = [];
for (const domain of TARGET_DOMAINS) {
  for (const modelId of SEED_MODELS) {
    const rows = results.filter(
      (r) => r.modelId === modelId && targets.find((t) => t.targetId === r.targetId)?.domain === domain,
    );
    if (rows.length === 0) continue;
    const metrics = {};
    for (const metricId of metricIds) {
      const decimals = metricId === "cost_per_run_usd" ? 5 : 2;
      const mean = rows.reduce((sum, r) => sum + r.metrics[metricId], 0) / rows.length;
      metrics[metricId] = round(mean, decimals);
    }
    rollups.push({ domain, modelId, dataSource: "illustrative", targetCount: rows.length, metrics });
  }
}

// Preserve any previously recorded measured results/rollups so regenerating the
// illustrative seed never wipes real experiment data.
function readExisting(relativePath, key) {
  try {
    return readJson(relativePath)[key] ?? [];
  } catch {
    return [];
  }
}
const preservedResults = readExisting("contracts/benchmarks-results.json", "results").filter(
  (r) => r.dataSource !== "illustrative",
);
const preservedRollups = readExisting("contracts/benchmarks-rollups.json", "rollups").filter(
  (r) => r.dataSource !== "illustrative",
);

const generatedAt = new Date().toISOString();
const base = {
  schemaVersion: "1.0.0",
  source: "plomus-contracts:skills+commerce",
  generatedAt,
  pricingAsOf: PRICING_AS_OF,
  modelVendors: MODEL_VENDORS,
  modalities: MODALITIES,
  modelStatuses: MODEL_STATUSES,
  metricCategories: METRIC_CATEGORIES,
  metricDirections: METRIC_DIRECTIONS,
  units: UNITS,
  targetKinds: TARGET_KINDS,
  targetDomains: TARGET_DOMAINS,
  dataSources: DATA_SOURCES,
  seedModels: SEED_MODELS,
};

writeJson("contracts/benchmarks-base.json", base);
writeJson("contracts/benchmarks-models.json", { schemaVersion: "1.0.0", pricingAsOf: PRICING_AS_OF, pricingNote: "List prices are indicative and may change; treat as relative reference only.", models: MODELS });
writeJson("contracts/benchmarks-metrics.json", { schemaVersion: "1.0.0", metrics: METRICS });
writeJson("contracts/benchmarks-targets.json", { schemaVersion: "1.0.0", targets });
writeJson("contracts/benchmarks-results.json", { schemaVersion: "1.0.0", note: "Illustrative rows (dataSource: illustrative) are a deterministic seed; measured rows come from tools/run-experiment.mjs.", results: [...preservedResults, ...results] });
writeJson("contracts/benchmarks-rollups.json", { schemaVersion: "1.0.0", note: "Illustrative rollups are means over illustrative results; measured rollups come from experiments.", rollups: [...preservedRollups, ...rollups] });

console.log(`generated benchmarks from ${targets.length} targets`);
console.log(`  models: ${MODELS.length}, metrics: ${METRICS.length}, seed models: ${SEED_MODELS.length}`);
console.log(`  results: ${results.length} illustrative + ${preservedResults.length} preserved measured`);
console.log(`  rollups: ${rollups.length} illustrative + ${preservedRollups.length} preserved measured`);
