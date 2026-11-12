// Test helper: resolves color tokens from the built tokens.css for each style
// and scheme pair and measures contrast of a fill against the track, which is
// a translucent overlay composited on the page body. Used by the WCAG 1.4.11
// tests of the bar and meter fills.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Rgba = { r: number; g: number; b: number; a: number };

const css = readFileSync(join(process.cwd(), 'packages/tokens/dist/css/tokens.css'), 'utf8');
const base = /:root,\s*\[data-style\] \{([^}]*)\}/.exec(css)?.[1] ?? '';
export const pairs = [...css.matchAll(/\[data-style='([a-z]+)'\]\[data-scheme='([a-z]+)'\] \{([^}]*)\}/g)].map(
  (m) => ({ name: `${m[1]} ${m[2]}`, body: m[3]! }),
);

function lookup(block: string, name: string): string | undefined {
  return new RegExp(`--ds-${name}: ([^;]+);`).exec(block)?.[1]?.trim() ?? new RegExp(`--ds-${name}: ([^;]+);`).exec(base)?.[1]?.trim();
}

function resolve(block: string, value: string, depth = 0): string {
  const ref = /^var\(--ds-([a-z0-9-]+)\)$/.exec(value);
  if (!ref || depth > 10) return value;
  const next = lookup(block, ref[1]!);
  if (!next) throw new Error(`unresolved ${value}`);
  return resolve(block, next, depth + 1);
}

function parse(value: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const nums = value.match(/[\d.]+/g)?.map(Number);
  if (!value.startsWith('rgb') || !nums || nums.length < 3) throw new Error(`cannot parse ${value}`);
  return { r: nums[0]!, g: nums[1]!, b: nums[2]!, a: nums[3] ?? 1 };
}

function over(top: Rgba, under: Rgba): Rgba {
  const mix = (f: number, b: number) => f * top.a + b * (1 - top.a);
  return { r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b), a: 1 };
}

function luminance(c: Rgba): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** Contrast of a fill token against a track token laid on bg.body, in one pair. */
export function fillOnTrack(block: string, fill: string, track: string): number {
  const color = (name: string) => parse(resolve(block, `var(--ds-${name})`));
  const body = color('color-bg-body');
  const under = over(color(track), body);
  const top = over(color(fill), body);
  const [hi, lo] = [luminance(top), luminance(under)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** The token name a CSS declaration of a private property points at, per tone. */
export function fillTokens(componentCss: string, ds: string, property: string): Record<string, string> {
  const out: Record<string, string> = {};
  const rootRule = new RegExp(`\\[data-ds='${ds}'\\] \\{[^}]*${property}: var\\(--ds-([a-z0-9-]+)\\)`).exec(componentCss);
  if (rootRule) out.accent = rootRule[1]!;
  for (const m of componentCss.matchAll(
    new RegExp(`\\[data-ds='${ds}'\\]\\[data-tone='([a-z]+)'\\] \\{[^}]*${property}: var\\(--ds-([a-z0-9-]+)\\)`, 'g'),
  )) {
    out[m[1]!] = m[2]!;
  }
  return out;
}
