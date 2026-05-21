import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/benchmarks/v1/base.json");
const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-benchmarks",
  generatedAt: new Date().toISOString(),
  pricingAsOf: base.pricingAsOf ?? null,
  enums: {
    modelVendors: base.modelVendors ?? [],
    metricCategories: base.metricCategories ?? [],
    metricDirections: base.metricDirections ?? [],
    units: base.units ?? [],
    targetKinds: base.targetKinds ?? [],
    targetDomains: base.targetDomains ?? [],
    dataSources: base.dataSources ?? [],
  },
  seedModels: base.seedModels ?? [],
  contracts: {
    models: readJson("contracts/benchmarks/v1/models.json").models ?? [],
    metrics: readJson("contracts/benchmarks/v1/metrics.json").metrics ?? [],
    targets: readJson("contracts/benchmarks/v1/targets.json").targets ?? [],
    results: readJson("contracts/benchmarks/v1/results.json").results ?? [],
    rollups: readJson("contracts/benchmarks/v1/rollups.json").rollups ?? [],
  },
};

writeJson("dist/plomus-benchmarks.json", registry);
console.log("built dist/plomus-benchmarks.json");
