import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/governance/v1/base.json");
writeJson("dist/plomus-governance.json", {
  schemaVersion: "1.0.0",
  name: "plomus-governance",
  generatedAt: new Date().toISOString(),
  builtOnBenchmarks: base.builtOnBenchmarks ?? "contracts/benchmarks/v1",
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
    roles: readJson("contracts/governance/v1/roles.json"),
    approval: readJson("contracts/governance/v1/approval.json"),
    executionLifecycle: readJson("contracts/governance/v1/execution-lifecycle.json"),
    modelRouting: readJson("contracts/governance/v1/model-routing.json"),
  },
});
console.log("built dist/plomus-governance.json");
