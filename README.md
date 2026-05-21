# Plomus Contracts

Plomus 운영체제들이 공유하는 공개 contract registry입니다. 외부 배포 주체가 preset, workflow, review rule, core enum 계약을 추가하거나 갱신할 때 이 저장소를 기준으로 검토합니다.

## 계약 범위

- `contracts/v1/base.json`: core enum, 기본 폴더, 문서 타입, 승인 정책, API surface
- `contracts/v1/presets.json`: 온보딩 preset과 활성 workflow/rule/folder/document type
- `contracts/v1/review-rules.json`: review rule id와 운영 도메인
- `contracts/v1/workflows.json`: workflow id, scope, target folder, safety profile

## 검증

```bash
pnpm install
pnpm run check:update
pnpm run check:ci
```

`pnpm run check:update`는 외부 PR에서 가장 먼저 실행할 검증입니다. JSON 포맷, 계약 참조, core parity, 요약 생성을 확인합니다.

`pnpm run check:ci`는 배포 전 전체 검증입니다. `dist/plomus-contracts.json`과 `dist/contract-summary.md`를 생성하고 테스트까지 실행합니다.

## 변경 절차

1. 계약 JSON을 수정합니다.
2. `pnpm run format:contracts`를 실행합니다.
3. `pnpm run check:update`를 실행합니다.
4. `pnpm run check:ci`를 실행합니다.
5. 변경 이유, 호환성 영향, 적용 대상 제품을 PR에 기록합니다.
6. breaking change는 `docs/CONTRACT-LIFECYCLE.md` 기준에 따라 major version으로 올립니다.

## 현재 원천

초기 계약은 `plomus-commerce-ai-os`의 내부 registry에서 추출했습니다. 이후부터는 이 저장소가 공개 contract의 기준입니다.

## GitHub 기반 운영

- 변경 요청: GitHub Issue `Contract change`
- PR 기준: `.github/PULL_REQUEST_TEMPLATE.md`
- GitHub Project 구성: [docs/GITHUB-PROJECT.md](docs/GITHUB-PROJECT.md)
- 상세 절차: [docs/UPDATE-WORKFLOW.md](docs/UPDATE-WORKFLOW.md)
- release artifact: `dist/plomus-contracts.json`, `dist/contract-summary.md`
