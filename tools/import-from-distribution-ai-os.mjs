import path from "node:path";
import { readJson, writeJson } from "../scripts/read-json.mjs";

// Single source of truth for the `distribution` contract domain.
//
// plomus-distribution-ai-os is a SUPERSET of the public commerce contract
// (its check-contract-parity enforces public ⊆ product). So its review rules,
// workflows, folders, and document types already live in contracts/commerce-. This
// domain captures the parts that are NOT yet contracted anywhere:
//   A1. the PLOMUS_DISTRIBUTION onboarding preset (not in commerce presets.json)
//   A2. domain-object lifecycle statuses (only in product Zod schemas today)
//   B.  distribution-specific vocabularies (거래처 types, pricing tiers,
//       payment terms, receivable aging, purchase-order/inbound, return reasons)
//   C.  defined-but-unimplemented, distribution-relevant rules as EXPERIMENTAL
//
// Commerce contracts are read READ-ONLY for cross-reference integrity; this tool
// never edits them (keeps the consuming product's parity baseline intact).
//
// Run with: pnpm run import:distribution

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const distRepo = process.env.PLOMUS_DISTRIBUTION_DIR ?? path.resolve(repoRoot, "../plomus-distribution-ai-os");
const generatedAt = new Date().toISOString();

// Commerce baseline (read-only) — used to keep the preset's system folders and
// base document types in sync with the shared contract.
const commerceBase = readJson("contracts/commerce-base.json");
const SYSTEM_FOLDERS = commerceBase.systemFolders ?? [];
const BASE_DOC_TYPES = [
  "commerce_review",
  "ai_recommendation",
  "change_plan",
  "task",
  "sync_event",
  "cloud_command",
  "hermes_command",
  "hermes_result",
  "validation_error",
];

// ---- B. controlled vocabularies (distribution-specific) ----
const PARTNER_TYPES = ["WHOLESALE_BUYER", "RETAIL_BUYER", "CONSIGNMENT_PARTNER", "SUPPLIER"];
const PAYMENT_TERMS = ["PREPAID", "COD", "NET_15", "NET_30", "NET_60", "MONTHLY_CLOSE"];
const PRICE_TIERS = ["SUPPLY", "WHOLESALE", "RETAIL", "ONLINE", "PARTNER"];
const RECEIVABLE_AGING_BUCKETS = ["CURRENT", "DUE_0_30", "DUE_31_60", "DUE_61_90", "OVERDUE_90_PLUS"];
const PURCHASE_ORDER_STATUSES = ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"];
const RETURN_REASONS = ["DEFECT", "WRONG_ITEM", "CHANGE_OF_MIND", "DELIVERY_DAMAGE", "OVER_SHIPMENT", "EXPIRED"];
const RULE_STATUSES = ["ACTIVE", "EXPERIMENTAL", "DEPRECATED", "REMOVED"];
// Document type proposed by the distribution domain (not in the commerce baseline yet).
const DISTRIBUTION_DOC_TYPES = ["purchase_order"];
// NOTE: domain-object lifecycle statuses (product/order/claim/settlement) are no
// longer duplicated here — they are owned by contracts/platform-frontmatter.json.

// ---- A1. PLOMUS_DISTRIBUTION preset (folders/doctypes expanded against commerce) ----
const PRESET_FOLDERS = ["10-products", "20-orders", "30-inventory", "35-partners", "40-claims", "50-settlements", "51-finance"];
const PRESET_DOC_TYPES = ["product", "order", "stock", "claim", "settlement", "partner", "commission", "accounts_receivable", "finance_item", "invoice"];
const distributionPreset = {
  presetId: "PLOMUS_DISTRIBUTION",
  label: "플로머스 탁구 유통형",
  description: "탁구 용품 도소매 유통: 상품, 주문, 재고, 거래처, 정산, 미수금 점검 중심의 운영 기준",
  commerceTypes: ["INVENTORY_BASED_SALES", "CONSIGNMENT_SALES"],
  salesChannels: ["OWN_WEB", "NAVER_SMARTSTORE", "B2B_DIRECT", "OFFLINE_MANUAL"],
  productTypes: ["PHYSICAL_PRODUCT"],
  operationMode: "INVENTORY_CONTROLLED",
  enabledDomains: ["PRODUCT", "ORDER", "INVENTORY", "SHIPPING", "CLAIM", "SETTLEMENT", "PARTNER", "SYSTEM"],
  enabledRules: [
    "PRODUCT_DESCRIPTION_MISSING",
    "PRODUCT_IMAGE_NEEDS_REVIEW",
    "PRODUCT_PRICE_MISSING",
    "ORDER_SHIPPING_DELAY",
    "INVENTORY_LOW_STOCK",
    "CLAIM_OVERDUE",
    "SETTLEMENT_MISMATCH",
    "PARTNER_CONTRACT_MISSING",
    "PARTNER_SETTLEMENT_PENDING",
    "FINANCE_RECEIVABLE_OVERDUE",
    "TASK_OVERDUE",
    "TASK_DONE_CLEANUP",
    "CHANGE_PLAN_STALE",
    "SYNC_FAILURE_DETECTED",
  ],
  highPriorityRules: ["INVENTORY_LOW_STOCK", "ORDER_SHIPPING_DELAY", "SETTLEMENT_MISMATCH", "FINANCE_RECEIVABLE_OVERDUE", "PARTNER_SETTLEMENT_PENDING"],
  enabledFolders: [...PRESET_FOLDERS, ...SYSTEM_FOLDERS],
  enabledDocumentTypes: [...PRESET_DOC_TYPES, ...BASE_DOC_TYPES],
  enabledWorkflows: ["commerce-review", "apply-change-plan", "inventory-review", "order-delay-review", "settlement-check", "partner-review", "daily-briefing"],
};

