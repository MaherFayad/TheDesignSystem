import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { citySections } from '../list-box/samples';
import { DsAutocomplete } from './autocomplete';

const tags = ['Design', 'Design review', 'Research', 'Release notes', 'Roadmap'].map((label) => ({ value: label, label }));

@Component({
  imports: [DsAutocomplete, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="Tag" description="Pick a tag or type a new one.">
      <div data-test="tag" dsAutocomplete [items]="tags" [(value)]="tag" name="tag" (commit)="committed.set($event)"></div>
    </div>
    <div data-test="cities" dsAutocomplete aria-label="Destination" size="sm" [items]="cities"></div>
    <div data-test="empty" dsAutocomplete aria-label="Tag" [items]="[]" empty="No tags yet."></div>
    <div dsField label="Tag" readOnly><div data-test="readonly" dsAutocomplete [items]="tags" defaultValue="Research"></div></div>
    <div data-test="reactive" dsAutocomplete aria-label="Tag" [items]="tags" [formControl]="form"></div>
    <div data-test="template" dsAutocomplete aria-label="Tag" [items]="tags" [(ngModel)]="model"></div>
  `,
})
class Host {
  readonly tags = tags;
  readonly cities = citySections('en');
  readonly tag = signal<string | undefined>('Roadmap');
  readonly committed = signal<string | null>(null);
  readonly form = new FormControl('Bug', { nonNullable: true });
  model = '';
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
  const key = async (id: string, k: string) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
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

describe('DsAutocomplete', () => {
  it('renders the root and the input, with no trigger and no clear, and the input carries the name', async () => {
    const { root, input } = await setup();
    const el = root('tag');
    expect(el.getAttribute('data-ds')).toBe('autocomplete');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.querySelector('[data-part="trigger"]')).toBeNull();
    expect(el.querySelector('[data-part="clear"]')).toBeNull();
    expect(input('tag').value).toBe('Roadmap');
    expect(input('tag').getAttribute('name')).toBe('tag');
    expect(el.querySelector('input[type="hidden"]')).toBeNull();
    expect(root('cities').getAttribute('data-size')).toBe('sm');
  });

  it('typing writes the value, filters, and highlights nothing, so Enter keeps the text', async () => {
    const { host, key, type, popup } = await setup();
    await type('tag', 're');
    expect(host.tag()).toBe('re');
    expect(popup()?.getAttribute('data-ds')).toBe('autocomplete');
    expect(popup()?.querySelectorAll('[role="option"]').length).toBe(3);
    expect(popup()?.querySelector('[data-highlighted]')).toBeNull();
    const enter = await key('tag', 'Enter');
    expect(enter.defaultPrevented).toBe(false);
    expect(host.committed()).toBe('re');
    expect(host.tag()).toBe('re');
  });

  it('an arrow highlights a suggestion and Enter puts its label in the field', async () => {
    const { host, input, key, type } = await setup();
    await type('tag', 're');
    await key('tag', 'ArrowDown');
    expect(document.getElementById(input('tag').getAttribute('aria-activedescendant') ?? '')?.textContent).toBe('Research');
    await key('tag', 'Enter');
    expect(host.tag()).toBe('Research');
    expect(input('tag').value).toBe('Research');
  });

  it('no match closes the popup: any text is fine', async () => {
    const { input, type, popup } = await setup();
    await type('tag', 'zzz');
    expect(popup()).toBeNull();
    expect(input('tag').getAttribute('aria-expanded')).toBe('false');
  });

  it('an empty text, when given, shows in the popup', async () => {
    const { type, popup } = await setup();
    await type('empty', 'a');
    expect(popup()?.querySelector('[data-part="empty"]')?.textContent).toBe('No tags yet.');
  });

  it('Escape closes, a second Escape clears', async () => {
    const { host, input, key, type } = await setup();
    await type('tag', 'de');
    await key('tag', 'Escape');
    expect(input('tag').getAttribute('aria-expanded')).toBe('false');
    expect(input('tag').value).toBe('de');
    await key('tag', 'Escape');
    expect(input('tag').value).toBe('');
    expect(host.tag()).toBe('');
  });

  it('read only from a Field keeps the text and does not open', async () => {
    const { root, input, type, popup } = await setup();
    expect(input('readonly').readOnly).toBe(true);
    expect(root('readonly').hasAttribute('data-readonly')).toBe(true);
    await type('readonly', 'x');
    expect(popup()).toBeNull();
  });

  it('works with a reactive form control, both ways, and its disabled state', async () => {
    const { host, input, type, settle } = await setup();
    expect(input('reactive').value).toBe('Bug');
    await type('reactive', 'Bugs');
    expect(host.form.value).toBe('Bugs');
    host.form.setValue('Roadmap');
    await settle();
    expect(input('reactive').value).toBe('Roadmap');
    host.form.disable();
    await settle();
    expect(input('reactive').disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, type } = await setup();
    await type('template', 'Notes');
    expect(host.model).toBe('Notes');
  });
});

@Component({
  imports: [DsAutocomplete, DsField],
  template: `
    <div dsField data-test="wired" label="Name" description="A hint." error="Fix this." required>
      <div dsAutocomplete [items]="items"></div>
    </div>
    <div dsField data-test="own-id" label="Name">
      <div dsAutocomplete [items]="items" id="own-control"></div>
    </div>
    <div dsField data-test="off" label="Name" disabled>
      <div dsAutocomplete [items]="items"></div>
    </div>
  `,
})
class FieldWiringHost {
  readonly items = citySections('en');
}

describe('DsAutocomplete in a Field', () => {
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
    expect(c.closest('[data-ds="autocomplete"]')?.hasAttribute('data-disabled')).toBe(true);
  });
});
