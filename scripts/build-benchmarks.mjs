import { readContract } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/benchmarks-base.json");
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
    models: readJson("contracts/benchmarks-models.json").models ?? [],
    metrics: readJson("contracts/benchmarks-metrics.json").metrics ?? [],
    targets: readContract("benchmarks-targets", "targets"),
    results: readContract("benchmarks-results", "results"),
    rollups: readJson("contracts/benchmarks-rollups.json").rollups ?? [],
  },
};

writeJson("dist/plomus-benchmarks.json", registry);
console.log("built dist/plomus-benchmarks.json");
