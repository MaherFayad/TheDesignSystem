import { describe, expect, it } from 'vitest';
import { FORCED_COLORS_ALLOW } from '../allowlist';
import { forcedColorsFallback, forcedColorsFallbackRule } from '../rules/forced-colors-fallback';
import { applyAllowlist, staleAllowEntries } from '../util';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/forced-colors-fallback: the transparent outline only inside a focus selector', () => {
  const found = runRule(forcedColorsFallbackRule);

  it('finds no transparent outline at rest', () => {
    expect(format(applyAllowlist(found, FORCED_COLORS_ALLOW)), 'move the transparent outline into the :focus-visible or :focus-within rule').toEqual([]);
  });

  it('every allow list entry still matches a finding', () => {
    expect(staleAllowEntries(found, FORCED_COLORS_ALLOW)).toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(forcedColorsFallback(fixture('forced-colors-fallback/bad.css')))).toEqual([4, 7, 19]);
  });
});
