# Contract Taxonomy

이 문서는 계약 폴더 분류 규칙을 정의합니다. **task 계약**(review rule·workflow·distribution rule)은 운영 *business unit*으로, **skill 계약**(catalog·data-source·package)은 *category*로 폴더가 나뉩니다. 단일 소스는 `scripts/taxonomy.mjs`이고, 분류 규칙은 validator가 CI에서 강제합니다.

## 폴더 배치 불변 조건

모든 계약은 폴더입니다(loose 파일 없음). 큰 컬렉션은 `<unit>.json` 파일들로 나뉩니다 — 예: `contracts/commerce-review-rules/settlement.json`, `skills/catalog/finance.json`.

배치 불변 조건(validator가 강제):

- task 계약의 각 항목은 `businessUnit` 필드를 가지며, 그 값이 항목이 속한 파일 stem과 같아야 합니다.
- skill 계약의 각 항목은 `category` 필드를 가지며, 그 값이 파일 stem과 같아야 합니다.
- 값은 아래 통제 어휘(business unit 15개 / category 15개)에 속해야 합니다.

두 단계로 강제합니다:

1. **통제 어휘 + 배치** — `businessUnit`(15 unit)·`category`(15 category) 축은 도메인 validator가 값이 어휘에 속하는지와 파일 stem 일치를 함께 검사합니다.

| 계약 | 축 | validator |
|---|---|---|
| `commerce-review-rules`, `commerce-workflows` | `businessUnit` | `scripts/validate.mjs` |
| `distribution-experimental-rules` | `businessUnit` | `scripts/validate-distribution.mjs` |
| `skills-catalog`, `skills-data-sources`, `skills-packages` | `category` | `scripts/validate-skills.mjs` |

2. **전 컬렉션 폴더 정합** — `scripts/validate-placement.mjs`(`validate:placement`)가 *모든* 폴더형 컬렉션에서 각 항목이 자기 분할 키의 `safeUnit()` 파일에 있는지 검사합니다(아래 표). 통제 어휘는 보지 않고 "잘못 놓였는지"만 봅니다.

공통 검사기: 통제 어휘 축은 `placementErrors(name, key, field, allowed)`, 일반 정합은 `folderPlacementErrors(name, key, field)` (둘 다 `scripts/taxonomy.mjs`). 파일 stem 보존 읽기는 `readGroups(name, key)` (`scripts/group.mjs`).

### 전체 폴더 분할 키 (`FOLDER_SPLIT`)

파일명 = `safeUnit(<분할 필드>)`. 단일 객체 계약(`*-base` 등)은 폴더당 1파일이라 분할하지 않습니다.

| 컬렉션 | 분할 필드 |
|---|---|
| `commerce-presets` | `presetId` |
| `commerce-review-rules`, `commerce-workflows`, `distribution-experimental-rules` | `businessUnit` |
| `distribution-fields`, `platform-frontmatter`, `gameops-fields` | `documentType` |
| `platform-event-types` | `object` |
| `platform-error-codes`, `benchmarks-metrics` | `category` |
| `protocol-endpoints` | `kind` |
| `protocol-payloads` | `objectType` |
| `gameops-adapters` | `adapterId` |
| `gameops-agents` | `agentId` |
| `gameops-playbooks` | `playbookId` |
| `skills-catalog`, `skills-data-sources`, `skills-packages`, `skills-categories` | `category` |
| `skills-credentials`, `skills-proxy-routes` | `upstream` |
| `skills-upstreams` | `upstreamId` |
| `benchmarks-models` | `vendor` |
| `benchmarks-targets`, `benchmarks-rollups` | `domain` |
| `benchmarks-results` | target의 `domain` (파생 — `targetId`로 해소) |

## Business unit (15)

운영 흐름 순서(`BUSINESS_UNITS`):

`product` · `order` · `inventory` · `claim` · `settlement` · `finance` · `hr` · `procurement` · `partner` · `legal-policy` · `app-distribution` · `si-project` · `recurring` · `operations` · `system`

`operations`는 catch-all입니다. 매핑 테이블에 없는 source 값은 `operations`로 떨어지고, validator가 진짜 미지의 unit만 차단합니다.

### Commerce review-rule `domain` → unit

| domain | unit |
|---|---|
| `PRODUCT` | product |
| `ORDER` | order |
| `INVENTORY` | inventory |
| `CLAIM` | claim |
| `SETTLEMENT` | settlement |
| `FINANCE` | finance |
| `HR` | hr |
| `PROCUREMENT` | procurement |
| `PARTNER` | partner |
| `LEGAL_POLICY` | legal-policy |
| `APP_DISTRIBUTION` | app-distribution |
| `SI_PROJECT` | si-project |
| `RECURRING` | recurring |
| `GENERAL_OPERATIONS`, `ALWAYS_ON` | operations |
| `SYSTEM` | system |

### Commerce workflow `reviewScope` → unit

| reviewScope | unit |
|---|---|
| `PRODUCT` | product |
| `ORDER_DELAY` | order |
| `INVENTORY` | inventory |
| `CLAIM` | claim |
| `SETTLEMENT` | settlement |
| `FINANCE` | finance |
| `HR` | hr |
| `PARTNER` | partner |
| `LEGAL_POLICY`, `CONTRACT` | legal-policy |
| `APP_RELEASE`, `APP_STORE` | app-distribution |
| `SI_PROJECT` | si-project |
| `RECURRING` | recurring |
| `OPERATIONS`, `TASK`, `WORKSPACE`, `DAILY_BRIEFING`, `GENERAL_COMPANY` | operations |
| `CHANGE_PLAN` | system |

### Distribution experimental-rule `domain` → unit

| domain | unit |
|---|---|
| `PRODUCT` | product |
| `ORDER` | order |
| `INVENTORY` | inventory |
| `CLAIM` | claim |
| `SETTLEMENT` | settlement |
| `SUPPLIER` | partner |

`SUPPLIER`는 `partner`로 접힙니다. 항목의 `domain`은 원래 값을 유지하고, `businessUnit`만 폴더 배치를 결정합니다.

## Skills category (15)

`skills/base/base.json`의 `categories`:

`commerce` · `finance` · `real-estate` · `travel` · `mobility` · `legal` · `government` · `health` · `food` · `documents` · `writing` · `sports` · `media` · `utility` · `tooling`

skill은 `category`(폴더 축)와 `subcategory`(더 세분된 분류, `skills/categories/`에서 grouping)를 모두 가집니다. 폴더는 `category`로만 나뉘고, `subcategory`는 `categories.json`이 따로 검증합니다. data-source·package 항목은 자신이 참조하는 skill의 `category`를 복사해 같은 축으로 배치됩니다(미지의 skill은 `tooling`).

## 재분류(one-time)

source 값이 바뀌어 폴더를 다시 정렬해야 하면 `node scripts/migrate-taxonomy.mjs`를 실행합니다. 이 스크립트는 매핑 테이블로 `businessUnit`/`category`를 다시 부여하고 `writeGroup`으로 폴더를 다시 씁니다(idempotent). 그 뒤 `pnpm run format:contracts`와 `pnpm run check:update`로 확인합니다.
