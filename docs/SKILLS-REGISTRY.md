# Skills Contract Registry

`contracts/skills-`는 `k-skill` 스킬 생태계에서 추출한 공개 계약 도메인입니다. `k-skill` 저장소를 **데이터 출처로 참고**해서 새로 설계했으며, `k-skill`의 디렉토리 구조나 파편화된 분류를 그대로 복제하지 않습니다.

## 계약 파일

| 파일 | 내용 |
|---|---|
| `base.json` | 통제 어휘(enum): `categories`, `locales`, `lifecyclePhases`, `implementationTypes`, `authTypes`, `upstreams` |
| `catalog.json` | 스킬 카탈로그: `skillId`, `description`, `category`, `locale`, `phase`, `license`, `implementationType`, `package`, `usesProxy`, `proxyRoutes`, `requiredEnv` |
| `proxy-routes.json` | `k-skill-proxy` 라우트 allowlist: `routeId`, `path`, `method`, `upstream`, `credential`, `cacheable`, `skills` |
| `credentials.json` | API 키/세션 레지스트리: `envVar`, `upstream`, `credentialType`, `proxyManaged`, `aliases`, `usedBySkills` |
| `data-sources.json` | 스킬별 외부 의존: `skillId`, `authType`, `proxyBacked`, `upstreams` |

## 설계 결정

- **`implementationType`(패키징)와 `usesProxy`(직교 속성)를 분리합니다.** k-skill의 "프록시 경유"는 패키징 유형이 아니라 직교 속성입니다. 예) `cheap-gas-nearby`는 npm 패키지이면서 opinet 프록시 라우트를 사용합니다.
- **카테고리는 통제 어휘로 재설계했습니다.** k-skill의 37종 파편 카테고리를 15종으로 통합했습니다(`commerce`, `finance`, `real-estate`, `travel`, `mobility`, `legal`, `government`, `health`, `food`, `documents`, `writing`, `sports`, `media`, `utility`, `tooling`).
- **`requiredEnv`는 사용자 관점의 키만 담습니다.** 프록시가 서버에서 보관하는 키(`proxyManaged: true`)는 제외하고, 사용자가 직접 설정해야 하는 키만 기록합니다. 예) `korean-transit-route`는 kakao geocoding을 프록시로 호출하므로 `ODSAY_API_KEY`만 사용자 키로 남깁니다.

## 검증 무결성 (`scripts/validate-skills.mjs`)

- 모든 enum은 고유하고, 카탈로그의 `category`/`locale`/`phase`/`implementationType`은 `base.json` 어휘에 속해야 합니다.
- `usesProxy` ⟺ `proxy-routes`의 `skills` 매핑에 등장 (양방향 일치).
- `proxyRoutes` ⊆ 라우트 id, `requiredEnv` ⊆ credential envVar.
- **거버넌스 규칙**: 모든 프록시 라우트는 credential을 요구해야 합니다 (k-skill `AGENTS.md`의 "키가 필요한 upstream만 프록시 편입" 규칙을 기계 검증).
- 라우트의 `skills`/credential의 `usedBySkills`/data-source의 `skillId`는 모두 카탈로그에 존재해야 합니다.
- 모든 스킬은 정확히 하나의 data-source 항목을 가지며, 정의된 모든 카테고리는 최소 하나의 스킬이 사용해야 합니다.

## 갱신 절차

```bash
pnpm run import:k-skill   # ../k-skill을 읽어 5개 계약 파일 재생성 (K_SKILL_PATH로 경로 변경 가능)
pnpm run check:ci         # format → validate(commerce+skills) → summary → build → test
```

`tools/import-from-k-skill.mjs`가 단일 진실원천입니다. 카테고리 매핑·credential·proxy 라우트 표를 여기서 큐레이션하고, SKILL.md frontmatter(`description`/`license`/`locale`/`phase`)와 패키징 유형(파일시스템)을 자동 추출합니다. CI는 커밋된 JSON만 검증하므로 `k-skill`이 없어도 동작합니다.
