import { readContract, readDoc } from "./group.mjs";
import { readJson, unique } from "./read-json.mjs";

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

const base = readDoc("protocol-base");
const endpoints = readContract("protocol-endpoints", "endpoints");
const syncEvent = readDoc("protocol-sync-event");
const payloads = readContract("protocol-payloads", "payloads");
const telegram = readDoc("protocol-telegram");

// commerce baseline (read-only)
const commerceCore = readDoc("commerce-base").core ?? {};
const commercePayloadTypes = new Set(commerceCore.syncPayloadObjectTypes ?? []);
const commerceCloudCommands = new Set(commerceCore.cloudCommandTypes ?? []);

const eventSources = base.eventSources ?? [];
const httpMethods = base.httpMethods ?? [];
const telegramKinds = base.telegramCommandKinds ?? [];
const telegramStatuses = base.telegramCommandStatuses ?? [];
const BASE_ENUMS = { eventSources };

for (const [field, values] of Object.entries({ eventSources, httpMethods, telegramCommandKinds: telegramKinds, telegramCommandStatuses: telegramStatuses })) {
  assertUnique("base", field, values);
}
requireString("base", base.protocolVersion, "protocolVersion");

// ---- endpoints ----
assertUnique("endpoints", "name", endpoints.map((e) => e.name));
assertUnique("endpoints", "method+path", endpoints.map((e) => `${e.method} ${e.path}`));
const endpointKinds = new Set(["sync", "approval", "settings", "health"]);
const transports = new Set(["json", "sse"]);
for (const ep of endpoints) {
  const scope = `endpoint:${ep.name ?? "(missing)"}`;
  requireString(scope, ep.name, "name");
  requireString(scope, ep.path, "path");
  if (!httpMethods.includes(ep.method)) fail(scope, `Unknown method: ${ep.method}`);
  if (!endpointKinds.has(ep.kind)) fail(scope, `Unknown kind: ${ep.kind}`);
  if (!transports.has(ep.transport)) fail(scope, `Unknown transport: ${ep.transport}`);
}

// ---- sync event wire schema ----
const fieldValueTypes = new Set(["string", "number", "object", "boolean", "enum"]);
const fields = requireArray("sync-event", syncEvent.fields, "fields");
assertUnique("sync-event", "field", fields.map((f) => f.field));
for (const f of fields) {
  const scope = `sync-event:${f.field ?? "(missing)"}`;
  requireString(scope, f.field, "field");
  if (!fieldValueTypes.has(f.type)) fail(scope, `Unknown type: ${f.type}`);
  if (typeof f.required !== "boolean") fail(scope, "required must be a boolean.");
  if (f.type === "enum" && !(f.enum in BASE_ENUMS)) fail(scope, `enum not defined in base: ${f.enum}`);
}

// ---- payloads (objectType resolves against commerce) ----
assertUnique("payloads", "objectType", payloads.map((p) => p.objectType));
for (const p of payloads) {
  const scope = `payload:${p.objectType ?? "(missing)"}`;
  if (!commercePayloadTypes.has(p.objectType)) fail(scope, `objectType not in commerce syncPayloadObjectTypes: ${p.objectType}`);
  const req = requireArray(scope, p.requiredFields, "requiredFields");
  if (!req.includes("local_id")) fail(scope, "requiredFields must include local_id.");
  if (p.localIdPrefix !== null && typeof p.localIdPrefix !== "string") fail(scope, "localIdPrefix must be a string or null.");
}

// ---- telegram inbound commands ----
const commands = telegram.commands ?? [];
assertUnique("telegram", "kind", commands.map((c) => c.kind));
const statusDiff = (telegram.commandStatuses ?? []).filter((s) => !telegramStatuses.includes(s));
if (statusDiff.length) fail("telegram", `commandStatuses not in base: ${statusDiff.join(", ")}`);
for (const cmd of commands) {
  const scope = `telegram:${cmd.kind ?? "(missing)"}`;
  if (!telegramKinds.includes(cmd.kind)) fail(scope, `Unknown kind: ${cmd.kind}`);
  if (requireArray(scope, cmd.verbs, "verbs").length === 0) fail(scope, "verbs must not be empty.");
  if (cmd.mapsToCloudCommand !== null && !commerceCloudCommands.has(cmd.mapsToCloudCommand)) {
    fail(scope, `mapsToCloudCommand not in commerce cloudCommandTypes: ${cmd.mapsToCloudCommand}`);
  }
}

if (failures.length) {
  console.error("protocol contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}
console.log("protocol contract validation passed");
