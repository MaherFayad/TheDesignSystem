import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { citySections, sortOptions } from '../list-box/samples';
import { DsSelect } from './select';

@Component({
  imports: [DsSelect, DsField, ReactiveFormsModule, FormsModule],
  template: `
    <div dsField label="Sort by" description="The board shows tasks in this order.">
      <button data-test="sort" dsSelect [items]="sort" [(value)]="value" [(open)]="open"></button>
    </div>
    <button data-test="plain" dsSelect aria-label="City" size="lg" shape="pill" [items]="cities" placeholder="Pick a city"></button>
    <button data-test="empty" dsSelect aria-label="Status" [items]="[]" empty="No statuses yet."></button>
    <button data-test="loading" dsSelect aria-label="Status" [items]="[]" loading loadingLabel="Loading statuses"></button>
    <div dsField label="City" readOnly><button data-test="readonly" dsSelect [items]="sort" defaultValue="name"></button></div>
    <div dsField label="City" disabled><button data-test="disabled" dsSelect [items]="sort" defaultValue="name"></button></div>
    <div dsField label="City" error="Choose one."><button data-test="invalid" dsSelect [items]="sort"></button></div>
    <button data-test="reactive" dsSelect aria-label="City" [items]="cities" [formControl]="form"></button>
    <button data-test="template" dsSelect aria-label="City" [items]="cities" [(ngModel)]="model"></button>
    <form><button data-test="inform" dsSelect aria-label="Sort" name="sort" [items]="sort" defaultValue="owner"></button></form>
  `,
})
class Host {
  readonly sort = sortOptions('en');
  readonly cities = citySections('en');
  readonly value = signal<string | null | undefined>('edited');
  readonly open = signal<boolean | undefined>(false);
  readonly form = new FormControl<string | null>('dubai');
  model: string | null = null;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLButtonElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (target: Element, k: string) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    await settle();
    return event;
  };
  const content = () => document.querySelector('[data-menu-layer] [data-part="content"]') as HTMLElement | null;
  const items = () => Array.from(content()?.querySelectorAll<HTMLElement>('[data-part="item"]') ?? []);
  return { fixture, host: fixture.componentInstance, root, settle, key, content, items };
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll('[data-menu-layer]'))) el.remove();
});

