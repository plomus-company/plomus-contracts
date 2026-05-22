# Contract Glossary

이 문서는 `plomus-contracts`에서 **"contract"가 무엇을 뜻하는지**, 그리고 저장소가 그 개념을 어떤 어휘·구조로 구현했는지 정의합니다. 폴더 배치의 기계 규칙은 [CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md), 옛 산출물에서 새 번들로의 이전은 [CONTRACT-MIGRATION.md](CONTRACT-MIGRATION.md)를 보세요.

## 이 저장소에서 contract란

AI agent 생태계에서 "contract"는 법률 계약서 하나가 아니라, **에이전트·도구·다른 에이전트·서비스·결제 시스템 사이에서 "무엇을, 어떤 조건으로, 어느 한계 안에서, 어떤 결과물로 수행할지"를 명시한 실행 가능한(기계가 읽는) 약속**입니다. `plomus-contracts`는 그 약속을 JSON으로 관리하고, GitHub PR·CI로 추가·검증·배포합니다.

핵심 원칙은 "똑똑한 에이전트보다 선을 넘지 않는 에이전트"입니다. contract는 기술 문서이면서 동시에 사업 신뢰를 만드는 경계 장치입니다.

## 개념 지도 (ASCII)

### 1. "contract"의 분해 — 무엇으로 나뉘나

```
                     ┌───────────────────────────────────────┐
                     │               "contract"              │
                     │     기계가 읽는, 실행 가능한 약속      │
                     │   에이전트·도구·서비스·결제의 경계     │
                     └────────────────────┬──────────────────┘
                                          │
            ┌──────────────────────────────┴───────────────────────┐
            ▼                                                        ▼
   contract role — essay 7분류를 폴더로 실현                 지원 축 (role 아님)
   ┌────────────┬─────────────┬──────────────┐               ┌──────────────────┐
   │ tool       │ task        │ transaction ⚗│               │ foundation       │
   │ Tool / API │ Task/위임    │ Payment      │               │ 공유 어휘(enum…) │
   ├────────────┼─────────────┼──────────────┤               ├──────────────────┤
   │ agent      │ governance  │ legal      ⚗ │               │ benchmarks       │
   │ Agent 능력 │ Behavioral  │ Legal        │               │ 측정층(성능·비용)│
   └────────────┴─────────────┴──────────────┘               └──────────────────┘
   ⚗ = EXPERIMENTAL/DRAFT (구조는 검증, 값은 scaffold)
   범위 밖: Smart contract (온체인) — transaction proof로 경계만 접함
```

### 2. 출처 도메인 → role 번들 (한 도메인이 여러 번들에 걸침)

```
  출처 도메인            조각                          contract role 번들 (dist)
  ──────────            ────                          ─────────────────────────
  skills    ────────────────────────────────────▶    tool         plomus-tool.json
  protocol  ────────────────────────────────────▶    tool          .members.protocol
  gameops ──┬─ adapters ─────────────────────────▶    tool          .members.gameopsAdapters
            └─ agents·playbooks·fields ──────────▶    agent        plomus-agent.json
  commerce ─┬─ presets·workflows ────────────────▶    task         plomus-task.json
            ├─ review-rules ─────────────────────▶    governance   plomus-governance.json
            └─ base (core enum) ─────────────────▶    foundation   plomus-foundation.json
  distribution ─┬─ presets ──────────────────────▶    task
                ├─ experimental-rules ───────────▶    governance
                └─ base·fields ──────────────────▶    foundation
  platform  ────────────────────────────────────▶    foundation    .members.platform
  transaction ──────────────────────────────────▶    transaction  plomus-transaction.json
  legal     ────────────────────────────────────▶    legal        plomus-legal.json
  benchmarks ───────────────────────────────────▶    benchmarks   plomus-benchmarks.json
```

### 3. role 의존 그래프 (모두 읽기 전용 교차참조)

```
   모든 role ───────────▶ foundation        (공유 어휘 참조)
   task ────────────────▶ governance        (preset이 rule·workflow 참조)
   agent ───────────────▶ governance        (playbook risk·approval 해소)
   transaction ─────────▶ governance        (예산 승인 게이트·riskLevel 해소)
   governance ──────────▶ benchmarks        (risk→model status 해소)
   benchmarks ──────────▶ tool · task       (skill·workflow를 측정 대상으로)
```

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

## 사용 예시 (usage)

### 소비자 import 패턴

기본 형태는 항상 `@plomus/contracts/<role>` → `.members.<domain>.contracts.<collection>` 입니다.

```js
import index from "@plomus/contracts";         // 매니페스트(role 의존 그래프)
import tool from "@plomus/contracts/tool";      // role 번들
const skills = tool.members.skills.contracts.skills;       // member.<domain>.contracts.<x>
const enums  = tool.members.skills.enums.categories;       // 도메인 enum
```

옛 도메인 export에서의 이전은 [CONTRACT-MIGRATION.md](CONTRACT-MIGRATION.md).

### role별 계약 항목 예시 (실제 항목 발췌)

**tool** — 도구를 *어떻게 호출하나* · `@plomus/contracts/tool` → `.members.skills.contracts.skills[]`

