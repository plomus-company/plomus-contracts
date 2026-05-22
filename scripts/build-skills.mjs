import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/skills/v1/base.json");
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
    skills: readJson("contracts/skills/v1/catalog.json").skills ?? [],
    proxyRoutes: readJson("contracts/skills/v1/proxy-routes.json").routes ?? [],
    credentials: readJson("contracts/skills/v1/credentials.json").credentials ?? [],
    dataSources: readJson("contracts/skills/v1/data-sources.json").sources ?? [],
    categories: readJson("contracts/skills/v1/categories.json").categories ?? [],
    upstreams: readJson("contracts/skills/v1/upstreams.json").upstreams ?? [],
    packages: readJson("contracts/skills/v1/packages.json").packages ?? [],
    mcp: readJson("contracts/skills/v1/mcp.json"),
    proxy: readJson("contracts/skills/v1/proxy.json"),
  },
};

writeJson("dist/plomus-skills.json", registry);
console.log("built dist/plomus-skills.json");
