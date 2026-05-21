import fs from "node:fs";
import path from "node:path";

export const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

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