```jsonc
// tool/skills-catalog/commerce.json
{ "skillId": "daangn-cars-search", "category": "commerce", "subcategory": "automotive",
  "locale": "ko-KR", "phase": "v1", "license": "MIT" }
```

**agent** — 에이전트가 *무엇을 할 수 있나* · `.../agent` → `.members.gameops.contracts.playbooks[]`

```jsonc
// agent/gameops-playbooks/payment-missing-response-v1.json
{ "playbookId": "payment-missing-response-v1", "riskLevel": "high", "requiresApproval": true,
  "steps": [ { "approvalPolicy": "operation_pm" /* → governance */ } ] }
```

**task** — *어떤 일을 어떤 안전 프로파일로* · `.../task` → `.members.commerce.contracts.workflows[]`

```jsonc
// task/commerce-workflows/order.json
{ "workflowId": "order-delay-review", "reviewScope": "ORDER_DELAY", "businessUnit": "order",
  "enabledRuleIds": ["ORDER_SHIPPING_DELAY"],
  "safety": { "executionClass": "LOCAL_WRITE", "riskLevel": "MEDIUM",
              "externalAccess": "NONE", "requiresApprovalBeforeApply": true, "sideEffects": ["..."] } }
```

**governance** — *지켜야 할 규칙·승인* · `.../governance` → `.members.commerce.contracts.reviewRules[]`, `.members.governance.contracts.approval`

```jsonc
// governance/commerce-review-rules/order.json
{ "ruleId": "ORDER_SHIPPING_DELAY", "domain": "ORDER", "status": "ACTIVE",
  "severity": "HIGH", "businessUnit": "order" }
// governance/governance-approval/approval.json  (다자승인 정책)
{ "policy": "admin_multi", "requiredApprovals": 2, "allowedChannels": ["WEB", "TELEGRAM"] }
```

**transaction** — *얼마를·어떻게·어떤 증명으로* · `.../transaction` → `.members.transaction.contracts.{budgets,settlements}[]`

```jsonc
// transaction/transaction-budgets/session.json   (x402식 세션 예산)
{ "budgetId": "agent-session-default", "scope": "SESSION", "currency": "KRW", "limit": 100000,
  "approvalPolicy": "single" /* → governance */, "riskLevel": "low",
  "requiresProof": true, "proofType": "PLATFORM_LEDGER_ENTRY", "onFailure": "ROLLBACK",
  "status": "EXPERIMENTAL" }
// transaction/transaction-settlement/settlement.json   (수수료·정산)
{ "settlementId": "marketplace-sale-commission", "businessUnit": "settlement",
  "commissionRateBps": 500, "cycle": "MONTHLY_CLOSE", "payoutRail": "BANK_TRANSFER" }
```

**legal** — *어떤 문서를 제시·준수* · `.../legal` → `.members.legal.contracts.{documents,disclosures}[]`

```jsonc
// legal/legal-documents/ecommerce-disclosure.json
{ "documentId": "ecommerce-seller-disclosure", "documentType": "ECOMMERCE_DISCLOSURE",
  "audience": "CONSUMER", "requiredConsent": "REQUIRED",
  "governsBusinessUnits": ["legal-policy", "order"], "status": "DRAFT" }
// legal/legal-disclosures/legal-policy.json   (전자상거래법 표시의무)
{ "disclosureId": "seller-identity", "businessUnit": "legal-policy",
  "documentType": "ECOMMERCE_DISCLOSURE", "field": "상호·대표자·사업자등록번호·통신판매업 신고번호",
  "legalBasis": "전자상거래법 제13조 제1항" }
```

### 보조 어휘가 실제로 어떻게 쓰이나

- **business unit** — `governance/commerce-review-rules/order.json`의 모든 항목은 `businessUnit: "order"`(파일 stem과 일치, validator가 강제).
- **category** — `tool/skills-catalog/commerce.json`의 모든 skill은 `category: "commerce"`.
- **logical id** — 폴더 `governance/commerce-review-rules/`의 논리 id는 `commerce-review-rules`(출처=commerce). `transaction/`로 옮겨도 validator는 이 id로 읽음.
- **member** — `plomus-governance.json`에 commerce·distribution·governance가 `members`로 함께 들어감(한 번들 = 여러 도메인).
- **cross-ref** — transaction budget의 `approvalPolicy: "single"`은 governance `approvalPolicies`에 존재해야 통과(`validate:transaction`).

### 개념이 맞물리는 예: 에이전트가 결제 한 건을 수행할 때

한 작업이 여러 role을 차례로 거칩니다 — "선을 넘지 않는 에이전트"가 이렇게 구현됩니다.

```
 사용자: "이 상품 결제해줘"
   │
   ├─ tool        결제 API 호출 규격 (인자·auth·에러)
   ├─ governance  "승인 전 결제 금지" review-rule + 실행 lifecycle(dry-run→approve→execute→verify→rollback)
   ├─ transaction 세션 예산 한도 확인(agent-session-default) → 초과 시 onFailure=ROLLBACK, 결제증명 요구
   ├─ legal       환불 정책·전자상거래 고지 제시 (청약철회·반품 비용)
   └─ benchmarks  이 워크플로의 비용·성공률을 모델별로 측정
```
