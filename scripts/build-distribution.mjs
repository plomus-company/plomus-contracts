import { readContract } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/distribution-base.json");
const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-distribution",
  generatedAt: new Date().toISOString(),
  builtOnCommerce: base.builtOnCommerce ?? "commerce",
  enums: {
    partnerTypes: base.partnerTypes ?? [],
    paymentTerms: base.paymentTerms ?? [],
    priceTiers: base.priceTiers ?? [],
    receivableAgingBuckets: base.receivableAgingBuckets ?? [],
    purchaseOrderStatuses: base.purchaseOrderStatuses ?? [],
    returnReasons: base.returnReasons ?? [],
    ruleStatuses: base.ruleStatuses ?? [],
    documentTypes: base.documentTypes ?? [],
  },
  contracts: {
    presets: readJson("contracts/distribution-presets.json").presets ?? [],
    fields: readJson("contracts/distribution-fields.json").fields ?? [],
    experimentalRules: readContract("distribution-experimental-rules", "rules"),
  },
};

writeJson("dist/plomus-distribution.json", registry);
console.log("built dist/plomus-distribution.json");
