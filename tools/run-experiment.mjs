import { readContract, writeGroup } from "../scripts/group.mjs";
import { readJson, writeJson } from "../scripts/read-json.mjs";

// Experiment pipeline: run benchmark targets against a real model (default: the
// local Ollama qwen3.6-27b baseline) and merge MEASURED results into the
// benchmarks contract. Illustrative seed rows are preserved (different dataSource).
//
//   pnpm run experiment -- [--model-id ID] [--ollama-tag TAG] [--targets a,b,c]
//                          [--limit N] [--reps N] [--num-predict N] [--base-url URL]
//
// Metrics measured from the Ollama response: latency (total_duration), token
// counts (prompt_eval_count / eval_count), throughput (eval_count / eval_duration),
// success_rate / error_rate. cost_per_run_usd uses the model's registry pricing
// (0 for the local baseline). accuracy is not measured (no gold set) and omitted.

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const MODEL_ID = arg("model-id", "qwen3.6-27b");
const OLLAMA_TAG = arg("ollama-tag", "qwen3.6-27b:latest");
const BASE_URL = arg("base-url", process.env.OLLAMA_BASE_URL ?? "http://localhost:11434");
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

async function generate(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 600000);
  const started = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // think:false — qwen35 is a reasoning model; otherwise the token budget is
      // spent on hidden thinking and `response` comes back empty.
      body: JSON.stringify({ model: OLLAMA_TAG, prompt, stream: false, think: false, options: { num_predict: NUM_PREDICT, temperature: 0 } }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, wallMs: Date.now() - started };
    const d = await res.json();
    const ns = (v) => (typeof v === "number" ? v : 0);
    const totalMs = ns(d.total_duration) / 1e6;
    const loadMs = ns(d.load_duration) / 1e6;
    const answer = (typeof d.response === "string" ? d.response : "").trim() || (typeof d.thinking === "string" ? d.thinking : "").trim();
    return {
      ok: Boolean(d.done) && answer.length > 0,
      // inference latency excludes one-time model load (we warm up first anyway)
      inferMs: Math.max(0, totalMs - loadMs),
      totalMs,
      loadMs,
      inputTokens: ns(d.prompt_eval_count),
      outputTokens: ns(d.eval_count),
      evalSec: ns(d.eval_duration) / 1e9,
      wallMs: Date.now() - started,
    };
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
const round = (n, d = 2) => Number(n.toFixed(d));

console.error(`Experiment: model=${MODEL_ID} (ollama ${OLLAMA_TAG}) targets=${selectedIds.length} reps=${REPS}`);
console.error("Warming up model...");
await generate("Reply with: ready");

const newResults = [];
const runRecord = { modelId: MODEL_ID, ollamaTag: OLLAMA_TAG, baseUrl: BASE_URL, startedAt: new Date().toISOString(), reps: REPS, numPredict: NUM_PREDICT, runs: [] };

for (const targetId of selectedIds) {
  const target = targetById.get(targetId);
  const prompt = promptFor(target);
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

  newResults.push({ targetId, modelId: MODEL_ID, dataSource: "measured", sampleSize: REPS, measuredAt: new Date().toISOString(), metrics });
  console.error(`  ${targetId}: ${metrics.latency_p50_ms}ms, ${metrics.output_tokens} out tok, ${metrics.throughput_tps} tps, success ${metrics.success_rate}%`);
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
