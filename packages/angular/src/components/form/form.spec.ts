import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import type { FormValidators, FormValues } from '@the-system/shared';
import { describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsCheckbox } from '../checkbox/checkbox';
import { DsFieldset } from '../fieldset/fieldset';
import { DsInput } from '../input/input';
import { DsRadioGroup, DsRadioGroupItem } from '../radio-group/radio-group';
import { DsForm } from './form';
import FormDemo from './form.demo';
import { DsFormField } from './form-field';
import { DsFormSubmit } from './form-submit';
import { angularErrors, messageOf } from './angular-forms';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

@Component({
  imports: [DsForm, DsFormField, DsFormSubmit, DsInput],
  template: `
    <form dsForm id="plain" [validators]="validators" [onSubmit]="onSubmit()" [serverErrors]="server()" [actions]="actions" (errors)="found.push($event)">
      <div dsFormField name="name" label="Full name" required><div dsInput name="name"></div></div>
      <div dsFormField name="email" label="Work email" required><div dsInput name="email" type="email"></div></div>
      <ng-template #actions><button dsFormSubmit>Send request</button></ng-template>
    </form>
  `,
})
class PlainHost {
  readonly validators: FormValidators = {
    email: (v) => (typeof v === 'string' && v.endsWith('@gmail.com') ? 'Use your work email.' : undefined),
  };
  readonly onSubmit = signal<((values: FormValues) => unknown) | undefined>(undefined);
  readonly server = signal<unknown>(undefined);
  readonly found: unknown[] = [];
}

@Component({
  imports: [DsForm, DsFormField, DsInput, ReactiveFormsModule],
  template: `
    <form dsForm id="reactive" [formGroup]="group" [onSubmit]="submit">
      <div dsFormField name="name" label="Full name"><div dsInput formControlName="name"></div></div>
      <div dsFormField name="age" label="Age"><div dsInput formControlName="age"></div></div>
      <button type="submit" dsFormSubmit>Save</button>
    </form>
  `,
})
class ReactiveHost {
  readonly group = new FormGroup({
    name: new FormControl('', Validators.required),
    age: new FormControl('7', (c) => (Number(c.value) < 18 ? { adult: 'You need to be 18 or older.' } : null)),
  });
  readonly submit = vi.fn();
}

@Component({
  imports: [DsForm, DsFormField, DsInput, FormsModule],
  template: `
    <form dsForm id="template">
      <div dsFormField name="city" label="City"><div dsInput name="city" [(ngModel)]="city" required></div></div>
      <button type="submit" dsFormSubmit>Save</button>
    </form>
  `,
})
class TemplateHost {
  city = '';
}

@Component({
  imports: [DsTheme, DsForm, DsFormField, DsInput],
  template: `
    <div dsTheme [lang]="'ar'">
      <form dsForm id="arabic" (errors)="found.push($event)">
        <div dsFormField name="email" label="البريد"><div dsInput name="email" type="email" value="sara"></div></div>
        <div dsFormField name="seats" label="المقاعد"><input name="seats" type="number" min="1" value="0" /></div>
        <div dsFormField name="postal" label="الرمز البريدي"><div dsInput name="postal" pattern="[0-9]{5}" value="12"></div></div>
      </form>
    </div>
  `,
})
class ArabicHost {
  readonly found: unknown[] = [];
}

@Component({
  imports: [DsForm, DsFormField, DsInput],
  template: `
    <form dsForm id="pattern" [validators]="validators" (errors)="found.push($event)">
      <div dsFormField name="postal" label="Postal code"><div dsInput name="postal" pattern="[0-9]{5}" value="12"></div></div>
      <div dsFormField name="site" label="Website"><div dsInput name="site" type="url" value="example"></div></div>
    </form>
  `,
})
class PatternHost {
  readonly validators: FormValidators = { postal: (v) => (v === '12' ? 'Enter the 5 digit postal code.' : undefined) };
  readonly found: unknown[] = [];
}

@Component({
  imports: [DsForm, DsFieldset, DsCheckbox, DsRadioGroup, DsRadioGroupItem],
  template: `
    <form dsForm id="choices" [validators]="validators" (errors)="found.push($event)">
      <div dsRadioGroup label="Seating" name="seat" required>
        <div dsRadioGroupItem value="in" label="Inside"></div>
        <div dsRadioGroupItem value="out" label="Outside"></div>
      </div>
      <div dsCheckbox name="terms" value="yes" label="I agree to the terms" required></div>
      <fieldset dsFieldset legend="How should we reach you" name="reach">
        <div dsCheckbox name="reach" value="email" label="Email"></div>
        <div dsCheckbox name="reach" value="text" label="Text message"></div>
      </fieldset>
    </form>
  `,
})
class ChoiceHost {
  readonly validators: FormValidators = { reach: (v) => (v === undefined ? 'Pick at least one way to reach you.' : undefined) };
  readonly found: unknown[] = [];
}

