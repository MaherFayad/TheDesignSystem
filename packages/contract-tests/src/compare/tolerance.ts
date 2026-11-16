// Tolerance profiles and the comparison of one probed value (plan section 3,
// "Tolerances"). Pure functions, so tolerance.test.ts can run them without a
// browser. Values arrive as the strings getComputedStyle returns.
import { differenceCiede2000, parse, rgb } from 'culori';
import type { Allowed, PairFile, RegionKind, Row, Status, Tolerance } from './types';

/** The default profile of plan section 3. */
export const DEFAULT_TOLERANCE: Tolerance = {
  controlBox: 1,
  regionBox: 2,
  deltaE: 2,
  lengthEqual: 0.05,
  lineHeight: 1,
  letterSpacingEm: 0.01,
  durationMs: 10,
  durationRatio: 0.1,
  travel: 1,
  scale: 0.01,
  easing: 0.02,
  pixelShare: 0.03,
  pixelThreshold: 0.1,
};

export const PROFILES: Record<string, Tolerance> = { default: DEFAULT_TOLERANCE };

/**
 * The profile a pair asks for. A pair may tighten a value, never loosen one:
 * a looser value throws, so a pair cannot pass by widening its own limits.
 */
export function resolveTolerance(spec: PairFile['tolerance']): Tolerance {
  const base = PROFILES[spec.profile];
  if (!base) throw new Error(`Unknown tolerance profile "${spec.profile}"`);
  const out: Tolerance = { ...base };
  for (const [key, value] of Object.entries(spec.tighten ?? {})) {
    const k = key as keyof Tolerance;
    if (!(k in base)) throw new Error(`Unknown tolerance "${key}"`);
    if (typeof value !== 'number' || value > base[k]) {
      throw new Error(`A pair may only tighten a tolerance: ${key} ${String(value)} is looser than ${base[k]}`);
    }
    out[k] = value;
  }
  return out;
}

/** How a property is compared. */
export type Kind = 'box' | 'count' | 'radius' | 'length' | 'number' | 'line-height' | 'letter-spacing' | 'color' | 'shadow' | 'duration' | 'easing' | 'transform' | 'string';

export function classify(property: string): Kind {
  const p = property.toLowerCase();
  if (['width', 'height', 'x', 'y', 'inline-size', 'block-size'].includes(p)) return 'box';
  if (/^(padding|margin)(-|$)|^(row-|column-)?gap$|^inset/.test(p)) return 'box';
  if (p === 'count') return 'count';
  if (p.endsWith('radius')) return 'radius';
  if (/^(border(-\w+)?-width|outline-width|outline-offset|font-size)$/.test(p)) return 'length';
  if (p === 'font-weight' || p === 'opacity' || p === 'z-index') return 'number';
  if (p === 'line-height') return 'line-height';
  if (p === 'letter-spacing') return 'letter-spacing';
  if (p.endsWith('color') || p === 'fill' || p === 'stroke') return 'color';
  if (p === 'box-shadow' || p === 'text-shadow') return 'shadow';
  if (p.endsWith('duration') || p.endsWith('delay')) return 'duration';
  if (p.endsWith('timing-function')) return 'easing';
  if (p === 'transform') return 'transform';
  return 'string';
}

export interface Ctx {
  tol: Tolerance;
  kind: RegionKind;
  /** Font size in px of the element on each side, for em based tolerances. */
  sourceFontSize?: number;
  systemFontSize?: number;
}

export interface Verdict {
  difference: string;
  tolerance: string;
  pass: boolean;
}

const num = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

/** Every px length in a computed value, in order. */
export function lengths(value: string): number[] {
  return [...value.matchAll(/(-?\d*\.?\d+(?:e-?\d+)?)px/g)].map((m) => Number(m[1]));
}

function compareLists(a: number[], b: number[], limit: number, unit: string, label: string): Verdict {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return { difference: `not comparable (${a.length} against ${b.length} values)`, tolerance: label, pass: false };
  }
  const diffs = a.map((v, i) => (b[i] ?? 0) - v);
  const worst = diffs.reduce((m, d) => (Math.abs(d) > Math.abs(m) ? d : m), 0);
  return { difference: `${worst > 0 ? '+' : ''}${num(worst)}${unit}`, tolerance: label, pass: Math.abs(worst) <= limit + 1e-9 };
}

/** Composites a colour on a backdrop in sRGB. Returns null for a value culori cannot read. */
function composite(value: string, backdrop: 0 | 1): { mode: 'rgb'; r: number; g: number; b: number } | null {
  const c = rgb(parse(value.trim()));
  if (!c) return null;
  const a = c.alpha ?? 1;
  return { mode: 'rgb', r: c.r * a + backdrop * (1 - a), g: c.g * a + backdrop * (1 - a), b: c.b * a + backdrop * (1 - a) };
}

const de2000 = differenceCiede2000();

