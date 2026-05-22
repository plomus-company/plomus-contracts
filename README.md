# Plomus Contracts

Plomus 운영체제들이 공유하는 공개 contract registry입니다. 외부 배포 주체가 preset, workflow, review rule, skill 계약을 추가하거나 갱신할 때 이 저장소를 기준으로 검토합니다.

**"contract"의 의미**는 [docs/CONTRACT-GLOSSARY.md](docs/CONTRACT-GLOSSARY.md)에 정의되어 있습니다 — 에이전트·도구·다른 에이전트·서비스 사이의 *실행 가능한(기계가 읽는) 약속*입니다.

## 구조: contract role 축

모든 계약은 `contracts/` 한 폴더 아래 **계약의 역할(contract role)**별로 묶입니다 — `contracts/<role>/<domain>-<contract>/`(출처 도메인이 아니라 역할이 1차 축). role은 닫힌 집합(아래 8)이라 도메인이 늘어도 root 디렉토리는 늘지 않습니다. 모든 계약은 폴더이며(loose 파일 없음), 큰 컬렉션은 `<businessUnit>.json`(task·governance)·`<category>.json`(skill)으로 분할되고, 단일 객체 계약(base 등)은 폴더에 한 파일로 들어갑니다. 각 계약 폴더는 출처를 드러내는 논리 id(`<domain>-<contract>`)를 그대로 유지합니다(예: `contracts/governance/commerce-review-rules/`).

| Role | 위치 | 의미 | 규모 | dist 번들 |
|---|---|---|---|---|
| **Tool** | `contracts/tool/` | 도구·API·와이어 호출 규격 | skill 86 · route 41 · credential 20 · upstream 18 · package 22 · endpoint 7 · payload 9 · adapter 7 | `plomus-tool.json` |
| **Agent** | `contracts/agent/` | 에이전트 능력·정체성 | agent 4 · playbook 2 · intent 16 · field 6 | `plomus-agent.json` |
| **Task** | `contracts/task/` | 위임 작업·워크플로 | preset 8 · workflow 21 · dist-preset 1 | `plomus-task.json` |
| **Governance** | `contracts/governance/` | 규칙·역할·라이프사이클·복구 | rule 37 · role 6 · 실행상태 19 · 승인정책 3 · EXPERIMENTAL 규칙 12 | `plomus-governance.json` |
| **Transaction** | `contracts/transaction/` | 결제·정산·수수료·예산 (EXPERIMENTAL) | budget 4 · settlement 3 | `plomus-transaction.json` |
| **Legal** | `contracts/legal/` | 법적 문서·약관·고지 (DRAFT) | document 6 · disclosure 4 | `plomus-legal.json` |
| **Foundation** | `contracts/foundation/` | 공유 어휘(역할 아님) | frontmatter 10 · 이벤트그룹 6 · error code 21 · 필드 7 | `plomus-foundation.json` |
| **Benchmarks** | `contracts/benchmarks/` | 측정층(역할 아님) | model 14 · metric 9 · target 114 · result 677 | `plomus-benchmarks.json` |

분류 규칙(role 매핑 + 15 business unit · 15 category 2차 축)은 [docs/CONTRACT-TAXONOMY.md](docs/CONTRACT-TAXONOMY.md)에 정의되고 validator가 폴더 배치를 강제합니다. 빌드(`build:*`)가 폴더를 다시 합쳐 `dist/plomus-*.json`을 만듭니다. 한 role 번들은 여러 출처 도메인의 조각을 `members.<domain>` 아래 담습니다. 버전 폴더는 두지 않습니다(버전관리는 git/GitHub).

> **transaction·legal**은 `EXPERIMENTAL`/`DRAFT`입니다 — 구조는 검증되지만 값(수수료율·약관 문구)은 권위 데이터가 아닌 scaffold입니다. governance review-rule(settlement·finance·claim·legal-policy 행동 규칙)은 그대로 두고, transaction은 그 위에 *기계 거래 규격*(예산·결제증명·정산)을, legal은 *법적 문서 계약*을 더합니다([GLOSSARY](docs/CONTRACT-GLOSSARY.md)). smart contract는 범위 밖.
> **소비자 이전**: dist·export가 변경(breaking)되었습니다 — [docs/CONTRACT-MIGRATION.md](docs/CONTRACT-MIGRATION.md).

