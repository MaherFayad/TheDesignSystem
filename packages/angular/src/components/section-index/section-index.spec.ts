// SectionIndex: the Angular twin of
// packages/react/src/components/SectionIndex/SectionIndex.test.tsx. WCAG 2.2
// covered here: 2.1.1 Keyboard (one Tab stop, Up, Down, Home, End, Enter),
// 2.4.3 Focus order (a jump moves focus to the section heading), 2.5.7
// Dragging movements (a tap and Enter reach every key without a drag), 4.1.2
// Name, role, value (a named nav landmark, aria-current location).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsList, DsListItem, DsListSection } from '../list/list';
import SectionIndexDemo from './section-index.demo';
import { DsSectionIndex, type SectionIndexCollapse, type SectionIndexSection, type SectionIndexSelect } from './section-index';

const sections: SectionIndexSection[] = [
  { key: 'A', target: 's-a' },
  { key: 'B', target: 's-b' },
  { key: 'C', target: 's-b' },
  { key: 'M', target: 's-m' },
  { key: '#', target: 's-m', label: '# other' },
];

@Component({
  imports: [DsList, DsListItem, DsListSection, DsSectionIndex],
  template: `
    <ul dsList aria-label="Contacts">
      <li dsListSection id="s-a" header="A"><ng-container><li dsListItem title="Amal"></li></ng-container></li>
      <li dsListSection id="s-b" header="B"><ng-container><li dsListItem title="Bader"></li></ng-container></li>
      <li dsListSection id="s-m" header="M"><ng-container><li dsListItem title="Maha"></li></ng-container></li>
    </ul>
    <nav
      dsSectionIndex
      class="x"
      label="Contacts index"
      [sections]="list()"
      [collapse]="collapse()"
      [active]="active()"
      (select)="chose($event)"
      (keydown)="own($event)"
    ></nav>
  `,
})
class Page {
  readonly list = signal<readonly SectionIndexSection[]>(sections);
  readonly collapse = signal<SectionIndexCollapse>('auto');
  readonly active = signal<string | undefined>(undefined);
  readonly picked: SectionIndexSelect[] = [];
  chose(s: SectionIndexSelect) {
    this.picked.push(s);
  }
  own = (_event: KeyboardEvent) => {};
}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="section-index"]')!;
const items = (c: HTMLElement) => Array.from(root(c).querySelectorAll<HTMLAnchorElement>(':scope > [data-part="item"]'));
const heading = (c: HTMLElement, key: string) =>
  Array.from(c.querySelectorAll<HTMLElement>('[data-part="section-header"]')).find((h) => h.textContent?.trim() === key)!;

function press(key: string): KeyboardEvent {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function pointer(el: HTMLElement, type: string, clientY: number) {
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientY }));
}

const realScroll = Element.prototype.scrollIntoView;

