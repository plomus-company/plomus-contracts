# Plomus Contracts Implementation Spec

이 문서는 `plomus-contracts`를 통해 구현한 공개 계약 관리 구조와 제품 연동 방식을 정의합니다. 대상 독자는 Plomus 제품 구현자, 외부 배포 주체, contract contributor입니다.

## 목표

`plomus-contracts`는 제품 코드 안에 흩어진 운영 기준을 공개 계약으로 분리합니다. 계약은 JSON으로 관리하고, GitHub PR과 CI를 통해 추가·갱신합니다.

구현 목표는 다음과 같습니다.

- 외부 배포 주체가 contract를 직접 제안하고 검증할 수 있어야 합니다.
- 제품 저장소는 공개 contract를 기준으로 내부 enum, workflow, rule registry를 동기화해야 합니다.
- contract 변경은 id 중복, 참조 누락, 안전 프로파일 누락을 CI에서 차단해야 합니다.
- 모델 벤치마크와 스킬 의존성까지 같은 release 단위로 배포할 수 있어야 합니다.

## 저장소 역할

| 저장소 | 역할 |
|---|---|
| `plomus-contracts` | 공개 contract의 기준 저장소입니다. JSON 계약, 검증기, build artifact, release workflow를 관리합니다. |
| `plomus-commerce-ai-os` | 제품 구현 저장소입니다. 공개 contract와 내부 구현의 parity를 `pnpm check:contracts`로 확인합니다. |
| `k-skill` | skills contract 설계의 참고 출처입니다. 구조를 그대로 복제하지 않고 필요한 분류·프록시·credential 정보를 정규화합니다. |

## 계약 도메인과 contract role

저장소의 최상위 폴더는 **contract role**(tool·agent·task·governance·transaction·legal·foundation, + 측정층 benchmarks)이고, 각 계약은 그 안에서 출처 도메인을 드러내는 논리 id(`<domain>-<contract>`) 폴더로 유지됩니다([CONTRACT-GLOSSARY.md](CONTRACT-GLOSSARY.md)). **검증은 출처 도메인 단위**(distribution·protocol·platform → commerce, benchmarks → skills·commerce·gameops·distribution, governance → benchmarks, gameops·transaction → governance의 읽기 전용 교차참조)이고, **빌드는 role 단위**로 dist 번들을 만듭니다. 따라서 한 출처 도메인이 여러 role 번들에 걸칠 수 있습니다.

| 도메인 | role 폴더 | dist 번들 | 현재 규모 |
|---|---|---|---|
| Commerce | `contracts/task/`(preset·workflow), `contracts/governance/`(review-rule), `contracts/foundation/`(base) | `plomus-task` · `plomus-governance` · `plomus-foundation` | preset 8, rule 37, workflow 21 |
| Skills | `contracts/tool/skills-*` | `plomus-tool` | skill 86, route 41, credential 20 |
| Benchmarks | `contracts/benchmarks/` | `dist/plomus-benchmarks.json` | model 14, metric 11, target 114, result 684 |
| Distribution | `contracts/task/`(preset), `contracts/governance/`(rule), `contracts/foundation/`(base·fields) | `plomus-task` · `plomus-governance` · `plomus-foundation` | preset 1, 필드 7, EXPERIMENTAL 규칙 12 |
| Protocol | `contracts/tool/protocol-*` | `plomus-tool` | endpoint 7, sync-event 13, payload 9, telegram 4 |
| Platform | `contracts/foundation/platform-*` | `plomus-foundation` | frontmatter 10, event 6, error code 21 |
| Governance | `contracts/governance/governance-*` | `plomus-governance` | role 6, lifecycle 19, 승인정책 3, 라우팅 4 |
| GameOps | `contracts/agent/gameops-*`(agent·playbook·field), `contracts/tool/gameops-adapters` | `plomus-agent` · `plomus-tool` | adapter 7, intent 16, agent 4, playbook 2, field 6 |
| Transaction | `contracts/transaction/` | `plomus-transaction` | budget 4, settlement 3 (EXPERIMENTAL) |
| Legal | `contracts/legal/` | `plomus-legal` | document 6, disclosure 4 (DRAFT) |

계약은 버전 폴더 없이 `<role>/<domain>-<contract>/` 단위로 관리합니다(버전관리는 git/GitHub). review rule·workflow는 `businessUnit`으로, skill은 `category`로 파일이 나뉘며, role 매핑·분류 규칙은 [CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md)에 정의되고 validator가 강제합니다. 본 문서는 Commerce·Skills·Benchmarks 세 도메인을 중심으로 기술하며, 나머지는 [docs/contracts/](contracts/)에 상세가 있습니다.

