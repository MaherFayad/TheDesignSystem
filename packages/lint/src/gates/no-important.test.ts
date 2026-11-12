import { describe, expect, it } from 'vitest';
import { noImportant, noImportantRule } from '../rules/no-important';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/no-important: no !important', () => {
  it('finds no !important in CSS', () => {
    expect(format(runRule(noImportantRule)), 'use the cascade layers').toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(noImportant(fixture('no-important/bad.css')))).toEqual([4, 5]);
  });
});
