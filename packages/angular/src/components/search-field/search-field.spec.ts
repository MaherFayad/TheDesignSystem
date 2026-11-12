import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsField } from '../field/field';
import { DS_INPUT_GROUP } from '../input-group/input-group';
import { DsSearchField } from './search-field';

@Component({
  imports: [DsSearchField, DsField, DS_INPUT_GROUP, ReactiveFormsModule],
  template: `
    <div data-t="plain" dsSearchField aria-label="Search boards" placeholder="Search boards"></div>
    <div data-t="query" dsSearchField aria-label="Search files" size="lg" shape="pill" [(value)]="query" (submit)="submits.push($event)" (clear)="clears = clears + 1" [end]="end"></div>
    <ng-template #end><span class="hint">K</span></ng-template>
    <div data-t="loading" dsSearchField aria-label="Search" value="launch" loading loadingLabel="Looking"></div>
    <div dsField label="Search members" readOnly><div data-t="readonly" dsSearchField value="omar"></div></div>
    <div dsInputGroup size="sm"><span dsInputGroupAddon>in</span><div data-t="grouped" dsSearchField aria-label="Search"></div></div>
    <div data-t="form" dsSearchField aria-label="Search" [formControl]="control"></div>
  `,
})
class Host {
  readonly query = signal('brand');
  readonly control = new FormControl('first');
  submits: string[] = [];
  clears = 0;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => q(id).querySelector('input') as HTMLInputElement;
  return { fixture, host: fixture.componentInstance, q, native };
}

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

describe('DsSearchField', () => {
  it('renders the parts in the React order with the defaults', async () => {
    const { q, native } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('search-field');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.getAttribute('data-empty')).toBe('');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'control', 'status']);
    expect(el.querySelector('[data-part="control"]')?.getAttribute('data-ds')).toBe('input');
    expect(native('plain').type).toBe('search');
    expect(native('plain').getAttribute('aria-label')).toBe('Search boards');
    expect(native('plain').placeholder).toBe('Search boards');
    expect(el.querySelector('[data-part="status"]')?.getAttribute('role')).toBe('status');
  });

  it('shows a clear button and the end slot with a query', async () => {
    const { q } = await setup();
    const el = q('query');
    expect(el.hasAttribute('data-empty')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'control', 'clear', 'end', 'status']);
    const clear = el.querySelector('[data-part="clear"]') as HTMLElement;
    expect(clear.getAttribute('aria-label')).toBe('Clear search');
    expect(clear.getAttribute('data-size')).toBe('sm');
    expect(el.querySelector('[data-part="end"] .hint')).not.toBeNull();
  });

  it('clears with the button and returns focus to the input', async () => {
    const { fixture, host, q, native } = await setup();
    (q('query').querySelector('[data-part="clear"]') as HTMLElement).click();
    await fixture.whenStable();
    expect(host.query()).toBe('');
    expect(host.clears).toBe(1);
    expect(document.activeElement).toBe(native('query'));
    expect(q('query').querySelector('[data-part="clear"]')).toBeNull();
  });

  it('clears on the first Escape and lets the second pass', async () => {
    const { fixture, host, native } = await setup();
    const input = native('query');
    const first = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(first);
    await fixture.whenStable();
    expect(first.defaultPrevented).toBe(true);
    expect(host.query()).toBe('');
    const second = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
  });

  it('emits submit on Enter with the query', async () => {
    const { host, native } = await setup();
    key(native('query'), 'Enter');
    expect(host.submits).toEqual(['brand']);
  });

  it('shows the spinner and the status while loading', async () => {
    const { q } = await setup();
    const el = q('loading');
    expect(el.getAttribute('data-loading')).toBe('');
    expect(el.querySelector('[data-part="end"] > [data-part="spinner"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Looking');
  });

  it('hides the clear button when read only and keeps Escape from clearing', async () => {
    const { fixture, q, native } = await setup();
    const el = q('readonly');
    expect(el.getAttribute('data-readonly')).toBe('');
    expect(el.querySelector('[data-part="clear"]')).toBeNull();
    key(native('readonly'), 'Escape');
    await fixture.whenStable();
    expect(native('readonly').value).toBe('omar');
  });

  it('is the control of an input group', async () => {
    const { q, native } = await setup();
    const el = q('grouped');
    expect(el.getAttribute('data-part')).toBe('control');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.querySelector('[data-ds="input"]')?.getAttribute('data-part')).toBe('control');
    expect(native('grouped').getAttribute('aria-describedby')).toBe(el.parentElement?.querySelector('[data-part="addon"]')?.id);
  });

  it('works with reactive forms', async () => {
    const { fixture, host, native } = await setup();
    expect(native('form').value).toBe('first');
    native('form').value = 'second';
    native('form').dispatchEvent(new Event('input', { bubbles: true }));
    expect(host.control.value).toBe('second');
    host.control.disable();
    await fixture.whenStable();
    expect(native('form').disabled).toBe(true);
  });
});
