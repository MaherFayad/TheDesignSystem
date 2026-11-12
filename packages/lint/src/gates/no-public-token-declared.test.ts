import { describe, expect, it } from 'vitest';
import { PUBLIC_TOKEN_DECLARED_ALLOW } from '../allowlist';
import { noPublicTokenDeclared, noPublicTokenDeclaredRule } from '../rules/no-public-token-declared';
import { applyAllowlist, staleAllowEntries } from '../util';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/no-public-token-declared: component CSS never declares --ds-*', () => {
  const found = runRule(noPublicTokenDeclaredRule);

  it('finds no --ds-* declaration in component CSS or recipes', () => {
    expect(format(applyAllowlist(found, PUBLIC_TOKEN_DECLARED_ALLOW)), 'declare a private --_<component>-<name> property').toEqual([]);
  });

  it('every allow list entry still matches a finding', () => {
    expect(staleAllowEntries(found, PUBLIC_TOKEN_DECLARED_ALLOW)).toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(noPublicTokenDeclared(fixture('no-public-token-declared/bad.css')))).toEqual([4, 8]);
  });
});