## 계약 역할 상세

각 role 번들은 여러 출처 도메인에서 모입니다. 도메인별 필드 상세는 [docs/contracts/](docs/contracts/).

### Tool (`contracts/tool/`) → `plomus-tool.json`

도구·API·와이어 프로토콜을 *어떻게 호출하는가*.

| 출처 | 폴더 | 내용 |
|---|---|---|
| skills | `contracts/tool/skills-*` | 스킬 카탈로그(86), 프록시 라우트 allowlist(41), credential 레지스트리(20), 스킬별 외부 의존(86), category(15)·subcategory(37), upstream(18), packages.json(22), mcp 사용 스킬(11) — [skills.md](docs/contracts/skills.md) |
| protocol | `contracts/tool/protocol-*` | desktop↔web endpoint(7), sync payload(9), telegram 명령(4), sync-event 필드(13) — [protocol.md](docs/contracts/protocol.md) |
| gameops | `contracts/tool/gameops-adapters` | LiveOps 실행 adapter(7) |

### Agent (`contracts/agent/`) → `plomus-agent.json`

에이전트가 *무엇이고 무엇을 할 수 있나*. gameops 운영 에이전트(4)·playbook(2)·intent(16)·게임 필드(6)와 gameops 어휘 — [gameops.md](docs/contracts/gameops.md).

### Task (`contracts/task/`) → `plomus-task.json`

*어떤 일을 어떤 레시피·안전 프로파일로 위임*하는가. commerce 온보딩 preset(8)·hermes workflow(21), distribution preset(1). workflow는 `safety.executionClass`·`riskLevel`·`externalAccess`·`sideEffects`를 가집니다 — [commerce.md](docs/contracts/commerce.md).

### Governance (`contracts/governance/`) → `plomus-governance.json`

에이전트가 *지켜야 할 규칙·역할·라이프사이클·복구*. risk→model 라우팅, 실행 lifecycle 상태기계(19: dry-run→approve→execute→verify→rollback), RBAC 역할(6) + 다자승인 정책(3), commerce review rule(37), distribution EXPERIMENTAL 규칙(12) — [governance.md](docs/contracts/governance.md), [distribution.md](docs/contracts/distribution.md).

### Transaction (`contracts/transaction/`) → `plomus-transaction.json` (EXPERIMENTAL)

*얼마를·어떻게·어떤 증명으로 결제·정산하는가* — 기계 거래 규격. x402식 spending budget(4: 세션/일/월, 예산 한도·결제레일·결제증명, 승인 게이트는 governance 교차참조)과 settlement(3: 수수료율·정산 주기·환불, businessUnit별). governance review-rule(행동 규칙) 위에 더하는 층입니다 — [GLOSSARY](docs/CONTRACT-GLOSSARY.md).

### Legal (`contracts/legal/`) → `plomus-legal.json` (DRAFT)

*어떤 법적 문서를 제시·준수해야 하는가*. legal document(6: 이용약관·개인정보처리방침·전자상거래 고지·파트너 계약·환불 정책·마케팅 동의, documentType별)과 전자상거래법 표시의무 disclosure(4). 값은 법률 검토 전 scaffold입니다 — [GLOSSARY](docs/CONTRACT-GLOSSARY.md).

### Foundation (`contracts/foundation/`) → `plomus-foundation.json`

모든 역할이 참조하는 *공유 어휘*. commerce core enum, distribution 어휘 + frontmatter 필드(7), platform frontmatter 상태(10)·이벤트 분류(6 그룹)·error code(21) — [platform.md](docs/contracts/platform.md).

### Benchmarks (`contracts/benchmarks/`) → `plomus-benchmarks.json`

실행 가능한 계약(스킬·워크플로)을 유명 모델로 측정. model(14)·metric(9)·target(114)·result(677)·rollup(22). 측정/사용은 [BENCHMARKS.md](docs/BENCHMARKS.md), 결과는 [BENCHMARK-RESULTS.md](docs/BENCHMARK-RESULTS.md), 필드 상세는 [benchmarks.md](docs/contracts/benchmarks.md).

