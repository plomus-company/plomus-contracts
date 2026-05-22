# Benchmarks

`benchmarks-`는 각 실행 가능한 계약을 유명 모델로 벤치마킹하기 위한 구조입니다. 필드별 상세는 [contracts/benchmarks.md](contracts/benchmarks.md).

## 목적

스킬과 커머스 워크플로는 결국 LLM이 실행합니다. 이 도메인은 "어떤 계약을, 어떤 모델로 돌렸을 때, 얼마나 빠르고/싸고/정확한가"를 계약화해서:

- 모델 선택을 비용·성능·품질 지표로 비교(리더보드)할 수 있고,
- 새 모델/계약 추가 시 회귀를 추적할 수 있으며,
- 도메인 단위(스킬 전체 / 커머스 전체)로 롤업해 큰 그림을 볼 수 있습니다.

## 데이터 모델

- **models** — 벤더별 유명 모델 레지스트리 (가격·컨텍스트·modality·status). 가격은 indicative.
- **metrics** — 무엇을 재는지 (performance / cost / quality / reliability, 단위, 방향).
- **targets** — 무엇을 재는 대상인지. 스킬(86)·워크플로(21)·gameops 에이전트(4)·playbook(2)·distribution preset(1) = **114**, 각 타깃이 `kind`+`ref`로 실재 계약을 참조.
- **results** — `target × model`의 측정 한 묶음. `dataSource`로 measured/illustrative/pending 구분.
- **rollups** — `domain × model` 지표 평균.

## 실험 파이프라인 (ASCII)

`pnpm run experiment`(`tools/run-experiment.mjs`)의 6단계입니다. 각 단계가 어떤 계약을 읽는지 표시합니다.

```
 $ pnpm run experiment -- --model-id <M> --ollama-tag <tag> [--targets …] [--reps N] [--num-predict N]
         │
         ▼
 ┌ 1. RESOLVE ───────────────────────────────────────────────────────────────┐
 │ benchmarks-models[M] (pricing·status) + benchmarks-targets 에서 선택       │
 │ targetId → target { kind, ref, domain }                                    │
 └───────────────────────────────┬───────────────────────────────────────────┘
                                  ▼  kind 별로 ref → 실재 계약 해소
 ┌ 2. PROMPT (계약 → 한국어 프롬프트) ────────────────────────────────────────┐
 │ skill    → contracts/tool/skills-catalog[ref].description                  │
 │ workflow → contracts/task/commerce-workflows[ref].label · reviewScope      │
 │ agent    → contracts/agent/gameops-agents[ref].intents · description       │
 │ playbook → contracts/agent/gameops-playbooks[ref].riskLevel·triggers·steps │
 │ preset   → contracts/task/distribution-presets[ref].label · description    │
 └───────────────────────────────┬───────────────────────────────────────────┘
                                  ▼  warmup 1회 후 reps회
 ┌ 3. RUN ────────────────────────────────────────────────────────────────────┐
 │ POST {BASE_URL}/api/generate  (Ollama · temperature 0 · think:false)       │
 │ ← total_duration·load_duration·prompt_eval_count·eval_count·eval_duration  │
 └───────────────────────────────┬───────────────────────────────────────────┘
                                  ▼  benchmarks-metrics 기준 산출
 ┌ 4. MEASURE ─────────────────────────────────────────────────────────────────┐
 │ latency_p50(=median infer, load 제외) · throughput_tps(out/eval_dur)        │
 │ input/output_tokens · cost_per_run_usd(=tokens × models[M].pricing)         │
 │ success_rate·error_rate · latency_p95(reps≥3만) · accuracy(gold셋 없어 생략)│
 └───────────────────────────────┬───────────────────────────────────────────┘
                                  ▼
 ┌ 5. MERGE ───────────────────────────────────────────────────────────────────┐
 │ results  ← measured 행 추가(같은 model의 ran target만 교체; 타 model·       │
 │            illustrative 보존)  → benchmarks-results/<domain>.json            │
 │ rollups  ← 그 model의 **전체 measured**에서 domain별 평균 재계산             │
 │ run record → experiments/runs/<M>-<ts>.json                                  │
 └───────────────────────────────┬───────────────────────────────────────────┘
                                  ▼
 6. DOC   pnpm run summary:benchmarks → BENCHMARK-RESULTS.md
          ( validate:benchmark-doc 가 계약↔문서 신선도를 CI에서 강제 )
```

## 계약·개념 활용 (실험이 무엇을 어떻게 소비하나)

벤치마크 실험은 이 레지스트리가 **"한 계약을 다른 곳에서 활용"**하는 대표 사례입니다 — 측정층(benchmarks)이 **tool·task·agent** role에 흩어진 실행 가능한 계약들을 **logical id(`ref`)로 교차참조**해 측정합니다. 모든 `ref`는 `validate:benchmarks`가 해당 레지스트리에 존재하는지 강제하므로, 존재하지 않는 계약은 측정 대상이 될 수 없습니다.

