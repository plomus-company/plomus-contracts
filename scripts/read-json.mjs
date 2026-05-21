import fs from "node:fs";
import path from "node:path";

const defaultRepoRoot = path.resolve(new URL("..", import.meta.url).pathname);

export const repoRoot = process.env.PLOMUS_CONTRACTS_ROOT
  ? path.resolve(process.env.PLOMUS_CONTRACTS_ROOT)
  : defaultRepoRoot;

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

export function writeJson(relativePath, value) {
  const target = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

export function unique(values) {
  return new Set(values).size === values.length;
}

export function diff(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value));
}
