import { describe, expect, it } from 'vitest';
import { nativeNoStyleLiterals, nativeNoStyleLiteralsRule } from '../rules/native-no-style-literals';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/native-no-style-literals: React Native styles come from the theme', () => {
  it('covers native source and leaves *.styles.ts to the theme', () => {
    expect(nativeNoStyleLiteralsRule.appliesTo('packages/native/src/components/Button/Button.tsx')).toBe(true);
    expect(nativeNoStyleLiteralsRule.appliesTo('packages/charts-native/src/Line.tsx')).toBe(true);
    expect(nativeNoStyleLiterals({ path: 'packages/native/src/components/Button/Button.styles.ts', content: 'const s = { padding: 12 };' })).toEqual([]);
  });

  it('finds no style literal in native source', () => {
    expect(format(runRule(nativeNoStyleLiteralsRule)), 'read the value from the theme in <Name>.styles.ts').toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(nativeNoStyleLiterals(fixture('native-no-style-literals/Sample.tsx')))).toEqual([6, 7, 8, 9, 10, 14, 19]);
  });
});
