# Plomus Contracts

Plomus 운영체제들이 공유하는 공개 contract registry입니다. 외부 배포 주체가 preset, workflow, review rule, skill 계약을 추가하거나 갱신할 때 이 저장소를 기준으로 검토합니다.

저장소는 **세 개의 계약 도메인**으로 구성되며, 각 도메인은 서로 참조하는 JSON 계약 파일 + 통제 어휘(enum) + 교차참조 검증기 + import/generate 도구를 갖습니다.

| 도메인 | 위치 | 출처 | 규모 | 상세 문서 |
|---|---|---|---|---|
| **Commerce** | `contracts/v1/` | `plomus-commerce-ai-os` | preset 8 · rule 37 · workflow 21 | [contracts/v1/README.md](contracts/v1/README.md) |
| **Skills** | `contracts/skills/v1/` | `k-skill` (참고 후 재설계) | skill 86 · route 41 · credential 20 · category 15 | [contracts/skills/v1/README.md](contracts/skills/v1/README.md) |
| **Benchmarks** | `contracts/benchmarks/v1/` | skills + commerce 계약 참조 | model 12 · metric 9 · target 107 · result 428 | [contracts/benchmarks/v1/README.md](contracts/benchmarks/v1/README.md) |

## 계약 범위

### Commerce (`contracts/v1/`)

커머스 운영체제의 온보딩·검토·승인 계약입니다. 필드별 상세는 [contracts/v1/README.md](contracts/v1/README.md).

| 파일 | 내용 |
|---|---|
| `base.json` | core enum(26 그룹), 시스템 폴더(13), 문서 타입(54), 승인 정책, watch 폴더(29) |
| `presets.json` | 제품별 온보딩 preset(8) — 활성 rule/workflow/folder/document type/승인 정책 |
| `review-rules.json` | review rule(37) — `ruleId` ↔ `domain` ↔ `status` |
| `workflows.json` | hermes workflow(21) — scope, target folder, rule, safety profile |

### Skills (`contracts/skills/v1/`)

`k-skill` 스킬 생태계를 데이터 출처로 참고해 새로 설계한 도메인입니다. 필드별 상세는 [contracts/skills/v1/README.md](contracts/skills/v1/README.md), 설계 배경은 [docs/SKILLS-REGISTRY.md](docs/SKILLS-REGISTRY.md).

| 파일 | 내용 |
|---|---|
| `base.json` | 통제 어휘 — category(15)·locale·phase·implementationType·authType·upstream(18) |
| `catalog.json` | 스킬 카탈로그(86) — 분류, 패키징 유형, 프록시 사용, 필수 키 |
| `proxy-routes.json` | `k-skill-proxy` 라우트 allowlist(41) — path, upstream, credential, 소비 스킬 |
| `credentials.json` | API 키/세션 레지스트리(20) — 프록시 보관 15 + 사용자측 5 |
| `data-sources.json` | 스킬별 외부 의존(86) — upstream, 인증 방식 |

### Benchmarks (`contracts/benchmarks/v1/`)

각 실행 가능한 계약(스킬·워크플로)을 유명 모델로 벤치마킹하는 성능·비용·품질 지표 구조입니다. 설계/사용은 [docs/BENCHMARKS.md](docs/BENCHMARKS.md). (현재 결과는 `dataSource: illustrative` 예시 수치)

| 파일 | 내용 |
|---|---|
| `base.json` | 어휘 — vendor·metric category·unit·direction·target kind·data source |
| `models.json` | 유명 모델 레지스트리(12) — 가격(indicative)·컨텍스트·status |
| `metrics.json` | 지표 정의(9) — performance/cost/quality/reliability, 단위, 방향 |
| `targets.json` | 벤치마크 대상(107) — 스킬 86 + 워크플로 21, 실재 계약 참조 |
| `results.json` | 측정값(428) — target × model × metric |
| `rollups.json` | 도메인 롤업(8) — domain × model 지표 평균 |

## 검증

```bash
pnpm install
pnpm run check:update
pnpm test
pnpm run check:ci
```

`pnpm run check:update`는 외부 PR에서 가장 먼저 실행할 검증입니다. JSON 포맷, 계약 참조, core parity, 요약 생성을 확인합니다.

`pnpm test`는 Node 22 내장 test runner로 smoke test와 validator 회귀 테스트를 실행합니다. 로컬 반복 실행은 `pnpm run test:watch`, 커버리지 확인은 `pnpm run test:coverage`를 사용합니다.

`pnpm run check:ci`는 배포 전 전체 검증입니다. 세 도메인을 모두 검증·빌드하며 `dist/plomus-contracts.json`, `dist/plomus-skills.json`, `dist/plomus-benchmarks.json`, `dist/contract-summary.md`를 생성하고 테스트까지 실행합니다.

도메인별 명령도 따로 제공합니다: `validate:commerce`/`validate:skills`/`validate:benchmarks`, `build:commerce`/`build:skills`/`build:benchmarks`.

테스트에서 실제 계약 파일을 오염시키지 않고 validator/build script를 실행해야 할 때는 `PLOMUS_CONTRACTS_ROOT=/path/to/fixture`를 지정합니다. `tests/helpers/registry-test-utils.mjs`가 이 방식으로 임시 fixture를 구성합니다.

## 변경 절차

1. 계약 JSON을 수정합니다.
2. `pnpm run format:contracts`를 실행합니다.
3. `pnpm run check:update`를 실행합니다.
4. `pnpm run check:ci`를 실행합니다.
5. 변경 이유, 호환성 영향, 적용 대상 제품을 PR에 기록합니다.
6. breaking change는 `docs/CONTRACT-LIFECYCLE.md` 기준에 따라 major version으로 올립니다.

## 현재 원천

- Commerce 계약은 `plomus-commerce-ai-os`의 내부 registry에서 추출했습니다 (`pnpm run import:commerce-ai-os`).
- Skills 계약은 `k-skill` 저장소를 참고해 새로 설계했습니다 (`pnpm run import:k-skill`).
- Benchmarks 계약은 skills + commerce 계약에서 타깃을 생성합니다 (`pnpm run generate:benchmarks`). 결과는 현재 illustrative 시드입니다.

이후부터는 이 저장소가 공개 contract의 기준입니다.

## GitHub 기반 운영

- 변경 요청: GitHub Issue `Contract change`
- PR 기준: `.github/PULL_REQUEST_TEMPLATE.md`
- GitHub Project 구성: [docs/GITHUB-PROJECT.md](docs/GITHUB-PROJECT.md)
- 상세 절차: [docs/UPDATE-WORKFLOW.md](docs/UPDATE-WORKFLOW.md)
- release artifact: `dist/plomus-contracts.json`, `dist/plomus-skills.json`, `dist/contract-summary.md`
