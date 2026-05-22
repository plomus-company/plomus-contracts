# Benchmarks Contracts (`benchmarks-`)

각 실행 가능한 계약(스킬·커머스 워크플로)을 **유명 모델**로 실행했을 때의 성능·비용·품질 지표를 정의하고 기록하는 도메인입니다. `tools/generate-benchmarks.mjs`가 단일 진실원천(모델·지표 큐레이션 + 타깃/결과/롤업 생성)이며, `scripts/validate-benchmarks.mjs`가 무결성을 검증합니다.

```
base.json (어휘: vendor/metric category/unit/direction/target kind/data source)
   ▲              ▲             ▲
models.json    metrics.json   targets.json ──(ref)──▶ skills catalog / commerce workflows
   └──────┬───────┘                │
       results.json (target × model × metric)  ──aggregate──▶  rollups.json (domain × model)
```

현재 규모: **모델 14 · 지표 9 · 타깃 114(스킬 86 + 워크플로 21 + gameops 에이전트 4·playbook 2 + distribution preset 1) · 결과 677 · 롤업 22**.

> 타깃 114건은 skills/commerce 외에 새 도메인의 LLM 실행 엔티티(gameops 에이전트·playbook, distribution preset)를 포함합니다. 결과 677건 = illustrative 시드 456 + **measured 221** (`qwen3.6-27b` 114 + `qwen-2.5-0.5b` 107). 측정 결과·모델 비교는 [BENCHMARK-RESULTS.md](../BENCHMARK-RESULTS.md), 방법론은 [BENCHMARKS.md](../BENCHMARKS.md). illustrative 행은 결정론적 합성 시드이며 실측이 아닙니다.

---

## base.json — 통제 어휘

| 필드 | 값 |
|---|---|
| `modelVendors` | `anthropic`, `openai`, `google`, `meta`, `alibaba`, `deepseek`, `mistral` |
| `modalities` | `text`, `text+vision` |
| `modelStatuses` | `frontier`, `balanced`, `fast`, `legacy` |
| `metricCategories` | `performance`, `cost`, `quality`, `reliability` |
| `metricDirections` | `higher-better`, `lower-better` |
| `units` | `ms`, `usd`, `tokens`, `percent`, `tokens-per-sec` |
| `targetKinds` | `skill`, `workflow` |
| `targetDomains` | `skills`, `commerce` |
| `dataSources` | `measured`, `illustrative`, `pending` |
| `seedModels` | 결과 시드에 쓰인 플래그십 모델 4종 |
| `pricingAsOf` | 모델 가격 기준 시점 |

---

## models.json — 모델 레지스트리 (14)

벤더별 유명 모델과 공개 스펙입니다. **가격은 1M 토큰당 USD 기준의 indicative(참고용) 값**으로, 절대 비교가 아닌 상대 참조로만 사용합니다 (`pricingNote`).

| 필드 | 설명 |
|---|---|
| `modelId` | 고유 id (예: `claude-opus-4-7`) |
| `vendor` / `family` / `displayName` | 제공자·계열·표시명 |
| `modality` | `text` / `text+vision` |
| `contextWindow` / `maxOutputTokens` | 컨텍스트·최대 출력 토큰 |
| `status` | `frontier` / `balanced` / `fast` / `legacy` |
| `pricing` | `{ inputPerMTok, outputPerMTok, currency }` |

수록 모델: Claude(Opus 4.7·Sonnet 4.6·Haiku 4.5), GPT(4o·4o-mini·o3-mini), Gemini(2.5 Pro·2.5 Flash), 오픈(Llama 3.3 70B·Qwen 2.5 72B·DeepSeek V3·Mixtral 8x22B), 로컬 measured 베이스라인(Qwen3.6 27B·Qwen 2.5 0.5B).

---

## metrics.json — 지표 정의 (9)

| metricId | category | unit | direction |
|---|---|---|---|
| `latency_p50_ms` / `latency_p95_ms` | performance | ms | lower-better |
| `throughput_tps` | performance | tokens-per-sec | higher-better |
| `cost_per_run_usd` | cost | usd | lower-better |
| `input_tokens` / `output_tokens` | cost | tokens | lower-better |
| `success_rate` / `accuracy` | quality | percent | higher-better |
| `error_rate` | reliability | percent | lower-better |

`direction`은 "값이 클수록/작을수록 좋음"을 명시해 리더보드 정렬과 회귀 판정의 기준이 됩니다.

---

## targets.json — 벤치마크 대상 (114)

모델이 실제 실행하는 단위입니다. 각 타깃은 **실재하는 계약을 참조**해야 합니다(검증기가 강제).

| 필드 | 설명 |
|---|---|
| `targetId` | 네임스페이스 id (`<kind>:<id>`) |
| `kind` | `skill`(86) · `workflow`(21) · `agent`(4) · `playbook`(2) · `preset`(1) |
| `domain` | `skills` · `commerce` · `gameops` · `distribution` |
| `ref` | 참조 대상 — kind에 맞는 registry(skills catalog·commerce workflows·gameops agents/playbooks·distribution presets)에 존재해야 함 |
| `label` / `group` | 표시명과 분류(스킬 category / 워크플로 reviewScope 등) |

---

## results.json — 측정값 (677)

타깃 × 모델 한 조합의 측정 한 묶음입니다.

| 필드 | 설명 |
|---|---|
| `targetId` / `modelId` | 대상·모델 (각 레지스트리 참조) |
| `dataSource` | `measured` / `illustrative` / `pending` |
| `sampleSize` | 측정 반복 횟수 |
| `metrics` | metricId → 값. percent 지표는 0–100 범위 검증, 모든 값은 음수 불가 |

`(targetId, modelId, dataSource)`는 고유해야 하므로, 같은 조합에 대해 illustrative와 measured가 공존할 수 있습니다(실측이 들어오면 추가/교체).

---

## rollups.json — 도메인 롤업 (22)

도메인 × 모델 × dataSource 단위의 지표 평균입니다 (results를 집계; 도메인 commerce·distribution·gameops·skills).

| 필드 | 설명 |
|---|---|
| `domain` / `modelId` | 집계 축 |
| `dataSource` | 집계 원천 종류 |
| `targetCount` | 평균에 포함된 타깃 수 |
| `metrics` | metricId → 평균값 |

---

## 갱신 절차

```bash
pnpm run generate:benchmarks   # 모델/지표 큐레이션 + catalog·workflows에서 타깃/결과/롤업 재생성
pnpm run check:ci              # 세 도메인 전체 검증·빌드·테스트
```

실측을 추가하려면 `results.json`에 `dataSource: "measured"` 행을 넣고 `rollups.json`을 갱신합니다(또는 generator의 집계 로직을 measured 우선으로 확장).
