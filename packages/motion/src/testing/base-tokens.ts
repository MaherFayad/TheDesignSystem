// Reads packages/tokens/src/base for the motion tests. Node only, never in
// the barrel (it sits in a subfolder).
import { readdirSync, readFileSync } from 'node:fs';

type Tree = Record<string, unknown>;

const baseDir = new URL('../../../tokens/src/base/', import.meta.url);
const base: Tree = {};
for (const f of readdirSync(baseDir).filter((n) => n.endsWith('.json'))) {
  Object.assign(base, JSON.parse(readFileSync(new URL(f, baseDir), 'utf8')) as Tree);
}

/** The token node at a dotted path in the base tokens, or undefined. */
export function tokenNode(path: string): Tree | undefined {
  let node: unknown = base;
  for (const key of path.split('.')) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Tree)[key];
  }
  return node && typeof node === 'object' ? (node as Tree) : undefined;
}

/** The value of a token, following `{alias}` references. Durations come back in ms. */
export function tokenValue(path: string): unknown {
  const node = tokenNode(path);
  const v = node?.$value;
  if (typeof v === 'string' && /^\{.+\}$/.test(v)) return tokenValue(v.slice(1, -1));
  if (v && typeof v === 'object' && 'unit' in v && 'value' in v) {
    const { value, unit } = v as { value: number; unit: string };
    return unit === 's' ? value * 1000 : value;
  }
  return v;
}
