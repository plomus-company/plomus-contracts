// Package-manager-agnostic build entrypoint. Runs every per-role build in
// dependency order in a single Node process (no pnpm needed), so it works as the
// `prepare` lifecycle script for consumers who install from a git ref / commit SHA
// (npm runs `prepare`, not `prepack`, on git installs) as well as for npm publish.
// dist/ is git-ignored, so this is what materialises the dist artifacts a consumer
// imports via @plomus/contracts/*.

const steps = [
  "build-foundation",
  "build-tool",
  "build-task",
  "build-governance",
  "build-agent",
  "build-transaction",
  "build-legal",
  "build-benchmarks",
  "build-index",
];

for (const step of steps) {
  await import(`./${step}.mjs`);
}
