import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/distribution/v1/base.json");
const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-distribution",
  generatedAt: new Date().toISOString(),
  builtOnCommerce: base.builtOnCommerce ?? "contracts/v1",
  enums: {
    partnerTypes: base.partnerTypes ?? [],
    paymentTerms: base.paymentTerms ?? [],
    priceTiers: base.priceTiers ?? [],
    receivableAgingBuckets: base.receivableAgingBuckets ?? [],
    purchaseOrderStatuses: base.purchaseOrderStatuses ?? [],
    returnReasons: base.returnReasons ?? [],
    ruleStatuses: base.ruleStatuses ?? [],
    documentTypes: base.documentTypes ?? [],
    lifecycleObjects: base.lifecycleObjects ?? [],
  },
  contracts: {
    presets: readJson("contracts/distribution/v1/presets.json").presets ?? [],
    domainStatuses: readJson("contracts/distribution/v1/domain-statuses.json").objects ?? [],
    fields: readJson("contracts/distribution/v1/fields.json").fields ?? [],
    experimentalRules: readJson("contracts/distribution/v1/experimental-rules.json").rules ?? [],
  },
};

writeJson("dist/plomus-distribution.json", registry);
console.log("built dist/plomus-distribution.json");
