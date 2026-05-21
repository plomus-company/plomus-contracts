# Contributing

이 저장소는 외부에서 접근 가능한 contract registry입니다. 변경은 작게 나누고, 각 PR은 하나의 목적을 가져야 합니다.

## PR 체크리스트

- GitHub Issue `Contract change`와 연결되어 있습니다.
- 새 id는 기존 id와 중복되지 않습니다.
- preset이 참조하는 rule, workflow, folder, document type은 base 계약 또는 registry에 존재합니다.
- workflow에는 safety profile이 있습니다.
- compatibility 수준을 `patch`, `minor`, `major` 중 하나로 적었습니다.
- `pnpm run format:contracts`를 실행했습니다.
- `pnpm run check:update`가 통과했습니다.
- breaking change 여부를 PR 설명에 적었습니다.
- `pnpm run check:ci`가 통과했습니다.

## 명명 규칙

- preset id와 rule id는 대문자 snake case를 사용합니다.
- workflow id는 소문자 kebab case를 사용합니다.
- document type과 folder id는 기존 Plomus workspace 규칙을 따릅니다.
