// Order M9.1 on Angular: Fieldset variant inset. Each dsField is a direct
// child of the body part, so Field.css draws it as one row of the card.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsLabel } from '../label/label';
import { DsFieldset } from './fieldset';

@Component({
  imports: [DsFieldset, DsField, DsInput, DsLabel],
  template: `
    <fieldset data-t="inset" dsFieldset variant="inset" legend="Contact details" description="We use these only to reach you.">
      <div dsField label="Name"><div dsInput variant="plain" clearable value="Sara Ahmed"></div></div>
      <div dsField>
        <label dsFieldLabel data-visually-hidden="">Board name</label>
        <div dsInput variant="plain" value="Spring launch"></div>
      </div>
    </fieldset>
    <fieldset data-t="plain" dsFieldset legend="Delivery address"><div dsField label="City"><div dsInput></div></div></fieldset>
  `,
})
class Host {}

describe('DsFieldset inset (order M9.1)', () => {
  it('stamps data-variant only when set, and keeps the DOM the row selectors read', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
    const inset = q('inset');
    expect(inset.getAttribute('data-variant')).toBe('inset');
    expect(inset.hasAttribute('variant')).toBe(false);
    expect(q('plain').hasAttribute('data-variant')).toBe(false);
    // The selectors of Field.css: a row is a direct child of the body; its label a direct child of the row.
    const rows = inset.querySelectorAll(":scope > [data-part='body'] > [data-ds='field']");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelector(":scope > [data-part='label']")?.textContent?.trim()).toBe('Name');
    expect(rows[0]?.querySelector(":scope > [data-ds='input'][data-variant='plain']")).not.toBeNull();
    const hidden = rows[1]?.querySelector(":scope > [data-part='label']");
    expect(hidden?.hasAttribute('data-visually-hidden')).toBe(true);
    // The description stays before the body in the DOM, so it is read before the rows.
    const parts = Array.from(inset.children).map((el) => el.getAttribute('data-part'));
    expect(parts).toEqual(['legend', 'description', 'body']);
  });
});
