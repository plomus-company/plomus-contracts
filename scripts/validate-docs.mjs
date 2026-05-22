import fs from "node:fs";
import path from "node:path";
import { readContract, readDoc } from "./group.mjs";
import { repoRoot } from "./read-json.mjs";

// Markdown docs hardcode contract counts (README scale table, docs/contracts/*
// section headers and tables, IMPLEMENTATION-SPEC). check:ci validates the JSON
// but not these prose numbers, so they drift silently when contracts are
// regenerated. This validator computes each count from the live contracts and
// asserts the doc still contains the matching token. Each needle embeds the
// computed value, so a contract change re-renders the needle and a stale doc
// fails until it is updated.

const n = (name, key) => readContract(name, key).length;
// Unique subcategory names — a few (lifestyle, utility) are listed under more
// than one category, so this is a Set, not a sum across groups.
const subcatTotal = new Set(
  readContract("skills-categories", "categories").flatMap((g) => g.subcategories ?? []),
).size;

const c = {
  // commerce
  presets: n("commerce-presets", "presets"),
  rules: n("commerce-review-rules", "reviewRules"),
  workflows: n("commerce-workflows", "workflows"),
  // skills
  catalog: n("skills-catalog", "skills"),
  routes: n("skills-proxy-routes", "routes"),
  creds: n("skills-credentials", "credentials"),
  sources: n("skills-data-sources", "sources"),
  categories: (readDoc("skills-base").categories ?? []).length,
  subcat: subcatTotal,
  upstreams: n("skills-upstreams", "upstreams"),
  packages: n("skills-packages", "packages"),
  usesMcp: readContract("skills-catalog", "skills").filter((s) => s.usesMcp).length,
  // benchmarks
  models: n("benchmarks-models", "models"),
  metrics: n("benchmarks-metrics", "metrics"),
  targets: n("benchmarks-targets", "targets"),
  results: n("benchmarks-results", "results"),
  rollups: n("benchmarks-rollups", "rollups"),
  // distribution
  distPresets: n("distribution-presets", "presets"),
  distFields: n("distribution-fields", "fields"),
  distRules: n("distribution-experimental-rules", "rules"),
  // protocol
  endpoints: n("protocol-endpoints", "endpoints"),
  syncFields: (readDoc("protocol-sync-event").fields ?? []).length,
  payloads: n("protocol-payloads", "payloads"),
  telegram: n("protocol-telegram", "commands"),
  // platform
  frontmatter: n("platform-frontmatter", "documents"),
  eventGroups: n("platform-event-types", "groups"),
  errorCodes: n("platform-error-codes", "errorCodes"),
  // governance
  roles: n("governance-roles", "roles"),
  execStates: (readDoc("governance-execution-lifecycle").states ?? []).length,
  cmdStates: (readDoc("governance-base").commandStates ?? []).length,
  approvalPolicies: (readDoc("governance-approval").policies ?? []).length,
  // gameops
  adapters: n("gameops-adapters", "adapters"),
  agents: n("gameops-agents", "agents"),
  playbooks: n("gameops-playbooks", "playbooks"),
  gameFields: n("gameops-fields", "fields"),
  intents: (readDoc("gameops-base").intents ?? []).length,
};

// Each entry: a doc file and the exact substrings that must appear, rendered
// with the computed counts. If a count changes, the substring changes and the
// stale doc no longer contains it.
const docChecks = {
  "README.md": [
    // contract-role scale table (aggregate cells)
    `skill ${c.catalog} · route ${c.routes} · credential ${c.creds} · upstream ${c.upstreams} · package ${c.packages} · endpoint ${c.endpoints} · payload ${c.payloads} · adapter ${c.adapters}`,
    `agent ${c.agents} · playbook ${c.playbooks} · intent ${c.intents} · field ${c.gameFields}`,
    `preset ${c.presets} · workflow ${c.workflows} · dist-preset ${c.distPresets}`,
    `rule ${c.rules} · role ${c.roles} · 실행상태 ${c.execStates} · 승인정책 ${c.approvalPolicies} · EXPERIMENTAL 규칙 ${c.distRules}`,
    `frontmatter ${c.frontmatter} · 이벤트그룹 ${c.eventGroups} · error code ${c.errorCodes} · 필드 ${c.distFields}`,
    `model ${c.models} · metric ${c.metrics} · target ${c.targets} · result ${c.results}`,
    // tool detail
    `카탈로그(${c.catalog})`,
    `allowlist(${c.routes})`,
    `레지스트리(${c.creds})`,
    `의존(${c.sources})`,
    `category(${c.categories})·subcategory(${c.subcat})`,
    `packages.json(${c.packages})`,
    `사용 스킬(${c.usesMcp})`,
    `sync-event 필드(${c.syncFields})`,
    // agent / task / governance / foundation / benchmarks detail
    `에이전트(${c.agents})·playbook(${c.playbooks})·intent(${c.intents})·게임 필드(${c.gameFields})`,
    `preset(${c.presets})·hermes workflow(${c.workflows})`,
    `상태기계(${c.execStates}`,
    `review rule(${c.rules})`,
    `EXPERIMENTAL 규칙(${c.distRules})`,
    `frontmatter 필드(${c.distFields})`,
    `이벤트 분류(${c.eventGroups} 그룹)`,
    `model(${c.models})·metric(${c.metrics})·target(${c.targets})·result(${c.results})·rollup(${c.rollups})`,
  ],
  "docs/IMPLEMENTATION-SPEC.md": [
    `preset ${c.presets}, rule ${c.rules}, workflow ${c.workflows}`,
    `skill ${c.catalog}, route ${c.routes}, credential ${c.creds}`,
    `model ${c.models}, metric ${c.metrics}, target ${c.targets}, result ${c.results}`,
  ],
  "docs/contracts/benchmarks.md": [
    `모델 레지스트리 (${c.models})`,
    `지표 정의 (${c.metrics})`,
    `벤치마크 대상 (${c.targets})`,
    `측정값 (${c.results})`,
    `도메인 롤업 (${c.rollups})`,
  ],
  "docs/contracts/skills.md": [
    `카테고리(${c.categories})`,
    `subcategory(${c.subcat})`,
    `레지스트리(${c.upstreams})`,
    `패키지(${c.packages})`,
    `스킬(${c.usesMcp})`,
  ],
  "docs/contracts/protocol.md": [
    `표면(${c.endpoints})`,
    `스키마(${c.syncFields} 필드)`,
    `객체타입(${c.payloads})`,
    `명령(${c.telegram})`,
  ],
  "docs/contracts/platform.md": [
    `필수필드(${c.frontmatter})`,
    `이벤트 분류(${c.eventGroups} 그룹)`,
    `error code(${c.errorCodes})`,
  ],
  "docs/contracts/governance.md": [
    `roles(${c.roles})`,
    `executionStates(${c.execStates})`,
    `commandStates(${c.cmdStates})`,
  ],
  "docs/contracts/gameops.md": [
    `intents(${c.intents})`,
    `어댑터(${c.adapters})`,
    `에이전트(${c.agents})`,
    `playbook(${c.playbooks})`,
    `바인딩(${c.gameFields})`,
  ],
};

const failures = [];
for (const [relPath, needles] of Object.entries(docChecks)) {
  const file = path.join(repoRoot, relPath);
  if (!fs.existsSync(file)) continue; // not part of this registry root (e.g. fixture)
  const text = fs.readFileSync(file, "utf8");
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${relPath}: missing or stale count — expected to find "${needle}"`);
  }
}

if (failures.length) {
  console.error("doc count validation failed");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log("doc count validation passed");
