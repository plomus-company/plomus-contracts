import { readContract, readDoc } from "./group.mjs";

// Per-domain registry payloads, factored out of the per-type build scripts.
// Each function returns the domain's contract payload WITHOUT the artifact
// wrapper (schemaVersion/name/generatedAt) — the type build scripts
// (build-tool/agent/task/governance/foundation) compose these into the
// contract-type bundles they ship. Splitting domains here is what lets a single
// source domain (e.g. commerce) contribute to several contract-type bundles.
// The exact old-artifact → new-path mapping is documented in
// docs/CONTRACT-MIGRATION.md.

// ---- tool ----

export function skillsRegistry() {
  const base = readDoc("skills-base");
  return {
    enums: {
      categories: base.categories ?? [],
      locales: base.locales ?? [],
      lifecyclePhases: base.lifecyclePhases ?? [],
      implementationTypes: base.implementationTypes ?? [],
      authTypes: base.authTypes ?? [],
      upstreams: base.upstreams ?? [],
    },
    contracts: {
      skills: readContract("skills-catalog", "skills"),
      proxyRoutes: readContract("skills-proxy-routes", "routes"),
      credentials: readContract("skills-credentials", "credentials"),
      dataSources: readContract("skills-data-sources", "sources"),
      categories: readContract("skills-categories", "categories"),
      upstreams: readContract("skills-upstreams", "upstreams"),
      packages: readContract("skills-packages", "packages"),
      mcp: readDoc("skills-mcp"),
      proxy: readDoc("skills-proxy"),
    },
  };
}

export function protocolRegistry() {
  const base = readDoc("protocol-base");
  return {
    protocolVersion: base.protocolVersion ?? null,
    builtOnCommerce: base.builtOnCommerce ?? "commerce",
    enums: {
      eventSources: base.eventSources ?? [],
      httpMethods: base.httpMethods ?? [],
      telegramCommandKinds: base.telegramCommandKinds ?? [],
      telegramCommandStatuses: base.telegramCommandStatuses ?? [],
    },
    contracts: {
      endpoints: readContract("protocol-endpoints", "endpoints"),
      syncEvent: readDoc("protocol-sync-event"),
      payloads: readContract("protocol-payloads", "payloads"),
      telegram: readDoc("protocol-telegram"),
    },
  };
}

export function gameopsAdaptersRegistry() {
  return { contracts: { adapters: readContract("gameops-adapters", "adapters") } };
}

// ---- agent ----

export function gameopsAgentRegistry() {
  const base = readDoc("gameops-base");
  return {
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
      agents: readContract("gameops-agents", "agents"),
      playbooks: readContract("gameops-playbooks", "playbooks"),
      fields: readContract("gameops-fields", "fields"),
    },
  };
}

// ---- task ----

export function commerceTaskRegistry() {
  return {
    contracts: {
      presets: readContract("commerce-presets", "presets"),
      workflows: readContract("commerce-workflows", "workflows"),
    },
  };
}

export function distributionTaskRegistry() {
  return { contracts: { presets: readContract("distribution-presets", "presets") } };
}

// ---- governance ----

export function governanceRegistry() {
  const base = readDoc("governance-base");
  return {
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
  };
}

export function commerceGovernanceRegistry() {
  return { contracts: { reviewRules: readContract("commerce-review-rules", "reviewRules") } };
}

export function distributionGovernanceRegistry() {
  return { contracts: { experimentalRules: readContract("distribution-experimental-rules", "rules") } };
}

// ---- foundation ----

export function commerceFoundationRegistry() {
  return { contracts: { base: readDoc("commerce-base") } };
}

export function distributionFoundationRegistry() {
  const base = readDoc("distribution-base");
  return {
    enums: {
      partnerTypes: base.partnerTypes ?? [],
      paymentTerms: base.paymentTerms ?? [],
      priceTiers: base.priceTiers ?? [],
      receivableAgingBuckets: base.receivableAgingBuckets ?? [],
      purchaseOrderStatuses: base.purchaseOrderStatuses ?? [],
      returnReasons: base.returnReasons ?? [],
      ruleStatuses: base.ruleStatuses ?? [],
      documentTypes: base.documentTypes ?? [],
    },
    contracts: {
      base: { builtOnCommerce: base.builtOnCommerce ?? "commerce" },
      fields: readContract("distribution-fields", "fields"),
    },
  };
}

export function platformRegistry() {
  const base = readDoc("platform-base");
  return {
    builtOnCommerce: base.builtOnCommerce ?? "commerce",
    enums: {
      lifecycleObjects: base.lifecycleObjects ?? [],
      eventObjects: base.eventObjects ?? [],
      errorCategories: base.errorCategories ?? [],
    },
    contracts: {
      frontmatter: readContract("platform-frontmatter", "documents"),
      eventTypes: readContract("platform-event-types", "groups"),
      errorCodes: readContract("platform-error-codes", "errorCodes"),
    },
  };
}

// ---- bundle wrapper ----

export function bundle(type, members) {
  return {
    schemaVersion: "1.0.0",
    name: `plomus-${type}`,
    type,
    generatedAt: new Date().toISOString(),
    members,
  };
}