## 외부 애플리케이션에서 활용 (consuming the contracts)

이 저장소는 **언어 무관 JSON 계약 레지스트리**입니다(런타임 의존성 없음). 외부 앱은 빌드 산출물 `dist/plomus-*.json`을 읽어 씁니다. 필드 경로 예시는 [docs/CONTRACT-GLOSSARY.md](docs/CONTRACT-GLOSSARY.md)의 "사용 예시", 옛 export에서의 이전은 [docs/CONTRACT-MIGRATION.md](docs/CONTRACT-MIGRATION.md).

### 1. 획득 — 세 경로

- **npm**: `npm i @plomus/contracts` (public). publish 시 빌드된 `dist/`가 포함됩니다.
- **GitHub Release**: `Contract Release` workflow가 role별 `dist/plomus-*.json` + 매니페스트 + `contract-summary.md`를 첨부합니다.
- **git ref / commit SHA 고정**: `npm i github:plomus-company/plomus-contracts#<sha>`. `dist/`는 git에 커밋되지 않지만(빌드 산출물), 설치 시 `prepare`(node 단독, pnpm 불필요)가 소스에서 `dist/`를 재현합니다.

### 2. import — export 맵

기본 형태는 `@plomus/contracts/<role>`입니다.

| import | 대상 |
|---|---|
| `@plomus/contracts` · `/index` | 매니페스트 — role·artifact·dependsOn·folders로 전체 discovery |
| `@plomus/contracts/tool` | 도구·API (skills·protocol·gameops adapter) |
| `/agent` · `/task` · `/governance` · `/transaction` · `/legal` · `/foundation` | 각 role 번들 |
| `/benchmarks` | 측정값 |

JS(ESM, Node ≥22)는 JSON import attribute가 필요합니다:

```js
import index from "@plomus/contracts" with { type: "json" };
import tool  from "@plomus/contracts/tool" with { type: "json" };
const skills = tool.members.skills.contracts.skills;   // members.<domain>.contracts.<x>
```

JS가 아니어도 됩니다 — Python·Go 등은 `dist/plomus-tool.json`(또는 release asset)을 파일/HTTP로 읽으면 그만입니다.

### 3. discovery & 자기서술 형태

`@plomus/contracts/index`(`plomus-contracts-index.json`)는 각 role의 `{ artifact, domains, dependsOn, folders }`를 담아 한 파일로 전체 구성·의존 그래프를 발견하게 합니다. **모든 번들은 `{ schemaVersion, name, type, generatedAt }`를 공유**하며, role 번들은 `members`(`members.<domain>.contracts.<x>`)를, benchmarks는 측정층이라 `enums`·`contracts`를 추가로 가집니다.

### 4. 버전 고정 & 호환성 (consumer가 지켜야 할 것)

- **고정(pin)**: release tag · npm version · commit SHA 중 하나로 고정해 재현성을 확보하세요.
- **호환성**: `patch`(라벨·설명·status) · `minor`(추가) · `major`(id 삭제·의미 변경·필수 필드)는 [docs/CONTRACT-LIFECYCLE.md](docs/CONTRACT-LIFECYCLE.md)를 따릅니다. major는 [docs/CONTRACT-MIGRATION.md](docs/CONTRACT-MIGRATION.md)에 이전 절차를 둡니다.
- **`status`를 반드시 확인**: production에는 `ACTIVE`만 쓰세요. `EXPERIMENTAL`/`DRAFT`(현재 `transaction`·`legal`)는 구조는 검증되지만 값(수수료율·약관 문구)이 권위 데이터가 아닌 scaffold입니다. `DEPRECATED`는 다음 major에서 `REMOVED`됩니다.
- **교차참조 해소**: 한 번들의 참조(예: transaction budget의 `approvalPolicy`)는 의존 번들(governance)에서 해소합니다 — `dependsOn`(매니페스트)대로 함께 가져오세요.

## 검증

