# Distribution Contracts (`contracts/distribution-`)

`plomus-distribution-ai-os`(탁구 용품 도소매 유통 OS) 점검 결과를 바탕으로 만든 계약 도메인입니다. 유통 제품은 공개 commerce 계약의 **superset**(제품의 `check-contract-parity`가 "공개 ⊆ 제품" 강제)이라, 유통 규칙·워크플로·문서타입은 대부분 이미 commerce 계약에 있습니다. 이 도메인은 **아직 어디에도 계약되지 않은 부분**만 담습니다.

- `tools/import-from-distribution-ai-os.mjs`가 단일 진실원천, `scripts/validate-distribution.mjs`가 검증.
- **commerce 계약(`contracts/commerce-`)은 읽기 전용으로 교차참조**만 합니다 — 절대 수정하지 않아 소비 제품의 parity baseline을 깨지 않습니다.

```
contracts/commerce- (commerce baseline) ──(read-only cross-ref)──▶ presets/experimental-rules/fields 검증
contracts/distribution-
  base.json            # 유통 통제 어휘
  presets.json         # PLOMUS_DISTRIBUTION preset (A1)
  fields.json          # 유통 frontmatter 필드 ↔ 어휘 바인딩 (B)
  experimental-rules.json # 정의됐으나 미구현인 유통 규칙 (C, EXPERIMENTAL)
  # A2(도메인 객체 lifecycle 상태)는 platform/frontmatter로 통합됨
```

---

## base.json — 통제 어휘 (B)

| 어휘 | 값 |
|---|---|
| `partnerTypes` | WHOLESALE_BUYER, RETAIL_BUYER, CONSIGNMENT_PARTNER, SUPPLIER (도매처/소매처/위탁/공급사) |
| `paymentTerms` | PREPAID, COD, NET_15, NET_30, NET_60, MONTHLY_CLOSE |
| `priceTiers` | SUPPLY, WHOLESALE, RETAIL, ONLINE, PARTNER (공급가/도매가/소매가/온라인가/파트너가) |
| `receivableAgingBuckets` | CURRENT, DUE_0_30, DUE_31_60, DUE_61_90, OVERDUE_90_PLUS (미수금 aging) |
| `purchaseOrderStatuses` | DRAFT, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED (발주/입고) |
| `returnReasons` | DEFECT, WRONG_ITEM, CHANGE_OF_MIND, DELIVERY_DAMAGE, OVER_SHIPMENT, EXPIRED (반품 사유) |
| `ruleStatuses` | ACTIVE, EXPERIMENTAL, DEPRECATED, REMOVED |
| `documentTypes` | purchase_order (commerce baseline에 없는 유통 제안 문서타입) |
| `lifecycleObjects` | product, order, claim, settlement |

---

## presets.json — `PLOMUS_DISTRIBUTION` (A1)

공개 commerce `presets.json`에 없던 유통 온보딩 preset입니다. 모든 참조(commerceType·channel·rule·workflow·folder·docType)는 **commerce baseline에 존재**해야 검증을 통과합니다(`validate-distribution.mjs`가 교차검증).

- commerceTypes: INVENTORY_BASED_SALES, CONSIGNMENT_SALES · operationMode: INVENTORY_CONTROLLED
- enabledRules 14 (상품/주문/재고/클레임/정산/거래처/미수금) · workflows 7 · folders 20 · docTypes 19
- 시스템 폴더·base 문서타입은 importer가 commerce `base.json`에서 읽어 합치므로 항상 동기화됩니다.

---

## 도메인 객체 lifecycle 상태 (A2) — platform으로 통합됨

product/order/claim/settlement의 상태 어휘는 이전에 이 도메인의 `domain-statuses.json`에 있었으나, 모든 커머스/유통 제품이 공유하는 어휘이므로 **[platform/frontmatter](../../platform/v1/frontmatter.json)** 단일 출처로 통합했습니다(중복 제거). 교차 도메인 검증기가 platform이 해당 객체를 계속 보유하는지 보장합니다.

---

## fields.json — 유통 frontmatter 필드 바인딩 (B)

`거래처`/`상품`/`미수금`/`발주`/`클레임` 문서의 유통 고유 필드가 어떤 통제 어휘(또는 primitive 타입)에 묶이는지 정의합니다. `documentType`은 commerce 또는 distribution 문서타입에 존재해야 하고, `enum`은 `base.json` 어휘 키여야 합니다.

예: `partner.partner_type → partnerTypes`(필수), `partner.payment_terms → paymentTerms`, `partner.credit_limit → number`, `accounts_receivable.aging_bucket → receivableAgingBuckets`, `purchase_order.po_status → purchaseOrderStatuses`, `claim.return_reason → returnReasons`.

---

## experimental-rules.json — 미구현 유통 규칙 (C)

제품 `review-rule-types.ts`는 59개 rule id를 정의하지만 구현은 36개, 공개 계약은 37개입니다. 정의만 된 ~22개 중 **유통에 중요한 12개**를 `status: EXPERIMENTAL`로 계약화했습니다(재고 품절/과재고/동기화, 공급사 지연, 주문 상태/결제, 상품 옵션/상태, 정산 미확정, 클레임 대기/환불 지연).

- 각 rule의 `domain`은 commerce `commerceDomains`에 존재해야 하고, `ruleId`는 commerce ACTIVE baseline과 **충돌하면 안 됩니다**(추가 제안이므로).
- `docs/CONTRACT-LIFECYCLE.md`의 EXPERIMENTAL 의미를 따릅니다. **공개 commerce `review-rules.json`에는 넣지 않습니다** — parity가 제품의 *구현된* 규칙 레지스트리에 대해 subset을 강제하므로, 미구현 규칙을 공개 ACTIVE baseline에 넣으면 소비 제품 CI가 깨지기 때문입니다.

---

## 갱신 절차

```bash
pnpm run import:distribution   # 큐레이션 어휘 + commerce baseline에서 preset 폴더/타입 합쳐 재생성
pnpm run check:ci              # 네 도메인 전체 검증·빌드·테스트
```
