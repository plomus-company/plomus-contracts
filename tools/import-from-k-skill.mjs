import { writeDoc, writeGroup } from "../scripts/group.mjs";
import fs from "node:fs";
import path from "node:path";
import { writeJson } from "../scripts/read-json.mjs";

// Single source of truth for the k-skill contract domain.
//
// This tool reads the sibling k-skill repository (per-skill SKILL.md frontmatter)
// and combines it with the curated maps below to emit the committed contracts in
// contracts/tool/skills-*. It references k-skill as a data source; it does not copy
// k-skill's directory layout. Run with: pnpm run import:k-skill
//
// CI validates the committed JSON, so k-skill does not need to be present there.

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const kSkillRoot = process.env.K_SKILL_PATH ?? path.resolve(repoRoot, "../k-skill");

const NON_SKILL_DIRS = new Set([
  "docs",
  "examples",
  "packages",
  "python-packages",
  "scripts",
  "tools",
]);

// ---- controlled vocabularies (redesigned from k-skill's 37 fragmented categories) ----
const CATEGORIES = [
  "commerce",
  "finance",
  "real-estate",
  "travel",
  "mobility",
  "legal",
  "government",
  "health",
  "food",
  "documents",
  "writing",
  "sports",
  "media",
  "utility",
  "tooling",
];
const LOCALES = ["ko-KR"];
const LIFECYCLE_PHASES = ["v1", "v1.5", "v2"];
const IMPLEMENTATION_TYPES = ["npm-package", "python-script", "skill-md-only"];
const AUTH_TYPES = ["none", "api-key", "session"];
const UPSTREAMS = [
  "airkorea",
  "kma",
  "seoul-open-data",
  "hrfco",
  "opinet",
  "data-go-kr",
  "data4library",
  "foodsafety-korea",
  "neis",
  "krx",
  "kakao",
  "kosis",
  "naver",
  "blue-ribbon",
  "dart",
  "kipris",
  "odsay",
  "lolesports",
];

// Canonical category for every k-skill (raw frontmatter categories are consolidated here).
const CATEGORY_OF = {
  // commerce
  "bunjang-search": "commerce",
  "daangn-used-goods-search": "commerce",
  "daangn-cars-search": "commerce",
  "daangn-jobs-search": "commerce",
  "coupang-product-search": "commerce",
  "daiso-product-search": "commerce",
  "danawa-price-search": "commerce",
  "market-kurly-search": "commerce",
  "naver-shopping-search": "commerce",
  "ohou-today-deal": "commerce",
  "olive-young-search": "commerce",
  "used-car-price-search": "commerce",
  // finance
  "daishin-report-search": "finance",
  "k-dart": "finance",
  "korean-jangbu-for": "finance",
  "korean-stock-search": "finance",
  "toss-securities": "finance",
  // real-estate
  "court-auction-notice-search": "real-estate",
  "daangn-realty-search": "real-estate",
  "gongsijiga-search": "real-estate",
  "lh-notice-search": "real-estate",
  "real-estate-search": "real-estate",
  "sh-notice-search": "real-estate",
  // travel
  "express-bus-booking": "travel",
  "intercity-bus-booking": "travel",
  "ktx-booking": "travel",
  "srt-booking": "travel",
  "flight-ticket-search": "travel",
  "foresttrip-vacancy": "travel",
  "myrealtrip-search": "travel",
  // mobility
  "seoul-subway-arrival": "mobility",
  "korean-transit-route": "mobility",
  "subway-lost-property": "mobility",
  "cheap-gas-nearby": "mobility",
  "hipass-receipt": "mobility",
  "delivery-tracking": "mobility",
  // legal
  "corporate-registration-consulting": "legal",
  "iros-registry-automation": "legal",
  "korean-law-search": "legal",
  "korean-privacy-terms": "legal",
  "korean-patent-search": "legal",
  // government
  "kosis-stats": "government",
  "kstartup-search": "government",
  "local-election-candidate-search": "government",
  "korean-scholarship-search": "government",
  "nts-business-registration": "government",
  // health
  "emergency-room-beds": "health",
  "gangnamunni-clinic-search": "health",
  "mfds-drug-safety": "health",
  "mfds-food-safety": "health",
  // food
  "blue-ribbon-nearby": "food",
  "hola-poke-yeoksam": "food",
  "kakao-bar-nearby": "food",
  "catchtable-sniper": "food",
  "k-schoollunch-menu": "food",
  // documents
  hwp: "documents",
  "rhwp-advanced": "documents",
  "rhwp-edit": "documents",
  // writing
  "korean-character-count": "writing",
  "korean-slang-writing": "writing",
  "korean-spell-check": "writing",
  // sports
  "kbl-results": "sports",
  "kbo-results": "sports",
  "kleague-results": "sports",
  "lck-analytics": "sports",
  "korean-marathon-schedule": "sports",
  // media
  "geeknews-search": "media",
  "naver-news-search": "media",
  "naver-blog-research": "media",
  "korean-cinema-search": "media",
  "joseon-sillok-search": "media",
  "ticket-availability": "media",
  // utility
  "korea-weather": "utility",
  "fine-dust-location": "utility",
  "han-river-water-level": "utility",
  "household-waste-info": "utility",
  "seoul-density": "utility",
  "donation-place-search": "utility",
  "parking-lot-search": "utility",
  "public-restroom-nearby": "utility",
  "zipcode-search": "utility",
  "library-book-search": "utility",
  "lotto-results": "utility",
  // tooling
  "k-skill-setup": "tooling",
  "k-skill-cleaner": "tooling",
  "kakaotalk-mac": "tooling",
};

