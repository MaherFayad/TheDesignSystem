// ds/contrast: every pair in the contrast pair data meets its WCAG 2.2
// minimum in every style and scheme of the token build. 4.5:1 for text
// (SC 1.4.3), 3:1 for control boundaries, focus rings and state fills
// (SC 1.4.11).
//
// Ported from GoBanana `banana-server/tests/design-tokens.test.ts`: a layer
// is a stack of tokens painted top first, and a translucent token is
// composited over the layer under it in sRGB, the way a browser paints it.
// Instead of parsing CSS, this reads the token build (`buildTokens` in
// packages/tokens/build.ts) and resolves aliases with its `resolveValue`.
//
// Pure functions, no test framework imports: `ds doctor` reuses them.
import { parse, wcagContrast, wcagLuminance, type Rgb } from 'culori';
import { resolveValue, type Mode, type TokenMap } from '../../../tokens/build';
import type { ContrastData, KnownFailure, PairGroup } from '../contrast-pairs';
import type { Finding } from '../types';

export const CONTRAST = 'ds/contrast';

/** The placeholder a layer uses for the backdrop under a glass material. */
export const BACKDROP = '$backdrop';
/** The placeholder a foreground layer uses for the background of its pair. */
export const BG = '$bg';

/** One token build mode, reduced to what the gate reads. */
export interface ContrastMode {
  /** `<style>.<scheme>`, for example `desk.light`. */
  id: string;
  style: string;
  scheme: string;
  /** Every token of the mode, base included, with aliases unresolved. */
  tokens: TokenMap;
  /** The source file findings point at. */
  file: string;
}

export function contrastModes(modes: readonly Mode[]): ContrastMode[] {
  return modes.map((m) => ({ id: m.id, style: m.style, scheme: m.scheme, tokens: m.all, file: `packages/styles/${m.style}/tokens.${m.scheme}.json` }));
}

/** One measured pair. */
export interface ContrastResult {
  mode: string;
  file: string;
  use: string;
  /** The foreground layer, top first, for example `color.border.control over color.bg.surface`. */
  fg: string;
  bg: string;
  min: number;
  /** Measured ratio, rounded down to two decimals so a pass never rounds up. */
  ratio: number;
  fgHex: string;
  bgHex: string;
  pass: boolean;
  /** `<mode>|<fg>|<bg>`: what a known failure entry names. */
  key: string;
}

interface Srgb {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

interface ColorValue {
  colorSpace: string;
  components: (number | 'none')[];
  alpha?: number;
  hex?: string;
}

function isColorValue(v: unknown): v is ColorValue {
  return typeof v === 'object' && v !== null && 'colorSpace' in v && 'components' in v;
}

/**
 * A token as an sRGB color. Uses the 6 digit hex fallback when present, else
 * the components rounded to 8 bits: the same numbers the CSS build writes.
 */
export function tokenColor(mode: ContrastMode, path: string): Srgb {
  const token = mode.tokens.get(path);
  if (!token) throw new Error(`${mode.id}: ${path} is not a token`);
  const value = resolveValue(token.value, mode.tokens, `${mode.id} ${path}`);
  if (!isColorValue(value)) throw new Error(`${mode.id}: ${path} is not a color`);
  const alpha = value.alpha ?? 1;
  if (value.hex && /^#[0-9a-f]{6}$/i.test(value.hex)) {
    const c = parse(value.hex) as Rgb | undefined;
    if (!c) throw new Error(`${mode.id}: ${path} has an unreadable hex ${value.hex}`);
    return { r: c.r, g: c.g, b: c.b, alpha };
  }
  if (value.colorSpace !== 'srgb') throw new Error(`${mode.id}: ${path} is in ${value.colorSpace} and has no hex fallback`);
  const [r, g, b] = value.components.map((x) => (x === 'none' ? 0 : Math.round(x * 255) / 255));
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0, alpha };
}

/** Splits `a over b over c` into its tokens, top first. */
export function layerTokens(layer: string): string[] {
  return layer.split(' over ').map((s) => s.trim());
}

/** Paints a layer stack bottom up. The bottom token must be opaque. */
export function flattenLayer(mode: ContrastMode, layer: string): Srgb {
  const stack = layerTokens(layer);
  const bottomPath = stack[stack.length - 1]!;
  let out = tokenColor(mode, bottomPath);
  if (out.alpha < 1) throw new Error(`${mode.id}: ${bottomPath} is translucent (alpha ${out.alpha}); name the layer it sits on in "${layer}"`);
  for (const path of stack.slice(0, -1).reverse()) {
    const top = tokenColor(mode, path);
    const a = top.alpha;
    out = { r: top.r * a + out.r * (1 - a), g: top.g * a + out.g * (1 - a), b: top.b * a + out.b * (1 - a), alpha: 1 };
  }
  return out;
}

function toCulori(c: Srgb): Rgb {
  return { mode: 'rgb', r: c.r, g: c.g, b: c.b };
}

