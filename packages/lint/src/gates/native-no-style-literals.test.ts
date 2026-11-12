import { describe, expect, it } from 'vitest';
import { nativeNoStyleLiterals, nativeNoStyleLiteralsRule } from '../rules/native-no-style-literals';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/native-no-style-literals: React Native styles come from the theme', () => {
  it('covers native source, *.styles.ts included', () => {
    expect(nativeNoStyleLiteralsRule.appliesTo('packages/native/src/components/Button/Button.tsx')).toBe(true);
    expect(nativeNoStyleLiteralsRule.appliesTo('packages/native/src/components/Button/Button.styles.ts')).toBe(true);
    expect(nativeNoStyleLiteralsRule.appliesTo('packages/charts-native/src/Line.tsx')).toBe(true);
  });

  it('finds no style literal in native source', () => {
    expect(format(runRule(nativeNoStyleLiteralsRule)), 'read the value from the theme in <Name>.styles.ts').toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(nativeNoStyleLiterals(fixture('native-no-style-literals/Sample.tsx')))).toEqual([6, 7, 8, 9, 10, 14, 19]);
  });

  it('fails on literals in a styles file, and passes 0, 1, percentages, keywords and theme values', () => {
    expect(lines(nativeNoStyleLiterals(fixture('native-no-style-literals/Sample.styles.ts')))).toEqual([8, 9, 11, 12, 13, 18]);
  });

  it('passes a styles file that reads everything from the theme', () => {
    const content = "export const create = (theme: Theme) => ({ root: { padding: theme.space.s, borderWidth: 1, margin: 0, width: '100%', color: theme.color.text.default } });";
    expect(nativeNoStyleLiterals({ path: 'packages/native/src/components/X/X.styles.ts', content })).toEqual([]);
  });
});
