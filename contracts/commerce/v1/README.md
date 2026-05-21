# Commerce Contracts (`contracts/commerce/v1/`)

`plomus-commerce-ai-os`의 내부 registry에서 추출한 커머스 운영 계약입니다. 온보딩 preset, review rule, hermes workflow, core enum을 정의하며 `pnpm run import:commerce-ai-os`로 재생성하고 `scripts/validate.mjs`로 무결성을 검증합니다.

계약 4개 파일은 서로를 참조합니다. 참조 무결성은 모두 검증기가 강제합니다.

```
base.json (core enum/folder/document/approval) ──┐
review-rules.json (rule id ↔ domain ↔ status) ────┼─ presets.json (제품별 활성 조합)
workflows.json (workflow id ↔ rule ↔ folder) ─────┘
```

---

## base.json

전 계약이 참조하는 기준 enum과 정책의 단일 출처입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `schemaVersion` | string | 계약 스키마 버전 (`1.0.0`) |
| `source` / `sourceImportedAt` | string | 추출 원천과 시각 |
| `systemFolders` | string[] (13) | 시스템이 관리하는 폴더 (예: `90-system/hermes-commands`) |
| `documentTypes` | string[] (54) | 워크스페이스 문서 타입 (예: `product`, `settlement`, `legal_policy`) |
| `baseWorkflows` | string[] (2) | 모든 제품의 기본 workflow (`commerce-review`, `apply-change-plan`) |
| `approvalRequired` | string[] (7) | 승인이 필요한 변경 유형 (예: `PRICE_CHANGE`, `CONTRACT_CHANGE`) |
| `autoApplyAllowed` | string[] (2) | 자동 적용 허용 유형 (`APPEND_REVIEW_MEMO`, `CLEANUP_DONE_TASK`) |
| `watchFolders` | string[] (29) | 변경 감시 대상 폴더 |
| `core` | object (27 keys) | core enum 묶음 — 아래 참조 |

### core 주요 그룹

- **분류 enum**: `commercePresetIds`, `commerceTypes`, `salesChannels`, `productTypes`, `operationModes`, `commerceDomains`
- **rule/workflow 색인**: `reviewRuleIds`(현행 37), `legacyReviewRuleIds`(과거 43), `hermesWorkflows`(21), `mvpHermesWorkflows`(2), `approvalRuleIds`(9)
- **객체/문서 모델**: `objectTypes`, `markdownObjectTypes`, `frontmatterTypes`, `syncPayloadObjectTypes`
- **동작 enum**: `cloudCommandTypes`, `onboardingSteps`, `syncOperations`, `syncEventTypes`(flat 36), `eventTypesByObject`(객체별 6그룹, `platform/event-types`와 일치 가드), `taskActionTypes`, `changePlanTypes`, `patchModes`, `priorities`, `riskLevels`, `sourceOfTruthValues`
- **`statuses`** (13 그룹): 시스템 객체 9종(`commerceReview`, `aiRecommendation`, `changePlan`, `task`, `sync`, `syncEvent`, `cloudCommand`, `hermesCommand`, `onboarding`) + **도메인 객체 4종(`product`, `order`, `claim`, `settlement`)의 lifecycle 상태**. 도메인 객체 상태는 `platform/frontmatter`와 동일하며 교차 도메인 검증기가 일치를 강제합니다.

검증기는 `core.reviewRuleIds`/`core.hermesWorkflows`/`core.commercePresetIds`가 각 registry와 **양방향으로 일치**하는지(누락·잔재 모두) 확인합니다.

---

## presets.json

제품(배포 주체)별로 활성화할 계약 조합입니다. 현재 8종: `PLOMUS_MIXED`, `ONLINE_COMMERCE`, `CONSIGNMENT_SALES`, `INVENTORY_BASED_SALES`, `APP_DISTRIBUTION`, `SI_BUSINESS`, `BROKERAGE`, `GENERAL_COMPANY`.

| 필드 | 타입 | 설명 |
|---|---|---|
| `presetId` | string | 고유 id (대문자 snake case). `core.commercePresetIds`에 존재해야 함 |
| `label` / `description` | string | 표시명과 설명 |
| `commerceTypes` / `salesChannels` / `productTypes` / `operationMode` | enum | 비즈니스 형태 (`core`의 해당 enum 값) |
| `enabledDomains` | string[] | 활성 운영 도메인 (`core.commerceDomains`) |
| `enabledRules` | string[] | 활성 review rule. **모두 `review-rules.json`에 존재해야 함** |
| `highPriorityRules` | string[] | 우선순위 rule. **`enabledRules`의 부분집합이어야 함** |
| `enabledFolders` | string[] | 활성 폴더. base `systemFolders`를 모두 포함해야 하며 알려진 폴더만 허용 |
| `enabledDocumentTypes` | string[] | 활성 문서 타입 (`documentTypes` ∪ `core.markdownObjectTypes`) |
| `enabledWorkflows` | string[] | 활성 workflow. **모두 `workflows.json`에 존재해야 함** |
| `requireApprovalFor` / `autoApplyAllowed` | string[] | 승인/자동적용 정책. `core.approvalRuleIds`의 값 |

---

## review-rules.json

운영 점검 rule의 마스터 목록입니다. 현재 37종.

| 필드 | 타입 | 설명 |
|---|---|---|
| `ruleId` | string | 고유 id (대문자 snake case). 예: `SETTLEMENT_MISMATCH` |
| `domain` | string | 소속 도메인. 예: `SETTLEMENT`, `HR`, `APP_DISTRIBUTION` |
| `status` | enum | `ACTIVE` / `EXPERIMENTAL` / `DEPRECATED` / `REMOVED` (자세히는 [CONTRACT-LIFECYCLE.md](../../docs/CONTRACT-LIFECYCLE.md)) |

`ruleId`는 preset의 `enabledRules`와 workflow의 `enabledRuleIds`가 참조하는 기준입니다.

---

## workflows.json

hermes 검토/적용 workflow 정의입니다. 현재 21종.

| 필드 | 타입 | 설명 |
|---|---|---|
| `workflowId` | string | 고유 id (소문자 kebab case). 예: `settlement-check` |
| `label` | string | 표시명 |
| `reviewScope` | string | 검토 범위 (예: `WORKSPACE`, `SETTLEMENT`) |
| `reviewType` | enum | `WORKFLOW`(도메인 검토) / `FULL`(전체 검토) / `APPLY`(변경 적용) |
| `targetFolders` | string[] | 검토 대상 폴더. 알려진 폴더만 허용 (FULL 등 일부는 생략) |
| `enabledRuleIds` | string[] | 적용 rule. **모두 `review-rules.json`에 존재해야 함** |
| `safety` | object | 안전 프로파일 — 아래 |

### safety 프로파일 (필수)

| 키 | 값 |
|---|---|
| `executionClass` | `READ_ONLY` / `LOCAL_WRITE` / `LOCAL_APPLY` / `REMOTE_SYNC` / `EXTERNAL_TOKEN` |
| `riskLevel` | `LOW` / `MEDIUM` / `HIGH` |
| `externalAccess` | `NONE` / `NETWORK` / `TOKEN` |
| `requiresApprovalBeforeApply` | boolean |
| `sideEffects` | string[] (비어 있을 수 없음) |
| `notes` | string |

검토 workflow는 로컬 산출물·변경 계획만 생성하고, 대상 파일 반영은 승인된 `apply-change-plan`에서만 수행합니다 (`LOCAL_APPLY`).
