import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/platform/v1/base.json");
writeJson("dist/plomus-platform.json", {
  schemaVersion: "1.0.0",
  name: "plomus-platform",
  generatedAt: new Date().toISOString(),
  builtOnCommerce: base.builtOnCommerce ?? "contracts/v1",
  enums: {
    lifecycleObjects: base.lifecycleObjects ?? [],
    eventObjects: base.eventObjects ?? [],
    errorCategories: base.errorCategories ?? [],
  },
  contracts: {
    frontmatter: readJson("contracts/platform/v1/frontmatter.json").documents ?? [],
    eventTypes: readJson("contracts/platform/v1/event-types.json").groups ?? [],
    errorCodes: readJson("contracts/platform/v1/error-codes.json").errorCodes ?? [],
  },
});
console.log("built dist/plomus-platform.json");
