import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import type { FormValidators, FormValues } from '@the-system/shared';
import { describe, expect, it, vi } from 'vitest';
import { DsInput } from '../input/input';
import { DsForm } from './form';
import { DsFormField } from './form-field';
import { DsFormSubmit } from './form-submit';
import { messageOf } from './angular-forms';

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
});
