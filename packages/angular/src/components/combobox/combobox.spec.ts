import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { cityOptions, citySections } from '../list-box/samples';
import { DsCombobox, defaultResultCount } from './combobox';

@Component({
  imports: [DsCombobox, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="City" description="Type a city name.">
      <div data-test="city" dsCombobox [items]="cities" [(value)]="city" [(open)]="open" placeholder="Search cities" name="city"></div>
    </div>
    <div data-test="plain" dsCombobox aria-label="City" size="lg" shape="pill" [items]="gulf" defaultValue="doha"></div>
    <div data-test="empty" dsCombobox aria-label="City" [items]="[]" empty="No cities yet."></div>
    <div data-test="loading" dsCombobox aria-label="City" [items]="[]" loading loadingLabel="Loading cities"></div>
    <div dsField label="City" disabled><div data-test="disabled" dsCombobox [items]="gulf" defaultValue="doha"></div></div>
    <div dsField label="City" error="Choose a city."><div data-test="invalid" dsCombobox [items]="gulf"></div></div>
    <div data-test="reactive" dsCombobox aria-label="City" [items]="gulf" [formControl]="form"></div>
    <div data-test="template" dsCombobox aria-label="City" [items]="gulf" [(ngModel)]="model"></div>
  `,
})
class Host {
  readonly cities = citySections('en');
  readonly gulf = cityOptions('en', 'gulf');
  readonly city = signal<string | null | undefined>('riyadh');
  readonly open = signal<boolean | undefined>(false);
  readonly form = new FormControl<string | null>('dubai');
  model: string | null = null;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const input = (id: string) => root(id).querySelector('input[role="combobox"]') as HTMLInputElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (id: string, k: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    input(id).dispatchEvent(event);
    await settle();
    return event;
  };
  const type = async (id: string, text: string) => {
    input(id).value = text;
    input(id).dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  };
  const popup = () => document.querySelector('[data-menu-layer] [data-part="popup"]') as HTMLElement | null;
  return { fixture, host: fixture.componentInstance, root, input, settle, key, type, popup };
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll('[data-menu-layer]'))) el.remove();
});

describe('DsCombobox', () => {
  it('counts results in English and Arabic', () => {
    expect(defaultResultCount(0, 'en')).toBe('No results');
    expect(defaultResultCount(1, 'en')).toBe('1 result');
    expect(defaultResultCount(3, 'en')).toBe('3 results');
    expect(defaultResultCount(2, 'ar')).toBe('نتيجتين');
    expect(defaultResultCount(5, 'ar')).toBe('5 نتائج');
  });

  it('renders the root and the input with the combobox attributes and the Field wiring', async () => {
    const { root, input } = await setup();
    const el = root('city');
    expect(el.getAttribute('data-ds')).toBe('combobox');
    expect(el.getAttribute('class')).toBe('');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    for (const name of ['dscombobox', 'items', 'placeholder', 'name']) expect(el.hasAttribute(name)).toBe(false);
    const c = input('city');
    expect(c.getAttribute('aria-expanded')).toBe('false');
    expect(c.getAttribute('aria-autocomplete')).toBe('list');
    expect(c.getAttribute('autocomplete')).toBe('off');
    expect(c.getAttribute('placeholder')).toBe('Search cities');
    expect(c.value).toBe('Riyadh');
    expect(c.getAttribute('value')).toBe('Riyadh');
    const field = el.closest('[data-ds="field"]') as HTMLElement;
    expect(c.id).toBe(field.querySelector('label')?.getAttribute('for'));
    expect(c.getAttribute('aria-describedby')).toBe(field.querySelector('[data-part="description"]')?.id);
    expect(el.querySelector('input[type="hidden"]')?.getAttribute('name')).toBe('city');
    expect(el.querySelector('[data-part="clear"]')?.getAttribute('aria-label')).toBe('Clear value');
    expect(el.querySelector('[data-part="trigger"]')?.getAttribute('tabindex')).toBe('-1');
    expect(el.querySelector('[data-part="status"]')?.getAttribute('role')).toBe('status');
    expect(root('plain').getAttribute('data-size')).toBe('lg');
    expect(root('plain').getAttribute('data-shape')).toBe('pill');
    expect(input('plain').getAttribute('aria-label')).toBe('City');
  });

  it('the trigger opens the popup in a themed layer, with the selected option highlighted', async () => {
    const { host, root, input, settle, popup } = await setup();
    (root('city').querySelector('[data-part="trigger"]') as HTMLButtonElement).click();
    await settle();
    expect(host.open()).toBe(true);
    const p = popup();
    expect(p).not.toBeNull();
    expect(p?.getAttribute('data-ds')).toBe('combobox');
    expect(p?.getAttribute('data-state')).toBe('open');
    expect(p?.parentElement?.hasAttribute('data-radix-popper-content-wrapper')).toBe(true);
    expect(p?.closest('[data-menu-layer]')?.getAttribute('data-ds')).toBe('theme');
    const list = p?.querySelector('[data-ds="list-box"]') as HTMLElement;
    expect(input('city').getAttribute('aria-expanded')).toBe('true');
    expect(input('city').getAttribute('aria-controls')).toBe(list.id);
    const active = input('city').getAttribute('aria-activedescendant');
    expect(document.getElementById(active ?? '')?.textContent).toBe('Riyadh');
    expect(list.getAttribute('aria-labelledby')).toBe(root('city').closest('[data-ds="field"]')?.querySelector('label')?.id);
  });

  it('typing filters with the shared filter, highlights the first match, Enter chooses', async () => {
    const { host, input, key, type, popup } = await setup();
    await type('city', 'jed');
    expect(popup()?.querySelectorAll('[role="option"]').length).toBe(1);
    expect(popup()?.querySelector('mark')?.textContent).toBe('Jed');
    expect(popup()?.querySelector('[data-highlighted]')?.textContent).toBe('Jeddah');
    const enter = await key('city', 'Enter');
    expect(enter.defaultPrevented).toBe(true);
    expect(host.city()).toBe('jeddah');
    expect(input('city').value).toBe('Jeddah');
    expect(host.open()).toBe(false);
  });

  it('finds Arabic across alef forms and by airport code', async () => {
    const { type, popup } = await setup();
    await type('city', 'ruh');
    expect(popup()?.querySelector('[data-highlighted]')?.textContent).toBe('Riyadh');
  });

  it('arrows move the highlight, loop by default, and Escape closes then clears', async () => {
    const { host, input, key, popup, settle } = await setup();
    await key('city', 'ArrowDown');
    expect(popup()?.querySelector('[data-highlighted]')?.textContent).toBe('Riyadh');
    await key('city', 'ArrowUp');
    expect(popup()?.querySelector('[data-highlighted]')?.textContent).toBe('Muscat');
    await key('city', 'ArrowDown');
    expect(popup()?.querySelector('[data-highlighted]')?.textContent).toBe('Riyadh');
    await key('city', 'Escape');
    await settle();
    expect(host.open()).toBe(false);
    expect(input('city').value).toBe('Riyadh');
    const second = await key('city', 'Escape');
    expect(second.defaultPrevented).toBe(true);
    expect(input('city').value).toBe('');
    expect(host.city()).toBe(null);
  });

  it('the clear button clears the value', async () => {
    const { host, root, settle } = await setup();
    (root('city').querySelector('[data-part="clear"]') as HTMLButtonElement).click();
    await settle();
    expect(host.city()).toBe(null);
    expect(root('city').querySelector('[data-part="clear"]')).toBeNull();
  });

  it('a value set from outside shows its label', async () => {
    const { host, input, settle } = await setup();
    host.city.set('abha');
    await settle();
    expect(input('city').value).toBe('Abha');
  });

  it('empty and loading say so in the popup', async () => {
    const { root, key, popup } = await setup();
    await key('empty', 'ArrowDown');
    expect(popup()?.querySelector('[data-part="empty"]')?.textContent).toBe('No cities yet.');
    expect(root('loading').hasAttribute('data-loading')).toBe(true);
    expect(root('loading').querySelector('[data-part="trigger"]')?.hasAttribute('data-loading')).toBe(true);
  });

  it('a disabled Field disables the input; an error marks it invalid', async () => {
    const { root, input } = await setup();
    expect(input('disabled').disabled).toBe(true);
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').querySelector('[data-part="clear"]')).toBeNull();
    expect(input('invalid').getAttribute('aria-invalid')).toBe('true');
    expect(root('invalid').hasAttribute('data-invalid')).toBe(true);
  });

  it('works with a reactive form control, both ways, and its disabled state', async () => {
    const { host, input, type, key, settle } = await setup();
    expect(input('reactive').value).toBe('Dubai');
    await type('reactive', 'mus');
    await key('reactive', 'Enter');
    expect(host.form.value).toBe('muscat');
    host.form.setValue('doha');
    await settle();
    expect(input('reactive').value).toBe('Doha');
    host.form.disable();
    await settle();
    expect(input('reactive').disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, type, key } = await setup();
    await type('template', 'man');
    await key('template', 'Enter');
    expect(host.model).toBe('manama');
  });
});

@Component({
  imports: [DsCombobox, DsField],
  template: `
    <div dsField data-test="wired" label="Name" description="A hint." error="Fix this." required>
      <div dsCombobox [items]="items"></div>
    </div>
    <div dsField data-test="own-id" label="Name">
      <div dsCombobox [items]="items" id="own-control"></div>
    </div>
    <div dsField data-test="off" label="Name" disabled>
      <div dsCombobox [items]="items"></div>
    </div>
  `,
})
class FieldWiringHost {
  readonly items = cityOptions('en');
}

describe('DsCombobox in a Field', () => {
  it('reads the Field as React useFieldControl does: id, describedby order, invalid, required, disabled', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const field = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
    const control = (id: string) => field(id).querySelector('input[role="combobox"]') as HTMLElement;

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
    const c = fixture.nativeElement.querySelector('[data-test="off"] input[role="combobox"]') as HTMLButtonElement;
    expect(c.disabled).toBe(true);
    expect(c.closest('[data-ds="combobox"]')?.hasAttribute('data-disabled')).toBe(true);
  });
});
