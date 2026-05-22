import { writeJson } from "./read-json.mjs";
import { bundle, gameopsAgentRegistry } from "./registries.mjs";

// Agent capability & identity contracts: what an agent is and what it can do.
writeJson("dist/plomus-agent.json", bundle("agent", {
  gameops: gameopsAgentRegistry(),
}));
console.log("built dist/plomus-agent.json");
