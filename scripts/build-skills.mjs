import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/skills-base.json");
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
    skills: readJson("contracts/skills-catalog.json").skills ?? [],
    proxyRoutes: readJson("contracts/skills-proxy-routes.json").routes ?? [],
    credentials: readJson("contracts/skills-credentials.json").credentials ?? [],
    dataSources: readJson("contracts/skills-data-sources.json").sources ?? [],
    categories: readJson("contracts/skills-categories.json").categories ?? [],
    upstreams: readJson("contracts/skills-upstreams.json").upstreams ?? [],
    packages: readJson("contracts/skills-packages.json").packages ?? [],
    mcp: readJson("contracts/skills-mcp.json"),
    proxy: readJson("contracts/skills-proxy.json"),
  },
};

writeJson("dist/plomus-skills.json", registry);
console.log("built dist/plomus-skills.json");
