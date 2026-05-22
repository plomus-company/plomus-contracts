import { writeJson } from "./read-json.mjs";
import { bundle, commerceTaskRegistry, distributionTaskRegistry } from "./registries.mjs";

// Task / workflow / delegation contracts: what work runs, under what recipe and
// safety profile. Onboarding presets bundle the rules and workflows a product
// activates.
writeJson("dist/plomus-task.json", bundle("task", {
  commerce: commerceTaskRegistry(),
  distribution: distributionTaskRegistry(),
}));
console.log("built dist/plomus-task.json");
