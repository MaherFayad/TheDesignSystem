import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DsSwitch } from './switch';

@Component({
  imports: [DsSwitch, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="plain" dsSwitch label="Show rulers" description="Along the top and the start edge."></div>
    <div data-test="sized" dsSwitch aria-label="Auto save" size="lg" defaultChecked></div>
    <div data-test="text" dsSwitch label="Snap" [stateText]="{ on: 'On', off: 'Off' }"></div>
    <div data-test="textonly" dsSwitch aria-label="Snap" [stateText]="{ on: 'On', off: 'Off' }" defaultChecked></div>
    <div data-test="bound" dsSwitch label="Sounds" [(checked)]="checked"></div>
    <div data-test="readonly" dsSwitch label="Locked" readOnly defaultChecked></div>
    <div data-test="disabled" dsSwitch label="Off" disabled></div>
    <div dsField error="Turn on two step sign in." required>
      <div data-test="field" dsSwitch label="Two step sign in"></div>
    </div>
    <div data-test="reactive" dsSwitch label="News" [formControl]="news"></div>
    <div data-test="template" dsSwitch label="Spell check" [(ngModel)]="spell"></div>
    <form><div data-test="inform" dsSwitch label="Terms" name="terms" value="yes" defaultChecked></div></form>
  `,
})
class Host {
  readonly checked = signal<boolean | undefined>(false);
  readonly news = new FormControl(true, { nonNullable: true });
  spell = false;
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

describe('DsSwitch', () => {
  it('renders the root, the control with role switch, the track and thumb, a bound label and a description', async () => {
    const { root, control } = await setup();
    const el = root('plain');
    expect(el.getAttribute('data-ds')).toBe('switch');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-state')).toBe('unchecked');
    for (const name of ['dsswitch', 'label', 'description']) expect(el.hasAttribute(name)).toBe(false);
    const c = control('plain');
    expect(c.getAttribute('role')).toBe('switch');
    expect(c.getAttribute('type')).toBe('button');
    expect(c.getAttribute('aria-checked')).toBe('false');
    expect(c.getAttribute('aria-required')).toBe('false');
    expect(c.getAttribute('value')).toBe('on');
    const thumb = c.querySelector(':scope > [data-part="track"] > [data-part="thumb"]');
    expect(thumb?.getAttribute('data-state')).toBe('unchecked');
    expect(el.querySelector('label[data-part="label"]')?.getAttribute('for')).toBe(c.id);
    expect(c.getAttribute('aria-describedby')).toBe(el.querySelector('[data-part="description"]')?.id);
  });

  it('maps size and aria-label, and starts at defaultChecked', async () => {
    const { root, control } = await setup();
    expect(root('sized').getAttribute('data-size')).toBe('lg');
    expect(root('sized').getAttribute('data-state')).toBe('checked');
    expect(root('sized').hasAttribute('aria-label')).toBe(false);
    expect(control('sized').getAttribute('aria-label')).toBe('Auto save');
    expect(control('sized').getAttribute('aria-checked')).toBe('true');
  });

  it('shows the state text inside the label, hidden from assistive tech, and follows the state', async () => {
    const { root, control, settle } = await setup();
    const text = root('text').querySelector('label > [data-part="state-text"]') as HTMLElement;
    expect(text.getAttribute('aria-hidden')).toBe('true');
    expect(text.textContent).toBe('Off');
    control('text').click();
    await settle();
    expect(root('text').querySelector('[data-part="state-text"]')?.textContent).toBe('On');
    const alone = root('textonly').querySelector(':scope > [data-part="state-text"]');
    expect(alone?.textContent).toBe('On');
  });

  it('toggles on click and on the label, and writes the model back', async () => {
    const { host, root, control, settle } = await setup();
    control('bound').click();
    await settle();
    expect(host.checked()).toBe(true);
    expect(root('bound').getAttribute('data-state')).toBe('checked');
    (root('bound').querySelector('label') as HTMLLabelElement).click();
    await settle();
    expect(host.checked()).toBe(false);
    host.checked.set(true);
    await settle();
    expect(control('bound').getAttribute('aria-checked')).toBe('true');
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

  it('disabled sets the native disabled and data-disabled on the root, control and thumb', async () => {
    const { root, control } = await setup();
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').hasAttribute('disabled')).toBe(false);
    expect(control('disabled').disabled).toBe(true);
    expect(control('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').querySelector('[data-part="thumb"]')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('reads id, the error, invalid and required from a Field', async () => {
    const { fixture, root, control } = await setup();
    const error = fixture.nativeElement.querySelector('[data-ds="field"] [data-part="error"]') as HTMLElement;
    expect(control('field').getAttribute('aria-describedby')).toBe(error.id);
    expect(control('field').getAttribute('aria-invalid')).toBe('true');
    expect(control('field').getAttribute('aria-required')).toBe('true');
    expect(root('field').hasAttribute('data-invalid')).toBe(true);
  });

  it('works with a reactive form control, both ways, and with its disabled state', async () => {
    const { host, root, control, settle } = await setup();
    expect(root('reactive').getAttribute('data-state')).toBe('checked');
    control('reactive').click();
    await settle();
    expect(host.news.value).toBe(false);
    host.news.setValue(true);
    await settle();
    expect(root('reactive').getAttribute('data-state')).toBe('checked');
    host.news.disable();
    await settle();
    expect(control('reactive').disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, control, settle } = await setup();
    control('template').click();
    await settle();
    expect(host.spell).toBe(true);
  });

  it('inside a form, a hidden native checkbox carries the name and value', async () => {
    const { root, control, settle } = await setup();
    await settle();
    const bubble = root('inform').querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(bubble.getAttribute('aria-hidden')).toBe('true');
    expect(bubble.tabIndex).toBe(-1);
    expect(bubble.name).toBe('terms');
    expect(bubble.value).toBe('yes');
    expect(bubble.checked).toBe(true);
    expect(bubble.hasAttribute('checked')).toBe(true);
    expect(bubble.getAttribute('style')).toContain('position: absolute');
    control('inform').click();
    await settle();
    expect(bubble.checked).toBe(false);
    expect(root('plain').querySelector('input')).toBeNull();
  });
});

@Component({
  imports: [DsSwitch, DsField],
  template: `
    <div dsField data-test="wired" label="Name" description="A hint." error="Fix this." required>
      <div dsSwitch></div>
    </div>
    <div dsField data-test="own-id" label="Name">
      <div dsSwitch id="own-control"></div>
    </div>
    <div dsField data-test="off" label="Name" disabled>
      <div dsSwitch></div>
    </div>
  `,
})
class FieldWiringHost {
}

describe('DsSwitch in a Field', () => {
  it('reads the Field as React useFieldControl does: id, describedby order, invalid, required, disabled', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const field = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
    const control = (id: string) => field(id).querySelector('[data-ds="switch"] > [data-part="control"]') as HTMLElement;

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
    const c = fixture.nativeElement.querySelector('[data-test="off"] [data-ds="switch"] > [data-part="control"]') as HTMLButtonElement;
    expect(c.disabled).toBe(true);
    expect(c.closest('[data-ds="switch"]')?.hasAttribute('data-disabled')).toBe(true);
  });
});
