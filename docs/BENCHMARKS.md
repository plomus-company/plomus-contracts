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

## 시드(초기 데이터) 정책

초기 결과·롤업은 **결정론적 illustrative 수치**입니다. `tools/generate-benchmarks.mjs`가 `targetId+modelId` 해시와 모델 가격·합성 속도/품질 계수로 안정적으로 생성하므로, 재실행해도 동일한 값이 나옵니다. 이는 구조를 시연하고 검증 파이프라인을 채우기 위한 것이며 **실측이 아닙니다**.

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
