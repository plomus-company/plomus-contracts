import { diff, readJson, unique } from "./read-json.mjs";

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });
const requireString = (scope, value, field) => {
  if (typeof value !== "string" || value.trim() === "") fail(scope, `${field} must be a non-empty string.`);
};
const requireArray = (scope, value, field) => {
  if (!Array.isArray(value)) {
    fail(scope, `${field} must be an array.`);
    return [];
  }
  return value;
};
const assertUnique = (scope, field, values) => {
  if (!unique(values)) fail(scope, `${field} has duplicate values.`);
};

const base = readJson("contracts/platform/v1/base.json");
const documents = readJson("contracts/platform/v1/frontmatter.json").documents ?? [];
const groups = readJson("contracts/platform/v1/event-types.json").groups ?? [];
const errorCodes = readJson("contracts/platform/v1/error-codes.json").errorCodes ?? [];

// commerce baseline (read-only)
const commerceBase = readJson("contracts/v1/base.json");
const commerceDocTypes = new Set([...(commerceBase.documentTypes ?? []), ...(commerceBase.core?.markdownObjectTypes ?? [])]);
const commerceEventTypes = new Set(commerceBase.core?.syncEventTypes ?? []);

const lifecycleObjects = base.lifecycleObjects ?? [];
const eventObjects = base.eventObjects ?? [];
const errorCategories = base.errorCategories ?? [];

for (const [field, values] of Object.entries({ lifecycleObjects, eventObjects, errorCategories })) {
  assertUnique("base", field, values);
}

// ---- frontmatter (P2 / A2): document statuses + required fields ----
assertUnique("frontmatter", "documentType", documents.map((d) => d.documentType));
const lifecycleSet = new Set(lifecycleObjects);
for (const doc of documents) {
  const scope = `frontmatter:${doc.documentType ?? "(missing)"}`;
  requireString(scope, doc.documentType, "documentType");
  if (!commerceDocTypes.has(doc.documentType)) fail(scope, `documentType not in commerce documentTypes: ${doc.documentType}`);

  // status is optional: domain objects carry a lifecycle status enum, profile/
  // review documents do not. Only documents with a non-empty status enum are
  // lifecycle objects, and exactly those must be listed in base.lifecycleObjects.
  const statuses = requireArray(scope, doc.statuses ?? [], "statuses");
  const hasLifecycle = statuses.length > 0;
  if (hasLifecycle) {
    requireString(scope, doc.statusField, "statusField");
    assertUnique(scope, "statuses", statuses);
    if (!lifecycleSet.has(doc.documentType)) fail(scope, `status-bearing document not in base.lifecycleObjects: ${doc.documentType}`);
  } else if (lifecycleSet.has(doc.documentType)) {
    fail(scope, `documentType in base.lifecycleObjects but has no status enum: ${doc.documentType}`);
  }
  for (const [name, values] of Object.entries(doc.extraEnums ?? {})) {
    assertUnique(scope, `extraEnums.${name}`, requireArray(scope, values, `extraEnums.${name}`));
  }
  const req = requireArray(scope, doc.requiredFields, "requiredFields");
  if (req.length === 0) fail(scope, "requiredFields must not be empty.");
  for (const must of ["type", "local_id"]) {
    if (!req.includes(must)) fail(scope, `requiredFields must include ${must}.`);
  }
}
// every declared lifecycle object must have a frontmatter document
const docTypeSet = new Set(documents.map((d) => d.documentType));
for (const obj of lifecycleObjects) {
  if (!docTypeSet.has(obj)) fail("frontmatter", `lifecycleObject has no frontmatter document: ${obj}`);
}

// ---- event-types (P3): per-object taxonomy, union ⊆ commerce ----
assertUnique("event-types", "object", groups.map((g) => g.object));
const eventObjectSet = new Set(eventObjects);
const allEvents = [];
for (const group of groups) {
  const scope = `event-group:${group.object ?? "(missing)"}`;
  if (!eventObjectSet.has(group.object)) fail(scope, `object not in base.eventObjects: ${group.object}`);
  const events = requireArray(scope, group.events, "events");
  if (events.length === 0) fail(scope, "events must not be empty.");
  assertUnique(scope, "events", events);
  const unknown = events.filter((e) => !commerceEventTypes.has(e));
  if (unknown.length) fail(scope, `events not in commerce syncEventTypes: ${unknown.join(", ")}`);
  allEvents.push(...events);
}
assertUnique("event-types", "events across groups", allEvents);
// every commerce sync event type should be owned by exactly one group
const orphanCommerceEvents = diff([...commerceEventTypes], allEvents);
if (orphanCommerceEvents.length) {
  fail("event-types", `commerce syncEventTypes not assigned to any group: ${orphanCommerceEvents.join(", ")}`);
}

// ---- error codes (P4) ----
assertUnique("error-codes", "code", errorCodes.map((e) => e.code));
const categorySet = new Set(errorCategories);
for (const ec of errorCodes) {
  const scope = `error-code:${ec.code ?? "(missing)"}`;
  requireString(scope, ec.code, "code");
  if (!categorySet.has(ec.category)) fail(scope, `Unknown category: ${ec.category}`);
}

if (failures.length) {
  console.error("platform contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}
console.log("platform contract validation passed");
