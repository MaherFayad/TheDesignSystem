// QA probe (ds-qa angular-2 review): the list family inside dsForm with reactive forms. Temporary.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsCombobox } from '../combobox/combobox';
import { DsForm } from '../form/form';
import { DsFormField } from '../form/form-field';
import { DsFormSubmit } from '../form/form-submit';
import { DsListBox } from '../list-box/list-box';
import { cityOptions, sortOptions } from '../list-box/samples';
import { DsMultiSelect } from '../multi-select/multi-select';
import { DsTagField } from '../tag-field/tag-field';
import { DsSelect } from './select';

@Component({
  imports: [DsForm, DsFormField, DsFormSubmit, DsSelect, DsMultiSelect, DsCombobox, DsTagField, DsListBox, ReactiveFormsModule],
  template: `
    <form dsForm id="f" [formGroup]="group">
      <div dsFormField name="sort" label="Sort by"><button dsSelect [items]="sort" formControlName="sort"></button></div>
      <div dsFormField name="cities" label="Cities"><div dsMultiSelect [items]="gulf" formControlName="cities"></div></div>
      <div dsFormField name="city" label="City"><div dsCombobox [items]="gulf" formControlName="city"></div></div>
      <div dsFormField name="tags" label="Tags"><div dsTagField formControlName="tags"></div></div>
      <div dsFormField name="order" label="Order"><div dsListBox aria-label="Order" [items]="sort" formControlName="order"></div></div>
      <button type="submit" dsFormSubmit>Save</button>
    </form>
  `,
})
class Host {
  readonly sort = sortOptions('en');
  readonly gulf = cityOptions('en', 'gulf');
  readonly group = new FormGroup({
    sort: new FormControl<string | null>(null, Validators.required),
    cities: new FormControl<string[]>([], { nonNullable: true, validators: Validators.required }),
    city: new FormControl<string | null>(null, Validators.required),
    tags: new FormControl<string[]>([], { nonNullable: true, validators: Validators.required }),
    order: new FormControl<string | null>(null, Validators.required),
  });
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('List family in dsForm', () => {
  it('every required control reaches the summary, focus goes to the first, aria-invalid lands on each control', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    document.body.appendChild(fixture.nativeElement);
    const form = fixture.nativeElement.querySelector('#f') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    const links = Array.from(form.querySelectorAll('[data-part="summary"] a')).map((a) => a.textContent?.trim());
    expect.soft(links, "summary link text").toEqual([
      'Sort by: Fill in this field.',
      'Cities: Fill in this field.',
      'City: Fill in this field.',
      'Tags: Fill in this field.',
      'Order: Fill in this field.',
    ]);
    const hrefTargets = Array.from(form.querySelectorAll<HTMLAnchorElement>('[data-part="summary"] a')).map((a) => {
      const el = document.getElementById(a.getAttribute('href')!.slice(1));
      return `${el?.tagName.toLowerCase()}:${el?.getAttribute('role') ?? ''}:${el?.getAttribute('data-part') ?? el?.getAttribute('data-ds') ?? ''}`;
    });
    expect.soft(hrefTargets, "summary link targets").toEqual([
      'button:combobox:select',
      'div:combobox:trigger',
      'input:combobox:control',
      'input::control',
      expect.stringMatching(/option|listbox/),
    ]);
    expect(document.activeElement?.getAttribute('data-ds')).toBe('select');
    const sel = form.querySelector('button[data-ds="select"]')!;
    expect(sel.getAttribute('aria-invalid')).toBe('true');
    expect(form.querySelector('[data-ds="multi-select"] [data-part="trigger"]')!.getAttribute('aria-invalid')).toBe('true');
    expect(form.querySelector('[data-ds="combobox"] input')!.getAttribute('aria-invalid')).toBe('true');
    expect(form.querySelector('[data-ds="tag-field"] input')!.getAttribute('aria-invalid')).toBe('true');
    fixture.nativeElement.remove();
  });
});
