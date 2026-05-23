# Contract-Type Re-layout: Consumer Migration

저장소를 출처 도메인 축에서 **contract role 축**(tool/agent/task/governance/foundation)으로 재배치하면서, dist 산출물과 `@plomus/contracts/*` export가 **변경(breaking)**되었습니다. 개념·구조는 [CONTRACT-GLOSSARY.md](CONTRACT-GLOSSARY.md)를 보세요. 이 문서는 소비자(예: `plomus-commerce-ai-os`)가 import를 옮기는 방법입니다.

## export 변경

| 옛 export | 새 export | 비고 |
|---|---|---|
| `@plomus/contracts` (commerce) | — (분할됨, 아래 표) | 단일 commerce 번들은 사라짐 |
| `@plomus/contracts/index` | `@plomus/contracts` 또는 `/index` | 기본 export가 이제 매니페스트 |
| `@plomus/contracts/skills` | `@plomus/contracts/tool` | `.members.skills` |
| `@plomus/contracts/protocol` | `@plomus/contracts/tool` | `.members.protocol` |
| `@plomus/contracts/gameops` | `@plomus/contracts/tool` + `/agent` | adapter는 tool, agent/playbook은 agent |
| `@plomus/contracts/platform` | `@plomus/contracts/foundation` | `.members.platform` |
| `@plomus/contracts/governance` | `@plomus/contracts/governance` | `.members.governance` |
| `@plomus/contracts/distribution` | `/task` + `/governance` + `/foundation` | preset/규칙/어휘로 분할 |
| `@plomus/contracts/benchmarks` | `@plomus/contracts/benchmarks` | **변경 없음** |
| — (신규) | `@plomus/contracts/transaction` | 신규 role(EXPERIMENTAL). 이전할 옛 export 없음 |
| — (신규) | `@plomus/contracts/legal` | 신규 role(DRAFT). 이전할 옛 export 없음 |

## 필드 경로 매핑

각 role 번들은 `members.<domain>` 아래에 출처 도메인 조각을 담습니다.

| 옛 위치 | 새 위치 |
|---|---|
| `plomus-contracts.json` `.contracts.base` | `plomus-foundation.json` `.members.commerce.contracts.base` |
| `plomus-contracts.json` `.contracts.presets` | `plomus-task.json` `.members.commerce.contracts.presets` |
| `plomus-contracts.json` `.contracts.workflows` | `plomus-task.json` `.members.commerce.contracts.workflows` |
| `plomus-contracts.json` `.contracts.reviewRules` | `plomus-governance.json` `.members.commerce.contracts.reviewRules` |
| `plomus-skills.json` `.{enums,contracts}` | `plomus-tool.json` `.members.skills.{enums,contracts}` |
| `plomus-protocol.json` `.{...}` | `plomus-tool.json` `.members.protocol.{...}` |
| `plomus-gameops.json` `.contracts.adapters` | `plomus-tool.json` `.members.gameopsAdapters.contracts.adapters` |
| `plomus-gameops.json` `.contracts.{agents,playbooks,fields}` + enums | `plomus-agent.json` `.members.gameops.{enums,contracts}` |
| `plomus-platform.json` `.{...}` | `plomus-foundation.json` `.members.platform.{...}` |
| `plomus-distribution.json` `.contracts.presets` | `plomus-task.json` `.members.distribution.contracts.presets` |
| `plomus-distribution.json` `.contracts.experimentalRules` | `plomus-governance.json` `.members.distribution.contracts.experimentalRules` |
| `plomus-distribution.json` `.{enums,contracts.fields}` | `plomus-foundation.json` `.members.distribution.{enums,contracts.fields}` |
| `plomus-governance.json` `.{enums,contracts}` | `plomus-governance.json` `.members.governance.{enums,contracts}` |
| `plomus-benchmarks.json` | `plomus-benchmarks.json` (동일) |

## 절차

1. 제품 저장소에서 `@plomus/contracts/<old>` import를 위 표대로 교체합니다.
2. 접근자를 `.members.<domain>.…`로 한 단계 내립니다.
3. `pnpm check:contracts`로 core enum parity를 재확인합니다(내부 enum/registry는 그대로이고, 읽는 경로만 바뀝니다).
4. release tag 또는 commit SHA로 새 버전을 고정합니다.

내부 contract 데이터(skill·rule·workflow·target 등)는 **내용이 동일**합니다 — 옮긴 것은 폴더·번들의 *모양*뿐입니다.

## 안정 소비 경로 (consumer interface)

`../plomus-{gameops,distribution,commerce}-ai-os`가 vendoring/sync에 핀하는 deep 번들 경로는 **안정 인터페이스**로 취급되며, `tests/package-consumption.test.mjs`가 존재를 강제합니다(member key를 바꾸면 CI에서 차단). 핀 가능한 경로:

| 번들 | 경로 |
|---|---|
| `plomus-tool.json` | `members.skills.contracts.skills` · `members.gameopsAdapters.contracts.adapters` |
| `plomus-governance.json` | `members.governance.enums` · `members.governance.contracts.{roles,approval,modelRouting,executionLifecycle}` |
| `plomus-agent.json` | `members.gameops.{enums,incidentSeverityThresholds,contracts.agents,contracts.playbooks}` |
| `plomus-benchmarks.json` | `contracts.models` |

소스 경로로 소비하는 제품(distribution·commerce)은 `contracts/<role>/<domain>-<contract>/`를 추출합니다([CONTRACT-TAXONOMY.md](CONTRACT-TAXONOMY.md)). 새 member 경로를 추가/변경할 때는 이 표와 테스트를 함께 갱신하세요.
