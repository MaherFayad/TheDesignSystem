import { describe, expect, it } from 'vitest';
import { LOGICAL_PROPERTIES_ALLOW } from '../allowlist';
import { logicalProperties, logicalPropertiesRule } from '../rules/logical-properties';
import { applyAllowlist, staleAllowEntries } from '../util';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/logical-properties: start and end, never left and right', () => {
  const found = runRule(logicalPropertiesRule);

  it('finds no physical property in packages/css or packages/styles', () => {
    expect(
      format(applyAllowlist(found, LOGICAL_PROPERTIES_ALLOW)),
      'use inset-inline-*, margin-inline-*, padding-inline-*, border-inline-*, border-start-start-radius, text-align: start or end',
    ).toEqual([]);
  });

  it('every allow list entry still matches a finding', () => {
    expect(staleAllowEntries(found, LOGICAL_PROPERTIES_ALLOW)).toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(logicalProperties(fixture('logical-properties/bad.css')))).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
