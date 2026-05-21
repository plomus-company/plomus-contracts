# Governance

Plomus contracts는 제품 코드와 분리해서 배포합니다. 제품은 이 저장소의 tagged release 또는 npm package를 기준으로 계약을 동기화합니다.

## 역할

- Maintainer: 계약 schema, release, 호환성 기준을 관리합니다.
- Product owner: 제품별 적용 가능성과 migration 필요 여부를 검토합니다.
- Contributor: 새 preset, workflow, rule 추가 제안을 PR로 제출합니다.

## 승인 기준

- 기존 제품이 사용하는 id를 삭제하지 않습니다.
- 삭제가 필요한 경우 deprecated 상태를 먼저 둡니다.
- workflow safety profile이 없는 workflow는 병합하지 않습니다.
- preset은 참조하는 rule과 workflow가 모두 registry에 있어야 합니다.

## 배포

- patch: 설명, label, non-breaking metadata 변경
- minor: 새 preset, workflow, rule 추가
- major: id 삭제, 의미 변경, 필수 필드 변경