### Commerce

Commerce 도메인은 `plomus-commerce-ai-os`의 온보딩과 운영 검토 계약입니다.

계약 구성(각 계약은 폴더이며, 빌드가 role 번들로 합칩니다 — `dist/plomus-foundation.json`·`plomus-task.json`·`plomus-governance.json`):

- `contracts/foundation/commerce-base/base.json`: core enum, 시스템 폴더, 문서 타입, 승인 정책, watch folder
- `contracts/task/commerce-presets/`: 제품 유형별 온보딩 preset
- `contracts/governance/commerce-review-rules/<businessUnit>.json`: 운영 점검 rule registry
- `contracts/task/commerce-workflows/<businessUnit>.json`: Hermes workflow와 safety profile

주요 불변 조건:

- preset이 참조하는 rule은 review-rule registry에 있어야 합니다.
- preset이 참조하는 workflow는 workflow registry에 있어야 합니다.
- review rule·workflow는 `businessUnit`이 자신이 속한 파일과 일치해야 합니다([CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md)).
- workflow의 `targetFolders`는 알려진 folder여야 합니다.
- 모든 workflow는 `safety.executionClass`, `riskLevel`, `externalAccess`, `sideEffects`를 가져야 합니다.
- `core.commercePresetIds`, `core.reviewRuleIds`, `core.hermesWorkflows`는 실제 registry와 양방향으로 일치해야 합니다.

### Skills

Skills 도메인은 `k-skill` 생태계를 공개 계약으로 정규화한 구조입니다.

파일 구성:

- `base.json`: category, locale, lifecycle phase, implementation type, auth type, upstream
- `catalog.json`: skill catalog
- `proxy-routes.json`: proxy route allowlist
- `credentials.json`: API key/session registry
- `data-sources.json`: skill별 외부 의존성

주요 불변 조건:

- 모든 skill은 정확히 하나의 data-source 항목을 가져야 합니다.
- `usesProxy`는 `proxy-routes.skills` 매핑과 양방향으로 일치해야 합니다.
- proxy route는 credential을 가져야 합니다.
- `requiredEnv`는 `credentials.envVar`에 존재해야 합니다.
- 정의된 category는 최소 하나 이상의 skill에서 사용해야 합니다.

### Benchmarks

Benchmarks 도메인은 skills와 commerce workflow를 모델별로 비교하기 위한 지표 구조입니다.

파일 구성:

- `base.json`: vendor, modality, metric category, unit, direction, target kind, data source
- `models.json`: 모델 registry
- `metrics.json`: 측정 지표
- `targets.json`: benchmark 대상
- `results.json`: target × model 측정값
- `rollups.json`: domain × model 집계값

주요 불변 조건:

- `kind: skill` target은 skills catalog에 존재해야 합니다.
- `kind: workflow` target은 commerce workflows에 존재해야 합니다.
- result의 `targetId`, `modelId`, `metricId`는 각각 registry에 존재해야 합니다.
- percent 지표는 0 이상 100 이하입니다.
- `(targetId, modelId, dataSource)` 조합은 고유해야 합니다.

현재 benchmark result 684건은 measured 228건(`qwen3.6-27b` 114 + `qwen-2.5-0.5b` 114)과 illustrative 456건으로 구성됩니다. illustrative 행은 구조 검증을 위한 결정론적 예시 수치이며 실측값이 아닙니다.

## 배포 인터페이스

`package.json`은 JSON 계약과 build artifact를 import 가능한 경로로 노출합니다.

소스 JSON은 폴더로 분할되어 있으므로, 소비자는 개별 파일이 아니라 `build:*`가 합친 `dist/plomus-*.json` 산출물을 import합니다.

| Export | 대상 |
|---|---|
| `@plomus/contracts` | `dist/plomus-contracts-index.json` (매니페스트) |
| `@plomus/contracts/index` | `dist/plomus-contracts-index.json` |
| `@plomus/contracts/tool` | `dist/plomus-tool.json` |
| `@plomus/contracts/agent` | `dist/plomus-agent.json` |
| `@plomus/contracts/task` | `dist/plomus-task.json` |
| `@plomus/contracts/governance` | `dist/plomus-governance.json` |
| `@plomus/contracts/transaction` | `dist/plomus-transaction.json` |
| `@plomus/contracts/legal` | `dist/plomus-legal.json` |
| `@plomus/contracts/foundation` | `dist/plomus-foundation.json` |
| `@plomus/contracts/benchmarks` | `dist/plomus-benchmarks.json` |

