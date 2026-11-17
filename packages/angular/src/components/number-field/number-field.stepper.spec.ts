// Order M9.3 on Angular: NumberField variant stepper. The value, then a
// capsule of decrease and increase (two soft pill IconButtons a step under
// the field height); data-variant only when set; the Arabic names stay.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsNumberField } from './number-field';

@Component({
  imports: [DsNumberField, DsTheme],
  template: `
    <div data-t="unset" dsNumberField aria-label="Guests" [value]="2"></div>
    <div data-t="field" dsNumberField variant="field" aria-label="Guests" [value]="2"></div>
    <div data-t="stepper" dsNumberField variant="stepper" aria-label="Guests" [min]="1" [max]="8" [(value)]="guests"></div>
    <div data-t="lg" dsNumberField variant="stepper" size="lg" aria-label="Guests" [value]="2"></div>
    <div data-t="sm" dsNumberField variant="stepper" size="sm" aria-label="Guests" [value]="2"></div>
    <div data-t="readonly" dsNumberField variant="stepper" readOnly aria-label="Guests" [value]="2"></div>
    <div dsTheme lang="ar">
      <div data-t="arabic" dsNumberField variant="stepper" aria-label="عدد الضيوف" [value]="2"></div>
    </div>
  `,
})
class Host {
  readonly guests = signal<number | null | undefined>(2);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const parts = (id: string) => Array.from(q(id).children).map((el) => el.getAttribute('data-part'));
  const step = (id: string, slot: string) => q(id).querySelector(`:scope > [data-part="${slot}"]`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q, parts, step };
}

describe('DsNumberField stepper (order M9.3)', () => {
  it('stamps data-variant only when passed; the field keeps a step button at each end', async () => {
    const { q, parts } = await setup();
    expect(q('unset').hasAttribute('data-variant')).toBe(false);
    expect(q('field').getAttribute('data-variant')).toBe('field');
    expect(parts('field')).toEqual(['decrement', 'control', null, 'increment']);
  });

  it('puts the value first, then decrease and increase, as soft pill IconButtons', async () => {
    const { q, parts, step } = await setup();
    expect(q('stepper').getAttribute('data-variant')).toBe('stepper');
    expect(q('stepper').hasAttribute('variant')).toBe(false);
    expect(parts('stepper')).toEqual(['control', null, 'decrement', 'increment']);
    for (const slot of ['decrement', 'increment']) {
      const button = step('stepper', slot);
      expect(button.getAttribute('data-ds')).toBe('icon-button');
      expect(button.getAttribute('data-emphasis')).toBe('soft');
      expect(button.getAttribute('data-shape')).toBe('pill');
      expect(button.getAttribute('data-size')).toBe('sm');
      expect(button.getAttribute('tabindex')).toBe('-1');
    }
    expect(step('lg', 'increment').getAttribute('data-size')).toBe('md');
    expect(step('sm', 'increment').getAttribute('data-size')).toBe('xs');
    expect(step('field', 'increment').getAttribute('data-emphasis')).toBe('ghost');
  });

  it('steps from the capsule as from the field buttons', async () => {
    const { fixture, host, step } = await setup();
    const plus = step('stepper', 'increment');
    plus.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, isPrimary: true }));
    plus.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, isPrimary: true }));
    await fixture.whenStable();
    expect(host.guests()).toBe(3);
  });

  // The Arabic names are the ones the field has today (React Aria's words): خفض and زيادة.
  it('hides the capsule while read only and keeps the Arabic names', async () => {
    const { parts, step } = await setup();
    expect(parts('readonly')).toEqual(['control', null]);
    expect(step('arabic', 'decrement').getAttribute('aria-label')).toContain('خفض');
    expect(step('arabic', 'increment').getAttribute('aria-label')).toContain('زيادة');
  });
});
