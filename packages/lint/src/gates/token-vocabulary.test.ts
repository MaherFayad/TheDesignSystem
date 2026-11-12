import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTokenVocabulary, createTokenVocabularyRule, declaredCustomProperties } from '../rules/token-vocabulary';
import { ROOT, fixture, format, lines, runRule } from './harness';

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
    expect(format(runRule(createTokenVocabularyRule(known))), 'use a built token or add the name to packages/tokens/src/contract.json').toEqual([]);
  });

  it('fails on the fixture', () => {
    const known = declaredCustomProperties(fixture('token-vocabulary/tokens.css').content);
    expect(lines(createTokenVocabulary(known)(fixture('token-vocabulary/bad.css')))).toEqual([6, 7]);
  });
});
