import { readJson, writeJson } from "./read-json.mjs";

const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-contracts",
  generatedAt: new Date().toISOString(),
  contracts: {
    base: readJson("contracts/commerce/base.json"),
    presets: readJson("contracts/commerce/presets.json").presets ?? [],
    reviewRules: readJson("contracts/commerce/review-rules.json").reviewRules ?? [],
    workflows: readJson("contracts/commerce/workflows.json").workflows ?? [],
  },
};

writeJson("dist/plomus-contracts.json", registry);
console.log("built dist/plomus-contracts.json");
