import { writeJson } from "./read-json.mjs";
import { bundle, legalRegistry } from "./registries.mjs";

// Legal contracts: legal documents (ToS, privacy, e-commerce disclosure, partner,
// refund) and 전자상거래법 disclosure items. DRAFT/EXPERIMENTAL.
writeJson("dist/plomus-legal.json", bundle("legal", {
  legal: legalRegistry(),
}));
console.log("built dist/plomus-legal.json");
