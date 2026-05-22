import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./read-json.mjs";

// Debugging & analysis over the raw experiment records under experiments/runs/.
// Each record holds per-rep output text + timing (+ prompts/targetMeta), so this
// surfaces what the per-(target,model) measured rows can't: failures, output
// non-determinism (reproducibility), latency instability, run-to-run regression,
// and concrete improvement candidates. Read-only, on-demand:
//   pnpm run analyze:benchmarks [-- --model <id>]
// See docs/BENCHMARKS.md "디버깅·분석·개선 루프".

const runsDir = path.join(repoRoot, "experiments/runs");
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i !== -1 ? process.argv[i + 1] : null; };
const modelFilter = arg("model");

const records = fs.existsSync(runsDir)
  ? fs.readdirSync(runsDir).filter((f) => f.endsWith(".json"))
      .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(runsDir, f), "utf8")) }))
      .filter((r) => !modelFilter || r.modelId === modelFilter)
      .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)))
  : [];

const out = [];
const line = (...s) => out.push(...s);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stddev = (xs) => (xs.length < 2 ? 0 : Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2))));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round = (n, d = 1) => Number(Number(n).toFixed(d));

// per-target stats derived from a record's raw runs[]
function targetStats(rec) {
  const byTarget = {};
  for (const r of rec.runs ?? []) (byTarget[r.targetId] ??= []).push(r);
  const stats = {};
  for (const [tid, runs] of Object.entries(byTarget)) {
    const ok = runs.filter((r) => r.ok);
    const lat = (ok.length ? ok : runs).map((r) => r.inferMs ?? r.totalMs ?? r.wallMs ?? 0);
    const texts = ok.map((r) => (r.text ?? "").trim());
    const counts = {}; let modal = 0;
    for (const t of texts) { counts[t] = (counts[t] ?? 0) + 1; modal = Math.max(modal, counts[t]); }
    const p50 = lat.length ? median(lat) : 0;
    stats[tid] = {
      n: runs.length, ok: ok.length, fail: runs.length - ok.length,
      p50: round(p50), stddev: round(stddev(lat)),
      cv: p50 ? round((stddev(lat) / p50) * 100) : 0,
      distinct: new Set(texts).size,
      consistency: texts.length ? round((modal / texts.length) * 100) : 0,
    };
  }
  return stats;
}

if (!records.length) {
  console.log(`no run records under experiments/runs/${modelFilter ? ` for model ${modelFilter}` : ""}.`);
  console.log("run an experiment first: pnpm run experiment -- --model-id <id> --ollama-tag <tag> --reps 5");
  process.exit(0);
}

line(`# Benchmark experiment analysis`, "");
line(`run records: ${records.length}${modelFilter ? ` (model=${modelFilter})` : ""}`, "");

line("## Runs");
for (const r of records) {
  const targets = new Set((r.runs ?? []).map((x) => x.targetId)).size;
  const fails = (r.runs ?? []).filter((x) => !x.ok).length;
  line(`- ${r.startedAt}  ${r.modelId}  reps=${r.reps}  targets=${targets}  runs=${(r.runs ?? []).length}  fails=${fails}`);
}

const allFails = records.flatMap((r) => (r.runs ?? []).filter((x) => !x.ok).map((x) => ({ model: r.modelId, ...x })));
line("", "## Failures");
line(allFails.length ? allFails.map((f) => `- [${f.model}] ${f.targetId} rep${f.rep}: ${f.error ?? "(empty/!done)"}`).join("\n") : "- none");

line("", "## Reproducibility & latency stability (reps≥2)");
const repRecords = records.filter((r) => (r.reps ?? 1) >= 2);
if (!repRecords.length) line("- no reps≥2 records — run with `--reps 3+` to measure consistency/stddev");
for (const r of repRecords) {
  line("", `### ${r.startedAt} · ${r.modelId} · reps=${r.reps}`);
  for (const [tid, s] of Object.entries(targetStats(r))) {
    const flags = [];
    if (s.consistency < 100) flags.push(`⚠ consistency ${s.consistency}% (${s.distinct} distinct)`);
    if (s.cv > 15) flags.push(`⚠ latency cv ${s.cv}%`);
    if (s.fail) flags.push(`⚠ ${s.fail}/${s.n} fail`);
    line(`- ${tid}: consistency ${s.consistency}% · p50 ${s.p50}ms ±${s.stddev} (cv ${s.cv}%)${flags.length ? "  — " + flags.join(" · ") : ""}`);
  }
}

line("", "## Regression (latest two runs per model, shared targets)");
const byModel = {};
for (const r of records) (byModel[r.modelId] ??= []).push(r);
for (const [model, recs] of Object.entries(byModel)) {
  if (recs.length < 2) { line(`- ${model}: only ${recs.length} run — no comparison`); continue; }
  const [prev, cur] = recs.slice(-2);
  const ps = targetStats(prev); const cs = targetStats(cur);
  const shared = Object.keys(cs).filter((t) => ps[t]);
  if (!shared.length) { line(`- ${model}: latest two runs share no targets`); continue; }
  line("", `### ${model}: ${prev.startedAt} → ${cur.startedAt}`);
  for (const t of shared) {
    const dPct = ps[t].p50 ? round(((cs[t].p50 - ps[t].p50) / ps[t].p50) * 100) : 0;
    const dCons = round(cs[t].consistency - ps[t].consistency);
    const flag = Math.abs(dPct) > 20 || dCons < -10 ? "  ⚠ regression" : "";
    line(`- ${t}: p50 ${ps[t].p50}→${cs[t].p50}ms (${dPct >= 0 ? "+" : ""}${dPct}%) · consistency ${ps[t].consistency}→${cs[t].consistency}%${flag}`);
  }
}

line("", "## Improvement candidates");
const latest = repRecords.slice(-1)[0];
if (!latest) {
  line("- reps≥2 실행이 없어 재현성/안정성 분석 불가 — `--reps 3+`로 측정하세요");
} else {
  const st = targetStats(latest);
  const lowCons = Object.entries(st).filter(([, s]) => s.consistency < 100).sort((a, b) => a[1].consistency - b[1].consistency);
  const highCv = Object.entries(st).filter(([, s]) => s.cv > 15);
  if (lowCons.length) line(`- 재현성 낮음 → reps↑·프롬프트 제약 강화·temperature 확인: ${lowCons.map(([t, s]) => `${t}(${s.consistency}%)`).join(", ")}`);
  if (highCv.length) line(`- 지연 변동 큼 → 워밍업/부하·동시 상주 점검: ${highCv.map(([t, s]) => `${t}(cv ${s.cv}%)`).join(", ")}`);
  if (allFails.length) line(`- 실패 존재(${allFails.length}건) → 프롬프트/타임아웃/모델 가용성 점검`);
  if (!lowCons.length && !highCv.length && !allFails.length) line("- 최신 reps 실행에서 특이사항 없음 — 다른 모델/타깃으로 커버리지 확대 권장");
}

const report = `${out.join("\n")}\n`;
process.stdout.write(report);
fs.mkdirSync(path.join(repoRoot, "dist"), { recursive: true });
fs.writeFileSync(path.join(repoRoot, "dist/benchmark-analysis.md"), report);
