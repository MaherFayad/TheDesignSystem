// ds/no-important: no `!important` anywhere in CSS. Cascade layers order the
// system, and consumer CSS outside the layers always wins (PLAN.md 3.4).
import { isSystemCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { locator, stripCssComments } from '../util';

export const NO_IMPORTANT = 'ds/no-important';

export function noImportant(file: SourceFile): Finding[] {
  const src = stripCssComments(file.content);
  const at = locator(src);
  const out: Finding[] = [];
  for (const m of src.matchAll(/!\s*important\b/gi)) {
    const pos = at(m.index ?? 0);
    out.push({
      ruleId: NO_IMPORTANT,
      file: file.path,
      line: pos.line,
      column: pos.column,
      message: '!important. Use the cascade layers: ds.reset, ds.tokens, ds.base, ds.recipes, ds.overrides.',
    });
  }
  return out;
}

export const noImportantRule: Rule = {
  id: NO_IMPORTANT,
  description: 'No !important in CSS.',
  appliesTo: (path) => isSystemCss(path) || (/^(apps|examples)\//.test(path) && path.endsWith('.css')),
  check: noImportant,
};
