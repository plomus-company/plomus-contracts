# Platform Contracts (`platform-`)

`plomus-commerce-ai-os`가 정의하지만 commerce import 도구가 추출하지 않는 **공유 플랫폼 어휘**입니다 — 문서별 frontmatter 상태/필수필드, 객체별 이벤트 분류, error code 분류.

- `tools/import-platform.mjs`가 단일 진실원천, `scripts/validate-platform.mjs`가 검증.
- commerce 계약은 **읽기 전용 교차참조**(documentTypes·syncEventTypes)만 합니다.

| 파일 | 내용 |
|---|---|
| `base.json` | `lifecycleObjects`, `eventObjects`, `errorCategories` |
| `frontmatter.json` | 문서별 상태/필수필드(10) — product/order/claim/settlement(상태 enum 보유) + commerce_review·commerce_profile·workflow_profile·review_policy·approval_policy·document_profile(상태 없음, 필수필드만) |
| `event-types.json` | 객체별 이벤트 분류(6 그룹) — profile/commerceReview/aiRecommendation/changePlan/task/system |
| `error-codes.json` | error code(21) — `PLOMUS_ERROR_CODES` |

## 무엇을 메웠나 (점검 매핑)

- **P2/A2 frontmatter**: product/order/claim/settlement의 상태 enum·필수필드가 Zod(`domain.schema.ts`)에만 있던 것을 계약화. 이 도메인 객체 lifecycle 상태는 commerce `base.json`의 `core.statuses`로도 **승격**되어(canonical 등록), 교차 도메인 검증기가 platform과 commerce의 일치를 강제합니다. platform은 상태에 더해 필수필드·extra enum까지 담는 풍부한 문서 계약입니다.
- **P3 event-types**: flat `syncEventTypes`(36)만 있던 것을 **객체별 소유**로 구조화. 모든 그룹 이벤트의 합집합 = commerce `syncEventTypes`(검증기가 1:1 정합 강제). 이 분류는 commerce `core.eventTypesByObject`로도 **승격**되어 교차검증으로 일치를 강제합니다.
- **P4 error-codes**: 21개 코드를 8개 카테고리(config/document/validation/workflow/changePlan/patch/sync/task)로 분류.

## 검증 무결성

frontmatter documentType∈commerce documentTypes·필수필드에 type+local_id 포함·상태는 선택적(보유 시 비어있지 않고 고유, 보유 문서만 base.lifecycleObjects에 등재); event-group object∈base.eventObjects·이벤트 commerce 정합·그룹간 중복 금지·**commerce 전 이벤트가 정확히 한 그룹에 귀속**; error code 고유·category∈base.

## 승격 후보

`frontmatter`의 도메인 객체 상태(A2)는 commerce `core.statuses`로, `event-types`(P3)는 commerce `core.eventTypesByObject`로 **승격 완료**(import 도구가 Zod enum/`*_EVENT_TYPES`에서 추출, 교차검증으로 일치 강제). 이전 distribution `domain-statuses`도 `frontmatter`로 통합 완료. platform은 이제 commerce baseline과 일치하는 풍부한 뷰(필수필드·extra enum 포함)와 `error-codes`를 제공합니다.

## 갱신

```bash
pnpm run import:platform && pnpm run check:ci
```
