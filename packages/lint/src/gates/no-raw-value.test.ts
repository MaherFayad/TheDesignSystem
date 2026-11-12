import { describe, expect, it } from 'vitest';
import { RAW_VALUE_ALLOW } from '../allowlist';
import { noRawValue, noRawValueRule } from '../rules/no-raw-value';
import { applyAllowlist, staleAllowEntries } from '../util';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/no-raw-value: tokens for spacing, size, radius, font size, shadow, duration and z-index', () => {
  const found = runRule(noRawValueRule);

  it('finds no raw value in the repo', () => {
    expect(format(applyAllowlist(found, RAW_VALUE_ALLOW)), 'use a --ds-* token, or allow a 1px hairline with a reason').toEqual([]);
  });

  it('every allow list entry still matches a finding', () => {
    expect(staleAllowEntries(found, RAW_VALUE_ALLOW)).toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(noRawValue(fixture('no-raw-value/bad.css')))).toEqual([4, 5, 6, 7, 7, 8, 9, 10, 11, 24]);
  });

  it('lets an allow list entry through', () => {
    const file = fixture('no-raw-value/bad.css');
    const key = `${file.path}|[data-ds='sample']|padding-inline|12px`;
    const kept = applyAllowlist(noRawValue(file), [{ key, reason: 'sample' }]);
    expect(lines(kept)).toEqual([5, 6, 7, 7, 8, 9, 10, 11, 24]);
  });

  it('allows env(safe-area-inset-*) with its fallback, and leaves unitless opacity alone', () => {
    const found = noRawValue(fixture('no-raw-value/bad.css')).filter((f) => f.line >= 22);
    expect(found.map((f) => f.message)).toEqual(['padding-block-start: 12px is a raw length. Use a --ds-* token.']);
  });
});