// User-facing credentials the end user must set themselves (proxy-managed keys excluded).
const REQUIRED_ENV = {
  "k-dart": ["API_K_DART"],
  "korean-patent-search": ["KIPRIS_PLUS_API_KEY"],
  "korean-transit-route": ["ODSAY_API_KEY"],
  "lck-analytics": ["LOLESPORTS_API_KEY"],
  "public-restroom-nearby": ["KAKAO_REST_API_KEY"],
};

// Credential registry. proxyManaged=true means k-skill-proxy holds the key server-side.
const CREDENTIALS = [
  { envVar: "AIR_KOREA_OPEN_API_KEY", upstream: "airkorea", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["fine-dust-location"] },
  { envVar: "KMA_OPEN_API_KEY", upstream: "kma", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["korea-weather"] },
  { envVar: "SEOUL_OPEN_API_KEY", upstream: "seoul-open-data", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["seoul-subway-arrival", "seoul-density"] },
  { envVar: "HRFCO_OPEN_API_KEY", upstream: "hrfco", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["han-river-water-level"] },
  { envVar: "OPINET_API_KEY", upstream: "opinet", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["cheap-gas-nearby"] },
  { envVar: "DATA_GO_KR_API_KEY", upstream: "data-go-kr", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["real-estate-search", "lh-notice-search", "parking-lot-search", "household-waste-info", "nts-business-registration", "kstartup-search", "mfds-drug-safety", "mfds-food-safety"] },
  { envVar: "DATA4LIBRARY_AUTH_KEY", upstream: "data4library", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["library-book-search"] },
  { envVar: "FOODSAFETYKOREA_API_KEY", upstream: "foodsafety-korea", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["mfds-food-safety"] },
  { envVar: "KEDU_INFO_KEY", upstream: "neis", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["k-schoollunch-menu"] },
  { envVar: "KRX_API_KEY", upstream: "krx", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["korean-stock-search"] },
  { envVar: "KAKAO_REST_API_KEY", upstream: "kakao", credentialType: "api-key", proxyManaged: true, aliases: [], usedBySkills: ["korean-transit-route", "public-restroom-nearby"] },
  { envVar: "KOSIS_API_KEY", upstream: "kosis", credentialType: "api-key", proxyManaged: true, aliases: ["KSKILL_KOSIS_API_KEY"], usedBySkills: ["kosis-stats"] },
  { envVar: "NAVER_SEARCH_CLIENT_ID", upstream: "naver", credentialType: "api-key", proxyManaged: true, aliases: ["NAVER_CLIENT_ID"], usedBySkills: ["naver-news-search", "naver-shopping-search"] },
  { envVar: "NAVER_SEARCH_CLIENT_SECRET", upstream: "naver", credentialType: "api-key", proxyManaged: true, aliases: ["NAVER_CLIENT_SECRET"], usedBySkills: ["naver-news-search", "naver-shopping-search"] },
  { envVar: "BLUE_RIBBON_SESSION_ID", upstream: "blue-ribbon", credentialType: "session", proxyManaged: true, aliases: [], usedBySkills: ["blue-ribbon-nearby"] },
  { envVar: "API_K_DART", upstream: "dart", credentialType: "api-key", proxyManaged: false, aliases: [], usedBySkills: ["k-dart"] },
  { envVar: "KIPRIS_PLUS_API_KEY", upstream: "kipris", credentialType: "api-key", proxyManaged: false, aliases: [], usedBySkills: ["korean-patent-search"] },
  { envVar: "ODSAY_API_KEY", upstream: "odsay", credentialType: "api-key", proxyManaged: false, aliases: [], usedBySkills: ["korean-transit-route"] },
  { envVar: "LOLESPORTS_API_KEY", upstream: "lolesports", credentialType: "api-key", proxyManaged: false, aliases: [], usedBySkills: ["lck-analytics"] },
  { envVar: "KSKILL_KSTARTUP_API_KEY", upstream: "data-go-kr", credentialType: "api-key", proxyManaged: false, aliases: [], usedBySkills: ["kstartup-search"] },
];

