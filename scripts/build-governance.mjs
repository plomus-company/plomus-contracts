import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/governance/base.json");
writeJson("dist/plomus-governance.json", {
  schemaVersion: "1.0.0",
  name: "plomus-governance",
  generatedAt: new Date().toISOString(),
  builtOnBenchmarks: base.builtOnBenchmarks ?? "contracts/benchmarks",
  enums: {
    riskLevels: base.riskLevels ?? [],
    roles: base.roles ?? [],
    approvalPolicies: base.approvalPolicies ?? [],
    approvalStatuses: base.approvalStatuses ?? [],
    approvalChannels: base.approvalChannels ?? [],
    executionStates: base.executionStates ?? [],
    commandStates: base.commandStates ?? [],
  },
  contracts: {
    roles: readJson("contracts/governance/roles.json"),
    approval: readJson("contracts/governance/approval.json"),
    executionLifecycle: readJson("contracts/governance/execution-lifecycle.json"),
    modelRouting: readJson("contracts/governance/model-routing.json"),
  },
});
console.log("built dist/plomus-governance.json");