| 개념 (계약) | role | 실험에서의 활용 |
|---|---|---|
| **target** (`benchmarks-targets`) | benchmarks | 측정 단위. `{kind, ref, domain}`이 "무엇을 잴지" 결정 |
| **skill** (`skills-catalog`) | tool | `kind:skill`의 `ref` → `description`으로 프롬프트 |
| **workflow** (`commerce-workflows`) | task | `kind:workflow`의 `ref` → `label`·`reviewScope`로 프롬프트 |
| **agent** (`gameops-agents`) | agent | `kind:agent`의 `ref` → `intents`·`description`으로 프롬프트 |
| **playbook** (`gameops-playbooks`) | agent | `kind:playbook`의 `ref` → `riskLevel`·`triggers`·`steps`로 프롬프트 |
| **preset** (`distribution-presets`) | task | `kind:preset`의 `ref` → `label`·`description`으로 프롬프트 |
| **model** (`benchmarks-models`) | benchmarks | `pricing`→비용 계산, `status`(frontier/balanced/fast)→리더보드 분류 |
| **metric** (`benchmarks-metrics`) | benchmarks | 어떤 수치를 재고 rollup에서 평균낼지 |
| **rollup** (`benchmarks-rollups`) | benchmarks | `domain × model` 평균 — 모델 비교의 큰 그림 |

즉 한 번의 실험이 **5종 실행 계약(3개 role) + 2종 benchmarks 계약**을 읽어 measured 결과를 만들고, 그 결과를 다시 benchmarks role 안에 병합합니다. 이는 [CONTRACT-GLOSSARY.md](CONTRACT-GLOSSARY.md)의 관계 #3(benchmarks target → skill·workflow·agent·playbook·preset)·#4(측정 참조)의 구체적 실행입니다.

## 측정 베이스라인 (로컬 Ollama, `qwen3.6-27b` 기준)

**전체 114개 타깃**(스킬 86 + 커머스 워크플로 21 + gameops 에이전트 4·playbook 2 + distribution preset 1)을 `qwen3.6-27b`로 1회씩 실제 실행했습니다 — **114/114 성공**. 새로 추가된 도메인의 LLM 실행 엔티티(에이전트·playbook·preset)도 포함합니다. 전 항목·카테고리별·전체 타깃 표는 [BENCHMARK-RESULTS.md](BENCHMARK-RESULTS.md) 참조.

| 도메인 | n | 지연 p50 | 처리량 | 평균 출력토큰 | 성공률 |
|---|---|---|---|---|---|
| skills | 86 | 3,520ms | 20.3 tps | 65.5 | 100% |
| commerce | 21 | 5,056ms | 50.2 tps | 236.3 | 100% |
| gameops | 6 | 4,125ms | 49.9 tps | 184.5 | 100% |
| distribution | 1 | 5,482ms | 50.1 tps | 256.0 | 100% |

- 비용 $0(로컬), `num_predict=256`. 짧은 출력(스킬 ~65토큰)은 프롬프트 평가 오버헤드 비중이 커 유효 tps가 낮고, 긴 출력(워크플로/에이전트 ~256토큰)은 정상 생성 속도(~50 tps)에 수렴합니다.
- qwen35(27B)는 reasoning 모델이라 `think:false`로 호출(기본 thinking 모드가 출력 토큰을 소진). 지연은 1회성 모델 로드를 제외한 추론 시간.
- **지연/처리량은 환경 의존적**입니다(GPU 부하·warm 상태). 정식 수치는 생성 산출물 `BENCHMARK-RESULTS.md`를 기준으로 합니다.
- 보조 비교: `qwen-2.5-0.5b`(소형) 측정값(skills+commerce 107건)도 `results.json`에 있어 소형 vs 대형 대비를 제공합니다.
- 메모리 경합으로 모델 동시 상주가 어려워 전환 시 `ollama stop <tag>`로 언로드 후 실행했습니다.
- 재현: `pnpm run experiment -- --model-id qwen3.6-27b --ollama-tag qwen3.6-27b:latest --limit 1000` (전체 114) 또는 `--targets agent:cs,playbook:daily_ops_brief_v1` (부분).

## 시드(초기 데이터) 정책

위 measured 베이스라인 외에, 나머지 모델/조합의 초기 결과·롤업은 **결정론적 illustrative 수치**입니다. `tools/generate-benchmarks.mjs`가 `targetId+modelId` 해시와 모델 가격·합성 속도/품질 계수로 안정적으로 생성하므로, 재실행해도 동일한 값이 나옵니다. 이는 구조를 시연하고 검증 파이프라인을 채우기 위한 것이며 **실측이 아닙니다**.

실측을 채우는 경로:

1. 대상 계약을 모델로 N회 실행하고 지표를 수집한다.
2. `results.json`에 `dataSource: "measured"` 행을 추가한다 (`(targetId, modelId, dataSource)` 고유).
3. `rollups.json`을 갱신한다.
4. `pnpm run check:ci`로 검증한다.

## 검증 무결성 (`scripts/validate-benchmarks.mjs`)

- 모든 enum 고유, 모델/지표/결과/롤업의 enum 참조는 `base.json` 어휘에 속함.
- **타깃은 실재 계약을 참조해야 함**: `kind: skill`은 `contracts/tool/skills-catalog/`, `kind: workflow`은 `contracts/task/commerce-workflows/`에 존재. (도메인 간 무결성)
- 결과·롤업의 `targetId`/`modelId`/`metricId`는 모두 등록된 값.
- percent 지표는 0–100, 모든 지표 값은 음수 불가.
- `(targetId, modelId, dataSource)` 조합 고유, `seedModels` ⊆ 모델 레지스트리.

## 산출물

`pnpm run build:benchmarks` → `dist/plomus-benchmarks.json` (enum + 모델/지표/타깃/결과/롤업 묶음). 소비자는 `@plomus/contracts/benchmarks` 또는 하위 경로(`./benchmarks/models` 등)로 import.
