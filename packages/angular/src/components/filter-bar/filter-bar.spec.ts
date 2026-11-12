import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
import { DsTheme } from '../../theme/theme';
import { DsFilterBar, type FilterBarFilter, type FilterBarSearch } from './filter-bar';

const kinds: FilterBarFilter[] = [
  { value: 'boards', label: 'Boards' },
  { value: 'images', label: 'Images' },
  { value: 'shared', label: 'Shared with me', disabled: true },
];
const more: FilterBarFilter[] = [{ value: 'starred', label: 'Starred' }];

@Component({
  imports: [DsFilterBar, DsTheme],
  template: `
    <div dsFilterBar id="bar" [search]="search" [filters]="kinds" [more]="more" [(value)]="value" [resultCount]="count()" (clear)="cleared = cleared + 1" [end]="end">
    </div>
    <ng-template #end><span id="end-slot">Sort</span></ng-template>
    <div dsFilterBar id="plain" [filters]="kinds" [defaultValue]="['images']"></div>
    <div dsTheme [lang]="'ar'"><div dsFilterBar id="ar" [filters]="kinds" [defaultValue]="['boards', 'images']" [resultCount]="2"></div></div>
  `,
})
class Host {
  readonly kinds = kinds;
  readonly more = more;
  readonly value = signal<readonly string[] | undefined>(['boards']);
  readonly count = signal<number | undefined>(3);
  readonly query = signal('');
  readonly search: FilterBarSearch = { 'aria-label': 'Search files', placeholder: 'Search files', onValueChange: (v) => this.query.set(v) };
  cleared = 0;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;
  const qa = (sel: string) => Array.from(fixture.nativeElement.querySelectorAll(sel)) as HTMLElement[];
  return { fixture, host: fixture.componentInstance, q, qa };
}

describe('DsFilterBar', () => {
  it('renders search, chips, more, count, clear and end in order', async () => {
    const { fixture, q } = await setup();
    const bar = q('#bar');
    expect(bar.getAttribute('data-ds')).toBe('filter-bar');
    expect(bar.getAttribute('data-size')).toBe('md');
    expect(bar.hasAttribute('data-active')).toBe(true);
    expect(Array.from(bar.children).map((c) => c.getAttribute('data-part') ?? c.getAttribute('role'))).toEqual([
      'search',
      'filters',
      'more',
      'count',
      'clear',
      'end',
      'status',
    ]);
    expect(q('#bar [data-part="search"]').getAttribute('data-ds')).toBe('search-field');
    expect(q('#bar [data-part="filters"]').getAttribute('role')).toBe('group');
    expect(q('#bar [data-part="filters"]').getAttribute('aria-label')).toBe('Filters');
    expect(q('#bar [data-part="count"]').textContent).toBe('1 filter on, 3 results');
    expect(q('#end-slot')).not.toBeNull();
    fixture.nativeElement.remove();
  });

  it('renders the chips as pressable chips with the check while on', async () => {
    const { fixture, qa } = await setup();
    const chips = qa('#bar [data-part="filters"] > button');
    expect(chips.map((c) => c.getAttribute('data-ds'))).toEqual(['chip', 'chip', 'chip']);
    expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
    expect(chips[0]!.hasAttribute('data-selected')).toBe(true);
    expect(chips[0]!.querySelector('[data-part="icon"] svg')?.getAttribute('data-icon')).toBe('check');
    expect(chips[0]!.getAttribute('data-shape')).toBe('pill');
    expect(chips[2]!.getAttribute('aria-disabled')).toBe('true');
    fixture.nativeElement.remove();
  });

  it('toggles a filter into the one value array', async () => {
    const { fixture, host, qa, q } = await setup();
    qa('#bar [data-part="filters"] > button')[1]!.click();
    await fixture.whenStable();
    expect(host.value()).toEqual(['boards', 'images']);
    expect(q('#bar [data-part="count"]').textContent).toBe('2 filters on, 3 results');
    qa('#bar [data-part="filters"] > button')[0]!.click();
    await fixture.whenStable();
    expect(host.value()).toEqual(['images']);
    // A disabled chip does not toggle.
    qa('#bar [data-part="filters"] > button')[2]!.click();
    await fixture.whenStable();
    expect(host.value()).toEqual(['images']);
    fixture.nativeElement.remove();
  });

  it('counts a search as a filter and clears everything with clear all, focusing the search box', async () => {
    const { fixture, host, q } = await setup();
    const input = q('#bar [data-part="search"] input') as HTMLInputElement;
    input.value = 'hero';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.query()).toBe('hero');
    expect(q('#bar [data-part="count"]').textContent).toBe('2 filters on, 3 results');
    q('#bar > [data-part="clear"]').click();
    await fixture.whenStable();
    expect(host.value()).toEqual([]);
    expect(host.query()).toBe('');
    expect(host.cleared).toBe(1);
    expect(q('#bar > [data-part="clear"]')).toBeNull();
    expect(q('#bar').hasAttribute('data-active')).toBe(false);
    expect(document.activeElement).toBe(q('#bar [data-part="search"] input'));
    fixture.nativeElement.remove();
  });

  it('announces the result count once, 600ms after a filter change', async () => {
    const { fixture, host, qa, q } = await setup();
    const status = () => q('#bar > [role="status"]').textContent;
    // A count that changes with no filter change is not read.
    host.count.set(5);
    await fixture.whenStable();
    await wait(700);
    expect(status()).toBe('');
    qa('#bar [data-part="filters"] > button')[1]!.click();
    await fixture.whenStable();
    host.count.set(1);
    await fixture.whenStable();
    await wait(300);
    expect(status()).toBe('');
    await wait(400);
    await fixture.whenStable();
    expect(status()).toBe('1 result\u00a0');
    fixture.nativeElement.remove();
  });

  it('keeps its own value from defaultValue and uses Arabic words under an Arabic theme', async () => {
    const { fixture, q, qa } = await setup();
    expect(qa('#plain [data-part="filters"] > button').map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    qa('#plain [data-part="filters"] > button')[0]!.click();
    await fixture.whenStable();
    expect(q('#plain [data-part="count"]').textContent).toBe('2 filters on');
    expect(q('#ar [data-part="count"]').textContent).toBe('فلترين مفعلين، نتيجتين');
    expect(q('#ar [data-part="clear"]').textContent?.trim()).toBe('مسح الفلاتر');
    fixture.nativeElement.remove();
  });
});
