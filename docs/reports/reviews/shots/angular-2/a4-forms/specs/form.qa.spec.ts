// QA probe for the angular-2 review (batch A4). Temporary: copied to
// docs/reports/reviews/shots/angular-2/a4-forms/ and deleted from the tree.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsCheckbox } from '../checkbox/checkbox';
import { DsConsentField } from '../consent-field/consent-field';
import { DsFieldset } from '../fieldset/fieldset';
import { DsInput } from '../input/input';
import { DsRadioGroup, DsRadioGroupItem } from '../radio-group/radio-group';
import { DsSelect } from '../select/select';
import { DsSlider } from '../slider/slider';
import { DsSwitch } from '../switch/switch';
import { DsForm } from './form';
import { DsFormField } from './form-field';
import { DsFormSubmit } from './form-submit';

const DUMP: string[] = [];
const dump = (...a: unknown[]) => DUMP.push(a.map(String).join(' '));
const tick = () => new Promise((r) => setTimeout(r, 0));
const cities = [
  { value: 'ruh', label: 'Riyadh' },
  { value: 'jed', label: 'Jeddah' },
];

function submit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function describeFocus(): string {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return 'body';
  return `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''}${el.getAttribute('aria-hidden') === 'true' ? '[aria-hidden]' : ''}#${el.id}`;
}

function summaryItems(form: HTMLFormElement) {
  return [...form.querySelectorAll('[data-part="summary"] li')].map((li) => {
    const a = li.querySelector('a');
    const id = a?.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    return {
      text: li.textContent?.trim(),
      href: a?.getAttribute('href') ?? null,
      target: target ? `${target.tagName.toLowerCase()}${target.getAttribute('role') ? `[role=${target.getAttribute('role')}]` : ''}${target.getAttribute('aria-hidden') === 'true' ? '[aria-hidden]' : ''}` : null,
    };
  });
}

async function linkFocus(form: HTMLFormElement): Promise<string[]> {
  const out: string[] = [];
  for (const a of form.querySelectorAll<HTMLAnchorElement>('[data-part="summary"] a')) {
    a.click();
    await tick();
    out.push(`${a.textContent?.trim()} -> ${describeFocus()}`);
  }
  return out;
}

@Component({
  imports: [DsForm, DsFormField, DsFormSubmit, DsInput, DsCheckbox, DsRadioGroup, DsRadioGroupItem, DsSelect, DsSlider, DsSwitch, DsConsentField, ReactiveFormsModule],
  template: `
    <form dsForm id="reactive" [formGroup]="group">
      <div dsFormField name="email" label="Work email" required><div dsInput formControlName="email" type="email"></div></div>
      <div dsFormField name="terms"><div dsCheckbox formControlName="terms" label="I agree to the terms"></div></div>
      <div dsRadioGroup formControlName="seat" label="Seating"><div dsRadioGroupItem value="in" label="Inside"></div><div dsRadioGroupItem value="out" label="Outside"></div></div>
      <div dsFormField name="city" label="City"><button dsSelect formControlName="city" [items]="cities"></button></div>
      <div dsFormField name="budget" label="Budget"><div dsSlider formControlName="budget" [min]="0" [max]="500"></div></div>
      <div dsFormField name="alerts"><div dsSwitch formControlName="alerts" label="Send alerts"></div></div>
      <div dsConsentField formControlName="consent" name="consent" purpose="Share my order with the courier." requiredError="Tick this so the courier can reach you."></div>
      <button dsFormSubmit>Save</button>
    </form>
  `,
})
class ReactiveHost {
  readonly cities = cities;
  readonly group = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    terms: new FormControl(false, Validators.requiredTrue),
    seat: new FormControl<string | null>(null, Validators.required),
    city: new FormControl<string | null>(null, Validators.required),
    budget: new FormControl(50, Validators.min(100)),
    alerts: new FormControl(false, Validators.requiredTrue),
    consent: new FormControl(false, Validators.requiredTrue),
  });
}

@Component({
  imports: [DsForm, DsFormField, DsFormSubmit, DsInput, DsCheckbox, DsRadioGroup, DsRadioGroupItem, DsSelect, DsSlider, DsConsentField, FormsModule],
  template: `
    <form dsForm id="template">
      <div dsFormField name="email" label="Work email"><div dsInput name="email" [(ngModel)]="email" required></div></div>
      <div dsFormField name="terms"><div dsCheckbox name="terms" [(ngModel)]="terms" label="I agree to the terms" required></div></div>
      <div dsRadioGroup name="seat" [(ngModel)]="seat" label="Seating" required><div dsRadioGroupItem value="in" label="Inside"></div><div dsRadioGroupItem value="out" label="Outside"></div></div>
      <div dsFormField name="city" label="City"><button dsSelect name="city" [(ngModel)]="city" [items]="cities" required></button></div>
      <div dsFormField name="budget" label="Budget"><div dsSlider name="budget" [(ngModel)]="budget" [min]="0" [max]="500"></div></div>
      <div dsConsentField name="consent" [(ngModel)]="consent" purpose="Share my order with the courier." required requiredError="Tick this so the courier can reach you."></div>
      <button dsFormSubmit>Save</button>
    </form>
  `,
})
class TemplateHost {
  readonly cities = cities;
  email = '';
  terms = false;
  seat: string | null = null;
  city: string | null = null;
  budget = 50;
  consent = false;
}