옛 도메인 export(`/skills`·`/distribution` 등)에서의 이전은 [CONTRACT-MIGRATION.md](CONTRACT-MIGRATION.md)를 보세요. 제품 저장소는 release tag, npm package, 또는 GitHub commit SHA 중 하나를 기준으로 contract를 고정합니다.

## 검증 파이프라인

기본 명령:

```bash
pnpm run check:update
pnpm run check:ci
```

`check:update`는 PR 작성자가 먼저 실행하는 빠른 검증입니다.

실행 순서:

1. `format:check`
2. `validate`
3. `summary`

`check:ci`는 release 전 전체 검증입니다.

실행 순서:

1. `check:update`
2. `build`
3. `test`

도메인별 검증:

| 명령 | 역할 |
|---|---|
| `validate:commerce` | Commerce 계약 참조와 core parity 검증 |
| `validate:skills` | Skills catalog, proxy, credential, data-source 무결성 검증 |
| `validate:benchmarks` | Benchmark target, model, metric, result, rollup 무결성 검증 |
| `validate:distribution` · `validate:protocol` · `validate:platform` · `validate:governance` · `validate:gameops` | 각 도메인 무결성 + commerce 교차참조 |
| `validate:transaction` · `validate:legal` | 예산·정산·문서·고지 무결성 + governance/business-unit 교차참조 |
| `validate:cross-domain` | platform↔distribution 상태 드리프트, governance↔benchmarks·gameops 정합 |
| `validate:placement` | 모든 폴더형 컬렉션의 항목이 분할 키(`FOLDER_SPLIT`)에 맞는 파일에 있는지 검증 |
| `validate:docs` | README·docs의 (N) 카운트가 실제 계약 수와 일치하는지 검증(문서 드리프트 차단) |
| `validate:benchmark-doc` | 생성 문서 `BENCHMARK-RESULTS.md`가 벤치마크 계약 데이터와 일치하는지 검증(`summary-benchmarks --check`) |

`validate`는 위 명령을 모두 실행합니다. 폴더 배치(`businessUnit`·`category`)는 commerce/distribution/skills validator가 함께 강제합니다([CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md)).

role별 빌드:

| 명령 | 산출물 |
|---|---|
| `build:tool` | `dist/plomus-tool.json` (skills + protocol + gameops adapter) |
| `build:agent` | `dist/plomus-agent.json` (gameops agent·playbook) |
| `build:task` | `dist/plomus-task.json` (commerce·distribution preset·workflow) |
| `build:governance` | `dist/plomus-governance.json` (governance + commerce·distribution rule) |
| `build:transaction` | `dist/plomus-transaction.json` (예산·정산·수수료, EXPERIMENTAL) |
| `build:legal` | `dist/plomus-legal.json` (법적 문서·전자상거래 고지, DRAFT) |
| `build:foundation` | `dist/plomus-foundation.json` (commerce·distribution·platform 어휘) |
| `build:benchmarks` | `dist/plomus-benchmarks.json` |
| `build:index` | `dist/plomus-contracts-index.json` (8 contract-type 의존 그래프 매니페스트) |

## GitHub 기반 갱신 흐름

외부 배포 주체는 GitHub에서 다음 흐름으로 contract를 갱신합니다.

1. `Contract change` issue를 생성합니다.
2. 변경 유형을 선택합니다: preset, workflow, review-rule, core-enum, document-type.
3. compatibility를 선택합니다: `patch`, `minor`, `major`.
4. PR에서 해당 계약 폴더의 `*.json`을 수정합니다(예: `contracts/governance/commerce-review-rules/<businessUnit>.json`).
5. `pnpm run format:contracts`와 `pnpm run check:update`를 실행합니다.
6. CI에서 `pnpm run check:ci`가 통과해야 합니다.
7. maintainer가 compatibility와 제품 영향 범위를 검토합니다.
8. release가 필요하면 `Contract Release` workflow를 실행합니다.

GitHub Actions 산출물:

- role별 `dist/plomus-{tool,agent,task,governance,transaction,legal,foundation,benchmarks}.json`
- `dist/plomus-contracts-index.json`
- `dist/contract-summary.md`

## 호환성 정책

