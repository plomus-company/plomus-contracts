# Benchmarks

`contracts/benchmarks/v1/`는 각 실행 가능한 계약을 유명 모델로 벤치마킹하기 위한 구조입니다. 필드별 상세는 [contracts/benchmarks/v1/README.md](../contracts/benchmarks/v1/README.md).

## 목적

스킬과 커머스 워크플로는 결국 LLM이 실행합니다. 이 도메인은 "어떤 계약을, 어떤 모델로 돌렸을 때, 얼마나 빠르고/싸고/정확한가"를 계약화해서:

- 모델 선택을 비용·성능·품질 지표로 비교(리더보드)할 수 있고,
- 새 모델/계약 추가 시 회귀를 추적할 수 있으며,
- 도메인 단위(스킬 전체 / 커머스 전체)로 롤업해 큰 그림을 볼 수 있습니다.

## 데이터 모델

- **models** — 벤더별 유명 모델 레지스트리 (가격·컨텍스트·modality·status). 가격은 indicative.
- **metrics** — 무엇을 재는지 (performance / cost / quality / reliability, 단위, 방향).
- **targets** — 무엇을 재는 대상인지. 스킬(86)·워크플로(21) 각각이 타깃이며 실재 계약을 참조.
- **results** — `target × model`의 측정 한 묶음. `dataSource`로 measured/illustrative/pending 구분.
- **rollups** — `domain × model` 지표 평균.

## 측정 베이스라인 (로컬 Ollama)

전체 계약(스킬 86 + 워크플로 21 = **107개 타깃**)을 두 로컬 모델로 1회씩 실제 실행한 측정값이 `results.json`에 `dataSource: "measured"`로 들어 있습니다(모델당 107건, 합 214건). 전 항목 결과·카테고리별·도메인 롤업·모델 비교는 [BENCHMARK-RESULTS.md](BENCHMARK-RESULTS.md) 참조.

| 도메인 | 모델 | 지연 p50 | 처리량 | 평균 출력토큰 | 성공률 |
|---|---|---|---|---|---|
| skills | `qwen3.6-27b` | 5,317ms | 13.6 tps | 65.5 | 100% |
| skills | `qwen-2.5-0.5b` | 539ms | 522.6 tps | 187.4 | 100% |
| commerce | `qwen3.6-27b` | 19,762ms | 12.6 tps | 239.5 | 100% |
| commerce | `qwen-2.5-0.5b` | 731ms | 496.3 tps | 236.5 | 100% |

- 두 모델 모두 107/107 성공(실패 0), 비용 $0(로컬), `num_predict=256`.
- **27B vs 0.5B**: 0.5B는 ~10–37배 빠르고 처리량 ~38배지만, 스킬에서 출력이 더 장황(187 vs 65.5 토큰) — 소형 모델의 낮은 간결성/품질 경향. 성공률은 "비어 있지 않은 응답" 기준이며 정확도는 미측정.
- qwen35(27B)는 reasoning 모델이라 `think:false`로 호출(기본 thinking 모드가 출력 토큰을 소진). 지연은 1회성 모델 로드를 제외한 추론 시간.
- 메모리 경합으로 두 모델 동시 상주가 어려워, 모델 전환 시 `ollama stop <tag>`로 언로드 후 실행했습니다.
- 재현: `pnpm run experiment -- --model-id <id> --ollama-tag <tag> --limit 1000` (전체) 또는 `--targets skill:k-dart,workflow:commerce-review` (부분).

## 시드(초기 데이터) 정책

위 measured 베이스라인 외에, 나머지 모델/조합의 초기 결과·롤업은 **결정론적 illustrative 수치**입니다. `tools/generate-benchmarks.mjs`가 `targetId+modelId` 해시와 모델 가격·합성 속도/품질 계수로 안정적으로 생성하므로, 재실행해도 동일한 값이 나옵니다. 이는 구조를 시연하고 검증 파이프라인을 채우기 위한 것이며 **실측이 아닙니다**.

실측을 채우는 경로:

1. 대상 계약을 모델로 N회 실행하고 지표를 수집한다.
2. `results.json`에 `dataSource: "measured"` 행을 추가한다 (`(targetId, modelId, dataSource)` 고유).
3. `rollups.json`을 갱신한다.
4. `pnpm run check:ci`로 검증한다.

## 검증 무결성 (`scripts/validate-benchmarks.mjs`)

- 모든 enum 고유, 모델/지표/결과/롤업의 enum 참조는 `base.json` 어휘에 속함.
- **타깃은 실재 계약을 참조해야 함**: `kind: skill`은 `skills/v1/catalog.json`, `kind: workflow`은 `v1/workflows.json`에 존재. (도메인 간 무결성)
- 결과·롤업의 `targetId`/`modelId`/`metricId`는 모두 등록된 값.
- percent 지표는 0–100, 모든 지표 값은 음수 불가.
- `(targetId, modelId, dataSource)` 조합 고유, `seedModels` ⊆ 모델 레지스트리.

## 산출물

`pnpm run build:benchmarks` → `dist/plomus-benchmarks.json` (enum + 모델/지표/타깃/결과/롤업 묶음). 소비자는 `@plomus/contracts/benchmarks` 또는 하위 경로(`./benchmarks/models` 등)로 import.