// k-skill-proxy allowlist (data routes only; /health and the AirKorea passthrough are omitted).
const PROXY_ROUTES = [
  { routeId: "fine-dust-report", path: "/v1/fine-dust/report", method: "GET", upstream: "airkorea", credential: "AIR_KOREA_OPEN_API_KEY", cacheable: true, skills: ["fine-dust-location"] },
  { routeId: "seoul-subway-arrival", path: "/v1/seoul-subway/arrival", method: "GET", upstream: "seoul-open-data", credential: "SEOUL_OPEN_API_KEY", cacheable: true, skills: ["seoul-subway-arrival"] },
  { routeId: "seoul-density-citydata", path: "/v1/seoul-density/citydata", method: "GET", upstream: "seoul-open-data", credential: "SEOUL_OPEN_API_KEY", cacheable: true, skills: ["seoul-density"] },
  { routeId: "kosis-search", path: "/v1/kosis/search", method: "GET", upstream: "kosis", credential: "KOSIS_API_KEY", cacheable: true, skills: ["kosis-stats"] },
  { routeId: "kosis-meta", path: "/v1/kosis/meta", method: "GET", upstream: "kosis", credential: "KOSIS_API_KEY", cacheable: true, skills: ["kosis-stats"] },
  { routeId: "kosis-data", path: "/v1/kosis/data", method: "GET", upstream: "kosis", credential: "KOSIS_API_KEY", cacheable: true, skills: ["kosis-stats"] },
  { routeId: "kakao-local-geocode", path: "/v1/kakao-local/geocode", method: "GET", upstream: "kakao", credential: "KAKAO_REST_API_KEY", cacheable: true, skills: ["korean-transit-route"] },
  { routeId: "korea-weather-forecast", path: "/v1/korea-weather/forecast", method: "GET", upstream: "kma", credential: "KMA_OPEN_API_KEY", cacheable: true, skills: ["korea-weather"] },
  { routeId: "han-river-water-level", path: "/v1/han-river/water-level", method: "GET", upstream: "hrfco", credential: "HRFCO_OPEN_API_KEY", cacheable: true, skills: ["han-river-water-level"] },
  { routeId: "blue-ribbon-nearby", path: "/v1/blue-ribbon/nearby", method: "GET", upstream: "blue-ribbon", credential: "BLUE_RIBBON_SESSION_ID", cacheable: true, skills: ["blue-ribbon-nearby"] },
  { routeId: "opinet-around", path: "/v1/opinet/around", method: "GET", upstream: "opinet", credential: "OPINET_API_KEY", cacheable: true, skills: ["cheap-gas-nearby"] },
  { routeId: "opinet-detail", path: "/v1/opinet/detail", method: "GET", upstream: "opinet", credential: "OPINET_API_KEY", cacheable: true, skills: ["cheap-gas-nearby"] },
  { routeId: "real-estate-region-code", path: "/v1/real-estate/region-code", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["real-estate-search"] },
  { routeId: "real-estate", path: "/v1/real-estate/:assetType/:dealType", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["real-estate-search"] },
  { routeId: "parking-lot-search", path: "/v1/parking-lots/search", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["parking-lot-search"] },
  { routeId: "household-waste-info", path: "/v1/household-waste/info", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["household-waste-info"] },
  { routeId: "lh-notice-search", path: "/v1/lh-notice/search", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["lh-notice-search"] },
  { routeId: "lh-notice-detail", path: "/v1/lh-notice/detail", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["lh-notice-search"] },
  { routeId: "data4library-book-search", path: "/v1/data4library/book-search", method: "GET", upstream: "data4library", credential: "DATA4LIBRARY_AUTH_KEY", cacheable: true, skills: ["library-book-search"] },
  { routeId: "data4library-book-detail", path: "/v1/data4library/book-detail", method: "GET", upstream: "data4library", credential: "DATA4LIBRARY_AUTH_KEY", cacheable: true, skills: ["library-book-search"] },
  { routeId: "data4library-book-exists", path: "/v1/data4library/book-exists", method: "GET", upstream: "data4library", credential: "DATA4LIBRARY_AUTH_KEY", cacheable: true, skills: ["library-book-search"] },
  { routeId: "data4library-libraries-by-book", path: "/v1/data4library/libraries-by-book", method: "GET", upstream: "data4library", credential: "DATA4LIBRARY_AUTH_KEY", cacheable: true, skills: ["library-book-search"] },
  { routeId: "data4library-library-search", path: "/v1/data4library/library-search", method: "GET", upstream: "data4library", credential: "DATA4LIBRARY_AUTH_KEY", cacheable: true, skills: ["library-book-search"] },
  { routeId: "mfds-drug-safety-lookup", path: "/v1/mfds/drug-safety/lookup", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["mfds-drug-safety"] },
  { routeId: "mfds-food-safety-search", path: "/v1/mfds/food-safety/search", method: "GET", upstream: "foodsafety-korea", credential: "FOODSAFETYKOREA_API_KEY", cacheable: true, skills: ["mfds-food-safety"] },
  { routeId: "mfds-health-food-ingredient", path: "/v1/mfds/food-safety/health-food-ingredient", method: "GET", upstream: "foodsafety-korea", credential: "FOODSAFETYKOREA_API_KEY", cacheable: true, skills: ["mfds-food-safety"] },
  { routeId: "mfds-inspection-fail", path: "/v1/mfds/food-safety/inspection-fail", method: "GET", upstream: "foodsafety-korea", credential: "FOODSAFETYKOREA_API_KEY", cacheable: true, skills: ["mfds-food-safety"] },
  { routeId: "mfds-product-report", path: "/v1/mfds/food-safety/product-report", method: "GET", upstream: "foodsafety-korea", credential: "FOODSAFETYKOREA_API_KEY", cacheable: true, skills: ["mfds-food-safety"] },
  { routeId: "neis-school-meal", path: "/v1/neis/school-meal", method: "GET", upstream: "neis", credential: "KEDU_INFO_KEY", cacheable: true, skills: ["k-schoollunch-menu"] },
  { routeId: "neis-school-search", path: "/v1/neis/school-search", method: "GET", upstream: "neis", credential: "KEDU_INFO_KEY", cacheable: true, skills: ["k-schoollunch-menu"] },
  { routeId: "nts-business-status", path: "/v1/nts-business/status", method: "POST", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["nts-business-registration"] },
  { routeId: "nts-business-validate", path: "/v1/nts-business/validate", method: "POST", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: false, skills: ["nts-business-registration"] },
  { routeId: "korean-stock-search", path: "/v1/korean-stock/search", method: "GET", upstream: "krx", credential: "KRX_API_KEY", cacheable: true, skills: ["korean-stock-search"] },
  { routeId: "korean-stock-base-info", path: "/v1/korean-stock/base-info", method: "GET", upstream: "krx", credential: "KRX_API_KEY", cacheable: true, skills: ["korean-stock-search"] },
  { routeId: "korean-stock-trade-info", path: "/v1/korean-stock/trade-info", method: "GET", upstream: "krx", credential: "KRX_API_KEY", cacheable: true, skills: ["korean-stock-search"] },
  { routeId: "kstartup-announcements", path: "/v1/kstartup/announcements", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["kstartup-search"] },
  { routeId: "kstartup-business-info", path: "/v1/kstartup/business-info", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["kstartup-search"] },
  { routeId: "kstartup-contents", path: "/v1/kstartup/contents", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["kstartup-search"] },
  { routeId: "kstartup-statistics", path: "/v1/kstartup/statistics", method: "GET", upstream: "data-go-kr", credential: "DATA_GO_KR_API_KEY", cacheable: true, skills: ["kstartup-search"] },
  { routeId: "naver-news-search", path: "/v1/naver-news/search", method: "GET", upstream: "naver", credential: "NAVER_SEARCH_CLIENT_ID", cacheable: true, skills: ["naver-news-search"] },
  { routeId: "naver-shopping-search", path: "/v1/naver-shopping/search", method: "GET", upstream: "naver", credential: "NAVER_SEARCH_CLIENT_ID", cacheable: true, skills: ["naver-shopping-search"] },
];