| 수준 | 기준 |
|---|---|
| `patch` | label, description, status, metadata 변경 |
| `minor` | 새 preset, workflow, rule, skill, benchmark target 추가 |
| `major` | 기존 id 삭제, 기존 의미 변경, 필수 필드 변경 |

major 변경은 제품별 migration 계획이 있어야 합니다. 기존 id는 즉시 삭제하지 않고 `DEPRECATED` 상태를 거친 뒤 제거합니다.

## 제품 연동 방식

`plomus-commerce-ai-os`는 공개 contract를 다음 구현 지점과 동기화합니다.

| 공개 contract | 제품 구현 |
|---|---|
| `contracts/task/commerce-presets/` | `apps/desktop/src/modules/onboarding/commerce-presets.ts` |
| `contracts/governance/commerce-review-rules/` | `apps/desktop/src/modules/commerce-review/rules.ts` |
| `contracts/task/commerce-workflows/` | `apps/desktop/src/modules/hermes/workflow-definitions.ts` |
| `contracts/foundation/commerce-base/base.json` `.core` | `packages/core/src/*-types.ts` |
| workflow safety | `docs/workflows/<workflow-id>.md`, `docs/WORKFLOW-SAFETY.md` |

제품 저장소는 `pnpm check:contracts`로 다음을 확인합니다.

- preset registry와 core preset enum이 일치합니다.
- rule registry와 core rule enum이 일치합니다.
- workflow definition과 core workflow enum이 일치합니다.
- workflow recipe 문서와 safety profile이 일치합니다.
- target folder가 event watcher에 포함되어 있습니다.

## Import와 생성 도구

| 도구 | 역할 |
|---|---|
| `tools/import-from-commerce-ai-os.mjs` | `plomus-commerce-ai-os`에서 Commerce 계약을 추출합니다. |
| `tools/import-from-k-skill.mjs` | `k-skill` 내용을 참고해 Skills 계약을 생성합니다. |
| `tools/generate-benchmarks.mjs` | Skills와 Commerce 계약을 참조해 Benchmark target, illustrative result, rollup을 생성합니다. |
| `tools/import-from-distribution-ai-os.mjs` · `import-protocol.mjs` · `import-platform.mjs` · `import-governance.mjs` · `import-gameops.mjs` | 각 도메인 계약을 원천 저장소에서 추출/생성합니다. |
| `scripts/migrate-taxonomy.mjs` | 폴더 분류를 [CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md) 기준으로 일괄 재정렬합니다(one-time). |

이 도구들은 계약 재생성 경로입니다. 커밋된 JSON은 CI에서 독립적으로 검증되므로, 소비자와 GitHub Actions는 원천 저장소가 없어도 동작합니다.

## 운영 산출물

| 산출물 | 설명 |
|---|---|
| `dist/plomus-{tool,agent,task,governance,transaction,legal,foundation}.json` | contract-role별 통합 번들 |
| `dist/plomus-benchmarks.json` | Benchmarks 측정 통합 파일 |
| `dist/plomus-contracts-index.json` | role 의존 그래프 매니페스트 |
| `dist/contract-summary.md` | CI step summary와 release note에 사용할 요약 |
| `dist/contract-summary.json` | 요약의 기계 판독 버전 |

## 현재 제한

- Benchmark 결과는 measured 228건(로컬 `qwen3.6-27b`·`qwen-2.5-0.5b`, 각 114) + illustrative 456건입니다. 상용 모델 등 추가 measured 수치는 `pnpm run experiment`로 수집 후 `dataSource: "measured"`로 채워야 합니다.
- Skills 계약은 `k-skill`을 참고하지만, `k-skill` package release와 자동 동기화하지 않습니다.
- JSON schema 파일은 registry wrapper 수준이며, 상세 무결성은 Node 검증 스크립트가 담당합니다.
- 제품 저장소는 아직 npm package 자동 업데이트 workflow를 갖지 않습니다. 현재는 release tag 또는 commit 기준으로 수동 동기화합니다.

## 완료 기준

contract 변경은 다음 조건을 만족해야 완료 상태로 봅니다.

- JSON 포맷이 canonical format입니다.
- 여덟 도메인 검증과 교차 도메인 검증이 모두 통과합니다.
- build artifact가 생성됩니다.
- 테스트가 통과합니다.
- PR에 compatibility와 적용 대상 제품이 기록되어 있습니다.
- 제품 저장소가 영향을 받는 경우 제품별 `check:ci`가 통과합니다.
