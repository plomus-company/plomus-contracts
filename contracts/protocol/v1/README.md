# Protocol Contracts (`contracts/protocol/v1/`)

`plomus-commerce-ai-os` 점검에서 도출한 **desktop↔web 통합(wire) 계약**입니다. commerce import 도구가 추출하지 않는 HTTP sync/approval API, sync event wire 스키마, sync payload 객체 레지스트리, 인바운드 Telegram 명령 분류를 담습니다.

- `tools/import-protocol.mjs`가 단일 진실원천, `scripts/validate-protocol.mjs`가 검증.
- commerce 계약(`contracts/v1/`)은 **읽기 전용 교차참조**(syncPayloadObjectTypes·cloudCommandTypes)만 합니다.

| 파일 | 내용 |
|---|---|
| `base.json` | `protocolVersion`(2.0), `eventSources`(LOCAL/CLOUD/TELEGRAM/SYSTEM), `httpMethods`, `telegramCommandKinds`, `telegramCommandStatuses` |
| `endpoints.json` | HTTP API 표면(7) — path·method·kind·transport |
| `sync-event.json` | sync event wire 스키마(13 필드) — `syncEventApiBodySchema` 기반 |
| `payloads.json` | sync payload 객체타입(9) — local_id 접두·필수 필드 |
| `telegram.json` | 인바운드 Telegram 명령(4) — kind·verbs·cloud command 매핑 |

## 핵심

- **별도 프로토콜 버전**: sync event의 `schema_version`(현재 `"2.0"`)은 계약 schemaVersion과 별개의 wire 버전입니다.
- **endpoints**(method 확인됨): `POST /api/sync/events`, `GET /api/sync/pull`, `GET /api/sync/commands/stream`(SSE), `POST /api/change-plans/:id/approve|reject`, `GET /api/settings/profile`, `GET /api/health`.
- **source enum**에 `TELEGRAM`이 포함돼 `sourceOfTruthValues`와 다릅니다.
- **telegram 명령**의 `mapsToCloudCommand`는 commerce `cloudCommandTypes`에 존재해야 검증 통과(run_workflow→RUN_WORKFLOW, apply_change_plan→APPLY_CHANGE_PLAN).

## 검증 무결성

endpoint method∈httpMethods·kind/transport 유효·(method,path) 고유; sync-event 필드 type 유효·enum 필드는 base enum 참조; payload objectType∈commerce syncPayloadObjectTypes·local_id 필수; telegram kind∈base·mapsToCloudCommand∈commerce cloudCommandTypes.

## 갱신

```bash
pnpm run import:protocol && pnpm run check:ci
```
