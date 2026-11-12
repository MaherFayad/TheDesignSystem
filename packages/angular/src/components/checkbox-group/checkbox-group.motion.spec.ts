// Order 1.22 motion of CheckboxGroup: the check-draw cascade under select
// all. As React, select all writes --_checkbox-step 1, 2, 3, 3 on the item
// boxes (capped at three steps) and checking one box alone removes them, so
// it draws at once. The draw itself is CSS (Checkbox.css), which keeps every
// step at 0s under reduced motion.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsCheckbox } from '../checkbox/checkbox';
import { DsCheckboxGroup } from './checkbox-group';

@Component({
  imports: [DsCheckboxGroup, DsCheckbox],
  template: `
    <fieldset dsCheckboxGroup legend="Notify me about" selectAll="All notifications">
      <div dsCheckbox value="comments" label="Comments"></div>
      <div dsCheckbox value="mentions" label="Mentions"></div>
      <div dsCheckbox value="invites" label="Invites"></div>
      <div dsCheckbox value="reviews" label="Reviews"></div>
    </fieldset>
  `,
})
class Host {}

describe('checkbox group motion, order 1.22', () => {
  it('check-draw: select all steps the boxes one delay.stagger apart, capped at three; one box alone draws at once', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-ds='checkbox']:not([data-part='select-all'])"));
    const steps = () => items.map((b) => b.style.getPropertyValue('--_checkbox-step'));
    expect(steps()).toEqual(['', '', '', '']);
    (root.querySelector("[data-part='select-all'] button") as HTMLElement).click();
    await fixture.whenStable();
    expect(steps()).toEqual(['1', '2', '3', '3']);
    expect(items.every((b) => b.querySelector('button')?.getAttribute('aria-checked') === 'true')).toBe(true);
    (items[1]!.querySelector('button') as HTMLElement).click();
    await fixture.whenStable();
    expect(steps()).toEqual(['', '', '', '']);
  });

  it('check-draw: each box keeps the draw span inside the indicator', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    for (const indicator of Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("[data-part='indicator']"))) {
      expect(indicator.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
      expect(indicator.firstElementChild?.querySelector('svg')).not.toBeNull();
    }
  });
});
