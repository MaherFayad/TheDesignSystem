import { describe, expect, it } from 'vitest';
import { RAW_COLOR_ALLOW } from '../allowlist';
import { noRawColor, noRawColorRule } from '../rules/no-raw-color';
import { applyAllowlist, staleAllowEntries } from '../util';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/no-raw-color: tokens for every color in component CSS and recipes', () => {
  const found = runRule(noRawColorRule);

  it('finds no raw color in the repo', () => {
    expect(format(applyAllowlist(found, RAW_COLOR_ALLOW)), 'use a --ds-color-* token').toEqual([]);
  });

  it('every allow list entry still matches a finding', () => {
    expect(staleAllowEntries(found, RAW_COLOR_ALLOW)).toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(noRawColor(fixture('no-raw-color/bad.css')))).toEqual([4, 5, 6, 7, 9]);
  });
});
