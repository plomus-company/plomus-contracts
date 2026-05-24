import { readContract, writeGroup } from "../scripts/group.mjs";
import { writeJson } from "../scripts/read-json.mjs";
import { providerFor, requireApiKey, buildRequest, parseResponse } from "./experiment-providers.mjs";

// Experiment pipeline: run benchmark targets against a real model and merge
// MEASURED results into the benchmarks contract. Illustrative seed rows are
// preserved (different dataSource). The provider is the local Ollama baseline by
// default; commercial APIs (Anthropic / OpenAI / Google) are reached by their
// vendor or an explicit --provider, with the key taken from the environment.
//
//   pnpm run experiment -- [--model-id ID] [--provider ollama|anthropic|openai|google]
//                          [--api-model NAME] [--ollama-tag TAG] [--base-url URL]
//                          [--targets a,b,c] [--limit N] [--reps N] [--num-predict N]
//
// Provider is inferred from the model's `vendor` (anthropic/openai/google) and
// falls back to ollama; --provider overrides. Remote providers need a key:
// ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or GOOGLE_API_KEY) — the run
// aborts with a clear message before any measurement if it is missing.
//
// Metrics: latency, token counts, throughput, success_rate / error_rate.
// cost_per_run_usd uses the model's registry pricing (0 for the local baseline).
// accuracy is not measured (no gold set) and omitted. Ollama reports server-side
// timing; remote APIs use wall-clock latency. Reproducibility/regression (reps >= 2):
// output_consistency (share of reps matching the modal output) and latency_stddev_ms;
// latency_p95_ms at reps >= 3. e.g.: pnpm run experiment -- --targets <id> --reps 10

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const MODEL_ID = arg("model-id", "qwen3.6-27b");
const OLLAMA_TAG = arg("ollama-tag", "qwen3.6-27b:latest");
const BASE_URL = arg("base-url", process.env.OLLAMA_BASE_URL ?? "http://localhost:11434");
const PROVIDER_ARG = arg("provider", "");
const REPS = Number(arg("reps", "1"));
const NUM_PREDICT = Number(arg("num-predict", "256"));
const LIMIT = Number(arg("limit", "0"));
const TARGET_ARG = arg("targets", "");

// A representative spread across both domains used when no --targets is given.
const DEFAULT_TARGETS = [
  "skill:korean-spell-check",
  "skill:k-dart",
  "skill:naver-news-search",
  "skill:seoul-subway-arrival",
  "workflow:commerce-review",
  "workflow:settlement-check",
];

const models = readContract("benchmarks-models", "models");
const model = models.find((m) => m.modelId === MODEL_ID);
if (!model) {
  console.error(`Unknown modelId '${MODEL_ID}'. Add it to contracts/benchmarks/models/ (run generate:benchmarks).`);
  process.exit(1);
}

// Resolve the provider (vendor → adapter, or --provider) and its API key up front.
// A missing key is a configuration error: report it cleanly and abort before any work.
let PROVIDER;
let API_KEY;
try {
  PROVIDER = providerFor(model.vendor, PROVIDER_ARG);
  API_KEY = requireApiKey(PROVIDER);
} catch (err) {
  console.error(String(err?.message ?? err));
  process.exit(1);
}
// API model name defaults to the registry modelId (claude-opus-4-7 / gpt-4o /
// gemini-2.5-pro already match); override with --api-model for vendor-specific ids.
const API_MODEL = arg("api-model", MODEL_ID);

const allTargets = readContract("benchmarks-targets", "targets");
const targetById = new Map(allTargets.map((t) => [t.targetId, t]));
const skillById = new Map((readContract("skills-catalog", "skills")).map((s) => [s.skillId, s]));
const workflowById = new Map((readContract("commerce-workflows", "workflows")).map((w) => [w.workflowId, w]));
const agentById = new Map((readContract("gameops-agents", "agents")).map((a) => [a.agentId, a]));
const playbookById = new Map((readContract("gameops-playbooks", "playbooks")).map((p) => [p.playbookId, p]));
const presetById = new Map((readContract("distribution-presets", "presets")).map((p) => [p.presetId, p]));

let selectedIds = TARGET_ARG ? TARGET_ARG.split(",").map((s) => s.trim()) : DEFAULT_TARGETS;
selectedIds = selectedIds.filter((id) => targetById.has(id));
if (LIMIT > 0) selectedIds = allTargets.slice(0, LIMIT).map((t) => t.targetId);
if (selectedIds.length === 0) {
  console.error("No valid targets selected.");
  process.exit(1);
}

