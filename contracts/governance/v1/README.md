# Governance Contracts (`contracts/governance/v1/`)

`plomus-gameops-ai-os` 점검에서 도출한 **횡단 "안전 운영" 제어 계약**입니다 — 어느 AI ops OS(commerce/distribution/gameops)든 재사용할 수 있습니다.

- `tools/import-governance.mjs`가 단일 진실원천, `scripts/validate-governance.mjs`가 검증.
- benchmarks 도메인을 **읽기 전용 교차참조**(model-routing이 실제 모델 status로 해소되는지)합니다.

| 파일 | 내용 | 점검 매핑 |
|---|---|---|
| `base.json` | riskLevels(4)·roles(6)·approvalPolicies·approvalStatuses·approvalChannels·executionStates(19)·commandStates(13) | — |
| `roles.json` | 역할 rank + 위험도별 승인 가능 역할 | A3 |
| `approval.json` | 승인 정책 임계치(admin_multi:2 등) + 위험도→정책 매핑 | A3 |
| `execution-lifecycle.json` | 실행 상태기계(dry-run→approve→execute→verify→rollback) + command 상태기계 + 어댑터 step 계약 | A2 |
| `model-routing.json` | 위험도→benchmarks 모델 status (critical/high→frontier, medium→balanced, low→fast) | A1 |

## 핵심

- **A1 risk→model**: gameops `selectClaudeModelForRisk`가 이미 benchmarks `models.status`로 모델을 고르는 정책을 계약화. 검증기는 각 `modelStatus`가 **실제 모델이 존재하는 status**인지까지 확인(라우팅이 항상 해소되도록).
- **A2 execution lifecycle**: 19-state 안전 실행 상태기계 + 전이맵. commerce/distribution은 change-plan apply만 있어 이 패턴이 없었습니다. 모든 전이의 from/to가 정의된 state여야 하고, 모든 state는 transitions 항목을 가져야 합니다.
- **A3 RBAC/approval**: 역할(owner..bot) + rank + 위험도별 승인권한 + 다자승인(admin_multi=2). commerce/distribution은 "무엇을 승인"(approvalRuleIds)만 있고 "누가/몇 명"이 없었습니다.

## 갱신

```bash
pnpm run import:governance && pnpm run check:ci
```
