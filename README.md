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
pnpm run check:ci
```

`pnpm validate`는 계약 간 참조 무결성을 확인합니다. `pnpm build`는 배포용 단일 파일 `dist/plomus-contracts.json`을 생성합니다.

## 변경 절차

1. 계약 JSON을 수정합니다.
2. `pnpm run check:ci`를 실행합니다.
3. 변경 이유, 호환성 영향, 적용 대상 제품을 PR에 기록합니다.
4. breaking change는 `docs/CONTRACT-LIFECYCLE.md` 기준에 따라 major version으로 올립니다.

## 현재 원천

초기 계약은 `plomus-commerce-ai-os`의 내부 registry에서 추출했습니다. 이후부터는 이 저장소가 공개 contract의 기준입니다.