/**
 * Delta E 2000 between two colours with alpha: each is composited on black
 * and on white, and the larger difference counts, so a change in alpha alone
 * shows up as a colour difference.
 */
export function deltaE(a: string, b: string): number | null {
  let worst = 0;
  for (const backdrop of [0, 1] as const) {
    const ca = composite(a, backdrop);
    const cb = composite(b, backdrop);
    if (!ca || !cb) return null;
    worst = Math.max(worst, de2000(ca, cb));
  }
  return worst;
}

export interface ShadowLayer {
  inset: boolean;
  color: string;
  lengths: number[];
}

/** Splits a computed box-shadow into layers. "none" has no layers. */
export function parseShadow(value: string): ShadowLayer[] {
  const v = value.trim();
  if (v === '' || v === 'none') return [];
  const layers: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of v) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      layers.push(cur);
      cur = '';
    } else cur += ch;
  }
  layers.push(cur);
  return layers.map((layer) => {
    const color = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[0-9a-fA-F]{3,8}\b|\b(?:transparent|black|white|currentcolor)\b/.exec(layer)?.[0] ?? 'currentcolor';
    const rest = layer.replace(color, '');
    return { inset: /\binset\b/.test(layer), color, lengths: lengths(rest) };
  });
}

/** Durations in ms; the longest counts. */
export function durationMs(value: string): number {
  const all = value.split(',').map((s) => {
    const t = s.trim();
    if (t.endsWith('ms')) return Number(t.slice(0, -2));
    if (t.endsWith('s')) return Number(t.slice(0, -1)) * 1000;
    return Number.NaN;
  });
  return all.some((n) => Number.isNaN(n)) ? Number.NaN : Math.max(...all);
}

const KEYWORD_EASING: Record<string, number[]> = {
  ease: [0.25, 0.1, 0.25, 1],
  linear: [0, 0, 1, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

/** The first easing of a computed list as four control points, or null for steps() and linear(). */
export function easingPoints(value: string): number[] | null {
  const first = value.split(/,(?![^(]*\))/)[0]?.trim() ?? '';
  if (KEYWORD_EASING[first]) return KEYWORD_EASING[first];
  const m = /^cubic-bezier\(([^)]*)\)$/.exec(first);
  if (!m) return null;
  const pts = (m[1] ?? '').split(',').map((s) => Number(s.trim()));
  return pts.length === 4 && pts.every((n) => !Number.isNaN(n)) ? pts : null;
}

/** Translate and scale of a computed transform. */
export function transformParts(value: string): { tx: number; ty: number; scale: number } | null {
  const v = value.trim();
  if (v === 'none') return { tx: 0, ty: 0, scale: 1 };
  const m = /^matrix\(([^)]*)\)$/.exec(v);
  if (!m) return null;
  const [a = 1, b = 0, , , e = 0, f = 0] = (m[1] ?? '').split(',').map((s) => Number(s.trim()));
  return { tx: e, ty: f, scale: Math.hypot(a, b) };
}

const NOT_FOUND = '(not found)';
export const ABSENT = 'absent';