function promptFor(target) {
  if (target.kind === "skill") {
    const desc = skillById.get(target.ref)?.description ?? "";
    return `다음 한국형 도구 스킬로 대표적인 사용자 요청을 처리하는 간결한 실행 계획을 한국어로 작성하라.\n스킬: ${target.ref}\n설명: ${desc}\n3단계 이내, 군더더기 없이.`;
  }
  if (target.kind === "workflow") {
    const wf = workflowById.get(target.ref);
    return `다음 커머스 운영 검토 워크플로의 대표 점검 결과 요약을 한국어로 작성하라.\n워크플로: ${wf?.label ?? target.ref} (scope: ${wf?.reviewScope ?? "?"})\n핵심 점검 항목 3가지와 권장 조치를 간결히.`;
  }
  if (target.kind === "agent") {
    const ag = agentById.get(target.ref);
    return `다음 게임 운영 에이전트가 대표 운영 입력을 처리하는 결과를 한국어로 작성하라.\n에이전트: ${target.ref} (intents: ${(ag?.intents ?? []).join(", ")})\n설명: ${ag?.description ?? ""}\n분류·요약·권장 조치를 간결히.`;
  }
  if (target.kind === "playbook") {
    const pb = playbookById.get(target.ref);
    return `다음 게임 운영 playbook을 실행하는 단계별 결과 요약을 한국어로 작성하라.\nplaybook: ${target.ref} (위험도: ${pb?.riskLevel ?? "?"}, 트리거: ${(pb?.triggers ?? []).join(", ")})\n각 단계(${(pb?.steps ?? []).map((s) => s.type).join("→")})의 산출을 간결히.`;
  }
  // preset
  const ps = presetById.get(target.ref);
  return `다음 유통 온보딩 preset 기준으로 초기 운영 점검 계획을 한국어로 작성하라.\npreset: ${target.ref} (${ps?.label ?? ""})\n설명: ${ps?.description ?? ""}\n우선 점검 영역 3가지를 간결히.`;
}

