import { readDoc } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readDoc("governance-base");
writeJson("dist/plomus-governance.json", {
  schemaVersion: "1.0.0",
  name: "plomus-governance",
  generatedAt: new Date().toISOString(),
  builtOnBenchmarks: base.builtOnBenchmarks ?? "benchmarks",
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
    roles: readDoc("governance-roles"),
    approval: readDoc("governance-approval"),
    executionLifecycle: readDoc("governance-execution-lifecycle"),
    modelRouting: readDoc("governance-model-routing"),
  },
});
console.log("built dist/plomus-governance.json");
