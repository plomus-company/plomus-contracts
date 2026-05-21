import { readJson, writeJson } from "./read-json.mjs";

const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-contracts",
  generatedAt: new Date().toISOString(),
  contracts: {
    base: readJson("contracts/v1/base.json"),
    presets: readJson("contracts/v1/presets.json").presets ?? [],
    reviewRules: readJson("contracts/v1/review-rules.json").reviewRules ?? [],
    workflows: readJson("contracts/v1/workflows.json").workflows ?? [],
  },
};

writeJson("dist/plomus-contracts.json", registry);
console.log("built dist/plomus-contracts.json");
