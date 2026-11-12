import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isComponentBaseCss } from '../scopes';
import { createTokenVocabulary, createTokenVocabularyRule, declaredCustomProperties, declaredPrivateProperties } from '../rules/token-vocabulary';
import { ROOT, filesFor, fixture, format, lines, readText, runRule } from './harness';

const BUILT = 'packages/tokens/dist/css/tokens.css';

// `npm run check` builds the tokens before vitest, so the file is always there
// in check. Running vitest alone needs the build first.
function builtNames(): Set<string> {
  if (!existsSync(join(ROOT, BUILT))) {
    throw new Error(`${BUILT} is missing. Run the token build first: npx tsx packages/tokens/build.ts (npm run check does it).`);
  }
  return declaredCustomProperties(readFileSync(join(ROOT, BUILT), 'utf8'));
}

describe('gate ds/token-vocabulary: every var(--ds-*) exists in the token build', () => {
  it(`every var(--ds-*) in packages/css and packages/styles is in ${BUILT} or declared in the same file`, () => {
    const known = builtNames();
    expect(known.size, `${BUILT} declares no --ds-* names`).toBeGreaterThan(0);
    const privateNames = declaredPrivateProperties(filesFor({ appliesTo: isComponentBaseCss }).map((p) => readText(p) ?? ''));
    expect(format(runRule(createTokenVocabularyRule(known, undefined, privateNames))), 'use a built token, add the name to packages/tokens/src/contract.json, or declare the private property in the component CSS').toEqual([]);
  });

  it('fails on the fixture', () => {
    const known = declaredCustomProperties(fixture('token-vocabulary/tokens.css').content);
    expect(lines(createTokenVocabulary(known)(fixture('token-vocabulary/bad.css')))).toEqual([6, 7]);
  });

  it('checks private --_* reads against the names component CSS declares, and lets --radix-* through', () => {
    const known = declaredCustomProperties(fixture('token-vocabulary/tokens.css').content);
    const check = createTokenVocabulary(known, undefined, new Set(['--_sample-gap', '--_button-height']));
    expect(lines(check(fixture('token-vocabulary/private.css')))).toEqual([4, 7, 8]);
  });

  it('accepts a private property in a recipe when component CSS declares it', () => {
    const check = createTokenVocabulary(new Set(), undefined, new Set(['--_button-radius']));
    const recipe = { path: 'packages/styles/desk/recipes/Button.css', content: "[data-ds='button'] { --_button-radius: 0; border-radius: var(--_button-radius); }" };
    expect(check(recipe)).toEqual([]);
  });
});
