import { diff, readJson, unique } from "./read-json.mjs";

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });

function requireString(scope, value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(scope, `${field} must be a non-empty string.`);
    return "";
  }
  return value;
}

function requireArray(scope, value, field) {
  if (!Array.isArray(value)) {
    fail(scope, `${field} must be an array.`);
    return [];
  }
  return value;
}

function assertUnique(scope, field, values) {
  if (!unique(values)) fail(scope, `${field} has duplicate values.`);
}

const base = readJson("contracts/skills/v1/base.json");
const skills = readJson("contracts/skills/v1/catalog.json").skills ?? [];
const routes = readJson("contracts/skills/v1/proxy-routes.json").routes ?? [];
const credentials = readJson("contracts/skills/v1/credentials.json").credentials ?? [];
const sources = readJson("contracts/skills/v1/data-sources.json").sources ?? [];

const categories = base.categories ?? [];
const locales = base.locales ?? [];
const phases = base.lifecyclePhases ?? [];
const implementationTypes = base.implementationTypes ?? [];
const authTypes = base.authTypes ?? [];
const upstreams = base.upstreams ?? [];

for (const required of [
  "schemaVersion",
  "categories",
  "locales",
  "lifecyclePhases",
  "implementationTypes",
  "authTypes",
  "upstreams",
]) {
  if (!(required in base)) fail("base", `Missing ${required}.`);
}

assertUnique("base", "categories", categories);
assertUnique("base", "locales", locales);
assertUnique("base", "lifecyclePhases", phases);
assertUnique("base", "implementationTypes", implementationTypes);
assertUnique("base", "authTypes", authTypes);
assertUnique("base", "upstreams", upstreams);

const skillIds = skills.map((s) => s.skillId);
const routeIds = routes.map((r) => r.routeId);
const credentialEnvVars = credentials.map((c) => c.envVar);
const routeSkillSet = new Set(routes.flatMap((r) => r.skills ?? []));

assertUnique("catalog", "skillId", skillIds);
assertUnique("proxy-routes", "routeId", routeIds);
assertUnique("proxy-routes", "path", routes.map((r) => `${r.method} ${r.path}`));
assertUnique("credentials", "envVar", credentialEnvVars);

const skillIdSet = new Set(skillIds);
const routeIdSet = new Set(routeIds);
const envVarSet = new Set(credentialEnvVars);

// ---- catalog ----
for (const skill of skills) {
  const scope = `skill:${skill.skillId ?? "(missing)"}`;
  requireString(scope, skill.skillId, "skillId");
  requireString(scope, skill.description, "description");
  requireString(scope, skill.license, "license");

  if (!categories.includes(skill.category)) fail(scope, `Unknown category: ${skill.category}`);
  if (!locales.includes(skill.locale)) fail(scope, `Unknown locale: ${skill.locale}`);
  if (!phases.includes(skill.phase)) fail(scope, `Unknown phase: ${skill.phase}`);
  if (!implementationTypes.includes(skill.implementationType)) {
    fail(scope, `Unknown implementationType: ${skill.implementationType}`);
  }
  if (skill.implementationType === "npm-package" && !skill.package) {
    fail(scope, "npm-package skills must declare a package path.");
  }
  if (skill.implementationType !== "npm-package" && skill.package) {
    fail(scope, `Non-package skill must not declare package: ${skill.package}`);
  }

  const proxyRoutes = requireArray(scope, skill.proxyRoutes ?? [], "proxyRoutes");
  const unknownRoutes = diff(proxyRoutes, routeIds);
  if (unknownRoutes.length) fail(scope, `Unknown proxyRoutes: ${unknownRoutes.join(", ")}`);
  if (skill.usesProxy && proxyRoutes.length === 0) {
    fail(scope, "usesProxy is true but proxyRoutes is empty.");
  }
  if (!skill.usesProxy && proxyRoutes.length > 0) {
    fail(scope, "proxyRoutes is non-empty but usesProxy is false.");
  }
  if (skill.usesProxy !== routeSkillSet.has(skill.skillId)) {
    fail(scope, "usesProxy disagrees with proxy-routes skill mapping.");
  }

  const requiredEnv = requireArray(scope, skill.requiredEnv ?? [], "requiredEnv");
  const unknownEnv = diff(requiredEnv, credentialEnvVars);
  if (unknownEnv.length) fail(scope, `Unknown requiredEnv: ${unknownEnv.join(", ")}`);
}