@Component({
  imports: [DsForm, DsFormField, DsInput, ReactiveFormsModule],
  template: `
    <form dsForm id="keys" [formGroup]="group" [validators]="validators" [labels]="labels">
      <div dsFormField name="seats" label="Seats"><div dsInput formControlName="seats"></div></div>
      <div dsFormField name="code" label="Code"><div dsInput formControlName="code"></div></div>
      <div dsFormField name="email" label="Email"><div dsInput formControlName="email"></div></div>
      <div dsFormField name="nick" label="Nickname"><div dsInput formControlName="nick"></div></div>
    </form>
  `,
})
class KeysHost {
  readonly group = new FormGroup({
    seats: new FormControl('0', Validators.min(1)),
    code: new FormControl('12', Validators.pattern(/^[0-9]{5}$/)),
    email: new FormControl('sara', Validators.email),
    nick: new FormControl('ab', Validators.minLength(3)),
  });
  readonly validators: FormValidators = { code: (v) => (v === '12' ? 'Enter the 5 digit code.' : undefined) };
  readonly labels = { tooShort: (min: number) => `At least ${min}.` };
}

async function settle(fixture: { whenStable: () => Promise<unknown> }) {
  await fixture.whenStable();
  await tick();
  await fixture.whenStable();
}

function submit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('DsForm', () => {
  it('renders the status, body and actions in order on a novalidate form', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#plain') as HTMLFormElement;
    expect(form.getAttribute('data-ds')).toBe('form');
    expect(form.hasAttribute('novalidate')).toBe(true);
    expect(form.getAttribute('data-state')).toBe('idle');
    expect(Array.from(form.children).map((c) => c.getAttribute('data-part') ?? c.getAttribute('role'))).toEqual(['status', 'body', 'actions']);
    const button = form.querySelector('[data-part="actions"] button') as HTMLButtonElement;
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.getAttribute('data-tone')).toBe('accent');
    expect(button.getAttribute('data-emphasis')).toBe('solid');
    expect(form.querySelector('[data-ds="field"]')?.getAttribute('data-name')).toBe('name');
  });

  it('on submit shows a summary with links in form order, focuses the first invalid field and announces the count', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#plain') as HTMLFormElement;
    document.body.appendChild(fixture.nativeElement);
    submit(form);
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    expect(form.hasAttribute('data-invalid')).toBe(true);
    const summary = form.querySelector('[data-part="summary"]') as HTMLElement;
    expect(summary.getAttribute('data-ds')).toBe('alert');
    expect(summary.getAttribute('tabindex')).toBe('-1');
    expect(summary.querySelector('[data-part="title"]')?.textContent).toBe('Fix 2 fields to send the form');
    const links = Array.from(summary.querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Full name: Fill in this field.', 'Work email: Fill in this field.']);
    const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
    expect(document.activeElement).toBe(nameInput);
    expect(nameInput.getAttribute('aria-invalid')).toBe('true');
    expect(form.querySelector('[role="status"]')?.textContent).toContain('Fix 2 fields to send the form');
    expect(fixture.componentInstance.found).toHaveLength(1);
    fixture.nativeElement.remove();
  });

  it('removes an error on a change that fixes it, runs the custom validators and never adds an error on change', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#plain') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    const name = form.querySelector('input[name="name"]') as HTMLInputElement;
    name.value = 'Sara';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    expect(Array.from(form.querySelectorAll('[data-part="summary"] li')).map((li) => li.textContent?.trim())).toEqual([
      'Work email: Fill in this field.',
    ]);
    const email = form.querySelector('input[name="email"]') as HTMLInputElement;
    email.value = 'sara@gmail.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    submit(form);
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    expect(form.querySelector('[data-part="summary"] li')?.textContent).toContain('Use your work email.');
  });

  it('passes the values to onSubmit, holds submitting while it runs and shows returned server errors', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    let release: (value: unknown) => void = () => undefined;
    const handler = vi.fn(() => new Promise((resolve) => (release = resolve)));
    fixture.componentInstance.onSubmit.set(handler);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#plain') as HTMLFormElement;
    (form.querySelector('input[name="name"]') as HTMLInputElement).value = 'Sara';
    (form.querySelector('input[name="email"]') as HTMLInputElement).value = 'sara@example.com';
    submit(form);
    await fixture.whenStable();
    expect(handler).toHaveBeenCalledWith({ name: 'Sara', email: 'sara@example.com' }, form);
    expect(form.getAttribute('data-state')).toBe('submitting');
    expect(form.getAttribute('aria-busy')).toBe('true');
    const button = form.querySelector('[data-part="actions"] button') as HTMLElement;
    expect(button.hasAttribute('data-loading')).toBe(true);
    expect(button.querySelector('[data-part="status"]')?.textContent).toBe('Sending');
    release({ email: 'Taken', form: 'Try again later.' });
    await tick();
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    expect(form.getAttribute('data-state')).toBe('idle');
    const items = Array.from(form.querySelectorAll('[data-part="summary"] li')).map((li) => li.textContent?.trim());
    expect(items).toEqual(['Try again later.', 'Work email: Taken']);
  });

  it('shows serverErrors on the first render without moving focus', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    fixture.componentInstance.server.set([{ field: 'email', message: 'This email already has an account.' }]);
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#plain') as HTMLFormElement;
    expect(form.querySelector('[data-part="summary"] a')?.textContent?.trim()).toBe('Work email: This email already has an account.');
    expect(form.querySelector('[data-name="email"] [data-part="error"]')?.textContent).toContain('This email already has an account.');
    expect(form.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('clears the errors on reset', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#plain') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    form.dispatchEvent(new Event('reset', { bubbles: true }));
    await fixture.whenStable();
    expect(form.querySelector('[data-part="summary"]')).toBeNull();
  });

  it('reads the errors of a reactive FormGroup and maps them to the summary', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#reactive') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    expect(host.submit).not.toHaveBeenCalled();
    expect(host.group.touched).toBe(true);
    const items = Array.from(form.querySelectorAll('[data-part="summary"] li')).map((li) => li.textContent?.trim());
    expect(items).toEqual(['Full name: Fill in this field.', 'Age: You need to be 18 or older.']);
    expect(form.querySelector('[data-name="age"] [data-part="error"]')?.textContent).toContain('You need to be 18 or older.');
    host.group.setValue({ name: 'Sara', age: '30' });
    submit(form);
    await fixture.whenStable();
    await tick();
    expect(host.submit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sara', age: '30' }), form);
  });

  it('reads the errors of template forms (NgForm)', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#template') as HTMLFormElement;
    submit(form);
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
    expect(form.querySelector('[data-part="summary"] li')?.textContent?.trim()).toBe('City: Fill in this field.');
    const input = form.querySelector('input[name="city"]') as HTMLInputElement;
    input.value = 'Riyadh';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(form.querySelector('[data-part="summary"]')).toBeNull();
  });

  it('maps Angular validation errors to messages', () => {
    const words = { required: 'Fill in this field.', invalid: 'Check the value.' };
    expect(messageOf({ required: true }, words)).toBe('Fill in this field.');
    expect(messageOf({ minlength: { requiredLength: 3 } }, words)).toBe('Check the value.');
    expect(messageOf({ taken: 'This name is taken.' }, words)).toBe('This name is taken.');
    expect(messageOf({ server: { message: 'No.' } }, words)).toBe('No.');
  });

  it('a constraint failure uses the Form copy in the page language, never the browser message', async () => {
    const fixture = TestBed.createComponent(ArabicHost);
    await fixture.whenStable();
    submit(fixture.nativeElement.querySelector('#arabic'));
    await settle(fixture);
    expect(fixture.componentInstance.found).toEqual([
      {
        email: 'اكتب بريد إلكتروني صحيح، مثل name@example.com.',
        seats: 'اكتب 1 أو أكثر.',
        postal: 'راجع صيغة القيمة في الحقل هذا.',
      },
    ]);
  });

  it('a validator message wins over the generic pattern copy, so it can name the format', async () => {
    const fixture = TestBed.createComponent(PatternHost);
    await fixture.whenStable();
    submit(fixture.nativeElement.querySelector('#pattern'));
    await settle(fixture);
    expect(fixture.componentInstance.found).toEqual([
      { postal: 'Enter the 5 digit postal code.', site: 'Enter a web address that starts with https://.' },
    ]);
  });

  it('a required radio group asks to pick an option, a required box asks to tick it, and a group link names the group', async () => {
    const fixture = TestBed.createComponent(ChoiceHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#choices') as HTMLFormElement;
    submit(form);
    await settle(fixture);
    expect(fixture.componentInstance.found).toEqual([
      { seat: 'Pick one option to go on.', terms: 'Tick this box to go on.', reach: 'Pick at least one way to reach you.' },
    ]);
    const links = Array.from(form.querySelectorAll('[data-part="summary"] a')).map((a) => a.textContent?.trim());
    expect(links).toEqual([
      'Seating: Pick one option to go on.',
      'I agree to the terms: Tick this box to go on.',
      'How should we reach you: Pick at least one way to reach you.',
    ]);
    // A radio group with no value: the first invalid field still takes focus on a visible item, and its link points there.
    const inside = form.querySelector('[role="radio"]') as HTMLElement;
    expect(document.activeElement).toBe(inside);
    expect((form.querySelector('[data-part="summary"] a') as HTMLAnchorElement).getAttribute('href')).toBe(`#${inside.id}`);
    const group = form.querySelector('fieldset') as HTMLElement;
    expect(group.querySelector('[data-part="error"]')?.textContent?.trim()).toBe('Pick at least one way to reach you.');
    (form.querySelectorAll('fieldset [role="checkbox"]')[1] as HTMLElement).click();
    await settle(fixture);
    expect(group.querySelector('[data-part="error"]')).toBeNull();
    fixture.nativeElement.remove();
  });

  it('maps the Angular validator keys to the Form copy; a custom validator wins; labels take the React shape', async () => {
    const fixture = TestBed.createComponent(KeysHost);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#keys') as HTMLFormElement;
    submit(form);
    await settle(fixture);
    const items = Array.from(form.querySelectorAll('[data-part="summary"] li')).map((li) => li.textContent?.trim());
    expect(items).toEqual([
      'Seats: Enter 1 or more.',
      'Code: Enter the 5 digit code.',
      'Email: Enter an email address, like name@example.com.',
      'Nickname: At least 3.',
    ]);
  });

  it('announces a submit that passes', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    fixture.componentInstance.onSubmit.set(() => undefined);
    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('#plain') as HTMLFormElement;
    (form.querySelector('input[name="name"]') as HTMLInputElement).value = 'Sara';
    (form.querySelector('input[name="email"]') as HTMLInputElement).value = 'sara@example.com';
    expect(form.querySelector('[data-part="success-mark"]')).toBeNull();
    submit(form);
    await settle(fixture);
    expect(form.getAttribute('data-state')).toBe('submitted');
    expect(form.querySelector('[role="status"]')?.textContent?.trim()).toBe('The form was sent.');
    // form-submit-success (order 1.23): a decorative mark draws after the buttons.
    const mark = form.querySelector('[data-part="actions"] > [data-part="success-mark"]');
    expect(mark?.previousElementSibling?.textContent?.trim()).toBe('Send request');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(mark?.getAttribute('focusable')).toBe('false');
    expect(mark?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(mark?.querySelectorAll('[pathLength="1"]')).toHaveLength(2);
    expect(mark?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('the demo postal code says which format it wants', async () => {
    const fixture = TestBed.createComponent(FormDemo);
    await fixture.whenStable();
    const many = fixture.nativeElement.querySelector('[data-demo-case="many"]') as HTMLElement;
    expect(many.querySelector('fieldset[data-name="reach"] legend')?.textContent?.trim()).toBe('How should we reach you');
    const postal = many.querySelector('input[name="postal"]') as HTMLInputElement;
    postal.value = '12';
    submit(postal.form as HTMLFormElement);
    await settle(fixture);
    const summary = many.querySelector('[data-part="summary"]')?.textContent ?? '';
    expect(summary).toContain('Postal code: Enter the 5 digit postal code.');
    expect(summary).toContain('How should we reach you: Pick at least one way to reach you.');
  });

  it('angularErrors maps the built in keys and takes a required message by path', () => {
    const group = new FormGroup({ terms: new FormControl(false, Validators.requiredTrue), age: new FormControl(3, Validators.max(2)) });
    const words = { required: 'Fill in.', invalid: 'Check.', rangeOverflow: (max: string) => `Up to ${max}.` };
    expect(angularErrors(group, words, (p) => (p === 'terms' ? 'Tick it.' : undefined))).toEqual({ terms: 'Tick it.', age: 'Up to 2.' });
  });
});