```bash
pnpm install
pnpm run check:update
pnpm test
pnpm run check:ci
```

`pnpm run check:update`는 외부 PR에서 가장 먼저 실행할 검증입니다. JSON 포맷, 계약 참조, core parity, 폴더 배치 정합(`validate:placement` — 모든 폴더형 컬렉션의 항목이 분할 키에 맞는 파일에 있는지), 문서 카운트 정합(`validate:docs` — README·docs의 (N) 카운트가 실제 계약 수와 일치하는지), 벤치마크 문서 신선도(`validate:benchmark-doc` — `BENCHMARK-RESULTS.md`가 계약 데이터와 일치하는지), 요약 생성을 확인합니다.

`pnpm test`는 Node 22 내장 test runner로 smoke test와 validator 회귀 테스트를 실행합니다. 로컬 반복 실행은 `pnpm run test:watch`, 커버리지 확인은 `pnpm run test:coverage`.

`pnpm run check:ci`는 배포 전 전체 검증입니다. 모든 도메인을 검증·빌드하고 **교차 도메인 일관성**(`validate:cross-domain` — platform↔distribution 상태 드리프트, governance↔benchmarks·gameops 정합)을 확인하며, role별 `dist/plomus-*.json`과 매니페스트 `dist/plomus-contracts-index.json`(role 의존 그래프), `dist/contract-summary.md`를 생성하고 테스트까지 실행합니다.

도메인별 명령도 따로 제공합니다: `validate:commerce`/`validate:skills`/`validate:transaction`/`validate:legal` 등(검증은 출처 도메인 단위), `build:tool`/`build:agent`/`build:task`/`build:governance`/`build:transaction`/`build:legal`/`build:foundation`/`build:benchmarks`(빌드는 role 단위).

테스트에서 실제 계약 파일을 오염시키지 않고 validator/build script를 실행해야 할 때는 `PLOMUS_CONTRACTS_ROOT=/path/to/fixture`를 지정합니다. `tests/helpers/registry-test-utils.mjs`가 이 방식으로 임시 fixture를 구성합니다.

## 변경 절차

1. 계약 JSON을 수정합니다(예: `contracts/governance/commerce-review-rules/<businessUnit>.json`).
2. `pnpm run format:contracts`를 실행합니다.
3. `pnpm run check:update`를 실행합니다.
4. `pnpm run check:ci`를 실행합니다.
5. 변경 이유, 호환성 영향, 적용 대상 제품을 PR에 기록합니다.
6. breaking change는 `docs/CONTRACT-LIFECYCLE.md` 기준에 따라 major version으로 올립니다.

## 현재 원천

- Commerce 계약은 `plomus-commerce-ai-os` registry에서 추출했습니다 (`pnpm run import:commerce-ai-os`).
- Skills 계약은 `k-skill` 저장소를 참고해 새로 설계했습니다 (`pnpm run import:k-skill`).
- Benchmarks 계약은 skills + commerce 계약에서 타깃을 생성합니다 (`pnpm run generate:benchmarks`). 측정값은 `pnpm run experiment`로 채우며, 현재 measured 221건(`qwen3.6-27b` 114 + `qwen-2.5-0.5b` 107) + illustrative 시드를 함께 보관합니다.
- Distribution·Protocol·Platform·Governance·GameOps 계약은 각 원천 저장소(`plomus-distribution-ai-os`, `plomus-commerce-ai-os`, `plomus-gameops-ai-os`)를 참고해 만들었고, 의존 도메인은 읽기 전용 교차참조만 합니다.

이후부터는 이 저장소가 공개 contract의 기준입니다.

## GitHub 기반 운영

- 변경 요청: GitHub Issue `Contract change`
- PR 기준: `.github/PULL_REQUEST_TEMPLATE.md`
- GitHub Project 구성: [docs/GITHUB-PROJECT.md](docs/GITHUB-PROJECT.md)
- 상세 절차: [docs/UPDATE-WORKFLOW.md](docs/UPDATE-WORKFLOW.md)
- release artifact: role별 `dist/plomus-*.json`, 매니페스트 `dist/plomus-contracts-index.json`, `dist/contract-summary.md`
