// ds/no-public-token-declared: component CSS and recipes never declare a
// `--ds-*` custom property. Public tokens come only from the token build;
// component plumbing uses private `--_<component>-<name>` properties
// (docs/contracts/anatomy.md, "One convention for component CSS and props").
// Reading `--ds-*` stays allowed; ds/token-vocabulary checks the names exist.
import { parseCss } from '../css';
import { isComponentCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { DEFAULT_PREFIX } from './token-vocabulary';

export const NO_PUBLIC_TOKEN_DECLARED = 'ds/no-public-token-declared';

export function createNoPublicTokenDeclared(prefix = DEFAULT_PREFIX): (file: SourceFile) => Finding[] {
  const start = `--${prefix}-`;
  return (file) =>
    parseCss(file.content)
      .declarations.filter((d) => d.property.startsWith(start))
      .map((d) => ({
        ruleId: NO_PUBLIC_TOKEN_DECLARED,
        file: file.path,
        line: d.line,
        column: d.column,
        message: `${d.property} is declared in component CSS. Public tokens come from the token build; declare a private --_<component>-<name> property instead.`,
        allowKey: `${file.path}|${d.property}`,
      }));
}

export const noPublicTokenDeclared = createNoPublicTokenDeclared();

export const noPublicTokenDeclaredRule: Rule = {
  id: NO_PUBLIC_TOKEN_DECLARED,
  description: 'Component CSS and recipes never declare a --ds-* custom property.',
  appliesTo: isComponentCss,
  check: noPublicTokenDeclared,
};
