import { describe, expect, it } from 'vitest';
import { BUTTON_PRIMITIVE_ALLOW } from '../allowlist';
import { buttonPrimitive, buttonPrimitiveRule } from '../rules/button-primitive';
import { applyAllowlist, staleAllowEntries } from '../util';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/button-primitive: every button comes from the system', () => {
  const found = runRule(buttonPrimitiveRule);

  it('finds no bare <button> outside the Button implementation', () => {
    expect(format(applyAllowlist(found, BUTTON_PRIMITIVE_ALLOW)), 'use Button or IconButton, or <button dsButton> in Angular').toEqual([]);
  });

  it('every allow list entry still matches a finding', () => {
    expect(staleAllowEntries(found, BUTTON_PRIMITIVE_ALLOW)).toEqual([]);
  });

  it('skips the Button implementation itself', () => {
    expect(buttonPrimitiveRule.appliesTo('packages/react/src/components/Button/Button.tsx')).toBe(false);
    expect(buttonPrimitiveRule.appliesTo('packages/react/src/components/IconButton/IconButton.tsx')).toBe(false);
    expect(buttonPrimitiveRule.appliesTo('packages/react/src/components/Dialog/Dialog.tsx')).toBe(true);
    expect(buttonPrimitiveRule.appliesTo('apps/gallery-react/src/App.tsx')).toBe(true);
  });

  it('fails on the TSX fixture', () => {
    expect(lines(buttonPrimitive(fixture('button-primitive/bad.tsx')))).toEqual([5, 6, 8]);
  });

  it('fails on the Angular fixture, and passes buttons that carry a ds directive', () => {
    expect(lines(buttonPrimitive(fixture('button-primitive/bad-angular.ts')))).toEqual([5, 6]);
  });
});
