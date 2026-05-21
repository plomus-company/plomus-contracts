# Contract Lifecycle

## 상태

- `ACTIVE`: 제품에서 사용할 수 있습니다.
- `EXPERIMENTAL`: 실험 또는 일부 제품에서만 사용합니다.
- `DEPRECATED`: 새 제품에서는 사용하지 않습니다.
- `REMOVED`: 다음 major version에서 제거된 항목입니다.

## 변경 원칙

새 계약은 `EXPERIMENTAL`로 시작할 수 있습니다. 제품에서 검증된 뒤 `ACTIVE`로 전환합니다.

기존 id를 재사용하지 않습니다. 의미가 달라지는 경우 새 id를 추가하고 기존 id는 deprecated 처리합니다.
