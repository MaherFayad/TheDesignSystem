import { Component, viewChild, type TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsFormWizard, type FormWizardStep, type FormWizardTemplateContext } from './form-wizard';

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

@Component({
  imports: [DsFormWizard, DsField, DsInput],
  template: `
    @if (steps(); as s) {
      <div dsFormWizard [steps]="s" stepsLabel="Checkout steps" submitLabel="Place order" doneTitle="Order placed" done="We sent the receipt."
        [onSubmit]="submit" [formProps]="{ autoComplete: 'on', name: 'checkout' }" (stepChange)="changes.push($event)"></div>
    }
    <ng-template #account let-errors="errors">
      <div dsField label="Full name" required [error]="errors.name"><div dsInput name="name"></div></div>
    </ng-template>
    <ng-template #address let-errors="errors">
      <div dsField label="Postal code" [error]="errors.postal"><div dsInput name="postal"></div></div>
    </ng-template>
    <ng-template #review let-values="values"><p id="summary">{{ values.name }} {{ values.postal }}</p></ng-template>
  `,
})
class Host {
  readonly account = viewChild.required<TemplateRef<FormWizardTemplateContext>>('account');
  readonly address = viewChild.required<TemplateRef<FormWizardTemplateContext>>('address');
  readonly review = viewChild.required<TemplateRef<FormWizardTemplateContext>>('review');
  readonly changes: number[] = [];
  submit = vi.fn(() => Promise.resolve());
  private made: FormWizardStep[] | undefined;
  steps(): FormWizardStep[] | undefined {
    if (this.made) return this.made;
    try {
      this.made = [
        { id: 'account', title: 'Account', content: this.account(), nextLabel: 'Save account' },
        {
          id: 'address',
          title: 'Address',
          content: this.address(),
          backLabel: 'Edit account',
          validate: (values) => (values['postal'] && !/^\d{5}$/.test(String(values['postal'])) ? { postal: 'Enter five digits' } : undefined),
        },
        { id: 'review', title: 'Review', content: this.review() },
      ];
    } catch {
      return undefined;
    }
    return this.made;
  }
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  await tick();
  await fixture.whenStable();
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;
  const settle = async () => {
    for (let i = 0; i < 4; i += 1) {
      await tick();
      await fixture.whenStable();
    }
  };
  return { fixture, host: fixture.componentInstance, q, settle };
}

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('DsFormWizard', () => {
  it('renders the stepper, the panel form with every step and the actions', async () => {
    const { fixture, q } = await setup();
    const root = q('[data-ds="form-wizard"]');
    expect(root.getAttribute('data-state')).toBe('editing');
    expect(Array.from(root.children).map((c) => c.getAttribute('data-part'))).toEqual(['steps', 'panel', 'status']);
    expect(q('[data-part="steps"]').getAttribute('aria-label')).toBe('Checkout steps');
    const form = q('form[data-part="panel"]');
    expect(form.hasAttribute('novalidate')).toBe(true);
    expect(form.getAttribute('autocomplete')).toBe('on');
    expect(form.getAttribute('name')).toBe('checkout');
    const title = q('[data-part="panel"] > h2');
    expect(form.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.textContent).toBe('Account');
    const bodies = Array.from(form.querySelectorAll('[data-part="body"]'));
    expect(bodies.map((b) => b.hasAttribute('hidden'))).toEqual([false, true, true]);
    expect(q('[data-part="actions"] [data-part="back"]')).toBeNull();
    expect(q('[data-part="next"]').textContent?.trim()).toBe('Save account');
    fixture.nativeElement.remove();
  });

  it('checks the step before moving on: an empty required field stays, is marked and takes focus', async () => {
    const { fixture, q, settle } = await setup();
    q('[data-part="next"]').click();
    await settle();
    expect(q('[data-part="panel"] > h2').textContent).toBe('Account');
    expect(q('[data-part="body"][data-step="0"] [data-part="error"]')?.textContent).toContain('Fill in this field');
    expect(document.activeElement).toBe(q('input[name="name"]'));
    expect(q('[data-part="steps"] > li').hasAttribute('data-invalid')).toBe(true);
    fixture.nativeElement.remove();
  });

  it('moves on when the step is valid, announces the step, focuses the title and keeps the values when going back', async () => {
    const { fixture, host, q, settle } = await setup();
    type(q('input[name="name"]') as HTMLInputElement, 'Sara');
    q('[data-part="next"]').click();
    await settle();
    const title = q('[data-part="panel"] > h2');
    expect(title.textContent).toBe('Address');
    expect(document.activeElement).toBe(title);
    expect(q('[data-part="status"][role="status"]').textContent).toBe('Step 2 of 3, Address');
    expect(host.changes).toEqual([1]);
    const back = q('[data-part="back"]');
    expect(back.textContent?.trim()).toBe('Edit account');
    back.click();
    await settle();
    expect(q('[data-part="panel"] > h2').textContent).toBe('Account');
    expect((q('input[name="name"]') as HTMLInputElement).value).toBe('Sara');
    fixture.nativeElement.remove();
  });

  it('runs the step validate, shows the review values and submits every value', async () => {
    const { fixture, host, q, settle } = await setup();
    type(q('input[name="name"]') as HTMLInputElement, 'Sara');
    q('[data-part="next"]').click();
    await settle();
    type(q('input[name="postal"]') as HTMLInputElement, '12');
    q('[data-part="next"]').click();
    await settle();
    expect(q('[data-part="body"][data-step="1"] [data-part="error"]')?.textContent).toContain('Enter five digits');
    type(q('input[name="postal"]') as HTMLInputElement, '12271');
    q('[data-part="next"]').click();
    await settle();
    expect(q('#summary').textContent).toBe('Sara 12271');
    const submit = q('[data-part="submit"]');
    expect(submit.textContent?.trim()).toBe('Place order');
    submit.click();
    await settle();
    expect(host.submit).toHaveBeenCalledWith({ name: 'Sara', postal: '12271' }, q('form'));
    expect(q('[data-ds="form-wizard"]').getAttribute('data-state')).toBe('done');
    expect(q('[data-part="panel"] > h2').textContent).toBe('Order placed');
    // wizard-done (order 1.23): a decorative mark draws before the done title and adds no words.
    const mark = q('[data-part="panel"] > h2').querySelector(':scope > [data-part="success-mark"]');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(q('[data-part="panel"] > h2').firstElementChild).toBe(mark);
    expect(mark?.querySelectorAll('[pathLength="1"]')).toHaveLength(2);
    expect(q('[data-part="actions"]')).toBeNull();
    expect(q('[data-part="status"][role="status"]').textContent).toBe('Order placed');
    fixture.nativeElement.remove();
  });

  it('shows the submit error when onSubmit rejects', async () => {
    const { fixture, host, q, settle } = await setup();
    host.submit = vi.fn(() => Promise.reject(new Error('offline')));
    fixture.componentRef.changeDetectorRef.markForCheck();
    await settle();
    type(q('input[name="name"]') as HTMLInputElement, 'Sara');
    q('[data-part="next"]').click();
    await settle();
    q('[data-part="next"]').click();
    await settle();
    q('[data-part="submit"]').click();
    await settle();
    expect(q('[data-ds="form-wizard"]').getAttribute('data-state')).toBe('editing');
    const error = q('[data-part="panel"] > [data-part="error"]');
    expect(error.textContent).toContain('The form was not sent.');
    expect(q('form').getAttribute('aria-describedby')).toBe(error.id);
    fixture.nativeElement.remove();
  });
});
