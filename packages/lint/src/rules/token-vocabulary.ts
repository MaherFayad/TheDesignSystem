// ds/token-vocabulary: every `var(--ds-*)` a stylesheet reads exists in the
// token build, or is a local variable the same file declares. Ported from
// Figma-Killer-2 `css-token-vocabulary.test.ts`, turned around: instead of a
// list of banned names, the build is the list of allowed names.
import { parseCss } from '../css';
import { isSystemCss } from '../scopes';
import type { Finding, Rule, RuleCheck, SourceFile } from '../types';
import { locator, stripCssComments } from '../util';

export const TOKEN_VOCABULARY = 'ds/token-vocabulary';

/** The default CSS variable prefix, from `ds.config.json`. */
export const DEFAULT_PREFIX = 'ds';

/** Every custom property a stylesheet declares, for example the built `tokens.css`. */
export function declaredCustomProperties(css: string): Set<string> {
  const out = new Set<string>();
  for (const d of parseCss(css).declarations) if (d.property.startsWith('--')) out.add(d.property);
  return out;
}

/** Builds the check from the names the token build declares. */
export function createTokenVocabulary(known: ReadonlySet<string>, prefix = DEFAULT_PREFIX): RuleCheck {
  const used = new RegExp(`var\\(\\s*(--${prefix}-[\\w-]+)`, 'g');
  return (file: SourceFile): Finding[] => {
    const local = declaredCustomProperties(file.content);
    const src = stripCssComments(file.content);
    const at = locator(src);
    const out: Finding[] = [];
    for (const m of src.matchAll(used)) {
      const name = m[1] ?? '';
      if (known.has(name) || local.has(name)) continue;
      const pos = at((m.index ?? 0) + 4);
      out.push({
        ruleId: TOKEN_VOCABULARY,
        file: file.path,
        line: pos.line,
        column: pos.column,
        message: `${name} is not in the token build and this file does not declare it. Use a token from packages/tokens or add the name to packages/tokens/src/contract.json.`,
      });
    }
    return out;
  };
}

export function createTokenVocabularyRule(known: ReadonlySet<string>, prefix = DEFAULT_PREFIX): Rule {
  return {
    id: TOKEN_VOCABULARY,
    description: 'Every var(--ds-*) used in system CSS exists in the token build or is declared in the same file.',
    appliesTo: isSystemCss,
    check: createTokenVocabulary(known, prefix),
  };
}
