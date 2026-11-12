// ds/forced-colors-fallback: the transparent outline that shows a focus ring
// in forced colors mode is set only inside a `:focus-visible` or
// `:focus-within` selector, never at rest (docs/contracts/anatomy.md, focus).
// Kept simple: any `outline` or `outline-color` with `transparent` outside
// such a selector is a finding.
import { parseCss } from '../css';
import { isComponentCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';

export const FORCED_COLORS_FALLBACK = 'ds/forced-colors-fallback';

const FOCUS = /:focus-(visible|within)\b/;

export function forcedColorsFallback(file: SourceFile): Finding[] {
  const out: Finding[] = [];
  for (const d of parseCss(file.content).declarations) {
    if (d.property !== 'outline' && d.property !== 'outline-color') continue;
    if (!/\btransparent\b/i.test(d.value)) continue;
    if (d.context.some((c) => FOCUS.test(c))) continue;
    out.push({
      ruleId: FORCED_COLORS_FALLBACK,
      file: file.path,
      line: d.line,
      column: d.column,
      message: `${d.property}: ${d.value} outside a :focus-visible or :focus-within selector. Set the transparent outline only inside the focus selector.`,
      allowKey: `${file.path}|${d.selector}|${d.property}`,
    });
  }
  return out;
}

export const forcedColorsFallbackRule: Rule = {
  id: FORCED_COLORS_FALLBACK,
  description: 'A transparent outline (the forced colors focus fallback) only inside a focus selector.',
  appliesTo: isComponentCss,
  check: forcedColorsFallback,
};