// ---- B. distribution frontmatter fields and the vocabulary each binds to ----
const FIELDS = [
  { documentType: "partner", field: "partner_type", enum: "partnerTypes", required: true },
  { documentType: "partner", field: "payment_terms", enum: "paymentTerms", required: false },
  { documentType: "partner", field: "credit_limit", valueType: "number", required: false },
  { documentType: "product", field: "price_tier", enum: "priceTiers", required: false },
  { documentType: "accounts_receivable", field: "aging_bucket", enum: "receivableAgingBuckets", required: false },
  { documentType: "purchase_order", field: "po_status", enum: "purchaseOrderStatuses", required: true },
  { documentType: "claim", field: "return_reason", enum: "returnReasons", required: false },
];

// ---- C. defined-but-unimplemented, distribution-relevant rules (proposed EXPERIMENTAL) ----
const EXPERIMENTAL_RULES = [
  { ruleId: "INVENTORY_OUT_OF_STOCK", domain: "INVENTORY", status: "EXPERIMENTAL", description: "판매 중 상품의 가용 재고가 0이 되어 품절 처리·발주가 필요한 상태." },
  { ruleId: "INVENTORY_OVER_STOCK", domain: "INVENTORY", status: "EXPERIMENTAL", description: "회전율 대비 과다 재고로 보관비·악성재고 위험이 있는 상태." },
  { ruleId: "INVENTORY_SYNC_MISMATCH", domain: "INVENTORY", status: "EXPERIMENTAL", description: "채널별 재고 수량이 서로 불일치해 동기화 점검이 필요한 상태." },
  { ruleId: "SUPPLIER_RESPONSE_DELAY", domain: "SUPPLIER", status: "EXPERIMENTAL", description: "공급사 발주·문의 응답이 기준 시간을 초과한 상태." },
  { ruleId: "SUPPLIER_STOCK_UNCONFIRMED", domain: "SUPPLIER", status: "EXPERIMENTAL", description: "공급사 재고 가용 여부가 미확인되어 발주 확정이 지연되는 상태." },
  { ruleId: "ORDER_STATUS_STALE", domain: "ORDER", status: "EXPERIMENTAL", description: "주문 상태가 장시간 갱신되지 않아 처리 누락이 의심되는 상태." },
  { ruleId: "ORDER_PAYMENT_MISMATCH", domain: "ORDER", status: "EXPERIMENTAL", description: "주문 금액과 결제 금액이 불일치하는 상태." },
  { ruleId: "PRODUCT_OPTION_MISSING", domain: "PRODUCT", status: "EXPERIMENTAL", description: "필수 상품 옵션(사이즈/색상 등) 정보가 누락된 상태." },
  { ruleId: "PRODUCT_STATUS_INCONSISTENT", domain: "PRODUCT", status: "EXPERIMENTAL", description: "판매 상태와 재고·노출 설정이 상호 모순되는 상태." },
  { ruleId: "SETTLEMENT_NOT_CONFIRMED", domain: "SETTLEMENT", status: "EXPERIMENTAL", description: "정산 예정 건이 기한 내 확정되지 않은 상태." },
  { ruleId: "CLAIM_WAITING_CUSTOMER", domain: "CLAIM", status: "EXPERIMENTAL", description: "고객 회신 대기로 클레임 처리가 멈춰 있는 상태." },
  { ruleId: "REFUND_DELAY", domain: "CLAIM", status: "EXPERIMENTAL", description: "환불 승인 후 실제 환급이 기준 시간을 초과한 상태." },
];

const base = {
  schemaVersion: "1.0.0",
  source: "plomus-distribution-ai-os",
  sourceImportedAt: generatedAt,
  builtOnCommerce: "commerce",
  partnerTypes: PARTNER_TYPES,
  paymentTerms: PAYMENT_TERMS,
  priceTiers: PRICE_TIERS,
  receivableAgingBuckets: RECEIVABLE_AGING_BUCKETS,
  purchaseOrderStatuses: PURCHASE_ORDER_STATUSES,
  returnReasons: RETURN_REASONS,
  ruleStatuses: RULE_STATUSES,
  documentTypes: DISTRIBUTION_DOC_TYPES,
};

writeJson("contracts/distribution-base.json", base);
writeJson("contracts/distribution-presets.json", { schemaVersion: "1.0.0", presets: [distributionPreset] });
writeJson("contracts/distribution-fields.json", { schemaVersion: "1.0.0", note: "Distribution frontmatter fields and the controlled vocabulary each binds to.", fields: FIELDS });
writeJson("contracts/distribution-experimental-rules.json", { schemaVersion: "1.0.0", note: "Defined-but-unimplemented rules proposed for distribution; not part of the commerce ACTIVE baseline.", rules: EXPERIMENTAL_RULES });

console.log(`imported distribution contracts (source: ${distRepo})`);
console.log(`  preset: ${distributionPreset.presetId}, fields: ${FIELDS.length}, experimental rules: ${EXPERIMENTAL_RULES.length} (domain statuses now in platform/frontmatter)`);
