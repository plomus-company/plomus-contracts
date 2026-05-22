# Contract Glossary

이 문서는 `plomus-contracts`에서 **"contract"가 무엇을 뜻하는지**, 그리고 저장소가 그 개념을 어떤 어휘·구조로 구현했는지 정의합니다. 폴더 배치의 기계 규칙은 [CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md), 옛 산출물에서 새 번들로의 이전은 [CONTRACT-MIGRATION.md](CONTRACT-MIGRATION.md)를 보세요.

## 이 저장소에서 contract란

AI agent 생태계에서 "contract"는 법률 계약서 하나가 아니라, **에이전트·도구·다른 에이전트·서비스·결제 시스템 사이에서 "무엇을, 어떤 조건으로, 어느 한계 안에서, 어떤 결과물로 수행할지"를 명시한 실행 가능한(기계가 읽는) 약속**입니다. `plomus-contracts`는 그 약속을 JSON으로 관리하고, GitHub PR·CI로 추가·검증·배포합니다.

핵심 원칙은 "똑똑한 에이전트보다 선을 넘지 않는 에이전트"입니다. contract는 기술 문서이면서 동시에 사업 신뢰를 만드는 경계 장치입니다.

## contract role (계약 역할) — 최상위 분류 축

저장소의 최상위 폴더는 **계약의 역할(contract role)**입니다. 같은 출처 도메인(commerce·gameops 등)이라도 역할이 다르면 다른 role 폴더로 갈라집니다. 각 role은 하나의 dist 번들로 빌드됩니다. 아래 6개 role이 essay의 7분류를 (smart contract 제외) 모두 실현합니다.

| Role 폴더 | 의미 (essay 분류) | 담는 것 | dist 번들 |
|---|---|---|---|
| `tool/` | **Tool/API** — 도구·API·와이어 프로토콜 호출 규격 | skills(catalog·data-source·proxy·credential·upstream·package·mcp), protocol(endpoint·payload·sync-event·telegram), gameops adapter | `plomus-tool.json` |
| `agent/` | **Agent capability** — 에이전트가 무엇이고 무엇을 할 수 있나 | gameops agent·playbook·field + gameops 어휘 | `plomus-agent.json` |
| `task/` | **Task/delegation** — 어떤 일을 어떤 레시피·안전 프로파일로 위임 | commerce preset·workflow, distribution preset | `plomus-task.json` |
| `governance/` | **Behavioral/Governance** — 규칙·역할·라이프사이클·복구 | governance(role·approval·execution-lifecycle·model-routing), commerce review-rule, distribution experimental-rule | `plomus-governance.json` |
| `transaction/` | **Payment/Transaction** — 결제·정산·수수료·예산·결제증명 | spending budget(예산 한도·승인 게이트·결제증명), settlement(수수료·정산 주기·환불) | `plomus-transaction.json` |
| `legal/` | **Legal** — 법적 문서·약관·고지 | legal document(약관·개인정보·전자상거래 고지·파트너·환불), 전자상거래법 표시의무 disclosure | `plomus-legal.json` |
| `foundation/` | (역할 아님) **공유 어휘** — core enum·frontmatter·event·error code | commerce-base, distribution base·fields, platform 전부 | `plomus-foundation.json` |
| `benchmarks/` | (역할 아님) **측정층** — 실행 가능한 계약을 모델별로 측정 | model·metric·target·result·rollup | `plomus-benchmarks.json` |

`foundation`과 `benchmarks`는 essay의 7분류에 없는 축입니다. foundation은 모든 role이 참조하는 공유 어휘이고, benchmarks는 "에이전트가 계약을 얼마나 잘·싸게 수행하나"를 재는 실측 백본(essay #1 resource-bounded, #4 성공기준의 근거)입니다.

## essay 7분류 ↔ 이 저장소

| essay 분류 | 이 저장소 | 비고 |
|---|---|---|
| Tool / API | `tool/` | 강함 |
| Agent capability | `agent/` | gameops 중심 |
| Task / delegation | `task/` | 예산/토큰 한도는 `transaction/`이 보완; benchmarks가 비용을 측정 |
| Behavioral / Governance | `governance/` | Pre/Invariant/Policy/Recovery(rollback)가 lifecycle에 |
| Payment / transaction | `transaction/` | x402식 세션/일/월 예산·결제증명·승인 게이트(→governance) + 수수료·정산·환불. EXPERIMENTAL |
| Legal | `legal/` | 약관·개인정보·전자상거래 고지·파트너·환불 문서 + 전자상거래법 표시의무. DRAFT |
| Smart contract (on-chain) | **범위 밖** | 온체인 요소 없음. (`transaction`의 `X402`/`ONCHAIN_TX` proof로 경계만 접함) |

### transaction과 governance의 관계

`settlement`·`finance`·`claim`·`legal-policy`는 **business unit**(운영 단위)이고, 그 운영 *행동 규칙*은 `governance/`의 review-rule로 남습니다. `transaction/`은 그 위에 **기계 거래 규격**을 더합니다 — 예산 한도·결제 레일·결제증명·정산 주기·수수료율. 즉 governance는 "무엇을 하면 안 되나", transaction은 "얼마를·어떻게·어떤 증명으로 결제·정산하나"입니다. transaction 예산의 승인 게이트(`approvalPolicy`·`riskLevel`)는 governance를 읽기 전용 교차참조해 해소됩니다.

## 보조 어휘

- **business unit (15)** — task·governance·transaction·legal 계약을 운영 단위로 분할하는 *2차 축*(`product`·`order`·…·`system`). role 폴더 안에서 `<businessUnit>.json`으로 파일이 나뉩니다. [CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md).
- **category (15)** — skill 계약을 기능 분류로 나누는 2차 축(`commerce`·`finance`·…·`tooling`).
- **logical id (`<domain>-<contract>`)** — 각 계약 폴더는 출처를 드러내는 논리 id를 그대로 유지합니다(예: `governance/commerce-review-rules/`). validator·build는 이 논리 id로 읽으므로 폴더가 옮겨져도 본체는 바뀌지 않습니다.
- **member (dist)** — 한 role 번들은 여러 출처 도메인의 조각을 `members.<domain>` 아래 담습니다(예: `plomus-tool.json.members.skills`).
- **status** — `transaction`·`legal`은 현재 `EXPERIMENTAL`/`DRAFT`입니다. 구조는 검증되지만 값(수수료율·약관 문구)은 권위 있는 데이터가 아닌 scaffold이며, 제품 확정 시 `ACTIVE`로 승격합니다.
