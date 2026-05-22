import { writeJson } from "./read-json.mjs";
import {
  bundle,
  commerceFoundationRegistry,
  distributionFoundationRegistry,
  platformRegistry,
} from "./registries.mjs";

// Foundation: shared vocabulary that the contract roles build on — core enums,
// document frontmatter, event taxonomy, error codes. Not a contract role itself,
// but every other bundle references it.
writeJson("dist/plomus-foundation.json", bundle("foundation", {
  commerce: commerceFoundationRegistry(),
  distribution: distributionFoundationRegistry(),
  platform: platformRegistry(),
}));
console.log("built dist/plomus-foundation.json");
