# Changelog

이 저장소의 주요 변경을 기록합니다. 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를,
버전은 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다. 계약 호환성 정책
(patch·minor·major ↔ status)은 [docs/CONTRACT-LIFECYCLE.md](docs/CONTRACT-LIFECYCLE.md)에 정의되어 있습니다.

## [0.1.0] - 2026-05-24

언어 비종속 JSON 계약 레지스트리의 **첫 태그 릴리스**. AI 에이전트 생태계의 "contract" 개념을
축으로, 모든 계약을 **role(1차 축)** 폴더에 두고 빌드가 이를 다시 합쳐 role별 `dist/plomus-*.json`
번들과 발견용 매니페스트를 생성합니다. 폴더 배치·문서 카운트·교차참조는 CI(`pnpm run check:ci`)가
강제합니다.

### Contract roles — `dist/plomus-*.json`

| Role | 번들 | 규모 | status |
|---|---|---|---|
| Tool | `plomus-tool.json` | skill 86 · route 41 · credential 20 · upstream 18 · package 22 · endpoint 7 · payload 9 · adapter 7 | ACTIVE |
| Agent | `plomus-agent.json` | agent 4 · playbook 2 · intent 16 · field 6 | ACTIVE |
| Task | `plomus-task.json` | preset 8 · workflow 21 · dist-preset 1 | ACTIVE |
| Governance | `plomus-governance.json` | rule 37 · role 6 · 실행상태 19 · 승인정책 3 · EXPERIMENTAL 규칙 12 | ACTIVE |
| Transaction | `plomus-transaction.json` | budget 4 · settlement 3 | EXPERIMENTAL |
| Legal | `plomus-legal.json` | document 6 · disclosure 11 | disclosure ACTIVE / document 본문 DRAFT |
| Foundation | `plomus-foundation.json` | frontmatter 10 · 이벤트그룹 6 · error code 21 · 필드 7 | ACTIVE |
| Benchmarks | `plomus-benchmarks.json` | model 14 · metric 11 · target 114 · result 684 | 측정층 |

발견용 매니페스트 `dist/plomus-contracts-index.json`이 모든 번들·의존을 나열합니다.

### Added

- **계약 레지스트리 + role 분류** — `contracts/<role>/<domain>-<contract>/` 단위, 버전 폴더 없음
  (버전관리는 git/태그). role 매핑·2차 축(15 business unit · 15 category)은
  [docs/CONTRACT-TAXONOMY.md](docs/CONTRACT-TAXONOMY.md)에 정의되고 validator가 폴더 배치를 강제.
- **소비 경로** — `package.json` exports로 role별 진입점 제공
  (`@plomus/contracts`, `/tool`·`/agent`·`/task`·`/governance`·`/transaction`·`/legal`·`/foundation`·`/benchmarks`).
  `prepare`가 패키지 매니저 비종속으로 dist를 빌드하므로 git/SHA 설치에서도 동작.
  다운스트림(`*-ai-os`)이 의존하는 깊은 번들 경로를 테스트로 고정.
- **Legal — 전자상거래법 공개법령 실데이터화** — 제10·13조 표시의무 11개 disclosure를 법령 그대로
  옮겨 `ACTIVE`로 등재(businessUnit별). legal-document 6종에 정확한 `legalBasis`(개인정보보호법
  제30조·전자상거래법·정보통신망법 제50조 등) 부여, 본문은 법률 검토 전이므로 `DRAFT` 유지.
- **Benchmarks 실험 파이프라인** — `pnpm run experiment`로 실측 → measured 병합(illustrative seed 보존),
  도메인 롤업 재계산, run record 보존. 재현성/회귀 지표(`output_consistency`·`latency_stddev_ms`·
  `latency_p95_ms`, reps≥2/3), 분석 도구(`analyze:benchmarks`).
- **상용 모델 API 어댑터** — 실험 runner를 provider 추상화로 일반화: 로컬 Ollama(기본) +
  Anthropic / OpenAI / Google(Gemini). vendor로 provider 추론·`--provider`로 강제, 키는 env에서
  읽고 없으면 측정 전 중단. (커밋된 measured 값은 로컬 baseline; 상용 측정은 키가 있을 때 추가.)
- **문서** — README 소비 가이드라인, [CONTRACT-GLOSSARY](docs/CONTRACT-GLOSSARY.md)·
  [TAXONOMY](docs/CONTRACT-TAXONOMY.md)·[LIFECYCLE](docs/CONTRACT-LIFECYCLE.md)·
  [MIGRATION](docs/CONTRACT-MIGRATION.md)·[BENCHMARKS](docs/BENCHMARKS.md), ASCII 개념도.

### Notes

- `EXPERIMENTAL`/`DRAFT` 값(수수료율·약관 본문 등 비공개·비권위 데이터)은 fabricate하지 않은
  scaffold이며 제품 확정 시 `ACTIVE`로 승격합니다. 단 legal disclosure는 공개 법령을 그대로 옮긴
  것이라 이미 `ACTIVE`입니다.
- dist·exports 레이아웃은 초기 리팩터링에서 한 차례 breaking 변경되었습니다(소비자 마이그레이션은
  [docs/CONTRACT-MIGRATION.md](docs/CONTRACT-MIGRATION.md)). v0.1.0은 그 결과를 고정하는 첫 태그입니다.

[0.1.0]: https://github.com/plomus-company/plomus-contracts/releases/tag/v0.1.0
