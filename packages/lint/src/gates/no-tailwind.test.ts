import { describe, expect, it } from 'vitest';
import { noTailwind, noTailwindRule } from '../rules/no-tailwind';
import { filesFor, fixture, format, lines, runRule } from './harness';

describe('gate ds/no-tailwind: no Tailwind inside the system', () => {
  it('reads every package.json under packages/', () => {
    expect(filesFor(noTailwindRule)).toEqual(expect.arrayContaining(['packages/lint/package.json', 'packages/react/package.json']));
  });

  it('finds no Tailwind dependency, directive or utility class', () => {
    expect(format(runRule(noTailwindRule)), 'style through data attributes and tokens').toEqual([]);
  });

  it('fails on the package.json fixture', () => {
    expect(lines(noTailwind(fixture('no-tailwind/bad.package.json')))).toEqual([5, 8, 9]);
  });

  it('fails on the CSS fixture', () => {
    expect(lines(noTailwind(fixture('no-tailwind/bad.css')))).toEqual([2, 3, 5]);
  });

  it('fails on the TSX fixture', () => {
    expect(lines(noTailwind(fixture('no-tailwind/bad.tsx')))).toEqual([5, 6, 7, 8]);
  });

  it('fails on the Angular template fixture', () => {
    expect(lines(noTailwind(fixture('no-tailwind/bad.html')))).toEqual([3, 4, 5]);
  });

  it('fails on className in React Native source', () => {
    const { content } = fixture('no-tailwind/Native.tsx');
    expect(lines(noTailwind({ path: 'packages/native/src/components/Sample/Sample.tsx', content }))).toEqual([4]);
  });
});
