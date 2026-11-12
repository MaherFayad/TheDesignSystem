import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { cityOptions, citySections } from '../list-box/samples';
import { DsMultiSelect, defaultSelectedCount } from './multi-select';

const labels = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'copy', label: 'Copy' },
  { value: 'bug', label: 'Bug' },
  { value: 'legal', label: 'Legal review', disabled: true },
];

@Component({
  imports: [DsMultiSelect, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="Labels" description="Tasks with any of these labels show.">
      <div data-test="labels" dsMultiSelect [items]="labels" [(value)]="value" [(open)]="open" name="labels" data-demo-trigger=""></div>
    </div>
    <div data-test="count" dsMultiSelect aria-label="Labels" summary="count" size="lg" shape="pill" [items]="labels" [defaultValue]="['design', 'bug']"></div>
    <div data-test="cities" dsMultiSelect aria-label="Cities" [maxTags]="2" [items]="cities" [defaultValue]="['riyadh', 'jeddah', 'abha', 'doha']"></div>
    <div data-test="empty" dsMultiSelect aria-label="Labels" [items]="[]" empty="No labels yet."></div>
    <div dsField label="Labels" disabled><div data-test="disabled" dsMultiSelect [items]="labels" [defaultValue]="['design']"></div></div>
    <div dsField label="Labels" readOnly><div data-test="readonly" dsMultiSelect [items]="labels"></div></div>
    <div data-test="reactive" dsMultiSelect aria-label="Cities" [items]="gulf" [formControl]="form"></div>
    <div data-test="template" dsMultiSelect aria-label="Cities" [items]="gulf" [(ngModel)]="model"></div>
  `,
})
class Host {
  readonly labels = labels;
  readonly cities = citySections('en');
  readonly gulf = cityOptions('en', 'gulf');
  readonly value = signal<readonly string[]>(['design', 'copy']);
  readonly open = signal<boolean | undefined>(false);
  readonly form = new FormControl<string[]>(['doha'], { nonNullable: true });
  model: string[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  // React spreads rest props on the trigger: the static data-test moves there, as data-demo-trigger does.
  const trigger = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const root = (id: string) => trigger(id).closest('[data-ds="multi-select"]') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    await settle();
    return event;
  };
  const popup = () => document.querySelector('[data-menu-layer] [data-part="popup"]') as HTMLElement | null;
  const options = () => Array.from(popup()?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
  return { fixture, host: fixture.componentInstance, root, trigger, settle, key, popup, options };
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll('[data-menu-layer]'))) el.remove();
});

describe('DsMultiSelect', () => {
  it('counts in English and Arabic', () => {
    expect(defaultSelectedCount(0, 'en')).toBe('None selected');
    expect(defaultSelectedCount(3, 'en')).toBe('3 selected');
    expect(defaultSelectedCount(2, 'ar')).toBe('عنصرين محددين');
  });

  it('renders the root, the trigger with role combobox, tags and the summary text', async () => {
    const { root, trigger } = await setup();
    const el = root('labels');
    expect(el.getAttribute('data-ds')).toBe('multi-select');
    expect(el.getAttribute('class')).toBe('');
    expect(el.hasAttribute('data-demo-trigger')).toBe(false);
    const t = trigger('labels');
    expect(t.hasAttribute('data-demo-trigger')).toBe(true);
    expect(t.getAttribute('role')).toBe('combobox');
    expect(t.getAttribute('tabindex')).toBe('0');
    expect(t.getAttribute('aria-haspopup')).toBe('listbox');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    const field = el.closest('[data-ds="field"]') as HTMLElement;
    expect(t.id).toBe(field.querySelector('label')?.getAttribute('for'));
    expect(t.getAttribute('aria-labelledby')).toBe(field.querySelector('label')?.id);
    expect(Array.from(t.querySelectorAll('[data-part="tag"]')).map((n) => n.textContent)).toEqual(['Design', 'Copy']);
    expect(t.querySelector('[data-part="summary-text"]')?.textContent).toBe('Design and Copy');
    expect(Array.from(el.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map((i) => i.value)).toEqual(['design', 'copy']);
    expect(trigger('count').querySelector('[data-part="value"]')?.textContent).toBe('2 selected');
    expect(root('count').getAttribute('data-size')).toBe('lg');
    expect(trigger('cities').querySelector('[data-more]')?.textContent).toBe('+2');
  });

  it('Enter opens the popup and focuses the list; Space toggles; Enter closes and refocuses the trigger', async () => {
    const { host, trigger, key, popup, options, settle } = await setup();
    await key(trigger('labels'), 'Enter');
    await settle();
    expect(host.open()).toBe(true);
    expect(popup()?.getAttribute('data-ds')).toBe('multi-select');
    expect(popup()?.querySelector('[data-part="search"]')).toBeNull();
    const list = popup()?.querySelector('[data-ds="list-box"]') as HTMLElement;
    expect(list.getAttribute('aria-multiselectable')).toBe('true');
    expect(trigger('labels').getAttribute('aria-controls')).toBe(list.id);
    expect(document.activeElement).toBe(options()[0]);
    await key(document.activeElement as Element, ' ');
    expect(host.value()).toEqual(['copy']);
    await key(document.activeElement as Element, 'Enter');
    expect(host.open()).toBe(false);
    expect(host.value()).toEqual(['copy']);
    expect(document.activeElement).toBe(trigger('labels'));
  });

  it('Select all and Clear selection skip disabled options', async () => {
    const { host, trigger, key, popup, settle } = await setup();
    await key(trigger('labels'), 'Enter');
    (popup()?.querySelector('[data-part="select-all"]') as HTMLButtonElement).click();
    await settle();
    expect(host.value()).toEqual(['design', 'copy', 'research', 'bug']);
    expect(popup()?.querySelector('[data-part="select-all"]')?.getAttribute('aria-disabled')).toBe('true');
    (popup()?.querySelector('[data-part="clear"]') as HTMLButtonElement).click();
    await settle();
    expect(host.value()).toEqual([]);
  });

  it('a long list gets a search field that filters, and ArrowDown moves into the list', async () => {
    const { trigger, key, popup, options, settle } = await setup();
    await key(trigger('cities'), 'Enter');
    await settle();
    const search = popup()?.querySelector('[data-part="search"] input') as HTMLInputElement;
    expect(search).not.toBeNull();
    expect(document.activeElement).toBe(search);
    expect(search.getAttribute('type')).toBe('search');
    search.value = 'dam';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(options().map((o) => o.textContent)).toEqual(['Dammam']);
    expect(popup()?.querySelector('[data-part="search"]')?.hasAttribute('data-empty')).toBe(false);
    await key(search, 'ArrowDown');
    expect(document.activeElement).toBe(options()[0]);
  });

  it('Escape closes and returns focus', async () => {
    const { host, trigger, key, settle } = await setup();
    await key(trigger('labels'), 'ArrowDown');
    await settle();
    await key(document.activeElement as Element, 'Escape');
    expect(host.open()).toBe(false);
    expect(document.activeElement).toBe(trigger('labels'));
  });

  it('the empty list says so', async () => {
    const { trigger, key, popup } = await setup();
    await key(trigger('empty'), 'Enter');
    expect(popup()?.querySelector('[data-part="empty"]')?.textContent).toBe('No labels yet.');
    expect(popup()?.querySelector('[data-part="actions"]')).toBeNull();
  });

  it('disabled and read only follow the Field and do not open', async () => {
    const { root, trigger, key, popup } = await setup();
    expect(trigger('disabled').getAttribute('tabindex')).toBe('-1');
    expect(trigger('disabled').getAttribute('aria-disabled')).toBe('true');
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(trigger('readonly').getAttribute('aria-readonly')).toBe('true');
    await key(trigger('readonly'), 'Enter');
    expect(popup()).toBeNull();
  });

  it('works with a reactive form control, both ways, and its disabled state', async () => {
    const { host, trigger, key, options, settle } = await setup();
    expect(trigger('reactive').querySelector('[data-part="summary-text"]')?.textContent).toBe('Doha');
    await key(trigger('reactive'), 'Enter');
    options()[0]?.click();
    await settle();
    expect(host.form.value).toEqual(['doha', 'dubai']);
    host.form.setValue(['muscat']);
    await settle();
    expect(trigger('reactive').querySelector('[data-part="summary-text"]')?.textContent).toBe('Muscat');
    host.form.disable();
    await settle();
    expect(trigger('reactive').getAttribute('aria-disabled')).toBe('true');
  });

  it('works with ngModel', async () => {
    const { host, trigger, key, options, settle } = await setup();
    await key(trigger('template'), 'Enter');
    options()[1]?.click();
    await settle();
    expect(host.model).toEqual(['abu-dhabi']);
  });
});

@Component({
  imports: [DsMultiSelect, DsField],
  template: `
    <div dsField data-test="wired" label="Name" description="A hint." error="Fix this." required>
      <div dsMultiSelect [items]="items"></div>
    </div>
    <div dsField data-test="own-id" label="Name">
      <div dsMultiSelect [items]="items" id="own-control"></div>
    </div>
    <div dsField data-test="off" label="Name" disabled>
      <div dsMultiSelect [items]="items"></div>
    </div>
  `,
})
class FieldWiringHost {
  readonly items = cityOptions('en');
}

describe('DsMultiSelect in a Field', () => {
  it('reads the Field as React useFieldControl does: id, describedby order, invalid, required, disabled', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const field = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
    const control = (id: string) => field(id).querySelector('[data-part="trigger"]') as HTMLElement;

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
    // A div cannot take the label's for alone: React also names the trigger with aria-labelledby.
    expect(c.getAttribute('aria-labelledby')).toBe(label.id);

    // A control with an id of its own tells the Field, so the label points at it.
    expect(control('own-id').id).toBe('own-control');
    expect(field('own-id').querySelector(':scope > label')?.getAttribute('for')).toBe('own-control');
    expect(control('own-id').hasAttribute('aria-describedby')).toBe(false);
    expect(control('own-id').hasAttribute('aria-invalid')).toBe(false);
  });

  it('takes disabled from the Field', async () => {
    const fixture = TestBed.createComponent(FieldWiringHost);
    await fixture.whenStable();
    const c = fixture.nativeElement.querySelector('[data-test="off"] [data-part="trigger"]') as HTMLButtonElement;
    expect(c.getAttribute('aria-disabled')).toBe('true');
    expect(c.getAttribute('tabindex')).toBe('-1');
    expect(c.closest('[data-ds="multi-select"]')?.hasAttribute('data-disabled')).toBe(true);
  });
});