// Dispatch one generation through the resolved provider. Request shaping and
// response normalization live in experiment-providers.mjs (pure, unit-tested);
// this wrapper owns the I/O: fetch, timeout, and HTTP/network error capture.
async function generate(prompt) {
  const { url, method, headers, body } = buildRequest(PROVIDER, {
    prompt, apiModel: API_MODEL, ollamaTag: OLLAMA_TAG, baseUrl: BASE_URL, apiKey: API_KEY, numPredict: NUM_PREDICT,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 600000);
  const started = Date.now();
  try {
    const res = await fetch(url, { method, headers, body: JSON.stringify(body), signal: controller.signal });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}${detail ? ` ${detail.slice(0, 200)}` : ""}`, wallMs: Date.now() - started };
    }
    const json = await res.json();
    // text is captured to measure output_consistency across reps.
    return parseResponse(PROVIDER, json, { wallMs: Date.now() - started });
  } catch (err) {
    return { ok: false, error: String(err?.name === "AbortError" ? "timeout" : err), wallMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const percentile = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stddev = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const round = (n, d = 2) => Number(n.toFixed(d));

const endpoint = PROVIDER === "ollama" ? `ollama ${OLLAMA_TAG} @ ${BASE_URL}` : `${PROVIDER} ${API_MODEL}`;
console.error(`Experiment: model=${MODEL_ID} (${endpoint}) targets=${selectedIds.length} reps=${REPS}`);
console.error("Warming up model...");
const warm = await generate("Reply with: ready");
if (!warm.ok) {
  // Fail fast: if the endpoint is unavailable the whole run would otherwise record
  // 342 failed rows and clobber the good baseline on merge (see guard below).
  console.error(`Warmup failed (${warm.error ?? "empty response"}) — ${PROVIDER} model/endpoint unavailable (${endpoint}). Aborting before any measurement; nothing written.`);
  process.exit(1);
}

const newResults = [];
// prompts + targetMeta make each run record self-contained for debugging/analysis
// (you can see exactly what was sent and which contract it resolved from).
const runRecord = {
  modelId: MODEL_ID, provider: PROVIDER, apiModel: API_MODEL,
  ...(PROVIDER === "ollama" ? { ollamaTag: OLLAMA_TAG, baseUrl: BASE_URL } : {}),
  startedAt: new Date().toISOString(), reps: REPS, numPredict: NUM_PREDICT, prompts: {}, targetMeta: {}, runs: [],
};

for (const targetId of selectedIds) {
  const target = targetById.get(targetId);
  const prompt = promptFor(target);
  runRecord.prompts[targetId] = prompt;
  runRecord.targetMeta[targetId] = { kind: target.kind, ref: target.ref, domain: target.domain };
  const samples = [];
  for (let r = 0; r < REPS; r += 1) {
    const out = await generate(prompt); // eslint-disable-line no-await-in-loop
    samples.push(out);
    runRecord.runs.push({ targetId, rep: r, ...out });
  }
  const ok = samples.filter((s) => s.ok);
  const successRate = round((ok.length / samples.length) * 100);
  const latencies = (ok.length ? ok : samples).map((s) => s.inferMs ?? s.totalMs ?? s.wallMs);
  const inTok = ok.length ? mean(ok.map((s) => s.inputTokens)) : 0;
  const outTok = ok.length ? mean(ok.map((s) => s.outputTokens)) : 0;
  const tps = ok.length ? mean(ok.map((s) => (s.evalSec > 0 ? s.outputTokens / s.evalSec : 0))) : 0;
  const cost = inTok / 1e6 * model.pricing.inputPerMTok + outTok / 1e6 * model.pricing.outputPerMTok;

  const metrics = {
    latency_p50_ms: round(median(latencies)),
    throughput_tps: round(tps),
    cost_per_run_usd: round(cost, 5),
    input_tokens: Math.round(inTok),
    output_tokens: Math.round(outTok),
    success_rate: successRate,
    error_rate: round(100 - successRate),
  };
  if (REPS >= 3) metrics.latency_p95_ms = round(percentile(latencies, 95));
  if (REPS >= 2) {
    // reproducibility/regression: how often the successful reps produced the same
    // output (modal share), and how stable the latency is (stddev).
    const texts = ok.map((s) => (s.text ?? "").trim());
    const counts = {};
    let modal = 0;
    for (const t of texts) { counts[t] = (counts[t] ?? 0) + 1; modal = Math.max(modal, counts[t]); }
    metrics.output_consistency = texts.length ? round((modal / texts.length) * 100) : 0;
    metrics.latency_stddev_ms = round(stddev(latencies));
  }

  newResults.push({ targetId, modelId: MODEL_ID, dataSource: "measured", sampleSize: REPS, measuredAt: new Date().toISOString(), metrics });
  const consInfo = metrics.output_consistency !== undefined ? `, consistency ${metrics.output_consistency}%` : "";
  console.error(`  ${targetId}: ${metrics.latency_p50_ms}ms, ${metrics.output_tokens} out tok, ${metrics.throughput_tps} tps, success ${metrics.success_rate}%${consInfo}`);
}

// Safety net: never let an all-failed run (e.g. the endpoint dropped mid-run)
// overwrite the committed baseline. Require at least one successful target.
if (newResults.every((r) => r.metrics.success_rate === 0)) {
  console.error(`All ${newResults.length} targets failed (0% success) — refusing to merge (would clobber good data). Nothing written.`);
  process.exit(1);
}

// ---- merge measured results (preserve illustrative + other measured) ----
const ranTargets = new Set(selectedIds);
const existingResults = readContract("benchmarks-results", "results");
const keptResults = existingResults.filter(
  (r) => !(r.dataSource === "measured" && r.modelId === MODEL_ID && ranTargets.has(r.targetId)),
);
const KIND_DOMAIN = { skill: "skills", workflow: "commerce", agent: "gameops", playbook: "gameops", preset: "distribution" };
writeGroup("benchmarks-results", "results", [...keptResults, ...newResults], (r) => KIND_DOMAIN[String(r.targetId).split(":")[0]] ?? "other");

// ---- recompute measured rollups for this model from ALL its measured results ----
// Use the full merged measured set (not just this run's newResults): a partial
// --targets run touches only some domains, so rolling up from newResults alone
// would drop the model's rollups for domains measured in earlier runs.
const metricIds = (readContract("benchmarks-metrics", "metrics")).map((m) => m.metricId);
const existingRollups = readContract("benchmarks-rollups", "rollups");
const keptRollups = existingRollups.filter((r) => !(r.dataSource === "measured" && r.modelId === MODEL_ID));
const modelMeasured = [...keptResults, ...newResults].filter((r) => r.dataSource === "measured" && r.modelId === MODEL_ID);
const measuredRollups = [];
const ranDomains = [...new Set(modelMeasured.map((r) => targetById.get(r.targetId)?.domain).filter(Boolean))].sort();
for (const domain of ranDomains) {
  const rows = modelMeasured.filter((r) => targetById.get(r.targetId)?.domain === domain);
  if (!rows.length) continue;
  const metrics = {};
  for (const metricId of metricIds) {
    const vals = rows.map((r) => r.metrics[metricId]).filter((v) => typeof v === "number");
    if (vals.length) metrics[metricId] = round(mean(vals), metricId === "cost_per_run_usd" ? 5 : 2);
  }
  measuredRollups.push({ domain, modelId: MODEL_ID, dataSource: "measured", targetCount: rows.length, metrics });
}
writeGroup("benchmarks-rollups", "rollups", [...keptRollups, ...measuredRollups], (r) => r.domain);

runRecord.finishedAt = new Date().toISOString();
const stamp = runRecord.startedAt.replace(/[:.]/g, "-");
writeJson(`experiments/runs/${MODEL_ID}-${stamp}.json`, runRecord);

console.error(`\nMerged ${newResults.length} measured results and ${measuredRollups.length} rollups for ${MODEL_ID}.`);
console.error(`Run record: experiments/runs/${MODEL_ID}-${stamp}.json`);
