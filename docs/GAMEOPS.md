# Governance & GameOps Contracts

`plomus-gameops-ai-os` 점검에서 도출한 두 도메인입니다. 필드별 상세는 [contracts/governance/README.md](../contracts/governance/README.md), [contracts/gameops/README.md](../contracts/gameops/README.md).

## 점검 핵심

gameops는 distribution의 parity와 달리 **공개 계약을 vendor**합니다 — `scripts/sync-contracts.mjs`가 `contracts/benchmarks/models.json`과 `contracts/skills/catalog.json`을 `packages/registry/contracts/`로 복사하고 commit을 `PINNED.json`에 고정합니다. 또 `selectClaudeModelForRisk`가 benchmarks `models.status`(frontier/balanced/fast)로 위험도별 모델을 고릅니다. → **benchmarks·skills 계약이 실제 소비되고 있음**이 확인됐고, gameops가 로컬에 정의한 풍부한 어휘는 미계약 상태였습니다.

## 점검 → 계약 매핑

| 코드 | 발견 (위치) | 계약 |
|---|---|---|
| **A1** | risk→model 라우팅이 `registry/src/index.ts`(RISK_MODEL_STATUS)에만 | `governance/model-routing.json` (benchmarks 교차참조) |
| **A2** | 안전 실행 상태기계가 `core/states.ts`·`lifecycle.ts`·`execution/execution.types.ts`에만 | `governance/execution-lifecycle.json` |
| **A3** | 역할·다자승인·위험게이트가 `core/rbac.ts`·`approval.ts`·`risk.ts`에만 | `governance/roles.json`·`approval.json` |
| **B** | LiveOps 어댑터·intent·agent·playbook·게임 도메인 어휘 | `gameops/*` |

## 도메인 의존 그래프

```
benchmarks(models) ──▶ governance(model-routing, risk, approval, execution) ──▶ gameops(playbook risk/approval, adapters)
```

governance·gameops 모두 상위 도메인을 **읽기 전용 교차참조**해 무결성만 검증합니다(모델 status 해소, risk/approval 정책 해소). 이로써 **benchmarks(비용/성능) → 위험도별 모델 선택 → gameops 운영**의 루프가 계약으로 닫힙니다.

## 재사용성

A1·A2·A3(governance)는 게임 전용이 아니라 **모든 ops OS 공통**입니다. commerce/distribution도 역할·다자승인·안전 실행 상태기계를 채택하면 이 도메인을 그대로 vendor할 수 있습니다(gameops의 `sync-contracts.mjs` artifacts 맵에 추가만 하면 소비).

## 산출물

`pnpm run build:governance`→`dist/plomus-governance.json`, `pnpm run build:gameops`→`dist/plomus-gameops.json`. import: `@plomus/contracts/governance`, `@plomus/contracts/gameops` (및 하위 경로).