afterEach(() => {
  vi.restoreAllMocks();
  Element.prototype.scrollIntoView = realScroll;
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('SectionIndex', () => {
  it('renders a named nav landmark of links, one per key, with fragment hrefs', async () => {
    const f = await mount(Page);
    const nav = root(f.nativeElement);
    expect(nav.tagName).toBe('NAV');
    expect(nav.getAttribute('aria-label')).toBe('Contacts index');
    expect(nav.getAttributeNames().sort()).toEqual(['aria-label', 'class', 'data-ds']);
    expect(items(f.nativeElement).map((a) => a.textContent)).toEqual(['A', 'B', 'C', 'M', '#']);
    expect(items(f.nativeElement)[2]!.getAttribute('href')).toBe('#s-b');
    expect(items(f.nativeElement)[4]!.getAttribute('aria-label')).toBe('# other');
    expect(items(f.nativeElement)[0]!.hasAttribute('aria-label')).toBe(false);
  });

  it('is one Tab stop, and Up, Down, Home and End move between keys', async () => {
    const f = await mount(Page);
    const links = items(f.nativeElement);
    expect(links.map((a) => a.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    links[0]!.focus();
    press('ArrowDown');
    await f.whenStable();
    expect(document.activeElement).toBe(links[1]);
    press('End');
    await f.whenStable();
    expect(document.activeElement).toBe(links[4]);
    press('ArrowDown');
    await f.whenStable();
    expect(document.activeElement).toBe(links[4]);
    press('ArrowUp');
    await f.whenStable();
    expect(document.activeElement).toBe(links[3]);
    press('Home');
    await f.whenStable();
    expect(document.activeElement).toBe(links[0]);
    expect(items(f.nativeElement).filter((a) => a.tabIndex === 0)).toHaveLength(1);
  });

  it('lets the caller handle a key first', async () => {
    const f = await mount(Page);
    f.componentInstance.own = (event) => event.preventDefault();
    const links = items(f.nativeElement);
    links[0]!.focus();
    press('ArrowDown');
    await f.whenStable();
    expect(document.activeElement).toBe(links[0]);
  });

  it('Enter jumps: scrolls the section, focuses its heading and marks the key', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const f = await mount(Page);
    const m = items(f.nativeElement)[3]!;
    m.focus();
    // Enter on a link fires a click with no pointer: detail 0.
    m.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }));
    await f.whenStable();
    const h = heading(f.nativeElement, 'M');
    expect(document.activeElement).toBe(h);
    expect(h.getAttribute('tabindex')).toBe('-1');
    expect(scroll).toHaveBeenCalled();
    expect(f.componentInstance.picked).toEqual([{ key: 'M', target: 's-m' }]);
    expect(items(f.nativeElement)[3]!.getAttribute('data-active')).toBe('');
    expect(items(f.nativeElement)[3]!.getAttribute('aria-current')).toBe('location');
    expect(items(f.nativeElement)[3]!.tabIndex).toBe(0);
  });

  it('a key whose section is missing does not throw and keeps focus', async () => {
    const f = await mount(Page, (p) => p.list.set([{ key: 'Z', target: 'nowhere' }]));
    const z = items(f.nativeElement)[0]!;
    z.focus();
    z.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }));
    await f.whenStable();
    expect(document.activeElement).toBe(z);
  });

  it('a press and move scrubs through the keys and focuses the last section on release', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const f = await mount(Page);
    items(f.nativeElement).forEach((a, i) => {
      vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, i * 24, 24, 24));
    });
    const nav = root(f.nativeElement);
    const picked = f.componentInstance.picked;
    pointer(nav, 'pointerdown', 30);
    await f.whenStable();
    expect(nav.getAttribute('data-dragging')).toBe('');
    expect(picked.at(-1)).toEqual({ key: 'B', target: 's-b' });
    pointer(nav, 'pointermove', 40);
    expect(picked).toHaveLength(1);
    pointer(nav, 'pointermove', 80);
    expect(picked.at(-1)).toEqual({ key: 'M', target: 's-m' });
    pointer(nav, 'pointermove', 500);
    expect(picked.at(-1)).toEqual({ key: '#', target: 's-m' });
    expect(document.activeElement).not.toBe(heading(f.nativeElement, 'M'));
    pointer(nav, 'pointerup', 500);
    await f.whenStable();
    expect(nav.hasAttribute('data-dragging')).toBe(false);
    expect(document.activeElement).toBe(heading(f.nativeElement, 'M'));
    // The click that follows a pointer press does not jump a second time.
    items(f.nativeElement)[4]!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
    expect(picked).toHaveLength(3);
  });

  it('collapses keys into gap dots when the column is short, and never with collapse never', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(5 * 24);
    const many = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map((key) => ({ key, target: `t-${key}` }));
    const f = await mount(Page, (p) => p.list.set(many));
    await f.whenStable();
    const nav = root(f.nativeElement);
    expect(nav.getAttribute('data-collapsed')).toBe('');
    const gaps = nav.querySelectorAll('[data-part="gap"]');
    expect(gaps.length).toBeGreaterThan(0);
    gaps.forEach((g) => expect(g.getAttribute('aria-hidden')).toBe('true'));
    expect(nav.children.length).toBeLessThanOrEqual(5);
    const shown = items(f.nativeElement).map((a) => a.textContent);
    expect(shown[0]).toBe('A');
    expect(shown[shown.length - 1]).toBe('#');
    f.componentInstance.collapse.set('never');
    await f.whenStable();
    expect(root(f.nativeElement).hasAttribute('data-collapsed')).toBe(false);
    expect(items(f.nativeElement)).toHaveLength(27);
  });

  it('takes the active key from the input', async () => {
    const f = await mount(Page, (p) => p.active.set('C'));
    expect(items(f.nativeElement)[2]!.hasAttribute('data-active')).toBe(true);
    expect(items(f.nativeElement)[2]!.tabIndex).toBe(0);
  });

  it('renders the demo cases in order, with the Arabic letters in the Arabic case', async () => {
    const f = await mount(SectionIndexDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-arabic']);
    const ar = c.querySelector('[data-demo-case="long-arabic"] [data-ds="section-index"]')!;
    const keys = Array.from(ar.querySelectorAll('[data-part="item"]')).map((a) => a.textContent);
    expect(keys).toHaveLength(29);
    expect(keys.slice(0, 3)).toEqual(['ا', 'ب', 'ت']);
    expect(keys[28]).toBe('#');
    expect(c.querySelectorAll('[data-demo-case="many"] li[data-part="item"]')).toHaveLength(200);
    expect(c.querySelectorAll('[data-demo-case="long-arabic"] li[data-part="item"]')).toHaveLength(200);
    expect(c.querySelector('[dsdemocontacts]')).toBeNull();
  });
});
