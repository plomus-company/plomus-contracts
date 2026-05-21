# Distribution Contracts

`contracts/distribution/v1/`는 `plomus-distribution-ai-os`(탁구 용품 도소매 유통 OS) 점검에서 도출한 추가 계약입니다. 필드별 상세는 [contracts/distribution/v1/README.md](../contracts/distribution/v1/README.md).

## 왜 별도 도메인인가

유통 OS는 공개 commerce 계약의 **superset**입니다. 제품의 `check-contract-parity`는 "공개 계약 ⊆ 제품"을 강제하며, 이때:

- **review rule subset 검사는 제품의 *구현된* 레지스트리(`REVIEW_RULE_REGISTRY`)를 기준**으로 합니다. 따라서 미구현 규칙을 공개 `review-rules.json`(전부 ACTIVE)에 추가하면 유통 제품 CI가 깨집니다.
- commerce 계약 파일은 `import-from-commerce-ai-os`가 소유하므로 하드 편집은 재생성 시 유실됩니다.

그래서 유통 점검 결과(아래 A1·A2·B·C)를 commerce 파일을 건드리지 않고 **독립 도메인**으로 구현하고, commerce 계약은 읽기 전용 교차참조로 무결성만 검증합니다(skills·benchmarks와 동일 패턴).

## 점검 → 계약 매핑

| 코드 | 점검에서 발견 | 계약 |
|---|---|---|
| **A1** | `PLOMUS_DISTRIBUTION` preset이 공개 registry에 없음 | `presets.json` |
| **A2** | product/order/claim/settlement lifecycle 상태가 Zod 스키마에만 존재(`domain.schema.ts`), 어떤 계약에도 없음 | `domain-statuses.json` |
| **B** | 거래처 유형·결제조건·여신·가격티어·미수금 aging·발주/입고·반품사유가 자유형 frontmatter로만 존재 | `base.json` 어휘 + `fields.json` 바인딩 |
| **C** | 59개 정의 규칙 중 미구현 ~22개에 유통 핵심(품절/과재고/공급사/주문상태…) 포함 | `experimental-rules.json` (EXPERIMENTAL) |

## 검증 무결성 (`scripts/validate-distribution.mjs`)

- 모든 base 어휘 고유.
- **A1 preset**: commerceType/channel/productType/operationMode/domain은 commerce `core.*`에, enabledRules는 commerce `review-rules`에, enabledWorkflows는 commerce `workflows`에, folders는 commerce(system∪watch)에, docTypes는 commerce∪distribution 문서타입에 존재.
- **A2**: object는 `lifecycleObjects`에, statuses 비어있지 않고 고유, extraEnums 고유.
- **B fields**: documentType은 commerce∪distribution에, enum은 base 어휘 키 또는 valueType primitive.
- **C experimental-rules**: ruleId 고유·commerce ACTIVE와 비충돌(추가 제안), domain은 commerce `commerceDomains`에, status는 `ruleStatuses`에.

## 산출물

`pnpm run build:distribution` → `dist/plomus-distribution.json`. 소비자는 `@plomus/contracts/distribution` 또는 하위 경로(`./distribution/presets` 등)로 import.

## 승격 후보 (후속)

- **A2 도메인 상태**와 **A1 preset**은 모든 커머스/유통 제품이 공유하므로 공개 commerce baseline으로 승격할 가치가 있습니다. 단, 이는 `plomus-commerce-ai-os` 원천과 `import-from-commerce-ai-os` 도구를 함께 갱신해야 하므로 별도 작업으로 둡니다.
- **C 규칙**을 실제 ACTIVE로 올리려면 유통/커머스 제품에서 먼저 구현(`REVIEW_RULE_REGISTRY` 등록)해야 parity가 유지됩니다.
