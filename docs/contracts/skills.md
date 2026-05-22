# Skills Contracts (`skills-`)

`k-skill` 스킬 생태계를 **데이터 출처로 참고**해 새로 설계한 계약 도메인입니다. `tools/import-from-k-skill.mjs`가 단일 진실원천이며(카테고리 매핑·credential·proxy 라우트 표를 큐레이션하고 SKILL.md를 자동 추출), `scripts/validate-skills.mjs`가 무결성을 검증합니다.

계약 5개 파일은 서로를 참조합니다.

```
base.json (통제 어휘: category/locale/phase/implType/authType/upstream)
   ▲            ▲                 ▲
catalog.json ── proxy-routes.json ── credentials.json
   │  (skillId)      (routeId·credential)   (envVar·upstream)
   └──────────── data-sources.json (skillId·upstream)
```

현재 규모: **스킬 86 · 프록시 라우트 41 · credential 20 · 카테고리 15(원시 subcategory 37) · upstream 18 · npm 패키지 22 · MCP 11스킬**.

### 세분화 파일

| 파일 | 내용 |
|---|---|
| `categories.json` | canonical 카테고리(15) → 원시 subcategory(37) 그룹핑 |
| `upstreams.json` | upstream 레지스트리(18) — baseUrl·credential·requiresKey·proxyManaged |
| `packages.json` | npm 패키지(22) — skillId↔packageName |
| `mcp.json` | MCP 명명 서버(4: korean-law/korea-stock/real-estate/coupang) + usesMcp 스킬(11) |
| `proxy.json` | k-skill-proxy 설정 — host/port/cacheTtl/rateLimit + upstream base URL |

catalog의 각 스킬에는 `subcategory`(원시 카테고리)와 `usesMcp`가 추가됩니다(검증기가 `subcategory ∈ categories.json` 강제).

---

## skill 소비 경로 (who uses a skill)

skill을 **계약으로 직접 참조**하는 곳은 두 군데입니다 — 같은 tool role 내부 배선과, 교차 role인 benchmarks. 그 외(commerce preset·workflow·review-rule, transaction, legal, foundation)는 skill을 직접 참조하지 않습니다. skills는 독립 capability 레지스트리이기 때문입니다.

```
                       category / subcategory   (분류 축)
                               │
   data-source ──(1:1)──▶ ┌──────────────┐ ◀──(N:1)── package
   {skillId, authType,    │    skill     │           {skillId, packageName, dir}
    proxyBacked,          │  (catalog,    │
    upstreams}            │   skillId)    │
   proxy-route ──(N:M)───▶│ usesProxy ⇄   │
   {routeId, path,        │  route.skills │
    upstream, credential, └──────┬───────┘
    skills:[...]}                │
        │                        ▼
        ▼            benchmarks target {targetId:"skill:<id>", kind:"skill",
   credential ─▶ upstream                domain:"skills", ref:"<skillId>"}
   {envVar}                              │
                                         ▼
                              benchmarks result (target × model × metric)
```

### A. 같은 tool role 내부 — "이 도구를 실제로 어떻게 호출하나"

skill이 허브이고 나머지 파일이 이를 가리킵니다(호출 사슬 = `skill → data-source / proxy-route → credential → upstream`):

- **data-source** (스킬당 정확히 1개): `skillId → upstreams · authType · proxyBacked`.
- **proxy-route**: `route.skills[]`가 소비 스킬을 나열하고, **`catalog.usesProxy` ↔ `route.skills` 양방향 일치를 `validate:skills`가 강제**. 라우트는 `credential` · `upstream`을 가리킴.
- **credential → upstream**: 실제 키·외부 엔드포인트. 스킬의 `requiredEnv`는 `credentials.envVar`에 존재해야 함.
- **package**: `package.skillId`로 스킬을 배포 단위로 묶음.

### B. 교차 role — benchmarks가 skill을 "측정 대상"으로 참조 (유일한 cross-role 계약 참조)

각 스킬은 benchmark **target**이 됩니다 — `{ targetId: "skill:<skillId>", kind: "skill", domain: "skills", ref: "<skillId>" }`. `validate:benchmarks`가 **`target.ref`가 실제 `skills-catalog`의 `skillId`인지** 검사하고(`kind:skill`은 `domain:"skills"` 강제), 그 target에 **result**(모델 × 지표)가 붙어 스킬별 비용·성능·성공률을 모델 비교합니다. 상세는 [benchmarks.md](benchmarks.md).

### C. 런타임 소비 (계약 참조는 아님)

- **gameops**: 제품의 `sync-contracts.mjs`가 `contracts/tool/skills-catalog`를 vendor하고 `PINNED.json`으로 고정해 소비합니다([GAMEOPS.md](../GAMEOPS.md)). repo 안 계약끼리의 참조는 아닙니다.
- **에이전트**: `@plomus/contracts/tool` 번들의 `.members.skills`를 읽어 어떤 스킬을 어떤 인자·auth로 호출할지 결정합니다.

