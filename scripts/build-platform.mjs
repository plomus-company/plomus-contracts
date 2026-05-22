import { readContract, readDoc } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readDoc("platform-base");
writeJson("dist/plomus-platform.json", {
  schemaVersion: "1.0.0",
  name: "plomus-platform",
  generatedAt: new Date().toISOString(),
  builtOnCommerce: base.builtOnCommerce ?? "commerce",
  enums: {
    lifecycleObjects: base.lifecycleObjects ?? [],
    eventObjects: base.eventObjects ?? [],
    errorCategories: base.errorCategories ?? [],
  },
  contracts: {
    frontmatter: readContract("platform-frontmatter", "documents"),
    eventTypes: readContract("platform-event-types", "groups"),
    errorCodes: readContract("platform-error-codes", "errorCodes"),
  },
});
console.log("built dist/plomus-platform.json");
