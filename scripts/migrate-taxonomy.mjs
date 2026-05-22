import { readContract, writeGroup } from "./group.mjs";
import { REVIEW_SCOPE_TO_UNIT, RULE_DOMAIN_TO_UNIT, DIST_DOMAIN_TO_UNIT, unitFrom } from "./taxonomy.mjs";

// One-time: re-classify contract folders per docs/CONTRACT-TAXONOMY.md.
//  - operational task contracts gain an explicit `businessUnit` and split by it
//  - skills (functional) split by `category` (not the finer subcategory)
//  - skills reference lists carry the owning skill's `category`

const skillCategory = new Map(readContract("skills-catalog", "skills").map((s) => [s.skillId, s.category]));

// 1) operational task contracts → businessUnit
const rules = readContract("commerce-review-rules", "reviewRules").map((r) => ({ ...r, businessUnit: unitFrom(RULE_DOMAIN_TO_UNIT, r.domain) }));
writeGroup("commerce-review-rules", "reviewRules", rules, (r) => r.businessUnit);

const workflows = readContract("commerce-workflows", "workflows").map((w) => ({ ...w, businessUnit: unitFrom(REVIEW_SCOPE_TO_UNIT, w.reviewScope) }));
writeGroup("commerce-workflows", "workflows", workflows, (w) => w.businessUnit);

const distRules = readContract("distribution-experimental-rules", "rules").map((r) => ({ ...r, businessUnit: unitFrom(DIST_DOMAIN_TO_UNIT, r.domain) }));
writeGroup("distribution-experimental-rules", "rules", distRules, (r) => r.businessUnit);

// 2) skills functional contracts → category
writeGroup("skills-catalog", "skills", readContract("skills-catalog", "skills"), (s) => s.category);

const sources = readContract("skills-data-sources", "sources").map((s) => ({ ...s, category: skillCategory.get(s.skillId) ?? "tooling" }));
writeGroup("skills-data-sources", "sources", sources, (s) => s.category);

const packages = readContract("skills-packages", "packages").map((p) => ({ ...p, category: skillCategory.get(p.skillId) ?? "tooling" }));
writeGroup("skills-packages", "packages", packages, (p) => p.category);

const summarize = (name, key, axis) => {
  const items = readContract(name, key);
  const units = new Set(items.map(axis));
  console.log(`${name}: ${items.length} items → ${units.size} folders`);
};
summarize("commerce-review-rules", "reviewRules", (r) => r.businessUnit);
summarize("commerce-workflows", "workflows", (w) => w.businessUnit);
summarize("distribution-experimental-rules", "rules", (r) => r.businessUnit);
summarize("skills-catalog", "skills", (s) => s.category);
summarize("skills-data-sources", "sources", (s) => s.category);
summarize("skills-packages", "packages", (p) => p.category);