연관관계 일반론은 [CONTRACT-GLOSSARY.md](../CONTRACT-GLOSSARY.md)의 "용어 연관관계"(관계 #3 benchmarks target → skill, #4 호출 사슬)를 보세요.

---

## base.json

전 계약이 참조하는 통제 어휘(enum)입니다. k-skill의 파편화된 분류를 정규화한 결과입니다.

| 필드 | 개수 | 설명 |
|---|---|---|
| `categories` | 15 | 스킬 분류. k-skill의 raw 37종을 통합: `commerce`, `finance`, `real-estate`, `travel`, `mobility`, `legal`, `government`, `health`, `food`, `documents`, `writing`, `sports`, `media`, `utility`, `tooling` |
| `locales` | 1 | 대상 로케일 (`ko-KR`) |
| `lifecyclePhases` | 3 | 성숙도 단계 (`v1`, `v1.5`, `v2`) |
| `implementationTypes` | 3 | 패키징 유형 (`npm-package`, `python-script`, `skill-md-only`) |
| `authTypes` | 3 | 사용자 관점 인증 방식 (`none`, `api-key`, `session`) |
| `upstreams` | 18 | 외부 데이터 제공자 (예: `data-go-kr`, `kakao`, `krx`, `naver`, `kosis`) |

검증기는 카탈로그/라우트/credential/data-source의 모든 enum 참조가 이 어휘에 속하는지, 그리고 정의된 모든 카테고리가 최소 하나의 스킬에 쓰이는지 확인합니다.

---

## catalog.json

스킬 카탈로그입니다 (`skills[]`, 현재 86개).

| 필드 | 타입 | 설명 |
|---|---|---|
| `skillId` | string | 고유 id = k-skill 디렉토리명 (소문자 kebab case) |
| `description` | string | SKILL.md frontmatter에서 추출한 한 줄 설명 |
| `category` | enum | `base.categories` 값 |
| `locale` | enum | `base.locales` 값 |
| `phase` | enum | `base.lifecyclePhases` 값 |
| `license` | string | SPDX 라이선스 (대부분 `MIT`) |
| `implementationType` | enum | **패키징 방식** (사용자가 실행하는 형태) |
| `package` | string\|null | npm 유형이면 `packages/<id>`, 아니면 `null` |
| `usesProxy` | boolean | `k-skill-proxy` 경유 여부. **`proxy-routes`의 `skills` 매핑과 양방향 일치해야 함** |
| `proxyRoutes` | string[] | 이 스킬이 쓰는 라우트 id 목록 (`proxy-routes.json` 참조) |
| `requiredEnv` | string[] | **사용자가 직접 설정해야 하는** credential. 프록시 보관 키(`proxyManaged`)는 제외 (`credentials.json` 참조) |

> **설계 포인트**: `implementationType`(패키징)과 `usesProxy`(직교 속성)는 분리됩니다. 예) `cheap-gas-nearby`는 `npm-package`이면서 opinet 프록시 라우트를 사용하고, `korean-transit-route`는 `skill-md-only`이면서 kakao는 프록시·odsay는 직접 호출합니다. 현재 분포: npm 22 / python 31 / md-only 33, proxy 사용 22.

---

## proxy-routes.json

`k-skill-proxy`가 노출하는 데이터 라우트 allowlist입니다 (`routes[]`, 현재 41개. `/health`와 AirKorea generic passthrough는 제외).

| 필드 | 타입 | 설명 |
|---|---|---|
| `routeId` | string | 고유 라우트 id (예: `kosis-search`) |
| `path` | string | HTTP 경로 (예: `/v1/kosis/search`, `/v1/real-estate/:assetType/:dealType`) |
| `method` | enum | `GET` 또는 `POST` (`nts-business-*`만 POST) |
| `upstream` | enum | 중계 대상 제공자 (`base.upstreams`) |
| `credential` | string | 이 라우트가 요구하는 키 (`credentials.json`의 `envVar`). **반드시 존재해야 함** |
| `cacheable` | boolean | 응답 캐시 여부 |
| `skills` | string[] | 이 라우트를 소비하는 스킬 (`catalog.json`). 비어 있을 수 없음 |

> **거버넌스 규칙**: k-skill `AGENTS.md`의 "키가 필요한 upstream만 프록시 편입" 원칙을 검증기가 강제합니다 — `credential` 없는 라우트는 검증 실패. 라우트의 `skills`는 모두 `usesProxy: true`인 카탈로그 스킬이어야 합니다.

---

## credentials.json

API 키·세션 credential 레지스트리입니다 (`credentials[]`, 현재 20개 = 프록시 보관 15 + 사용자측 5).

| 필드 | 타입 | 설명 |
|---|---|---|
| `envVar` | string | 환경변수 이름 (예: `DATA_GO_KR_API_KEY`) |
| `upstream` | enum | 소속 제공자 (`base.upstreams`) |
| `credentialType` | enum | `api-key` 또는 `session` (`BLUE_RIBBON_SESSION_ID`만 session) |
| `proxyManaged` | boolean | `true`면 `k-skill-proxy`가 서버에서 보관 → 사용자 설정 불필요 |
| `aliases` | string[] | 동등 환경변수 이름 (예: `KOSIS_API_KEY` ↔ `KSKILL_KOSIS_API_KEY`) |
| `usedBySkills` | string[] | 이 키를 사용하는 스킬 (`catalog.json`) |

`envVar`와 `aliases`는 레지스트리 전체에서 충돌 없이 고유해야 합니다. 사용자측(`proxyManaged: false`) 5종: `API_K_DART`, `KIPRIS_PLUS_API_KEY`, `ODSAY_API_KEY`, `LOLESPORTS_API_KEY`, `KSKILL_KSTARTUP_API_KEY`.

---

## data-sources.json

스킬별 외부 의존 요약입니다 (`sources[]`, 카탈로그와 1:1 — 모든 스킬이 정확히 하나의 항목).

| 필드 | 타입 | 설명 |
|---|---|---|
| `skillId` | string | `catalog.json` 참조 |
| `authType` | enum | 사용자 관점 인증 방식. `requiredEnv`가 있으면 `api-key`, 없으면 `none` |
| `proxyBacked` | boolean | `catalog.usesProxy`와 일치 |
| `upstreams` | string[] | 의존하는 제공자 (프록시 라우트 upstream ∪ 사용자 키 upstream). 공개 엔드포인트만 쓰는 스킬은 빈 배열 |
