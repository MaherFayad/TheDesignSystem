import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTokenVocabulary, createTokenVocabularyRule, declaredCustomProperties } from '../rules/token-vocabulary';
import { ROOT, fixture, format, lines, runRule } from './harness';

const BUILT = 'packages/tokens/dist/css/tokens.css';
const built = existsSync(join(ROOT, BUILT));

const NOTE = `[ds/token-vocabulary] skipped: ${BUILT} is not built yet. Run the token build (order 0.5) to make this gate strict.`;

// Vitest hides console output of passing tests, so the note goes straight to stderr.
if (!built) process.stderr.write(`${NOTE}\n`);

describe('gate ds/token-vocabulary: every var(--ds-*) exists in the token build', () => {
  it.skipIf(!built)(`every var(--ds-*) in packages/css and packages/styles is in ${BUILT} or declared in the same file`, () => {
    const known = declaredCustomProperties(readFileSync(join(ROOT, BUILT), 'utf8'));
    expect(known.size, `${BUILT} declares no --ds-* names`).toBeGreaterThan(0);
    expect(format(runRule(createTokenVocabularyRule(known))), 'use a built token or add the name to packages/tokens/src/contract.json').toEqual([]);
  });

  it('fails on the fixture', () => {
    const known = declaredCustomProperties(fixture('token-vocabulary/tokens.css').content);
    expect(lines(createTokenVocabulary(known)(fixture('token-vocabulary/bad.css')))).toEqual([6, 7]);
  });
});
