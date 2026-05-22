import { readContract, readDoc } from "./group.mjs";
import { diff, readJson, unique } from "./read-json.mjs";
import { placementErrors } from "./taxonomy.mjs";

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

const base = readDoc("skills-base");
const skills = readContract("skills-catalog", "skills");
const routes = readContract("skills-proxy-routes", "routes");
const credentials = readContract("skills-credentials", "credentials");
const sources = readContract("skills-data-sources", "sources");
const categoryGroups = readContract("skills-categories", "categories");
const upstreamRegistry = readContract("skills-upstreams", "upstreams");
const packages = readContract("skills-packages", "packages");
const mcp = readDoc("skills-mcp");
const proxyConfig = readDoc("skills-proxy");

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
  requireString(scope, skill.subcategory, "subcategory");
  if (typeof skill.usesMcp !== "boolean") fail(scope, "usesMcp must be a boolean.");
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

// ---- folder-placement: catalog/data-sources/packages split by category ----
// Each item lives in the <category>.json file it declares, and that category is
// in base.categories. See docs/CONTRACT-TAXONOMY.md.
for (const [scope, message] of [
  ...placementErrors("skills-catalog", "skills", "category", categories),
  ...placementErrors("skills-data-sources", "sources", "category", categories),
  ...placementErrors("skills-packages", "packages", "category", categories),
]) {
  fail(scope, message);
}

// ---- coverage: every controlled category is used by at least one skill ----
const usedCategories = new Set(skills.map((s) => s.category));
const unusedCategories = categories.filter((c) => !usedCategories.has(c));
if (unusedCategories.length) {
  fail("base", `Categories defined but unused: ${unusedCategories.join(", ")}`);
}

// ---- categories.json: canonical + subcategory grouping ----
assertUnique("categories", "category", categoryGroups.map((g) => g.category));
const subcatByCat = new Map(categoryGroups.map((g) => [g.category, new Set(g.subcategories ?? [])]));
const missingCatGroups = diff(categories, categoryGroups.map((g) => g.category));
if (missingCatGroups.length) fail("categories", `categories.json missing canonical: ${missingCatGroups.join(", ")}`);
for (const g of categoryGroups) {
  if (!categories.includes(g.category)) fail(`category:${g.category}`, "not in base.categories.");
}
for (const skill of skills) {
  const set = subcatByCat.get(skill.category);
  if (set && !set.has(skill.subcategory)) {
    fail(`skill:${skill.skillId}`, `subcategory '${skill.subcategory}' not listed under category '${skill.category}' in categories.json.`);
  }
}

// ---- upstreams.json: registry resolves against base + credentials ----
assertUnique("upstreams", "upstreamId", upstreamRegistry.map((u) => u.upstreamId));
if (diff(upstreams, upstreamRegistry.map((u) => u.upstreamId)).length) fail("upstreams", "upstreams.json must cover every base.upstreams id.");
for (const u of upstreamRegistry) {
  const scope = `upstream:${u.upstreamId ?? "(missing)"}`;
  if (!upstreams.includes(u.upstreamId)) fail(scope, `not in base.upstreams: ${u.upstreamId}`);
  if (typeof u.requiresKey !== "boolean") fail(scope, "requiresKey must be a boolean.");
  if (u.credential && !envVarSet.has(u.credential)) fail(scope, `credential not in credentials: ${u.credential}`);
  if (u.requiresKey !== Boolean(u.credential)) fail(scope, "requiresKey must match presence of credential.");
}

// ---- packages.json: npm-package skills ----
const npmSkillIds = new Set(skills.filter((s) => s.implementationType === "npm-package").map((s) => s.skillId));
assertUnique("packages", "skillId", packages.map((p) => p.skillId));
for (const p of packages) {
  const scope = `package:${p.skillId ?? "(missing)"}`;
  if (!skillIdSet.has(p.skillId)) fail(scope, `unknown skillId: ${p.skillId}`);
  if (!npmSkillIds.has(p.skillId)) fail(scope, `skill is not implementationType npm-package: ${p.skillId}`);
  requireString(scope, p.packageName, "packageName");
}
const missingPkgs = [...npmSkillIds].filter((id) => !packages.some((p) => p.skillId === id));
if (missingPkgs.length) fail("packages", `npm-package skills missing from packages.json: ${missingPkgs.join(", ")}`);

// ---- mcp.json: named servers + mcpSkills consistent with catalog.usesMcp ----
const mcpSkillsCatalog = new Set(skills.filter((s) => s.usesMcp).map((s) => s.skillId));
for (const server of mcp.servers ?? []) {
  const scope = `mcp:${server.server ?? "(missing)"}`;
  requireString(scope, server.server, "server");
  for (const id of requireArray(scope, server.skills, "skills")) {
    if (!skillIdSet.has(id)) fail(scope, `unknown skill: ${id}`);
    else if (!mcpSkillsCatalog.has(id)) fail(scope, `skill '${id}' not marked usesMcp in catalog.`);
  }
}
const mcpSkillsList = mcp.mcpSkills ?? [];
if (diff([...mcpSkillsCatalog], mcpSkillsList).length || diff(mcpSkillsList, [...mcpSkillsCatalog]).length) {
  fail("mcp", "mcpSkills must match catalog skills with usesMcp=true.");
}

// ---- proxy.json: config + upstream base urls ----
const unknownProxyUpstreams = diff(Object.keys(proxyConfig.upstreamBaseUrls ?? {}), upstreams);
if (unknownProxyUpstreams.length) fail("proxy", `upstreamBaseUrls has unknown upstreams: ${unknownProxyUpstreams.join(", ")}`);
if (typeof proxyConfig.cacheTtlMs !== "number") fail("proxy", "cacheTtlMs must be a number.");
if (typeof proxyConfig.rateLimit?.max !== "number") fail("proxy", "rateLimit.max must be a number.");

if (failures.length) {
  console.error("skills contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}

console.log("skills contract validation passed");