@Component({
  imports: [DsForm, DsFieldset, DsCheckbox, DsFormSubmit],
  template: `
    <form dsForm id="group" [validators]="checks">
      <fieldset dsFieldset legend="How should we reach you" name="reach">
        <div dsCheckbox name="reach" value="email" label="Email"></div>
        <div dsCheckbox name="reach" value="text" label="Text message"></div>
      </fieldset>
      <button dsFormSubmit>Save contact</button>
    </form>
  `,
})
class GroupHost {
  readonly checks = { reach: (v: unknown) => (v === undefined ? 'Pick at least one way to reach you.' : undefined) };
}

@Component({
  imports: [DsForm, DsConsentField, DsFormSubmit],
  template: `
    <form dsForm id="consent">
      <div dsConsentField name="terms" purpose="I agree to the terms." required requiredError="Agree to the terms to open an account."></div>
      <button dsFormSubmit>Open account</button>
    </form>
  `,
})
class ConsentHost {}

@Component({
  imports: [DsForm, DsFormField, DsInput, DsFormSubmit],
  template: `
    <form dsForm id="ok" [onSubmit]="send">
      <div dsFormField name="topic" label="Topic"><div dsInput name="topic" value="Invoice"></div></div>
      <button dsFormSubmit>Send</button>
    </form>
  `,
})
class PassHost {
  readonly send = () => undefined;
}

describe('QA A4: Form with Angular forms', () => {
  it('reactive FormGroup: errors reach the summary, focus and links', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#reactive') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    await tick();
    fixture.detectChanges();
    const items = summaryItems(form);
    dump('REACTIVE first focus', describeFocus());
    dump('REACTIVE summary', JSON.stringify(items, null, 1));
    dump('REACTIVE link focus', JSON.stringify(await linkFocus(form), null, 1));
    dump('REACTIVE consent error part', form.querySelector('[data-ds="consent-field"] [data-part="error"]')?.textContent?.trim());
    dump('REACTIVE touched', JSON.stringify(Object.fromEntries(Object.entries(fixture.componentInstance.group.controls).map(([k, c]) => [k, c.touched]))));
    fixture.nativeElement.remove();
    expect(DUMP).toEqual([]);
  });

  it('template NgForm: errors reach the summary, focus and links', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#template') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    await tick();
    fixture.detectChanges();
    const items = summaryItems(form);
    dump('TEMPLATE first focus', describeFocus());
    dump('TEMPLATE summary', JSON.stringify(items, null, 1));
    dump('TEMPLATE link focus', JSON.stringify(await linkFocus(form), null, 1));
    dump('TEMPLATE radio DOM', [...form.querySelectorAll('[data-ds="radio-group"] button, [data-ds="radio-group"] input')].map((e) => `${e.tagName}:${e.getAttribute('tabindex')}:${e.getAttribute('aria-hidden')}:${e.id}`).join(' | '));
    const radioInput = form.querySelector<HTMLInputElement>('[data-ds="radio-group"] input');
    radioInput?.focus();
    dump('TEMPLATE hidden radio input focusable by script', describeFocus());
    dump('TEMPLATE consent error part', form.querySelector('[data-ds="consent-field"] [data-part="error"]')?.textContent?.trim());
    fixture.nativeElement.remove();
    expect(DUMP).toEqual([]);
  });

  it('a Fieldset name shows the group error and names the group in the summary (React test parity)', async () => {
    const fixture = TestBed.createComponent(GroupHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#group') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    fixture.detectChanges();
    const fieldset = form.querySelector('fieldset') as HTMLFieldSetElement;
    dump('GROUP summary', JSON.stringify(summaryItems(form)));
    dump('GROUP fieldset', JSON.stringify({
      dataName: fieldset.getAttribute('data-name'),
      nameAttr: fieldset.getAttribute('name'),
      invalid: fieldset.hasAttribute('data-invalid'),
      error: fieldset.querySelector('[data-part="error"]')?.textContent?.trim() ?? null,
      describedby: fieldset.getAttribute('aria-describedby'),
    }));
    expect(fieldset.getAttribute('data-name')).toBe('reach');
    fixture.nativeElement.remove();
  });

  it('ConsentField requiredError says the same in the field and the summary (React parity)', async () => {
    const fixture = TestBed.createComponent(ConsentHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#consent') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    fixture.detectChanges();
    const summary = summaryItems(form).map((i) => i.text);
    const field = form.querySelector('[data-ds="consent-field"] [data-part="error"]')?.textContent?.trim();
    dump('CONSENT summary', JSON.stringify(summary), 'field', field, 'focus', describeFocus());
    expect(summary[0]).toContain('Agree to the terms to open an account.');
    fixture.nativeElement.remove();
  });

  it('a submit that passes is announced (React says "The form was sent.")', async () => {
    const fixture = TestBed.createComponent(PassHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#ok') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    await tick();
    fixture.detectChanges();
    const status = form.querySelector(':scope > [role="status"]')?.textContent;
    dump('PASS state', form.getAttribute('data-state'), 'status', JSON.stringify(status));
    expect(status?.trim()).toBe('The form was sent.');
  });
});
