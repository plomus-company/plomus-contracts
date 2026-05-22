import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/gameops-base.json");
writeJson("dist/plomus-gameops.json", {
  schemaVersion: "1.0.0",
  name: "plomus-gameops",
  generatedAt: new Date().toISOString(),
  builtOnGovernance: base.builtOnGovernance ?? "governance",
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
    dashboardStatusLevels: base.dashboardStatusLevels ?? [],
  },
  incidentSeverityThresholds: base.incidentSeverityThresholds ?? [],
  contracts: {
    adapters: readJson("contracts/gameops-adapters.json").adapters ?? [],
    agents: readJson("contracts/gameops-agents.json").agents ?? [],
    playbooks: readJson("contracts/gameops-playbooks.json").playbooks ?? [],
    fields: readJson("contracts/gameops-fields.json").fields ?? [],
  },
});
console.log("built dist/plomus-gameops.json");
