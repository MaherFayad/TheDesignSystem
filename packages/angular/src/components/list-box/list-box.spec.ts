import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import {
  DsListBox,
  filterListBoxItems,
  flattenListBoxItems,
  listBoxOptionId,
  markLabel,
  type ListBoxItem,
  type ListBoxValue,
} from './list-box';
import { citySections, sortOptions } from './samples';

const letters: ListBoxItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo', disabled: true },
  { value: 'c', label: 'Charlie' },
  { value: 'd', label: 'Delta' },
];

@Component({
  imports: [DsListBox, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="sort" dsListBox aria-label="Sort by" [items]="sort" [(value)]="value" (optionSelect)="picked.set($event)"></div>
    <div data-test="letters" dsListBox aria-label="Letters" [items]="letters" size="sm"></div>
    <div data-test="multi" dsListBox aria-label="Letters" selectionMode="multiple" [items]="letters" [defaultValue]="['a']"></div>
    <div data-test="groups" dsListBox aria-label="City" [items]="cities" query="ri" defaultValue="abha"></div>
    <div data-test="empty" dsListBox aria-label="City" [items]="[]" empty="No cities yet."></div>
    <div data-test="disabled" dsListBox aria-label="Letters" [items]="letters" disabled></div>
    <div data-test="readonly" dsListBox aria-label="Letters" [items]="letters" defaultValue="a" readOnly></div>
    <div dsTheme dir="rtl"><div data-test="horizontal" dsListBox aria-label="Letters" orientation="horizontal" [items]="letters"></div></div>
    <div data-test="virtual" dsListBox aria-label="Letters" [items]="letters" virtualFocus [(highlightedValue)]="lit"></div>
    <div data-test="reactive" dsListBox aria-label="Letters" selectionMode="multiple" [items]="letters" [formControl]="form"></div>
    <div data-test="template" dsListBox aria-label="Letters" [items]="letters" [(ngModel)]="model"></div>
  `,
})
class Host {
  readonly sort = sortOptions('en');
  readonly letters = letters;
  readonly cities = citySections('en');
  readonly value = signal<ListBoxValue | undefined>('edited');
  readonly picked = signal<string | null>(null);
  readonly lit = signal<string | null>(null);
  readonly form = new FormControl<ListBoxValue>(['c'], { nonNullable: true });
  model: ListBoxValue = null;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const options = (id: string) => Array.from(root(id).querySelectorAll<HTMLElement>('[role="option"]'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (id: string, k: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    (root(id).querySelector('[tabindex="0"]') ?? root(id)).dispatchEvent(event);
    await settle();
    return event;
  };
  const lit = (id: string) => root(id).querySelector('[data-highlighted]')?.textContent;
  return { fixture, host: fixture.componentInstance, root, options, settle, key, lit };
}

describe('DsListBox', () => {
  it('helpers flatten, filter with the shared filter, mark and make safe ids', () => {
    expect(flattenListBoxItems(citySections('en')).length).toBe(30);
    const found = filterListBoxItems(citySections('en'), 'jed');
    expect(flattenListBoxItems(found).map((o) => o.value)).toEqual(['jeddah']);
    expect(markLabel('Riyadh', 'ri')).toEqual({ before: '', match: 'Ri', after: 'yadh' });
    expect(listBoxOptionId('l', 'a b')).toBe('l-option-a_20b');
    // Arabic alef forms fold: a query with a bare alef finds Abha written with hamza.
    const ar = filterListBoxItems(citySections('ar'), 'ابها');
    expect(flattenListBoxItems(ar).map((o) => o.value)).toEqual(['abha']);
  });

  it('renders the root, the options and their parts as React does', async () => {
    const { root, options } = await setup();
    const el = root('sort');
    expect(el.getAttribute('data-ds')).toBe('list-box');
    expect(el.getAttribute('role')).toBe('listbox');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.getAttribute('aria-label')).toBe('Sort by');
    for (const name of ['dslistbox', 'items', 'value']) expect(el.hasAttribute(name)).toBe(false);
    const [name, edited, , size] = options('sort');
    expect(name?.getAttribute('aria-selected')).toBe('false');
    expect(name?.getAttribute('tabindex')).toBe('-1');
    expect(edited?.getAttribute('aria-selected')).toBe('true');
    expect(edited?.hasAttribute('data-selected')).toBe(true);
    expect(edited?.getAttribute('tabindex')).toBe('0');
    expect(edited?.getAttribute('id')).toBe(listBoxOptionId(el.id, 'edited'));
    expect(edited?.getAttribute('aria-labelledby')).toBe(`${edited?.id}-label`);
    expect(edited?.getAttribute('aria-describedby')).toBe(`${edited?.id}-description`);
    expect(edited?.querySelector('[data-part="indicator"] [data-icon="check"]')).not.toBeNull();
    expect(edited?.querySelector('[data-part="option-icon"] [data-icon="clock"]')).not.toBeNull();
    expect(size?.getAttribute('aria-disabled')).toBe('true');
    expect(size?.hasAttribute('data-disabled')).toBe(true);
    expect(root('letters').getAttribute('data-size')).toBe('sm');
  });

  it('draws groups with labels, a separator between them, and marks the match', async () => {
    const { root } = await setup();
    const el = root('groups');
    const groups = el.querySelectorAll('[data-part="group"]');
    expect(groups.length).toBe(2);
    const label = groups[0]?.querySelector('[data-part="group-label"]');
    expect(groups[0]?.getAttribute('aria-labelledby')).toBe(label?.id);
    expect(el.querySelectorAll('[data-part="separator"]').length).toBe(1);
    expect(el.querySelector('mark')?.textContent).toBe('Ri');
  });

  it('an empty list is a named group with the empty text', async () => {
    const { root } = await setup();
    expect(root('empty').getAttribute('role')).toBe('group');
    expect(root('empty').querySelector('[data-part="empty"]')?.textContent).toBe('No cities yet.');
  });

  it('chooses on click, writes the model and emits optionSelect', async () => {
    const { host, root, options, settle } = await setup();
    options('sort')[0]?.click();
    await settle();
    expect(host.value()).toBe('name');
    expect(host.picked()).toBe('name');
    expect(options('sort')[0]?.getAttribute('aria-selected')).toBe('true');
    options('sort')[3]?.click();
    await settle();
    expect(host.value()).toBe('name');
    host.value.set('owner');
    await settle();
    expect(root('sort').querySelector('[data-selected] [data-part="option-label"]')?.textContent).toBe('Owner');
  });

  it('arrows skip disabled options, Home and End go to the ends, Enter chooses', async () => {
    const { root, options, key, lit } = await setup();
    await key('letters', 'ArrowDown');
    expect(lit('letters')).toBe('Charlie');
    expect(document.activeElement).toBe(options('letters')[2]);
    await key('letters', 'ArrowUp');
    expect(lit('letters')).toBe('Alpha');
    await key('letters', 'End');
    expect(lit('letters')).toBe('Delta');
    await key('letters', 'ArrowDown');
    expect(lit('letters')).toBe('Delta');
    await key('letters', 'Home');
    expect(lit('letters')).toBe('Alpha');
    const enter = await key('letters', 'Enter');
    expect(enter.defaultPrevented).toBe(true);
    expect(root('letters').querySelector('[data-selected]')?.textContent).toBe('Alpha');
  });

  it('typeahead moves the highlight', async () => {
    const { key, lit } = await setup();
    await key('letters', 'd');
    expect(lit('letters')).toBe('Delta');
  });

  it('horizontal lists follow the reading order', async () => {
    const { root, key, lit } = await setup();
    expect(root('horizontal').getAttribute('aria-orientation')).toBe('horizontal');
    await key('horizontal', 'ArrowLeft');
    expect(lit('horizontal')).toBe('Charlie');
  });

  it('multiple mode toggles with Space and selects all with Control A', async () => {
    const { root, key } = await setup();
    expect(root('multi').getAttribute('aria-multiselectable')).toBe('true');
    await key('multi', ' ');
    expect(root('multi').querySelectorAll('[data-selected]').length).toBe(0);
    await key('multi', 'a', { ctrlKey: true });
    expect(root('multi').querySelectorAll('[data-selected]').length).toBe(3);
  });

  it('disabled and read only keep the selection', async () => {
    const { root, options, settle } = await setup();
    expect(root('disabled').getAttribute('aria-disabled')).toBe('true');
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    options('disabled')[0]?.click();
    await settle();
    expect(root('disabled').querySelector('[data-selected]')).toBeNull();
    expect(root('readonly').getAttribute('aria-readonly')).toBe('true');
    options('readonly')[2]?.click();
    await settle();
    expect(root('readonly').querySelector('[data-selected]')?.textContent).toBe('Alpha');
  });

  it('virtual focus: no tabindex, the pointer moves the highlight to the owner', async () => {
    const { host, options, settle } = await setup();
    const [first] = options('virtual');
    expect(first?.hasAttribute('tabindex')).toBe(false);
    first?.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    await settle();
    expect(host.lit()).toBe('a');
    expect(first?.hasAttribute('data-highlighted')).toBe(true);
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    first?.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    host.lit.set('d');
    await settle();
    expect(options('virtual')[3]?.hasAttribute('data-highlighted')).toBe(true);
  });

  it('works with a reactive form control, both ways, and its disabled state', async () => {
    const { host, root, options, settle } = await setup();
    expect(root('reactive').querySelector('[data-selected]')?.textContent).toBe('Charlie');
    options('reactive')[0]?.click();
    await settle();
    expect(host.form.value).toEqual(['c', 'a']);
    host.form.setValue(['d']);
    await settle();
    expect(root('reactive').querySelector('[data-selected]')?.textContent).toBe('Delta');
    host.form.disable();
    await settle();
    expect(root('reactive').hasAttribute('data-disabled')).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, options, settle } = await setup();
    options('template')[3]?.click();
    await settle();
    expect(host.model).toBe('d');
  });
});
