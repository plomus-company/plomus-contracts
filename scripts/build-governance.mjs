import { writeJson } from "./read-json.mjs";
import {
  bundle,
  commerceGovernanceRegistry,
  distributionGovernanceRegistry,
  governanceRegistry,
} from "./registries.mjs";

// Behavioral & governance contracts: the rules, roles, lifecycle, and recovery an
// agent must obey. Cross-cutting governance plus the per-domain review rules that
// constrain operational behaviour.
writeJson("dist/plomus-governance.json", bundle("governance", {
  governance: governanceRegistry(),
  commerce: commerceGovernanceRegistry(),
  distribution: distributionGovernanceRegistry(),
}));
console.log("built dist/plomus-governance.json");