// Skills that drive an MCP server (named servers are listed in MCP_SERVERS;
// the rest use a generic browser/HTTP MCP and are flagged via usesMcp only).
const MCP_SKILLS = new Set([
  "korean-cinema-search", "k-skill-setup", "catchtable-sniper", "olive-young-search",
  "used-car-price-search", "hola-poke-yeoksam", "korean-law-search", "korean-stock-search",
  "real-estate-search", "myrealtrip-search", "coupang-product-search",
]);
const MCP_SERVERS = [
  { server: "korean-law-mcp", skills: ["korean-law-search"] },
  { server: "korea-stock-mcp", skills: ["korean-stock-search"] },
  { server: "real-estate-mcp", skills: ["real-estate-search"] },
  { server: "coupang-partners-mcp", skills: ["coupang-product-search"] },
];

// Upstream base URLs (k-skill-proxy server.js + docs/sources.md). null = no single
// stable base URL (session/scrape-based).
const UPSTREAM_BASE_URLS = {
  airkorea: "http://apis.data.go.kr",
  "data-go-kr": "https://apis.data.go.kr",
  kma: "https://apis.data.go.kr",
  "seoul-open-data": "http://openapi.seoul.go.kr",
  hrfco: "https://api.hrfco.go.kr",
  opinet: "https://www.opinet.co.kr",
  data4library: "https://data4library.kr/api",
  "foodsafety-korea": "https://openapi.foodsafetykorea.go.kr",
  neis: "https://open.neis.go.kr",
  krx: "http://data-dbg.krx.co.kr",
  kakao: "https://dapi.kakao.com",
  kosis: "https://kosis.kr",
  naver: "https://openapi.naver.com",
  "blue-ribbon": "https://www.bluer.co.kr",
  dart: "https://opendart.fss.or.kr",
  kipris: "https://plus.kipris.or.kr",
  odsay: "https://api.odsay.com",
  lolesports: "https://esports-api.lolesports.com",
};

