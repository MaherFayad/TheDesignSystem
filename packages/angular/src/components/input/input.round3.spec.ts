// Round 3 of Input (order 1.23): the variant input, stamped as data-variant
// only when it is set.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsInput, type InputVariant } from './input';

@Component({
  imports: [DsInput],
  template: `<div dsInput aria-label="Name" [variant]="variant()"></div>`,
})
class Host {
  readonly variant = signal<InputVariant | undefined>(undefined);
}

describe('Input variant, order 1.23', () => {
  it('stamps data-variant only when a variant is set', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = () => (fixture.nativeElement as HTMLElement).querySelector('[data-ds="input"]') as HTMLElement;
    expect(root().hasAttribute('data-variant')).toBe(false);
    fixture.componentInstance.variant.set('filled');
    await fixture.whenStable();
    expect(root().getAttribute('data-variant')).toBe('filled');
    fixture.componentInstance.variant.set('outlined');
    await fixture.whenStable();
    expect(root().getAttribute('data-variant')).toBe('outlined');
    expect(root().hasAttribute('variant')).toBe(false);
  });
});
