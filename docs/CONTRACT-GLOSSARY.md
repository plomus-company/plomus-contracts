# Contract Glossary

이 문서는 `plomus-contracts`에서 **"contract"가 무엇을 뜻하는지**, 그리고 저장소가 그 개념을 어떤 어휘·구조로 구현했는지 정의합니다. 폴더 배치의 기계 규칙은 [CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md), 옛 산출물에서 새 번들로의 이전은 [CONTRACT-MIGRATION.md](CONTRACT-MIGRATION.md)를 보세요.

## 이 저장소에서 contract란

AI agent 생태계에서 "contract"는 법률 계약서 하나가 아니라, **에이전트·도구·다른 에이전트·서비스 사이에서 "무엇을, 어떤 조건으로, 어느 한계 안에서, 어떤 결과물로 수행할지"를 명시한 실행 가능한(기계가 읽는) 약속**입니다. `plomus-contracts`는 그 약속을 JSON으로 관리하고, GitHub PR·CI로 추가·검증·배포합니다.

핵심 원칙은 "똑똑한 에이전트보다 선을 넘지 않는 에이전트"입니다. contract는 기술 문서이면서 동시에 사업 신뢰를 만드는 경계 장치입니다.

## contract role (계약 역할) — 최상위 분류 축

저장소의 최상위 폴더는 **계약의 역할(contract role)**입니다. 같은 출처 도메인(commerce·gameops 등)이라도 역할이 다르면 다른 role 폴더로 갈라집니다. 각 role은 하나의 dist 번들로 빌드됩니다.

| Role 폴더 | 의미 (essay 분류) | 담는 것 | dist 번들 |
|---|---|---|---|
| `tool/` | **Tool/API** — 도구·API·와이어 프로토콜 호출 규격 | skills(catalog·data-source·proxy·credential·upstream·package·mcp), protocol(endpoint·payload·sync-event·telegram), gameops adapter | `plomus-tool.json` |
| `agent/` | **Agent capability** — 에이전트가 무엇이고 무엇을 할 수 있나 | gameops agent·playbook·field + gameops 어휘 | `plomus-agent.json` |
| `task/` | **Task/delegation** — 어떤 일을 어떤 레시피·안전 프로파일로 위임 | commerce preset·workflow, distribution preset | `plomus-task.json` |
| `governance/` | **Behavioral/Governance** — 규칙·역할·라이프사이클·복구 | governance(role·approval·execution-lifecycle·model-routing), commerce review-rule, distribution experimental-rule | `plomus-governance.json` |
| `foundation/` | (역할 아님) **공유 어휘** — core enum·frontmatter·event·error code | commerce-base, distribution base·fields, platform 전부 | `plomus-foundation.json` |
| `benchmarks/` | (역할 아님) **측정층** — 실행 가능한 계약을 모델별로 측정 | model·metric·target·result·rollup | `plomus-benchmarks.json` |

`foundation`과 `benchmarks`는 essay의 7분류에 없는 축입니다. foundation은 모든 role이 참조하는 공유 어휘이고, benchmarks는 "에이전트가 계약을 얼마나 잘·싸게 수행하나"를 재는 실측 백본(essay #1 resource-bounded, #4 성공기준의 근거)입니다.

## essay 7분류 ↔ 이 저장소

| essay 분류 | 이 저장소 | 비고 |
|---|---|---|
| Tool / API | `tool/` | 강함 |
| Agent capability | `agent/` | gameops 중심 |
| Task / delegation | `task/` | 예산/토큰 한도는 없음 — benchmarks가 비용을 측정 |
| Behavioral / Governance | `governance/` | 최강점. Pre/Invariant/Policy/Recovery(rollback)가 lifecycle에 |
| **Payment / transaction** | **없음 (frontier gap)** | settlement·finance·claim은 *business unit*이지 결제 프로토콜이 아님 — governance review-rule로 존재. x402식 세션 예산·결제증명은 미구현 |
| Smart contract (on-chain) | **범위 밖** | 온체인 요소 없음 |
| **Legal** | **없음 (frontier gap)** | legal-policy는 *정책 룰*(governance)로 존재. 약관·개인정보처리방침 등 법적 *문서* 계약은 미구현 |

### Payment / Legal를 폴더로 두지 않은 이유

`settlement`·`finance`·`claim`·`legal-policy`는 **business unit**(운영 단위)이지 contract role이 아닙니다. 이들은 review-rule(행동 규칙)로서 `governance/`에 있습니다. 이를 `payment/`·`legal/`로 옮기면 (1) businessUnit 분할이 깨지고 (2) 행동 규칙을 결제/법무 계약으로 오분류하게 됩니다. 진짜 *기계 결제 프로토콜*(x402·HTTP 402·세션 예산·spending governance·결제증명)과 *법적 문서 계약*(ToS·개인정보처리방침·파트너 계약·환불 고지)은 아직 이 저장소에 없으며, 생기면 `payment/`·`legal/` role로 추가합니다.

## 보조 어휘

- **business unit (15)** — task·governance 계약을 운영 단위로 분할하는 *2차 축*(`product`·`order`·…·`system`). role 폴더 안에서 `<businessUnit>.json`으로 파일이 나뉩니다. [CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md).
- **category (15)** — skill 계약을 기능 분류로 나누는 2차 축(`commerce`·`finance`·…·`tooling`).
- **logical id (`<domain>-<contract>`)** — 각 계약 폴더는 출처를 드러내는 논리 id를 그대로 유지합니다(예: `governance/commerce-review-rules/`). validator·build는 이 논리 id로 읽으므로 폴더가 옮겨져도 본체는 바뀌지 않습니다.
- **member (dist)** — 한 role 번들은 여러 출처 도메인의 조각을 `members.<domain>` 아래 담습니다(예: `plomus-tool.json.members.skills`).