describe('DsSelect', () => {
  it('renders the trigger as the root with the Radix attributes, the value and the icon', async () => {
    const { root } = await setup();
    const el = root('sort');
    expect(el.getAttribute('data-ds')).toBe('select');
    expect(el.getAttribute('role')).toBe('combobox');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('aria-autocomplete')).toBe('none');
    expect(el.getAttribute('aria-expanded')).toBe('false');
    expect(el.getAttribute('dir')).toBe('ltr');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-state')).toBe(false);
    for (const name of ['dsselect', 'items', 'value']) expect(el.hasAttribute(name)).toBe(false);
    expect(el.querySelector('[data-part="value"] [data-part="item-label"]')?.textContent).toBe('Date edited');
    expect(el.querySelector('[data-part="icon"] [data-icon="chevrons-up-down"]')).not.toBeNull();
    const field = el.closest('[data-ds="field"]') as HTMLElement;
    expect(el.id).toBe(field.querySelector('label')?.getAttribute('for'));
    expect(el.getAttribute('aria-describedby')).toBe(field.querySelector('[data-part="description"]')?.id);
    const plain = root('plain');
    expect(plain.hasAttribute('data-placeholder')).toBe(true);
    expect(plain.querySelector('[data-part="value"]')?.textContent).toBe('Pick a city');
    expect(plain.getAttribute('data-shape')).toBe('pill');
    expect(plain.getAttribute('aria-label')).toBe('City');
  });

  it('Enter opens the list in a themed layer and focuses the chosen item', async () => {
    const { host, root, key, content, items } = await setup();
    await key(root('sort'), 'Enter');
    expect(host.open()).toBe(true);
    const c = content();
    expect(c).not.toBeNull();
    expect(c?.getAttribute('role')).toBe('listbox');
    expect(c?.getAttribute('data-state')).toBe('open');
    expect(root('sort').getAttribute('aria-controls')).toBe(c?.id);
    expect(c?.getAttribute('aria-labelledby')).toBe(root('sort').closest('[data-ds="field"]')?.querySelector('label')?.id);
    expect(c?.querySelector('style')?.textContent).toContain('data-radix-select-viewport');
    expect(c?.querySelector('[data-part="viewport"]')?.getAttribute('role')).toBe('presentation');
    const [, edited, , size] = items();
    expect(document.activeElement).toBe(edited);
    expect(edited?.getAttribute('data-state')).toBe('checked');
    expect(edited?.hasAttribute('data-highlighted')).toBe(true);
    expect(edited?.getAttribute('aria-selected')).toBe('true');
    expect(size?.hasAttribute('tabindex')).toBe(false);
    expect(size?.getAttribute('aria-disabled')).toBe('true');
  });

  it('arrows skip disabled items and do not wrap, Enter chooses, closes and refocuses the trigger', async () => {
    const { host, root, key, items, content } = await setup();
    await key(root('sort'), 'ArrowDown');
    await key(document.activeElement as Element, 'ArrowDown');
    expect(document.activeElement).toBe(items()[2]);
    await key(document.activeElement as Element, 'ArrowDown');
    expect(document.activeElement).toBe(items()[2]);
    await key(document.activeElement as Element, 'Home');
    expect(document.activeElement).toBe(items()[0]);
    await key(document.activeElement as Element, 'Enter');
    expect(host.value()).toBe('name');
    expect(host.open()).toBe(false);
    expect(content()).toBeNull();
    expect(document.activeElement).toBe(root('sort'));
  });

  it('typeahead on the closed trigger chooses without opening', async () => {
    const { host, root, key, content } = await setup();
    await key(root('sort'), 'o');
    expect(host.value()).toBe('owner');
    expect(content()).toBeNull();
  });

  it('Escape closes and keeps the value', async () => {
    const { host, root, key, content } = await setup();
    await key(root('sort'), 'Enter');
    await key(document.activeElement as Element, 'Escape');
    expect(content()).toBeNull();
    expect(host.value()).toBe('edited');
    expect(document.activeElement).toBe(root('sort'));
  });

  it('groups get a label and a separator between them', async () => {
    const { root, key, content } = await setup();
    await key(root('plain'), 'Enter');
    const groups = content()?.querySelectorAll('[data-part="group"]') ?? [];
    expect(groups.length).toBe(2);
    expect(groups[0]?.getAttribute('aria-labelledby')).toBe(groups[0]?.querySelector('[data-part="label"]')?.id);
    expect(content()?.querySelectorAll('[data-part="separator"]').length).toBe(1);
  });

  it('an empty list says so and describes the list', async () => {
    const { root, key, content } = await setup();
    await key(root('empty'), 'Enter');
    const empty = content()?.querySelector('[data-part="empty"]');
    expect(empty?.textContent).toBe('No statuses yet.');
    expect(content()?.getAttribute('aria-describedby')).toBe(empty?.id);
  });

  it('loading shows a spinner, describes the trigger, and does not open', async () => {
    const { root, key, content } = await setup();
    const el = root('loading');
    expect(el.hasAttribute('data-loading')).toBe(true);
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('[data-ds="spinner"]')).not.toBeNull();
    const words = el.nextElementSibling as HTMLElement;
    expect(words.hidden).toBe(true);
    expect(words.textContent).toBe('Loading statuses');
    expect(el.getAttribute('aria-describedby')).toBe(words.id);
    await key(el, 'Enter');
    expect(content()).toBeNull();
  });

  it('read only, disabled and invalid follow the Field', async () => {
    const { root, key, content } = await setup();
    expect(root('readonly').getAttribute('aria-readonly')).toBe('true');
    const typed = await key(root('readonly'), 'f');
    expect(typed.defaultPrevented).toBe(true);
    await key(root('readonly'), 'Enter');
    expect(content()).toBeNull();
    expect(root('disabled').disabled).toBe(true);
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('invalid').getAttribute('aria-invalid')).toBe('true');
    expect(root('invalid').hasAttribute('data-invalid')).toBe(true);
  });

  it('inside a form, a hidden native select carries the name and value', async () => {
    const { root, settle } = await setup();
    await settle();
    const select = root('inform').nextElementSibling as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    expect(select.getAttribute('aria-hidden')).toBe('true');
    expect(select.tabIndex).toBe(-1);
    expect(select.name).toBe('sort');
    expect(select.value).toBe('owner');
    expect(root('plain').nextElementSibling?.tagName).not.toBe('SELECT');
  });

  it('works with a reactive form control, both ways, and its disabled state', async () => {
    const { host, root, settle, key, items } = await setup();
    expect(root('reactive').querySelector('[data-part="item-label"]')?.textContent).toBe('Dubai');
    await key(root('reactive'), 'Enter');
    items()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(host.form.value).toBe('riyadh');
    host.form.setValue('doha');
    await settle();
    expect(root('reactive').querySelector('[data-part="item-label"]')?.textContent).toBe('Doha');
    host.form.disable();
    await settle();
    expect(root('reactive').disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, root, key } = await setup();
    await key(root('template'), 'm');
    expect(host.model).toBe('makkah');
  });
});
