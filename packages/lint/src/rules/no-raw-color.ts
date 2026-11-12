// ds/no-raw-color: component CSS and recipes read every color from a token.
// Ported from GoBanana `design-no-raw-colors.test.ts` and Figma-Killer-2
// `css-token-policy.test.ts`.
import { inDescriptorBlock, parseCss } from '../css';
import { isComponentCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { COLOR_FUNCTION, HEX_COLOR, NAMED_COLORS, maskCssStrings } from '../util';

export const NO_RAW_COLOR = 'ds/no-raw-color';

/** Properties whose values are names, not colors (a font called "Olive" is not a color). */
const NAME_VALUED =
  /^(font|font-family|animation|animation-name|transition|transition-property|grid-area|grid-template-areas|grid-row|grid-column|content|counter-reset|counter-increment|counter-set|will-change|view-transition-name|view-transition-class|container|container-name|anchor-name|position-anchor|list-style-type|quotes)$/;

export function noRawColor(file: SourceFile): Finding[] {
  const out: Finding[] = [];
  for (const d of parseCss(file.content).declarations) {
    if (inDescriptorBlock(d)) continue;
    const value = maskCssStrings(d.value);
    const hit = (literal: string) =>
      out.push({
        ruleId: NO_RAW_COLOR,
        file: file.path,
        line: d.line,
        column: d.column,
        message: `${d.property}: ${literal} is a raw color. Use a --ds-color-* token.`,
        allowKey: `${file.path}|${d.selector}|${d.property}|${literal}`,
      });
    for (const m of value.matchAll(HEX_COLOR)) hit(m[0]);
    for (const m of value.matchAll(COLOR_FUNCTION)) hit(`${m[0]}...)`);
    if (NAME_VALUED.test(d.property)) continue;
    const words = value.replace(/var\([^)]*\)/g, ' ').toLowerCase().match(/(?<![\w-])[a-z]+(?![\w-])/g) ?? [];
    for (const word of words) if (NAMED_COLORS.has(word)) hit(word);
  }
  return out;
}

export const noRawColorRule: Rule = {
  id: NO_RAW_COLOR,
  description: 'No hex, color function or named color in component CSS or recipes.',
  appliesTo: isComponentCss,
  check: noRawColor,
};