// k-skill-proxy default config (server.js buildConfig).
const PROXY_CONFIG = {
  name: "k-skill-proxy",
  host: "127.0.0.1",
  port: 4020,
  cacheTtlMs: 300000,
  rateLimit: { windowMs: 60000, max: 60 },
  policy: "free APIs only; routed only when the upstream requires a key (AGENTS.md inclusion rule)",
};

// ---- helpers ----
function readFrontmatter(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  const block = match ? match[1] : "";
  const top = (key) => {
    const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(block);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  };
  const meta = (key) => {
    const m = new RegExp(`^\\s+${key}:\\s*(.+)$`, "m").exec(block);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  };
  return { top, meta, text };
}

function hasPython(dir) {
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".py")) return true;
    }
  }
  return false;
}

function listSkillDirs() {
  return fs
    .readdirSync(kSkillRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !NON_SKILL_DIRS.has(e.name))
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(kSkillRoot, name, "SKILL.md")))
    .sort();
}

// ---- build ----
const credByEnv = new Map(CREDENTIALS.map((c) => [c.envVar, c]));
const routeSkills = new Set(PROXY_ROUTES.flatMap((r) => r.skills));
const skillIds = listSkillDirs();

const unmapped = skillIds.filter((id) => !CATEGORY_OF[id]);
if (unmapped.length) {
  console.error(`CATEGORY_OF is missing entries for: ${unmapped.join(", ")}`);
  process.exit(1);
}

const generatedAt = new Date().toISOString();
const skills = [];
const sources = [];

