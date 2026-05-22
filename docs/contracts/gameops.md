# GameOps Contracts (`gameops-`)

`plomus-gameops-ai-os`(게임 라이브 운영 OS) 전용 어휘 계약입니다. governance 도메인을 **읽기 전용 교차참조**(playbook의 riskLevel·approvalPolicy가 거기 존재하는지)합니다.

- `tools/import-gameops.mjs`가 단일 진실원천, `scripts/validate-gameops.mjs`가 검증.

| 파일 | 내용 |
|---|---|
| `base.json` | intents(16)·agentIds(4)·playbookStepTypes(4)·sanctionTypes(ban/mute/warn)·incidentSeverities(S1–S4)·CS 분류(category/status/priority/sentiment)·noticeTypes·pipelineEntityTypes·commandSources |
| `adapters.json` | LiveOps 실행 어댑터(7) — executionTypes·capabilities·dryRun/rollback 지원·requiresConfig |
| `agents.json` | GameOps 에이전트(4) — cs/notice/incident/dashboard + 지원 intent + **출력 분류 바인딩(`outputs`)** |
| `playbooks.json` | playbook(2) — triggers·riskLevel·requiresApproval·steps |
| `fields.json` | 게임 문서 필드↔어휘 바인딩(6) — cs_ticket/incident/notice |

`base.json`에 `dashboardStatusLevels`와 **인시던트 심각도 임계(`incidentSeverityThresholds`: S2≥30·S3≥10·S4≥0 tickets)**를 포함합니다.

## 핵심

- **LiveOps 어댑터**: notice.cms, reward.grant, coupon.issue, sanction.apply, push.send(rollback 불가), event.config, webhook.custom. 각 어댑터의 dryRun/rollback 지원이 명시되어 governance 실행 lifecycle과 맞물립니다.
- **playbook 교차검증**: triggers ⊆ intents, riskLevel ∈ **governance** riskLevels, approval step의 approvalPolicy ∈ **governance** approvalPolicies, requiresApproval이면 approval step 필수.
- **agent**: 지원 intent ⊆ base.intents.

## 게임 도메인 고유 어휘 (commerce/distribution에 없음)

제재(ban/mute/warn), 인시던트 심각도(S1–S4), CS 감정/분류, 인게임 이벤트 config, 푸시(비가역), 데이터 파이프라인 엔티티(PAYMENT/STABILITY/SESSION/CS).

## 갱신

```bash
pnpm run import:gameops && pnpm run check:ci
```
