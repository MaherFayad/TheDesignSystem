// ds/contract-filled: every semantic name in packages/tokens/src/contract.json
// (`names` and `added`) resolves to a concrete value of the group's type in
// every style and scheme, and no style defines a semantic name the contract
// does not list (PLAN.md 3.6: extend only by adding to the contract file).
//
// A semantic name is any path under a contract group (`color.bg`, `radius`,
// `z` and so on) or under `color`. Component tokens (`button.height.md`) live
// outside those roots and are free.
//
// Pure functions, no test framework imports: `ds doctor` reuses them.
import { resolveValue, type ContractGroup, type Mode, type Token, type TokenMap } from '../../../tokens/build';
import type { Finding } from '../types';

export const CONTRACT_FILLED = 'ds/contract-filled';

/** Roots that are semantic even without a contract group of that exact name. */
export const SEMANTIC_ROOTS: readonly string[] = ['color'];

/** One mode reduced to what the gate reads. */
export interface ContractMode {
  id: string;
  /** Tokens from the style file only. */
  own: TokenMap;
  /** Base plus style tokens. */
  all: TokenMap;
  /** The style file findings point at. */
  file: string;
}

export function contractModes(modes: readonly Mode[]): ContractMode[] {
  return modes.map((m) => ({ id: m.id, own: m.own, all: m.all, file: `packages/styles/${m.style}/tokens.${m.scheme}.json` }));
}

const ALIAS = /^\{([^{}]+)\}$/;

/** The token an alias chain ends at, or a reason it does not end. */
function finalToken(token: Token, map: TokenMap): Token | string {
  let t = token;
  const seen = new Set<string>([token.path]);
  for (let m = typeof t.value === 'string' ? ALIAS.exec(t.value) : null; m; m = typeof t.value === 'string' ? ALIAS.exec(t.value) : null) {
    const target = m[1]!;
    if (seen.has(target)) return `circular alias through {${target}}`;
    seen.add(target);
    const next = map.get(target);
    if (!next) return `alias {${target}} does not resolve`;
    t = next;
  }
  return t;
}

function hasAlias(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('{');
  if (Array.isArray(value)) return value.some(hasAlias);
  if (typeof value === 'object' && value !== null) return Object.values(value).some(hasAlias);
  return false;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

/**
 * True when the final token has the group's type. A `number` with
 * `$extensions["ds.unit"]` fills a dimension: DTCG dimensions allow only px
 * and rem, so `em` and `vh` values are numbers (docs/contracts/tokens.md).
 */
function typeMatches(token: Token, type: string): boolean {
  if (token.type === type) return true;
  return type === 'dimension' && token.type === 'number' && typeof token.extensions?.['ds.unit'] === 'string';
}

/** Every contract name as a full path with the type its group declares. */
export function contractEntries(groups: readonly ContractGroup[]): { path: string; type: string }[] {
  return groups.flatMap((g) => [...g.names, ...g.added].map((n) => ({ path: `${g.group}.${n}`, type: g.type })));
}

function finding(mode: ContractMode, message: string): Finding {
  return { ruleId: CONTRACT_FILLED, file: mode.file, line: 1, message: `${mode.id}: ${message}` };
}

/** Checks one mode against the contract. */
export function checkContractMode(mode: ContractMode, groups: readonly ContractGroup[]): Finding[] {
  const out: Finding[] = [];
  const entries = contractEntries(groups);
  const known = new Set(entries.map((e) => e.path));

  for (const { path, type } of entries) {
    const token = mode.all.get(path);
    if (!token) {
      out.push(finding(mode, `${path} is in the contract and has no value`));
      continue;
    }
    const end = finalToken(token, mode.all);
    if (typeof end === 'string') {
      out.push(finding(mode, `${path}: ${end}`));
      continue;
    }
    if (!typeMatches(end, type)) {
      out.push(finding(mode, `${path} resolves to a ${end.type}, the contract group wants ${type}`));
      continue;
    }
    let value: unknown;
    try {
      value = resolveValue(token.value, mode.all, `${mode.id} ${path}`);
    } catch (e) {
      out.push(finding(mode, `${path}: ${(e as Error).message}`));
      continue;
    }
    if (isEmpty(value) || hasAlias(value)) out.push(finding(mode, `${path} does not resolve to a concrete value`));
  }

  const roots = [...groups.map((g) => g.group), ...SEMANTIC_ROOTS];
  for (const path of mode.own.keys()) {
    if (known.has(path)) continue;
    const root = roots.find((r) => path.startsWith(`${r}.`));
    if (root) out.push(finding(mode, `${path} is a semantic name (under ${root}) that packages/tokens/src/contract.json does not list. Add it to the contract or rename it as a component token.`));
  }
  return out;
}

export function checkContract(modes: readonly ContractMode[], groups: readonly ContractGroup[]): Finding[] {
  return modes.flatMap((m) => checkContractMode(m, groups));
}