for (const skillId of skillIds) {
  const dir = path.join(kSkillRoot, skillId);
  const { top, meta } = readFrontmatter(path.join(dir, "SKILL.md"));

  const hasPackage = fs.existsSync(path.join(kSkillRoot, "packages", skillId, "package.json"));
  let implementationType = "skill-md-only";
  if (hasPackage) implementationType = "npm-package";
  else if (hasPython(dir)) implementationType = "python-script";

  const usesProxy = routeSkills.has(skillId);
  const proxyRoutes = PROXY_ROUTES.filter((r) => r.skills.includes(skillId)).map((r) => r.routeId);
  const requiredEnv = REQUIRED_ENV[skillId] ?? [];

  const subcategory = meta("category") ?? CATEGORY_OF[skillId];
  skills.push({
    skillId,
    description: top("description") ?? "",
    category: CATEGORY_OF[skillId],
    subcategory,
    locale: meta("locale") ?? "ko-KR",
    phase: meta("phase") ?? "v1",
    license: top("license") ?? "MIT",
    implementationType,
    package: hasPackage ? `packages/${skillId}` : null,
    usesProxy,
    usesMcp: MCP_SKILLS.has(skillId),
    proxyRoutes,
    requiredEnv,
  });

  const upstreams = [
    ...new Set([
      ...proxyRoutes.map((id) => PROXY_ROUTES.find((r) => r.routeId === id).upstream),
      ...requiredEnv.map((env) => credByEnv.get(env)?.upstream).filter(Boolean),
    ]),
  ].sort();
  sources.push({
    skillId,
    authType: requiredEnv.length ? "api-key" : "none",
    proxyBacked: usesProxy,
    upstreams,
    category: CATEGORY_OF[skillId],
  });
}

const base = {
  schemaVersion: "1.0.0",
  source: "k-skill",
  sourceImportedAt: generatedAt,
  categories: CATEGORIES,
  locales: LOCALES,
  lifecyclePhases: LIFECYCLE_PHASES,
  implementationTypes: IMPLEMENTATION_TYPES,
  authTypes: AUTH_TYPES,
  upstreams: UPSTREAMS,
};

// ---- subdivisions ----
// categories: canonical -> the raw subcategories observed under it
const subcatByCanonical = {};
for (const skill of skills) {
  (subcatByCanonical[skill.category] ??= new Set()).add(skill.subcategory);
}
const categories = CATEGORIES.map((category) => ({
  category,
  subcategories: [...(subcatByCanonical[category] ?? new Set())].sort(),
}));

// packages: npm-package skills (packages/<id>)
const packages = skills
  .filter((s) => s.implementationType === "npm-package")
  .map((s) => ({ skillId: s.skillId, packageName: s.skillId, dir: `packages/${s.skillId}`, category: s.category }));

// upstreams: enum -> registry (baseUrl, credential, requiresKey, proxyManaged)
const credByUpstream = {};
for (const c of CREDENTIALS) (credByUpstream[c.upstream] ??= c);
const upstreamRegistry = UPSTREAMS.map((upstreamId) => {
  const cred = credByUpstream[upstreamId];
  return {
    upstreamId,
    baseUrl: UPSTREAM_BASE_URLS[upstreamId] ?? null,
    requiresKey: Boolean(cred),
    credential: cred?.envVar ?? null,
    proxyManaged: cred?.proxyManaged ?? false,
  };
});

// Folder split keys must match scripts/taxonomy.mjs FOLDER_SPLIT: catalog/
// data-sources/packages/categories split by `category`; proxy-routes/credentials
// by `upstream`; upstreams by `upstreamId`. (No separate migrate step needed.)
writeDoc("skills-base", base);
writeGroup("skills-catalog", "skills", skills, (s) => s.category);
writeGroup("skills-proxy-routes", "routes", PROXY_ROUTES, (x) => x.upstream);
writeGroup("skills-credentials", "credentials", CREDENTIALS, (x) => x.upstream);
writeGroup("skills-data-sources", "sources", sources, (x) => x.category);
writeGroup("skills-categories", "categories", categories, (x) => x.category);
writeGroup("skills-upstreams", "upstreams", upstreamRegistry, (x) => x.upstreamId);
writeGroup("skills-packages", "packages", packages, (x) => x.category);
writeDoc("skills-mcp", { schemaVersion: "1.0.0", servers: MCP_SERVERS, mcpSkills: skills.filter((s) => s.usesMcp).map((s) => s.skillId) });
writeDoc("skills-proxy", { schemaVersion: "1.0.0", ...PROXY_CONFIG, upstreamBaseUrls: UPSTREAM_BASE_URLS });

console.log(`imported ${skills.length} skills from ${kSkillRoot}`);
console.log(`  routes ${PROXY_ROUTES.length}, creds ${CREDENTIALS.length}, categories ${CATEGORIES.length} (subcats ${new Set(skills.map((s) => s.subcategory)).size})`);
console.log(`  packages ${packages.length}, upstreams ${upstreamRegistry.length}, mcp servers ${MCP_SERVERS.length}/${MCP_SKILLS.size} skills`);
