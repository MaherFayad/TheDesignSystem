import { describe, expect, it } from 'vitest';
import { noDash, noDashRule } from '../rules/no-dash';
import { filesFor, fixture, format, lines, runRule } from './harness';

describe('gate ds/no-dash: no em dash or en dash in any text file', () => {
  it('reads every text file, PLAN.md included, and skips the lock file', () => {
    const files = filesFor(noDashRule);
    expect(files).toEqual(expect.arrayContaining(['PLAN.md', 'AGENTS.md', 'package.json', 'packages/lint/src/rules/no-dash.ts']));
    expect(files).not.toContain('package-lock.json');
    expect(files.some((f) => f.startsWith('packages/lint/fixtures/'))).toBe(false);
  });

  it('finds no dash in the repo', () => {
    expect(format(runRule(noDashRule)), 'use a comma, colon, period or parentheses').toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(noDash(fixture('no-dash/bad.md')))).toEqual([5, 6, 7, 7, 8, 9]);
  });

  it('fails on the raw characters', () => {
    const em = String.fromCharCode(0x2014);
    const en = String.fromCharCode(0x2013);
    const found = noDash({ path: 'sample.md', content: `one ${em} two\nthree 4${en}5\nsix - seven` });
    expect(found.map((f) => [f.line, f.column])).toEqual([
      [1, 5],
      [2, 8],
    ]);
  });
});
