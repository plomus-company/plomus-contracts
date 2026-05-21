# GitHub Project Setup

GitHub Project를 사용할 때 권장하는 field 구성입니다.

## Fields

- `Status`: Triage, Ready, In review, Blocked, Released
- `Contract type`: preset, workflow, review-rule, core-enum, document-type
- `Compatibility`: patch, minor, major
- `Target product`: 적용 대상 제품 또는 외부 배포 주체
- `Release tag`: 배포 예정 tag

## Views

- `Intake`: 새 issue와 미분류 요청
- `Ready for PR`: contract 정의가 충분한 요청
- `Breaking changes`: `Compatibility = major`
- `Release queue`: release tag가 정해진 항목

## Automation

- 새 issue는 `Triage`로 둡니다.
- PR이 열리면 `In review`로 옮깁니다.
- main에 merge되면 release 필요 여부를 확인합니다.
- release가 완료되면 `Released`로 옮깁니다.
