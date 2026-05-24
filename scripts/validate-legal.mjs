import { readContract, readDoc } from "./group.mjs";
import { unique } from "./read-json.mjs";
import { BUSINESS_UNITS, placementErrors } from "./taxonomy.mjs";

// Legal contract: the legal documents an agent/operator must surface or honour
// (ToS, privacy, e-commerce disclosure, partner agreement, refund policy) plus the
// 전자상거래법 disclosure items each e-commerce listing must show. governs* fields
// resolve against the canonical business-unit vocabulary.

const failures = [];
const fail = (scope, message) => failures.push({ scope, message });
const requireString = (scope, value, field) => {
  if (typeof value !== "string" || value.trim() === "") fail(scope, `${field} must be a non-empty string.`);
};
const assertUnique = (scope, field, values) => {
  if (!unique(values)) fail(scope, `${field} has duplicate values.`);
};
const inSet = (scope, value, set, field) => {
  if (!set.has(value)) fail(scope, `Unknown ${field}: ${value}`);
};

const base = readDoc("legal-base");
const documents = readContract("legal-documents", "documents");
const disclosures = readContract("legal-disclosures", "disclosures");

const documentTypes = new Set(base.documentTypes ?? []);
const jurisdictions = new Set(base.jurisdictions ?? []);
const audiences = new Set(base.audiences ?? []);
const consentTypes = new Set(base.consentTypes ?? []);
const statuses = new Set(base.statuses ?? []);
const units = new Set(BUSINESS_UNITS);

// ---- base enums unique ----
for (const [field, values] of Object.entries({
  documentTypes: base.documentTypes ?? [],
  jurisdictions: base.jurisdictions ?? [],
  audiences: base.audiences ?? [],
  consentTypes: base.consentTypes ?? [],
})) {
  assertUnique("base", field, values);
}

// ---- legal documents (filed by documentType — placement enforced generically) ----
assertUnique("documents", "documentId", documents.map((d) => d.documentId));
for (const d of documents) {
  const scope = `document:${d.documentId ?? "(missing)"}`;
  requireString(scope, d.documentId, "documentId");
  requireString(scope, d.version, "version");
  requireString(scope, d.summary, "summary");
  requireString(scope, d.legalBasis, "legalBasis");
  inSet(scope, d.documentType, documentTypes, "documentType");
  inSet(scope, d.audience, audiences, "audience");
  inSet(scope, d.jurisdiction, jurisdictions, "jurisdiction");
  inSet(scope, d.requiredConsent, consentTypes, "requiredConsent");
  inSet(scope, d.status, statuses, "status");
  for (const u of d.governsBusinessUnits ?? []) {
    if (!units.has(u)) fail(scope, `governsBusinessUnit not a canonical unit: ${u}`);
  }
}

// ---- disclosures (전자상거래법 표시의무), filed by business unit ----
for (const [scope, message] of placementErrors("legal-disclosures", "disclosures", "businessUnit", BUSINESS_UNITS)) {
  fail(scope, message);
}
assertUnique("disclosures", "disclosureId", disclosures.map((d) => d.disclosureId));
for (const d of disclosures) {
  const scope = `disclosure:${d.disclosureId ?? "(missing)"}`;
  requireString(scope, d.disclosureId, "disclosureId");
  requireString(scope, d.field, "field");
  requireString(scope, d.legalBasis, "legalBasis");
  inSet(scope, d.documentType, documentTypes, "documentType");
  inSet(scope, d.status, statuses, "status");
}

if (failures.length) {
  console.error("legal contract validation failed");
  for (const failure of failures) console.error(`- [${failure.scope}] ${failure.message}`);
  process.exit(1);
}

console.log("legal contract validation passed");