function hex(c: Srgb): string {
  const h = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** The WCAG contrast of two layers, rounded down to two decimals. */
export function contrastOf(mode: ContrastMode, fg: string, bg: string): { ratio: number; fgHex: string; bgHex: string } {
  const f = flattenLayer(mode, fg);
  const b = flattenLayer(mode, bg);
  const ratio = Math.floor(wcagContrast(toCulori(f), toCulori(b)) * 100) / 100;
  return { ratio, fgHex: hex(f), bgHex: hex(b) };
}

/** The darkest and the brightest backdrop candidate of a mode, darkest first. */
export function backdropsOf(mode: ContrastMode, data: Pick<ContrastData, 'backdrops'>): string[] {
  const scored = data.backdrops.map((path) => ({ path, lum: wcagLuminance(toCulori(flattenLayer(mode, path))) }));
  scored.sort((a, b) => a.lum - b.lum);
  const picked = [scored[0]?.path, scored[scored.length - 1]?.path].filter((p): p is string => Boolean(p));
  return [...new Set(picked)];
}

function applies(group: PairGroup, mode: ContrastMode): boolean {
  if (group.schemes && !group.schemes.includes(mode.scheme)) return false;
  if (group.styles && !group.styles.includes(mode.style)) return false;
  return true;
}

function expandBackdrop(layer: string, backdrops: string[]): string[] {
  return layer.includes(BACKDROP) ? backdrops.map((b) => layer.replace(BACKDROP, b)) : [layer];
}

/** Measures every pair of the data in one mode. */
export function measureMode(mode: ContrastMode, data: ContrastData): ContrastResult[] {
  const backdrops = backdropsOf(mode, data);
  const out: ContrastResult[] = [];
  const seen = new Set<string>();
  for (const group of data.groups) {
    if (!applies(group, mode)) continue;
    for (const bgRaw of group.bg) {
      for (const bg of expandBackdrop(bgRaw, backdrops)) {
        const fgs = group.fg.map((f) => f.replace(BG, bg));
        const measured = fgs.map((fg) => ({ fg, ...contrastOf(mode, fg, bg) }));
        // `any`: the group passes on this background when one foreground does,
        // for example a two ring focus indicator where either ring may carry it.
        const picks = group.any ? [measured.reduce((best, m) => (m.ratio > best.ratio ? m : best))] : measured;
        for (const m of picks) {
          const fg = group.any ? fgs.join(' | ') : m.fg;
          const key = `${mode.id}|${fg}|${bg}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ mode: mode.id, file: mode.file, use: group.use, fg, bg, min: group.min, ratio: m.ratio, fgHex: m.fgHex, bgHex: m.bgHex, pass: m.ratio >= group.min, key });
        }
      }
    }
  }
  return out;
}

export function knownFailureKey(k: KnownFailure): string {
  return `${k.mode}|${k.fg}|${k.bg}`;
}

/** One line for a result: `desk.light 2.91:1 < 4.5 color.text.subtle (#56606e) on ... (use)`. */
export function describeResult(r: ContrastResult): string {
  return `${r.mode} ${r.ratio.toFixed(2)}:1 ${r.pass ? '>=' : '<'} ${r.min} ${r.fg} (${r.fgHex}) on ${r.bg} (${r.bgHex}): ${r.use}`;
}

export interface ContrastReport {
  results: ContrastResult[];
  /** Failures no known failure entry names. The gate fails on these. */
  findings: Finding[];
  /** Failures a known failure entry names. Printed, not fatal. */
  known: { result: ContrastResult; entry: KnownFailure }[];
  /** Known failure entries that now pass or name no measured pair. The gate fails on these. */
  stale: { entry: KnownFailure; why: string }[];
}

/** Runs the pair data over every mode and sorts the results against the known failures. */
export function checkContrast(modes: readonly ContrastMode[], data: ContrastData): ContrastReport {
  const results = modes.flatMap((m) => measureMode(m, data));
  const byKey = new Map(results.map((r) => [r.key, r]));
  const knownByKey = new Map(data.knownFailures.map((k) => [knownFailureKey(k), k]));
  const findings: Finding[] = [];
  const known: ContrastReport['known'] = [];
  for (const r of results) {
    if (r.pass) continue;
    const entry = knownByKey.get(r.key);
    if (entry) {
      known.push({ result: r, entry });
      continue;
    }
    findings.push({ ruleId: CONTRAST, file: r.file, line: 1, message: describeResult(r), allowKey: r.key });
  }
  const stale: ContrastReport['stale'] = [];
  for (const entry of data.knownFailures) {
    const r = byKey.get(knownFailureKey(entry));
    if (!r) stale.push({ entry, why: 'names no measured pair' });
    else if (r.pass) stale.push({ entry, why: `now passes at ${r.ratio.toFixed(2)}:1, remove the entry` });
  }
  return { results, findings, known, stale };
}