/** Compares one property. The two values are the strings the page probe read. */
export function compareValue(property: string, source: string, system: string, ctx: Ctx): Verdict {
  const t = ctx.tol;
  if (source === NOT_FOUND || system === NOT_FOUND) {
    return { difference: 'element not found', tolerance: '', pass: false };
  }
  const kind = classify(property);
  if (kind !== 'count' && (source === ABSENT || system === ABSENT)) {
    const same = source === system;
    return { difference: same ? 'absent on both' : `${source === ABSENT ? 'source' : 'system'} has no such part`, tolerance: 'same parts', pass: same };
  }
  switch (kind) {
    case 'box': {
      const limit = ctx.kind === 'region' ? t.regionBox : t.controlBox;
      const a = lengths(source.endsWith('px') ? source : `${source}px`);
      const b = lengths(system.endsWith('px') ? system : `${system}px`);
      return compareLists(a, b, limit, 'px', `${limit}px`);
    }
    case 'count': {
      const a = Number(source === ABSENT ? 0 : source);
      const b = Number(system === ABSENT ? 0 : system);
      return { difference: `${b - a > 0 ? '+' : ''}${b - a}`, tolerance: 'equal', pass: a === b };
    }
    case 'radius':
    case 'length':
      return compareLists(lengths(source), lengths(system), t.lengthEqual, 'px', 'equal');
    case 'number': {
      const a = Number(source);
      const b = Number(system);
      if (Number.isNaN(a) || Number.isNaN(b)) return { difference: source === system ? '0' : 'not comparable', tolerance: 'equal', pass: source === system };
      return { difference: `${b - a > 0 ? '+' : ''}${num(b - a)}`, tolerance: 'equal', pass: Math.abs(b - a) < 1e-6 };
    }
    case 'line-height': {
      if (source === 'normal' || system === 'normal') {
        return { difference: source === system ? '0' : 'not comparable (normal)', tolerance: `${t.lineHeight}px`, pass: source === system };
      }
      return compareLists(lengths(source), lengths(system), t.lineHeight, 'px', `${t.lineHeight}px`);
    }
    case 'letter-spacing': {
      const toEm = (v: string, fs?: number): number => {
        if (v === 'normal') return 0;
        if (v.endsWith('em')) return Number(v.slice(0, -2));
        const px = lengths(v)[0] ?? Number.NaN;
        return fs ? px / fs : Number.NaN;
      };
      const a = toEm(source, ctx.sourceFontSize);
      const b = toEm(system, ctx.systemFontSize);
      if (Number.isNaN(a) || Number.isNaN(b)) return { difference: 'not comparable', tolerance: `${t.letterSpacingEm}em`, pass: false };
      const d = b - a;
      return { difference: `${d > 0 ? '+' : ''}${Math.round(d * 1000) / 1000}em`, tolerance: `${t.letterSpacingEm}em`, pass: Math.abs(d) <= t.letterSpacingEm + 1e-9 };
    }
    case 'color': {
      const d = deltaE(source, system);
      if (d === null) return { difference: 'not comparable', tolerance: `Delta E ${t.deltaE}`, pass: source === system };
      return { difference: `Delta E ${num(d)}`, tolerance: `Delta E ${t.deltaE}`, pass: d <= t.deltaE };
    }
    case 'shadow': {
      const a = parseShadow(source);
      const b = parseShadow(system);
      const label = `${t.controlBox}px, Delta E ${t.deltaE}`;
      if (a.length !== b.length) return { difference: `${a.length} against ${b.length} layers`, tolerance: label, pass: false };
      let worstPx = 0;
      let worstDe = 0;
      for (let i = 0; i < a.length; i += 1) {
        const la = a[i] as ShadowLayer;
        const lb = b[i] as ShadowLayer;
        if (la.inset !== lb.inset || la.lengths.length !== lb.lengths.length) return { difference: `layer ${i + 1} differs in shape`, tolerance: label, pass: false };
        la.lengths.forEach((v, j) => (worstPx = Math.max(worstPx, Math.abs((lb.lengths[j] ?? 0) - v))));
        worstDe = Math.max(worstDe, deltaE(la.color, lb.color) ?? 100);
      }
      return { difference: `${num(worstPx)}px, Delta E ${num(worstDe)}`, tolerance: label, pass: worstPx <= t.controlBox && worstDe <= t.deltaE };
    }
    case 'duration': {
      const a = durationMs(source);
      const b = durationMs(system);
      const limit = Math.max(t.durationMs, a * t.durationRatio);
      const label = `${t.durationMs}ms or ${t.durationRatio * 100} percent`;
      if (Number.isNaN(a) || Number.isNaN(b)) return { difference: 'not comparable', tolerance: label, pass: false };
      return { difference: `${b - a > 0 ? '+' : ''}${num(b - a)}ms`, tolerance: label, pass: Math.abs(b - a) <= limit };
    }
    case 'easing': {
      const a = easingPoints(source);
      const b = easingPoints(system);
      const label = `each point ${t.easing}`;
      if (!a || !b) return { difference: source === system ? '0' : 'not comparable', tolerance: label, pass: source === system };
      const worst = Math.max(...a.map((v, i) => Math.abs((b[i] ?? 0) - v)));
      return { difference: num(worst), tolerance: label, pass: worst <= t.easing + 1e-9 };
    }
    case 'transform': {
      const a = transformParts(source);
      const b = transformParts(system);
      const label = `${t.travel}px, scale ${t.scale}`;
      if (!a || !b) return { difference: 'not comparable', tolerance: label, pass: source === system };
      const travel = Math.max(Math.abs(b.tx - a.tx), Math.abs(b.ty - a.ty));
      const scale = Math.abs(b.scale - a.scale);
      return { difference: `${num(travel)}px, scale ${num(scale)}`, tolerance: label, pass: travel <= t.travel && scale <= t.scale + 1e-9 };
    }
    default: {
      const norm = (v: string) => v.replace(/\s+/g, ' ').trim();
      return { difference: norm(source) === norm(system) ? 'same' : 'differs', tolerance: 'equal', pass: norm(source) === norm(system) };
    }
  }
}

/** A row's status: a failing value listed as an allowed difference reads "allowed". */
export function statusOf(pass: boolean, region: string, probe: string, allowed: Allowed[]): { status: Status; note?: string } {
  const hit = allowed.find((a) => a.region === region && a.probe === probe);
  if (pass) return hit ? { status: 'pass', note: 'listed as allowed, but within tolerance' } : { status: 'pass' };
  return hit ? { status: 'allowed', note: hit.reason } : { status: 'fail' };
}

/** Counts by status. */
export function summarize(rows: Row[]): Record<Status, number> {
  const out: Record<Status, number> = { pass: 0, fail: 0, allowed: 0 };
  for (const r of rows) out[r.status] += 1;
  return out;
}
