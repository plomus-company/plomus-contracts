import fs from "node:fs";
import path from "node:path";
import { readJson, repoRoot } from "./read-json.mjs";

// Generates a human-readable benchmark report from the benchmarks contract.
// Writes the committed docs/BENCHMARK-RESULTS.md and the CI artifact
// dist/benchmark-summary.md. Run with: pnpm run summary:benchmarks

const models = readJson("contracts/benchmarks/v1/models.json").models ?? [];
const metrics = readJson("contracts/benchmarks/v1/metrics.json").metrics ?? [];
const targets = readJson("contracts/benchmarks/v1/targets.json").targets ?? [];
const results = readJson("contracts/benchmarks/v1/results.json").results ?? [];
const rollups = readJson("contracts/benchmarks/v1/rollups.json").rollups ?? [];

const targetById = new Map(targets.map((t) => [t.targetId, t]));
const modelById = new Map(models.map((m) => [m.modelId, m]));
const num = (n, d = 2) => (typeof n === "number" ? Number(n.toFixed(d)) : "—");
const table = (header, rows) =>
  [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const measured = results.filter((r) => r.dataSource === "measured");
const measuredModelIds = [...new Set(measured.map((r) => r.modelId))];

const lines = [];
const p = (...s) => lines.push(...s);

p("# Benchmark Results", "");
p("`scripts/summary-benchmarks.mjs`가 `contracts/benchmarks/v1/`에서 생성합니다. 수정은 계약 데이터에서 하고 재생성하세요.", "");

p("## Methodology", "");
p("- **대상(targets)**: 실행 가능한 계약 = 스킬 + 커머스 워크플로. 각 타깃은 실재 계약을 참조합니다.");
p("- **measured**: 실제 모델 실행 측정값 (`tools/run-experiment.mjs`). 지연은 1회성 모델 로드를 제외한 추론 시간, 처리량은 출력토큰/평가시간, 비용은 모델 가격(로컬은 0). `accuracy`는 골드셋이 없어 미측정.");
p("- **illustrative**: 결정론적 합성 시드 (`tools/generate-benchmarks.mjs`). 구조 시연/회귀 베이스라인용이며 실측이 아닙니다.");
p("");

p("## Models", "");
p(
  table(
    ["modelId", "vendor", "status", "context", "in $/Mtok", "out $/Mtok"],
    models.map((m) => [
      `\`${m.modelId}\``,
      m.vendor,
      m.status,
      String(m.contextWindow),
      String(m.pricing?.inputPerMTok ?? "—"),
      String(m.pricing?.outputPerMTok ?? "—"),
    ]),
  ),
);
p("", "_가격은 indicative(참고용)이며 로컬 모델은 0._", "");

// ---- measured model comparison (when 2+ models measured) ----
const measuredRollups = rollups.filter((r) => r.dataSource === "measured");
if (measuredModelIds.length >= 2 && measuredRollups.length) {
  p("## Measured model comparison", "");
  p("동일 타깃을 여러 모델로 실행한 도메인 롤업 비교입니다.", "");
  p(
    table(
      ["domain", "model", "n", "지연 p50(ms)", "처리량(tps)", "출력tok", "성공률(%)"],
      [...measuredRollups]
        .sort((a, b) => a.domain.localeCompare(b.domain) || a.modelId.localeCompare(b.modelId))
        .map((r) => [
          r.domain,
          `\`${r.modelId}\``,
          String(r.targetCount),
          String(num(r.metrics.latency_p50_ms)),
          String(num(r.metrics.throughput_tps)),
          String(num(r.metrics.output_tokens)),
          String(num(r.metrics.success_rate)),
        ]),
    ),
  );
  p("", "_성공률은 비어 있지 않은 응답 비율(품질/정확도는 미측정)._", "");
}

// ---- measured baselines ----
if (measuredModelIds.length === 0) {
  p("## Measured", "", "_아직 측정값이 없습니다. `pnpm run experiment`로 실행하세요._", "");
} else {
  for (const modelId of measuredModelIds) {
    const model = modelById.get(modelId);
    const rows = measured.filter((r) => r.modelId === modelId);
    p(`## Measured baseline — \`${modelId}\``, "");
    p(`${model?.displayName ?? modelId} · 측정 타깃 ${rows.length}개.`, "");

    // domain rollups
    const mr = rollups.filter((r) => r.dataSource === "measured" && r.modelId === modelId);
    if (mr.length) {
      p("### Domain rollups", "");
      p(
        table(
          ["domain", "n", "지연 p50(ms)", "처리량(tps)", "입력tok", "출력tok", "성공률(%)"],
          mr.map((r) => [
            r.domain,
            String(r.targetCount),
            String(num(r.metrics.latency_p50_ms)),
            String(num(r.metrics.throughput_tps)),
            String(num(r.metrics.input_tokens)),
            String(num(r.metrics.output_tokens)),
            String(num(r.metrics.success_rate)),
          ]),
        ),
      );
      p("");
    }

    // per-category aggregate (skills only, grouped by category)
    const cats = {};
    for (const r of rows) {
      const t = targetById.get(r.targetId);
      if (t?.kind !== "skill") continue;
      (cats[t.group] ??= []).push(r);
    }
    const catNames = Object.keys(cats).sort();
    if (catNames.length) {
      p("### Skills by category", "");
      p(
        table(
          ["category", "n", "지연 p50(ms)", "처리량(tps)", "출력tok", "성공률(%)"],
          catNames.map((c) => {
            const rs = cats[c];
            return [
              c,
              String(rs.length),
              String(num(mean(rs.map((r) => r.metrics.latency_p50_ms)))),
              String(num(mean(rs.map((r) => r.metrics.throughput_tps)))),
              String(num(mean(rs.map((r) => r.metrics.output_tokens)))),
              String(num(mean(rs.map((r) => r.metrics.success_rate)))),
            ];
          }),
        ),
      );
      p("");
    }

    // full per-target table
    p("### All targets", "");
    const sorted = [...rows].sort((a, b) => {
      const ta = targetById.get(a.targetId);
      const tb = targetById.get(b.targetId);
      return (ta.kind + ta.group + a.targetId).localeCompare(tb.kind + tb.group + b.targetId);
    });
    p(
      table(
        ["target", "kind", "group", "지연 p50(ms)", "출력tok", "tps", "성공률(%)"],
        sorted.map((r) => {
          const t = targetById.get(r.targetId);
          return [
            `\`${r.targetId}\``,
            t.kind,
            t.group,
            String(num(r.metrics.latency_p50_ms)),
            String(r.metrics.output_tokens ?? "—"),
            String(num(r.metrics.throughput_tps)),
            String(num(r.metrics.success_rate)),
          ];
        }),
      ),
    );
    p("");
  }
}

// ---- illustrative leaderboard ----
const ir = rollups.filter((r) => r.dataSource === "illustrative");
if (ir.length) {
  p("## Illustrative leaderboard (synthetic seed)", "");
  p("_합성 시드 — 절대 비교가 아닌 구조/회귀 참조용._", "");
  for (const domain of [...new Set(ir.map((r) => r.domain))]) {
    p(`### ${domain}`, "");
    p(
      table(
        ["model", "비용($/run)", "지연 p50(ms)", "정확도(%)", "성공률(%)"],
        ir
          .filter((r) => r.domain === domain)
          .map((r) => [
            `\`${r.modelId}\``,
            String(num(r.metrics.cost_per_run_usd, 5)),
            String(num(r.metrics.latency_p50_ms)),
            String(num(r.metrics.accuracy)),
            String(num(r.metrics.success_rate)),
          ]),
      ),
    );
    p("");
  }
}

const markdown = `${lines.join("\n")}\n`;
fs.writeFileSync(path.join(repoRoot, "docs/BENCHMARK-RESULTS.md"), markdown);
fs.mkdirSync(path.join(repoRoot, "dist"), { recursive: true });
fs.writeFileSync(path.join(repoRoot, "dist/benchmark-summary.md"), markdown);

console.log(`built docs/BENCHMARK-RESULTS.md (measured models: ${measuredModelIds.length || "none"})`);
