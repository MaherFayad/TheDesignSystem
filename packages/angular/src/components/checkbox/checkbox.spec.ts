import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsCheckbox, checkboxState, type CheckboxCheckedState } from './checkbox';

@Component({
  imports: [DsCheckbox, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="plain" dsCheckbox label="Show rulers" description="Along the top and the start edge."></div>
    <div data-test="sized" dsCheckbox aria-label="Select the row" size="lg" tone="danger" defaultChecked="indeterminate"></div>
    <div data-test="bound" dsCheckbox label="Snap" [(checked)]="checked"></div>
    <div data-test="readonly" dsCheckbox label="Locked" readOnly [defaultChecked]="true"></div>
    <div data-test="disabled" dsCheckbox label="Off" disabled></div>
    <div dsField error="Agree to the terms." required>
      <div data-test="field" dsCheckbox label="I agree"></div>
    </div>
    <div data-test="reactive" dsCheckbox label="News" [formControl]="news"></div>
    <div data-test="template" dsCheckbox label="Sounds" [(ngModel)]="sounds"></div>
    <form><div data-test="inform" dsCheckbox label="Terms" name="terms" value="yes"></div></form>
  `,
})
class Host {
  readonly checked = signal<CheckboxCheckedState | undefined>(false);
  readonly news = new FormControl<CheckboxCheckedState>(true, { nonNullable: true });
  sounds: CheckboxCheckedState = false;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const control = (id: string) => root(id).querySelector('[data-part="control"]') as HTMLButtonElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, control, settle };
}

describe('DsCheckbox', () => {
  it('maps a checked state to the state word', () => {
    expect(checkboxState(true)).toBe('checked');
    expect(checkboxState(false)).toBe('unchecked');
    expect(checkboxState('indeterminate')).toBe('indeterminate');
  });

  it('renders the root, the control with role checkbox, the indicator, a bound label and a description', async () => {
    const { root, control } = await setup();
    const el = root('plain');
    expect(el.getAttribute('data-ds')).toBe('checkbox');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-state')).toBe('unchecked');
    for (const name of ['dscheckbox', 'label', 'description']) expect(el.hasAttribute(name)).toBe(false);
    const c = control('plain');
    expect(c.getAttribute('role')).toBe('checkbox');
    expect(c.getAttribute('type')).toBe('button');
    expect(c.getAttribute('aria-checked')).toBe('false');
    expect(c.getAttribute('aria-required')).toBe('false');
    expect(c.getAttribute('value')).toBe('on');
    expect(c.querySelector('[data-part="indicator"]')).not.toBeNull();
    const label = el.querySelector('label[data-part="label"]');
    expect(label?.getAttribute('for')).toBe(c.id);
    const description = el.querySelector('[data-part="description"]');
    expect(c.getAttribute('aria-describedby')).toBe(description?.id);
  });

  it('maps size, tone, aria-label and the indeterminate state', async () => {
    const { root, control } = await setup();
    const el = root('sized');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(el.getAttribute('data-state')).toBe('indeterminate');
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(control('sized').getAttribute('aria-label')).toBe('Select the row');
    expect(control('sized').getAttribute('aria-checked')).toBe('mixed');
    expect(el.querySelector('[data-icon="minus"]')).not.toBeNull();
  });

  it('keeps the indicator and a hidden span with the last glyph while unchecked, for the check draw, as React', async () => {
    const { root, control, settle } = await setup();
    const glyph = (id: string) => root(id).querySelector('[data-part="indicator"] > span[aria-hidden="true"] > svg');
    expect(glyph('plain')?.getAttribute('data-icon')).toBe('check');
    expect(glyph('sized')?.getAttribute('data-icon')).toBe('minus');
    control('sized').click();
    await settle();
    expect(glyph('sized')?.getAttribute('data-icon')).toBe('check');
    control('sized').click();
    await settle();
    expect(root('sized').getAttribute('data-state')).toBe('unchecked');
    expect(glyph('sized')?.getAttribute('data-icon')).toBe('check');
  });

  it('a click on the indeterminate box checks it', async () => {
    const { root, control, settle } = await setup();
    control('sized').click();
    await settle();
    expect(root('sized').getAttribute('data-state')).toBe('checked');
    expect(root('sized').querySelector('[data-icon="check"]')).not.toBeNull();
  });

  it('toggles on click and on the label, writes the model back, and ignores Enter', async () => {
    const { host, root, control, settle } = await setup();
    control('bound').click();
    await settle();
    expect(host.checked()).toBe(true);
    expect(control('bound').getAttribute('aria-checked')).toBe('true');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    control('bound').dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    (root('bound').querySelector('label') as HTMLLabelElement).click();
    await settle();
    expect(host.checked()).toBe(false);
    host.checked.set(true);
    await settle();
    expect(root('bound').getAttribute('data-state')).toBe('checked');
  });

  it('read only keeps the value and focus, and stamps the state', async () => {
    const { root, control, settle } = await setup();
    control('readonly').click();
    await settle();
    expect(root('readonly').getAttribute('data-state')).toBe('checked');
    expect(root('readonly').hasAttribute('data-readonly')).toBe(true);
    expect(control('readonly').getAttribute('aria-readonly')).toBe('true');
    expect(control('readonly').disabled).toBe(false);
  });

  it('disabled sets the native disabled and data-disabled on the root, control and indicator', async () => {
    const { root, control } = await setup();
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').hasAttribute('disabled')).toBe(false);
    expect(control('disabled').disabled).toBe(true);
    expect(control('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').querySelector('[data-part="indicator"]')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('reads id, the error, invalid and required from a Field', async () => {
    const { fixture, root, control } = await setup();
    const c = control('field');
    const error = fixture.nativeElement.querySelector('[data-ds="field"] [data-part="error"]') as HTMLElement;
    expect(c.getAttribute('aria-describedby')).toBe(error.id);
    expect(c.getAttribute('aria-invalid')).toBe('true');
    expect(c.getAttribute('aria-required')).toBe('true');
    expect(root('field').hasAttribute('data-invalid')).toBe(true);
  });

  it('works with a reactive form control, both ways, and with its disabled state', async () => {
    const { host, root, control, settle } = await setup();
    expect(root('reactive').getAttribute('data-state')).toBe('checked');
    control('reactive').click();
    await settle();
    expect(host.news.value).toBe(false);
    host.news.setValue('indeterminate');
    await settle();
    expect(root('reactive').getAttribute('data-state')).toBe('indeterminate');
    host.news.disable();
    await settle();
    expect(control('reactive').disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, control, settle } = await setup();
    control('template').click();
    await settle();
    expect(host.sounds).toBe(true);
  });

  it('inside a form, a hidden native checkbox carries the name and value', async () => {
    const { root, control, settle } = await setup();
    await settle();
    const bubble = root('inform').querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(bubble).not.toBeNull();
    expect(bubble.getAttribute('aria-hidden')).toBe('true');
    expect(bubble.tabIndex).toBe(-1);
    expect(bubble.name).toBe('terms');
    expect(bubble.value).toBe('yes');
    expect(bubble.checked).toBe(false);
    control('inform').click();
    await settle();
    expect(bubble.checked).toBe(true);
    expect(root('plain').querySelector('input')).toBeNull();
  });
});

@Component({
  imports: [DsCheckbox, DsField],
  template: `
    <div dsField data-test="wired" label="Name" description="A hint." error="Fix this." required>
      <div dsCheckbox></div>
    </div>
    <div dsField data-test="own-id" label="Name">
      <div dsCheckbox id="own-control"></div>
    </div>
    <div dsField data-test="off" label="Name" disabled>
      <div dsCheckbox></div>
    </div>
  `,
})
class FieldWiringHost {
}

describe('DsCheckbox in a Field', () => {
  it('reads the Field as React useFieldControl does: id, describedby order, invalid, required, disabled', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const field = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
    const control = (id: string) => field(id).querySelector('[data-ds="checkbox"] > [data-part="control"]') as HTMLElement;

    const wired = field('wired');
    const label = wired.querySelector(':scope > label') as HTMLLabelElement;
    const description = wired.querySelector(':scope > [data-part="description"]') as HTMLElement;
    const error = wired.querySelector(':scope > [data-part="error"]') as HTMLElement;
    const c = control('wired');
    expect(c.id).not.toBe('');
    expect(label.getAttribute('for')).toBe(c.id);
    expect(c.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`);
    expect(c.getAttribute('aria-invalid')).toBe('true');
    expect(c.getAttribute('aria-required')).toBe('true');

    // A control with an id of its own tells the Field, so the label points at it.
    expect(control('own-id').id).toBe('own-control');
    expect(field('own-id').querySelector(':scope > label')?.getAttribute('for')).toBe('own-control');
    expect(control('own-id').hasAttribute('aria-describedby')).toBe(false);
    expect(control('own-id').hasAttribute('aria-invalid')).toBe(false);
  });

  it('takes disabled from the Field', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    const c = fixture.nativeElement.querySelector('[data-test="off"] [data-ds="checkbox"] > [data-part="control"]') as HTMLButtonElement;
    expect(c.disabled).toBe(true);
    expect(c.closest('[data-ds="checkbox"]')?.hasAttribute('data-disabled')).toBe(true);
  });
});
