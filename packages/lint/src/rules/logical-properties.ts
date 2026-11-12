// ds/logical-properties: CSS says start and end, never left and right, so
// Arabic pages mirror. Ported from GoBanana `design-logical-properties.test.ts`.
//
// Flagged: the physical inset properties (`left`, `right`, `top`, `bottom`),
// physical margin, padding, border, scroll and radius longhands on the inline
// axis, every physical corner radius, `text-align`, `float` and `clear` set
// to left or right, four value shorthands whose two inline sides differ, and
// a multi value `border-radius` that is not mirror safe.
import { parseCss, splitSpaces } from '../css';
import { isSystemCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';

export const LOGICAL_PROPERTIES = 'ds/logical-properties';

const PHYSICAL =
  /^(left|right|top|bottom|(margin|padding|scroll-margin|scroll-padding)-(left|right)|border-(left|right)(-(width|style|color))?|border-(top|bottom)-(left|right)-radius)$/;
const SIDE_VALUE = /^(text-align|text-align-last|float|clear)$/;
const FOUR_VALUE = /^(margin|padding|inset|scroll-margin|scroll-padding|border-width|border-style|border-color)$/;

const HINT: Record<string, string> = {
  left: 'inset-inline-start',
  right: 'inset-inline-end',
  top: 'inset-block-start',
  bottom: 'inset-block-end',
};

function hintFor(property: string): string {
  if (HINT[property]) return HINT[property];
  if (/-radius$/.test(property)) return 'border-start-start-radius and the other logical corners';
  return property.replace(/-left\b/, '-inline-start').replace(/-right\b/, '-inline-end');
}

export function logicalProperties(file: SourceFile): Finding[] {
  const out: Finding[] = [];
  for (const d of parseCss(file.content).declarations) {
    if (d.property.startsWith('--')) continue;
    const value = d.value.replace(/!\s*important/i, '').trim();
    const hit = (message: string) =>
      out.push({
        ruleId: LOGICAL_PROPERTIES,
        file: file.path,
        line: d.line,
        column: d.column,
        message,
        allowKey: `${file.path}|${d.selector}|${d.property}`,
      });
    if (PHYSICAL.test(d.property)) {
      hit(`${d.property} is physical. Use ${hintFor(d.property)}.`);
    } else if (SIDE_VALUE.test(d.property) && /\b(left|right)\b/i.test(value)) {
      hit(`${d.property}: ${value} is physical. Use start or end.`);
    } else if (FOUR_VALUE.test(d.property)) {
      const v = splitSpaces(value);
      if (v.length === 4 && v[1] !== v[3]) hit(`${d.property} with four values reads left and right in physical order. Use the -inline and -block longhands.`);
    } else if (d.property === 'border-radius') {
      const v = splitSpaces(value.split('/')[0] ?? '');
      const [tl, tr = tl, br = tl, bl = tr] = v;
      if (tl !== tr || bl !== br) hit('border-radius with sides that differ does not mirror. Use border-start-start-radius and the other logical corners.');
    }
  }
  return out;
}

export const logicalPropertiesRule: Rule = {
  id: LOGICAL_PROPERTIES,
  description: 'Logical properties only in packages/css and packages/styles.',
  appliesTo: isSystemCss,
  check: logicalProperties,
};
