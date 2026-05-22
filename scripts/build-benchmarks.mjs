import { readContract, readDoc } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readDoc("benchmarks-base");
const registry = {
  schemaVersion: "1.0.0",
  name: "plomus-benchmarks",
  type: "benchmarks",
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
    models: readContract("benchmarks-models", "models"),
    metrics: readContract("benchmarks-metrics", "metrics"),
    targets: readContract("benchmarks-targets", "targets"),
    results: readContract("benchmarks-results", "results"),
    rollups: readContract("benchmarks-rollups", "rollups"),
  },
};

writeJson("dist/plomus-benchmarks.json", registry);
console.log("built dist/plomus-benchmarks.json");
