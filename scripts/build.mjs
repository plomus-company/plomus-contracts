import { readContract, readDoc } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-contracts",
  generatedAt: new Date().toISOString(),
  contracts: {
    base: readDoc("commerce-base"),
    presets: readContract("commerce-presets", "presets"),
    reviewRules: readContract("commerce-review-rules", "reviewRules"),
    workflows: readContract("commerce-workflows", "workflows"),
  },
};

writeJson("dist/plomus-contracts.json", registry);
console.log("built dist/plomus-contracts.json");
