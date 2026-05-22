import { readContract, readDoc } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readDoc("skills-base");
const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-skills",
  generatedAt: new Date().toISOString(),
  enums: {
    categories: base.categories ?? [],
    locales: base.locales ?? [],
    lifecyclePhases: base.lifecyclePhases ?? [],
    implementationTypes: base.implementationTypes ?? [],
    authTypes: base.authTypes ?? [],
    upstreams: base.upstreams ?? [],
  },
  contracts: {
    skills: readContract("skills-catalog", "skills"),
    proxyRoutes: readContract("skills-proxy-routes", "routes"),
    credentials: readContract("skills-credentials", "credentials"),
    dataSources: readContract("skills-data-sources", "sources"),
    categories: readContract("skills-categories", "categories"),
    upstreams: readContract("skills-upstreams", "upstreams"),
    packages: readContract("skills-packages", "packages"),
    mcp: readDoc("skills-mcp"),
    proxy: readDoc("skills-proxy"),
  },
};

writeJson("dist/plomus-skills.json", registry);
console.log("built dist/plomus-skills.json");
