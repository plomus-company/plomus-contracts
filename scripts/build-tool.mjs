import { writeJson } from "./read-json.mjs";
import { bundle, gameopsAdaptersRegistry, protocolRegistry, skillsRegistry } from "./registries.mjs";

// Tool & API contracts: how an agent calls tools, APIs, and wire protocols.
writeJson("dist/plomus-tool.json", bundle("tool", {
  skills: skillsRegistry(),
  protocol: protocolRegistry(),
  gameopsAdapters: gameopsAdaptersRegistry(),
}));
console.log("built dist/plomus-tool.json");
