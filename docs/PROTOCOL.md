# Protocol & Platform Contracts

`plomus-commerce-ai-os`(commerce 계약의 원천) 점검에서, import 도구가 추출하지 않던 표면을 두 도메인으로 계약화했습니다. 필드별 상세는 [contracts/protocol/v1/README.md](../contracts/protocol/v1/README.md), [contracts/platform/v1/README.md](../contracts/platform/v1/README.md).

## 점검 → 계약 매핑

| 코드 | 점검에서 발견 (위치) | 계약 |
|---|---|---|
| **P1** | desktop↔web HTTP API + sync event wire 스키마가 라우트/Zod에만 존재 (`apps/web/app/api/*`, `sync-event.schema.ts`) | `protocol/endpoints.json`, `protocol/sync-event.json` |
| **P5** | sync payload 객체별 필수 필드가 `sync-payload-router.ts`에만 | `protocol/payloads.json` |
| **P6** | 인바운드 Telegram 명령 분류가 `telegram-command.service.ts`에만 | `protocol/telegram.json` |
| **P2** | product/order/claim/settlement 상태·필수필드가 `domain.schema.ts`에만 (= 이전 distribution A2) | `platform/frontmatter.json` |
| **P3** | 객체별 이벤트 분류(`*_EVENT_TYPES`)가 core에만, 계약은 flat union만 | `platform/event-types.json` |
| **P4** | `PLOMUS_ERROR_CODES`(21)가 어디에도 계약 안 됨 | `platform/error-codes.json` |

## 왜 commerce 파일을 안 건드렸나

commerce 계약 4파일은 `import-from-commerce-ai-os`가 소유해 하드 편집은 재생성 시 유실됩니다. 또 parity는 일부 차원만 검사하지만(preset/rule/workflow/enum), 위 항목들은 검사하지 않으므로 별도 도메인 추가가 안전합니다. 두 도메인은 commerce 계약을 **읽기 전용 교차참조**해 무결성만 검증합니다(payload objectType·event type·document type·cloud command 정합).

## 승격 경로 (후속)

- `platform/frontmatter`의 도메인 객체 상태(P2/A2)는 commerce `core.statuses`로, `platform/event-types`(P3)는 commerce `core.eventTypesByObject`로 **승격 완료**(`import-from-commerce-ai-os`가 Zod enum / `*_EVENT_TYPES` 추출, 교차 도메인 검증으로 일치 강제).
- PLOMUS_DISTRIBUTION preset(A1)은 commerce 원천에 없어 **공개 commerce 승격 부적합**(승격 시 commerce 제품 parity 위반·import 재실행 시 유실) — distribution 도메인 유지가 정답.
- distribution 도메인의 `domain-statuses`(A2)는 `platform/frontmatter`로 통합하는 것이 정합적입니다.

## 산출물

`pnpm run build:protocol`→`dist/plomus-protocol.json`, `pnpm run build:platform`→`dist/plomus-platform.json`. import: `@plomus/contracts/protocol`, `@plomus/contracts/platform` (및 하위 경로).
