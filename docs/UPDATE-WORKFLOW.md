# Contract Update Workflow

이 저장소는 GitHub PR을 기준으로 contract를 추가하고 갱신합니다. source JSON은 contract-role 폴더(`tool/`·`agent/`·`task/`·`governance/`·`foundation/`, + `benchmarks/`)에 있고, CI는 참조 무결성, 포맷, 배포 artifact 생성을 확인합니다.

## 1. 변경 요청

GitHub Issue에서 `Contract change`를 선택합니다. 다음 정보를 적습니다.

- 변경할 contract 유형
- 변경 이유
- 호환성 수준: `patch`, `minor`, `major`
- 영향을 받는 제품 또는 외부 배포 주체
- 검증 계획

## 2. PR 작성

브랜치를 만들고 필요한 JSON만 수정합니다.

```bash
pnpm install
pnpm run format:contracts
pnpm run check:update
```

`check:update`는 다음 항목을 확인합니다.

- JSON canonical format
- preset, workflow, review rule id 중복
- preset이 참조하는 rule, workflow, folder, document type 존재 여부
- workflow safety profile 존재 여부
- core enum과 registry 항목 parity
- contract summary 생성

## 3. 리뷰

PR 설명에서 compatibility를 선택합니다.

- `patch`: label, description, status, metadata 변경
- `minor`: 새 id 추가
- `major`: id 삭제, 기존 의미 변경, 필수 필드 변경

major 변경은 제품별 migration 계획이 있어야 합니다.

## 4. 병합과 배포

main에 병합되면 `Contract CI`가 실행됩니다. 배포가 필요하면 `Contract Release` workflow를 수동 실행하고 tag를 입력합니다.

배포 artifact:

- role별 `dist/plomus-{tool,agent,task,governance,foundation,benchmarks}.json`
- `dist/plomus-contracts-index.json`
- `dist/contract-summary.md`

제품 저장소는 release tag 또는 npm package 기준으로 contract를 동기화합니다.