// ---- proxy-routes ----
for (const route of routes) {
  const scope = `route:${route.routeId ?? "(missing)"}`;
  requireString(scope, route.routeId, "routeId");
  requireString(scope, route.path, "path");
  if (!["GET", "POST"].includes(route.method)) fail(scope, `Unknown method: ${route.method}`);
  if (!upstreams.includes(route.upstream)) fail(scope, `Unknown upstream: ${route.upstream}`);

  // Governance: the proxy is for keyed upstreams only (k-skill AGENTS.md inclusion rule).
  if (!route.credential) {
    fail(scope, "proxy route must require a credential (proxy is for keyed upstreams only).");
  } else if (!envVarSet.has(route.credential)) {
    fail(scope, `Unknown credential: ${route.credential}`);
  }

  const routeSkills = requireArray(scope, route.skills ?? [], "skills");
  if (routeSkills.length === 0) fail(scope, "route must serve at least one skill.");
  const unknownSkills = routeSkills.filter((id) => !skillIdSet.has(id));
  if (unknownSkills.length) fail(scope, `Unknown skills: ${unknownSkills.join(", ")}`);
}

// ---- credentials ----
for (const credential of credentials) {
  const scope = `credential:${credential.envVar ?? "(missing)"}`;
  requireString(scope, credential.envVar, "envVar");
  if (!upstreams.includes(credential.upstream)) fail(scope, `Unknown upstream: ${credential.upstream}`);
  if (!["api-key", "session"].includes(credential.credentialType)) {
    fail(scope, `Unknown credentialType: ${credential.credentialType}`);
  }
  if (typeof credential.proxyManaged !== "boolean") fail(scope, "proxyManaged must be a boolean.");
  const usedBy = requireArray(scope, credential.usedBySkills ?? [], "usedBySkills");
  const unknownUsedBy = diff(usedBy, skillIds);
  if (unknownUsedBy.length) fail(scope, `Unknown usedBySkills: ${unknownUsedBy.join(", ")}`);
}

// alias collisions across the whole registry
const aliasAll = credentials.flatMap((c) => c.aliases ?? []);
assertUnique("credentials", "aliases", [...aliasAll, ...credentialEnvVars]);

// ---- data-sources ----
const sourceSkillIds = sources.map((s) => s.skillId);
assertUnique("data-sources", "skillId", sourceSkillIds);
for (const source of sources) {
  const scope = `data-source:${source.skillId ?? "(missing)"}`;
  if (!skillIdSet.has(source.skillId)) fail(scope, `Unknown skillId: ${source.skillId}`);
  if (!authTypes.includes(source.authType)) fail(scope, `Unknown authType: ${source.authType}`);
  if (typeof source.proxyBacked !== "boolean") fail(scope, "proxyBacked must be a boolean.");
  const unknownUpstreams = diff(source.upstreams ?? [], upstreams);
  if (unknownUpstreams.length) fail(scope, `Unknown upstreams: ${unknownUpstreams.join(", ")}`);
}

// ---- coverage: every skill has exactly one data-source entry ----
const missingSources = diff(skillIds, sourceSkillIds);
if (missingSources.length) fail("data-sources", `Missing entries for skills: ${missingSources.join(", ")}`);
const staleSources = diff(sourceSkillIds, skillIds);
if (staleSources.length) fail("data-sources", `Entries for unknown skills: ${staleSources.join(", ")}`);

// ---- coverage: every route skill is a proxy-using catalog skill ----
for (const skillId of routeSkillSet) {
  const skill = skills.find((s) => s.skillId === skillId);
  if (skill && !skill.usesProxy) {
    fail("proxy-routes", `Route maps to ${skillId} but catalog marks usesProxy=false.`);
  }
}

// ---- coverage: every controlled category is used by at least one skill ----
const usedCategories = new Set(skills.map((s) => s.category));
const unusedCategories = categories.filter((c) => !usedCategories.has(c));
if (unusedCategories.length) {
  fail("base", `Categories defined but unused: ${unusedCategories.join(", ")}`);
}

if (failures.length) {
  console.error("skills contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}

console.log("skills contract validation passed");
