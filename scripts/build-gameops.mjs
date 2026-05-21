import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/gameops/v1/base.json");
writeJson("dist/plomus-gameops.json", {
  schemaVersion: "1.0.0",
  name: "plomus-gameops",
  generatedAt: new Date().toISOString(),
  builtOnGovernance: base.builtOnGovernance ?? "contracts/governance/v1",
  enums: {
    intents: base.intents ?? [],
    agentIds: base.agentIds ?? [],
    playbookStepTypes: base.playbookStepTypes ?? [],
    sanctionTypes: base.sanctionTypes ?? [],
    incidentSeverities: base.incidentSeverities ?? [],
    csCategories: base.csCategories ?? [],
    csStatuses: base.csStatuses ?? [],
    csPriorities: base.csPriorities ?? [],
    csSentiments: base.csSentiments ?? [],
    noticeTypes: base.noticeTypes ?? [],
    pipelineEntityTypes: base.pipelineEntityTypes ?? [],
    commandSources: base.commandSources ?? [],
  },
  contracts: {
    adapters: readJson("contracts/gameops/v1/adapters.json").adapters ?? [],
    agents: readJson("contracts/gameops/v1/agents.json").agents ?? [],
    playbooks: readJson("contracts/gameops/v1/playbooks.json").playbooks ?? [],
  },
});
console.log("built dist/plomus-gameops.json");
