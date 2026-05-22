import { readContract, readDoc } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readDoc("gameops-base");
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
    adapters: readContract("gameops-adapters", "adapters"),
    agents: readContract("gameops-agents", "agents"),
    playbooks: readContract("gameops-playbooks", "playbooks"),
    fields: readContract("gameops-fields", "fields"),
  },
});
console.log("built dist/plomus-gameops.json");
