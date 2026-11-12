// ds/no-raw-value: component CSS and recipes read spacing, sizes, radii, font
// sizes, shadows, durations and z-index from tokens. Ported from Figma-Killer-2
// `admin-spacing-token-policy.test.ts` and `admin-typography-token-policy.test.ts`,
// widened to every length and time unit.
//
// Allowed: 0 with or without a unit, percentages, unitless numbers (line
// height, flex, scale, opacity), angles, `fr`, and anything inside a token.
// A 1px hairline passes only with an allow list entry that gives a reason.
// `env(safe-area-inset-*)` is allowed, its fallback included: the platform
// gives that value, no token can. Unitless numbers are not flagged, so
// `opacity: 0.38` passes this rule (the convention is still
// var(--ds-opacity-disabled); review catches it, not this gate).
//
// `@media` and `@container` conditions: custom properties do not work there,
// so a length literal is allowed only when it equals a `breakpoint.*` token
// value and the same line carries `/* breakpoint.<name> */` naming that token.
// Any other length in a condition fails.
import breakpointSource from '../../../tokens/src/base/breakpoint.json';
import { inDescriptorBlock, parseCss } from '../css';
import { isComponentCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { locator, maskCssStrings, stripCssComments } from '../util';

export const NO_RAW_VALUE = 'ds/no-raw-value';

const UNITS = 'px|rem|em|ch|ex|ic|cap|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|pt|pc|cm|mm|in|q|ms|s';
const DIMENSION = new RegExp(`(?<![\\w.#-])-?(?:\\d+\\.?\\d*|\\.\\d+)(${UNITS})(?![\\w-])`, 'gi');
const NUMBER = /(?<![\w.#-])-?(?:\d+\.?\d*|\.\d+)(?![\w.%-])/g;

const ROOT_FONT_PX = 16;

/** A length in px, or undefined for a unit that is not absolute at the root (vw, em and so on). */
function toPx(value: number, unit: string): number | undefined {
  const u = unit.toLowerCase();
  if (u === 'px') return value;
  if (u === 'rem') return value * ROOT_FONT_PX;
  return undefined;
}

/** The `breakpoint.*` tokens in px, by name. */
export function breakpointsFrom(tree: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  const group = (tree as { breakpoint?: Record<string, { $value?: { value: number; unit: string } }> }).breakpoint ?? {};
  for (const [name, token] of Object.entries(group)) {
    const v = token.$value;
    const px = v ? toPx(v.value, v.unit) : undefined;
    if (px !== undefined) out[name] = px;
  }
  return out;
}

export const BREAKPOINTS: Readonly<Record<string, number>> = breakpointsFrom(breakpointSource);

/** Blanks every `env(safe-area-inset-*, fallback)` call, nested parentheses included. */
export function maskSafeArea(value: string): string {
  let out = value;
  for (const m of value.matchAll(/\benv\(\s*safe-area-inset-(?:top|right|bottom|left)\b/gi)) {
    const start = m.index ?? 0;
    let depth = 0;
    let end = value.length;
    for (let i = start; i < value.length; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')' && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    out = out.slice(0, start) + ' '.repeat(end - start) + out.slice(end);
  }
  return out;
}

/** Length literals in `@media` and `@container` conditions that are not a marked breakpoint token. */
export function rawConditionValues(file: SourceFile, breakpoints: Readonly<Record<string, number>> = BREAKPOINTS): Finding[] {
  const src = stripCssComments(file.content);
  const at = locator(src);
  const original = file.content.split('\n');
  const out: Finding[] = [];
  for (const cond of src.matchAll(/@(media|container)\b[^{;]*/gi)) {
    const kind = `@${(cond[1] ?? '').toLowerCase()}`;
    const prelude = cond[0].replace(/\s+/g, ' ').trim();
    for (const m of maskCssStrings(cond[0]).matchAll(DIMENSION)) {
      const value = Number.parseFloat(m[0]);
      if (value === 0) continue;
      const pos = at((cond.index ?? 0) + (m.index ?? 0));
      const line = original[pos.line - 1] ?? '';
      const px = toPx(value, m[1] ?? '');
      const marked = [...line.matchAll(/\/\*([\s\S]*?)\*\//g)].flatMap((c) => [...(c[1] ?? '').matchAll(/\bbreakpoint\.([\w-]+)/g)].map((n) => n[1] ?? ''));
      if (px !== undefined && marked.some((name) => breakpoints[name] === px)) continue;
      const names = Object.entries(breakpoints).map(([n, v]) => `${n} ${v / ROOT_FONT_PX}rem`).join(', ');
      out.push({
        ruleId: NO_RAW_VALUE,
        file: file.path,
        line: pos.line,
        column: pos.column,
        message: `${kind} ${m[0]} is a raw length in a condition. Use a breakpoint token value (${names}) with a /* breakpoint.<name> */ comment on the same line.`,
        allowKey: `${file.path}|${prelude}|${kind}|${m[0]}`,
      });
    }
  }
  return out;
}

export function noRawValue(file: SourceFile): Finding[] {
  const out: Finding[] = rawConditionValues(file);
  for (const d of parseCss(file.content).declarations) {
    if (inDescriptorBlock(d)) continue;
    const value = maskSafeArea(maskCssStrings(d.value)).replace(/!\s*important/i, '');
    const hit = (literal: string, what: string) =>
      out.push({
        ruleId: NO_RAW_VALUE,
        file: file.path,
        line: d.line,
        column: d.column,
        message: `${d.property}: ${literal} is a raw ${what}. Use a --ds-* token.`,
        allowKey: `${file.path}|${d.selector}|${d.property}|${literal}`,
      });
    for (const m of value.matchAll(DIMENSION)) {
      if (Number.parseFloat(m[0]) === 0) continue;
      const unit = (m[1] ?? '').toLowerCase();
      hit(m[0], unit === 'ms' || unit === 's' ? 'duration' : 'length');
    }
    if (d.property === 'z-index') {
      for (const m of value.matchAll(NUMBER)) if (Number.parseFloat(m[0]) !== 0) hit(m[0], 'z-index');
    }
  }
  return out.sort((a, b) => a.line - b.line || (a.column ?? 0) - (b.column ?? 0));
}

export const noRawValueRule: Rule = {
  id: NO_RAW_VALUE,
  description: 'No raw spacing, size, radius, font size, shadow, duration or z-index in component CSS or recipes.',
  appliesTo: isComponentCss,
  check: noRawValue,
};
