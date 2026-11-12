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
import { inDescriptorBlock, parseCss } from '../css';
import { isComponentCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { maskCssStrings } from '../util';

export const NO_RAW_VALUE = 'ds/no-raw-value';

const UNITS = 'px|rem|em|ch|ex|ic|cap|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|pt|pc|cm|mm|in|q|ms|s';
const DIMENSION = new RegExp(`(?<![\\w.#-])-?(?:\\d+\\.?\\d*|\\.\\d+)(${UNITS})(?![\\w-])`, 'gi');
const NUMBER = /(?<![\w.#-])-?(?:\d+\.?\d*|\.\d+)(?![\w.%-])/g;

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

export function noRawValue(file: SourceFile): Finding[] {
  const out: Finding[] = [];
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
  return out;
}

export const noRawValueRule: Rule = {
  id: NO_RAW_VALUE,
  description: 'No raw spacing, size, radius, font size, shadow, duration or z-index in component CSS or recipes.',
  appliesTo: isComponentCss,
  check: noRawValue,
};
