// Pagination: the Angular twin of the React tests in
// packages/react/src/components/Pagination/ (numbers, dots, pressed and
// round 3). WCAG 2.2 covered here: 2.1.1 Keyboard (dots arrows, Home, End),
// 2.4.3 Focus order (focus stays on the pressed control when the window of
// pages shifts; inert ends stay focusable), 2.5.8 Target size (the compact
// dots track is one control), 4.1.2 Name, role, value (page names,
// aria-current).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import PaginationDemo from './pagination.demo';
import { DsPagination, type PaginationVariant } from './pagination';

const nav = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-ds="pagination"]')!;
const parts = (el: HTMLElement) => Array.from(el.children).map((c) => c.getAttribute('data-part') ?? '');
const pages = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-part="page"]'));
const named = (root: HTMLElement, name: string) => {
  const found = root.querySelector<HTMLElement>(`[aria-label="${name}"]`);
  if (!found) throw new Error(`nothing named ${name}`);
  return found;
};
const dots = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-part="dot"]'));

function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

@Component({
  imports: [DsPagination, DsTheme],
  template: `
    <div dsTheme [lang]="lang()" [dir]="dir()">
      <nav
        dsPagination
        [variant]="variant()"
        [(page)]="page"
        [pageCount]="pageCount()"
        [itemCount]="itemCount()"
        [pageSize]="pageSize()"
        [showEnds]="showEnds()"
        [getHref]="getHref()"
        [disabled]="disabled()"
        [label]="label()"
        [formatSummary]="formatSummary()"
        size="lg"
        shape="pill"
        (pageChange)="changed($event)"
      ></nav>
    </div>
  `,
})
class Host {
  readonly variant = signal<PaginationVariant>('numbers');
  readonly page = signal<number | undefined>(1);
  readonly pageCount = signal<number | undefined>(16);
  readonly itemCount = signal<number | undefined>(undefined);
  readonly pageSize = signal(20);
  readonly showEnds = signal(true);
  readonly getHref = signal<((p: number) => string) | undefined>(undefined);
  readonly disabled = signal(false);
  readonly label = signal<string | undefined>(undefined);
  readonly formatSummary = signal<((s: number, e: number, t: number) => string) | undefined>(undefined);
  readonly lang = signal<'en' | 'ar'>('en');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly changes: number[] = [];
  changed(p: number | undefined) {
    if (p !== undefined) this.changes.push(p);
  }
}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

afterEach(() => {
  vi.restoreAllMocks();
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('Pagination', () => {
  it('renders a labelled nav with the parts in order and the axes', async () => {
    const f = await mount(Host, (h) => h.page.set(5));
    const root = nav(f.nativeElement);
    expect(root.tagName).toBe('NAV');
    expect(root.getAttribute('aria-label')).toBe('Pagination');
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.getAttribute('data-shape')).toBe('pill');
    expect(root.hasAttribute('data-variant')).toBe(false);
    expect(root.getAttributeNames().sort()).toEqual(['aria-label', 'data-ds', 'data-shape', 'data-size']);
    expect(parts(root)).toEqual(['first', 'previous', 'page', 'ellipsis', 'page', 'page', 'page', 'ellipsis', 'ellipsis', 'page', 'next', 'last']);
    expect(root.querySelectorAll('[data-part="ellipsis"][data-compact]')).toHaveLength(1);
    for (const el of root.querySelectorAll('[data-part="ellipsis"]')) expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks the current page, draws its pill and names each page', async () => {
    const f = await mount(Host, (h) => h.page.set(2));
    const current = named(f.nativeElement, 'Page 2');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.getAttribute('data-active')).toBe('');
    expect(current.getAttribute('data-emphasis')).toBe('soft');
    expect(current.getAttribute('data-ds')).toBe('button');
    expect(current.getAttribute('type')).toBe('button');
    expect(Array.from(current.children).map((c) => c.getAttribute('data-part'))).toEqual([null, 'label', 'hit']);
    expect(current.querySelector(':scope > [data-part="label"] > span[aria-hidden="true"]')?.textContent).toBe('2');
    const other = named(f.nativeElement, 'Page 1');
    expect(other.hasAttribute('aria-current')).toBe(false);
    expect(other.getAttribute('data-emphasis')).toBe('ghost');
    expect(Array.from(other.children).map((c) => c.getAttribute('data-part'))).toEqual(['label', 'hit']);
    for (const el of pages(f.nativeElement)) expect(el.getAttributeNames()).not.toContain('dspaginationpage');
  });

  it('uses the chevron icons on the ends and keeps the inert ends focusable', async () => {
    const f = await mount(Host);
    const first = named(f.nativeElement, 'First page');
    expect(first.getAttribute('data-ds')).toBe('icon-button');
    expect(first.getAttribute('data-part')).toBe('first');
    expect(first.getAttribute('aria-disabled')).toBe('true');
    expect(first.hasAttribute('disabled')).toBe(false);
    expect(named(f.nativeElement, 'Previous page').getAttribute('aria-disabled')).toBe('true');
    expect(named(f.nativeElement, 'Next page').hasAttribute('aria-disabled')).toBe(false);
    expect(first.querySelector('[data-part="icon"]')).not.toBeNull();
  });

  it('moves between pages, emits pageChange and keeps focus on the pressed control', async () => {
    const f = await mount(Host);
    const next = named(f.nativeElement, 'Next page');
    next.focus();
    next.click();
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([2]);
    expect(named(f.nativeElement, 'Page 2').getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(next);
    named(f.nativeElement, 'Page 2').click();
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([2]);
  });

  it('keeps focus on a pressed page when the window of pages shifts', async () => {
    const f = await mount(Host, (h) => h.page.set(4));
    const five = named(f.nativeElement, 'Page 5');
    five.focus();
    five.click();
    await f.whenStable();
    expect(document.activeElement).toBe(five);
    expect(five.getAttribute('aria-current')).toBe('page');
    expect(pages(f.nativeElement).map((p) => p.getAttribute('aria-label'))).toEqual(['Page 1', 'Page 4', 'Page 5', 'Page 6', 'Page 16']);
  });

  it('follows a controlled page and clamps a page past the end', async () => {
    const f = await mount(Host);
    f.componentInstance.page.set(9);
    await f.whenStable();
    expect(named(f.nativeElement, 'Page 9').getAttribute('aria-current')).toBe('page');
    f.componentInstance.page.set(99);
    await f.whenStable();
    expect(named(f.nativeElement, 'Page 16').getAttribute('aria-current')).toBe('page');
  });

  it('reads a page count of 0 or NaN as one page with inert ends', async () => {
    const f = await mount(Host, (h) => h.pageCount.set(Number.NaN));
    expect(pages(f.nativeElement)).toHaveLength(1);
    expect(named(f.nativeElement, 'Next page').getAttribute('aria-disabled')).toBe('true');
    f.componentInstance.pageCount.set(0);
    await f.whenStable();
    expect(pages(f.nativeElement)).toHaveLength(1);
  });

  it('shows the summary from itemCount and pageSize, with Western digits in Arabic', async () => {
    const f = await mount(Host, (h) => {
      h.pageCount.set(undefined);
      h.itemCount.set(312);
      h.page.set(2);
    });
    const summary = () => f.nativeElement.querySelector('[data-part="summary"]')?.textContent;
    expect(summary()).toBe('21 to 40 of 312');
    expect(pages(f.nativeElement).at(-1)?.getAttribute('aria-label')).toBe('Page 16');
    f.componentInstance.lang.set('ar');
    await f.whenStable();
    expect(summary()).toBe('21 إلى 40 من 312');
    expect(nav(f.nativeElement).getAttribute('aria-label')).toBe('التنقل بين الصفحات');
    expect(named(f.nativeElement, 'صفحة 2').getAttribute('aria-current')).toBe('page');
  });

  it('says No items for an empty list, in English and Arabic', async () => {
    const f = await mount(Host, (h) => {
      h.pageCount.set(undefined);
      h.itemCount.set(0);
    });
    const summary = () => f.nativeElement.querySelector('[data-part="summary"]')?.textContent;
    expect(summary()).toBe('No items');
    f.componentInstance.lang.set('ar');
    await f.whenStable();
    expect(summary()).toBe('لا توجد عناصر');
  });

  it('renders no summary for an item count that is not finite, and reads a bad page size as 20', async () => {
    const f = await mount(Host, (h) => {
      h.pageCount.set(undefined);
      h.itemCount.set(Number.NaN);
    });
    expect(f.nativeElement.querySelector('[data-part="summary"]')).toBeNull();
    f.componentInstance.itemCount.set(100);
    f.componentInstance.pageSize.set(Number.NaN);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[data-part="summary"]')?.textContent).toBe('1 to 20 of 100');
  });

  it('takes a custom summary and label', async () => {
    const f = await mount(Host, (h) => {
      h.itemCount.set(50);
      h.label.set('Results pages');
      h.formatSummary.set((s, e, t) => `Rows ${s} to ${e} of ${t}`);
    });
    expect(nav(f.nativeElement).getAttribute('aria-label')).toBe('Results pages');
    expect(f.nativeElement.querySelector('[data-part="summary"]')?.textContent).toBe('Rows 1 to 20 of 50');
  });

  it('renders links with getHref, drops the href of an inert end and keeps it a tab stop', async () => {
    const f = await mount(Host, (h) => h.getHref.set((p) => `#page-${p}`));
    const first = named(f.nativeElement, 'First page');
    expect(first.tagName).toBe('A');
    expect(first.hasAttribute('href')).toBe(false);
    expect(first.getAttribute('role')).toBe('link');
    expect(first.getAttribute('tabindex')).toBe('0');
    const three = named(f.nativeElement, 'Page 3');
    expect(three.tagName).toBe('A');
    expect(three.getAttribute('href')).toBe('#page-3');
    expect(three.hasAttribute('type')).toBe(false);
    expect(three.hasAttribute('tabindex')).toBe(false);
  });

  it('in link mode leaves a modifier click and a middle click to the browser', async () => {
    const f = await mount(Host, (h) => h.getHref.set((p) => `#page-${p}`));
    const three = named(f.nativeElement, 'Page 3');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
    three.dispatchEvent(click);
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([]);
    expect(click.defaultPrevented).toBe(false);
  });

  it('when disabled, presses nothing and keeps link controls focusable', async () => {
    const f = await mount(Host, (h) => {
      h.disabled.set(true);
      h.getHref.set((p) => `#page-${p}`);
    });
    for (const el of (f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('nav > a')) {
      expect(el.getAttribute('aria-disabled')).toBe('true');
      expect(el.getAttribute('tabindex')).toBe('0');
    }
    named(f.nativeElement, 'Page 3').click();
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([]);
  });

  it('hides the ends with showEnds false', async () => {
    const f = await mount(Host, (h) => h.showEnds.set(false));
    expect(parts(nav(f.nativeElement))).not.toContain('first');
    expect(parts(nav(f.nativeElement))).not.toContain('last');
  });

  it('sets data-pressed on a page from pointerdown, never while disabled, and writes the press point', async () => {
    const f = await mount(Host);
    const two = named(f.nativeElement, 'Page 2');
    two.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, isPrimary: true, clientX: 4, clientY: 4 }));
    expect(two.hasAttribute('data-pressed')).toBe(true);
    two.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, isPrimary: true }));
    expect(two.hasAttribute('data-pressed')).toBe(false);
    f.componentInstance.disabled.set(true);
    await f.whenStable();
    two.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, isPrimary: true }));
    expect(two.hasAttribute('data-pressed')).toBe(false);
  });

  it('pagination-roll: a shifted window renders each new number in a fresh aria-hidden host', async () => {
    const f = await mount(Host, (h) => h.page.set(4));
    named(f.nativeElement, 'Page 5').click();
    await f.whenStable();
    const texts = pages(f.nativeElement).map((p) => p.getAttribute('aria-label'));
    expect(texts).toEqual(['Page 1', 'Page 4', 'Page 5', 'Page 6', 'Page 16']);
    named(f.nativeElement, 'Page 6').click();
    await f.whenStable();
    named(f.nativeElement, 'Page 7').click();
    await f.whenStable();
    expect(pages(f.nativeElement).map((p) => p.getAttribute('aria-label'))).toEqual(['Page 1', 'Page 6', 'Page 7', 'Page 8', 'Page 16']);
    expect(named(f.nativeElement, 'Page 7').querySelector('[data-part="label"] > span')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders every demo case', async () => {
    const f = await mount(PaginationDemo);
    const ids = Array.from(f.nativeElement.querySelectorAll('[data-demo-case]')).map((s) => (s as Element).getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(f.nativeElement.querySelectorAll('[data-ds="pagination"]').length).toBeGreaterThan(10);
  });
});

describe('Pagination variant dots', () => {
  const dotsHost = (h: Host) => {
    h.variant.set('dots');
    h.pageCount.set(5);
    h.page.set(2);
  };

  it('is a nav named Pages with one dot per page and no numbers, ends or summary', async () => {
    const f = await mount(Host, (h) => {
      dotsHost(h);
      h.itemCount.set(100);
    });
    const root = nav(f.nativeElement);
    expect(root.getAttribute('aria-label')).toBe('Pages');
    expect(root.getAttribute('data-variant')).toBe('dots');
    expect(root.hasAttribute('data-size')).toBe(false);
    expect(root.hasAttribute('data-shape')).toBe(false);
    expect(parts(root)).toEqual(['track']);
    expect(dots(f.nativeElement)).toHaveLength(5);
    expect(f.nativeElement.querySelector('[data-part="page"], [data-part="summary"], [data-part="first"]')).toBeNull();
  });

  it('names each dot Page n of m, marks the current one and draws the dot', async () => {
    const f = await mount(Host, dotsHost);
    const all = dots(f.nativeElement);
    expect(all.map((d) => d.getAttribute('aria-label'))).toEqual(['Page 1 of 5', 'Page 2 of 5', 'Page 3 of 5', 'Page 4 of 5', 'Page 5 of 5']);
    expect(all[1]!.getAttribute('aria-current')).toBe('page');
    expect(all[1]!.getAttribute('data-active')).toBe('');
    expect(all[0]!.hasAttribute('aria-current')).toBe(false);
    expect(all[0]!.getAttribute('data-size')).toBe('xs');
    expect(all[0]!.getAttribute('data-shape')).toBe('pill');
    expect(all[0]!.getAttribute('data-emphasis')).toBe('ghost');
    expect(Array.from(all[0]!.children).map((c) => c.getAttribute('data-part'))).toEqual([null, 'hit']);
  });

  it('says its words in Arabic with Western digits', async () => {
    const f = await mount(Host, (h) => {
      dotsHost(h);
      h.lang.set('ar');
    });
    expect(nav(f.nativeElement).getAttribute('aria-label')).toBe('الصفحات');
    expect(dots(f.nativeElement)[0]!.getAttribute('aria-label')).toBe('صفحة 1 من 5');
  });

  it('is one tab stop: only the current dot is in the tab order', async () => {
    const f = await mount(Host, dotsHost);
    expect(dots(f.nativeElement).map((d) => d.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1', '-1']);
  });

  it('moves and selects with the arrows, Home and End, without wrapping', async () => {
    const f = await mount(Host, dotsHost);
    dots(f.nativeElement)[1]!.focus();
    press('ArrowRight');
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([3]);
    expect(document.activeElement).toBe(dots(f.nativeElement)[2]);
    press('End');
    await f.whenStable();
    press('ArrowRight');
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([3, 5]);
    expect(document.activeElement).toBe(dots(f.nativeElement)[4]);
    press('Home');
    await f.whenStable();
    press('ArrowLeft');
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([3, 5, 1]);
    expect(dots(f.nativeElement)[0]!.getAttribute('tabindex')).toBe('0');
  });

  it('mirrors the arrows in right to left', async () => {
    const f = await mount(Host, (h) => {
      dotsHost(h);
      h.dir.set('rtl');
    });
    dots(f.nativeElement)[1]!.focus();
    press('ArrowLeft');
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([3]);
  });

  it('selects a page on a press of its dot, not the current one', async () => {
    const f = await mount(Host, dotsHost);
    dots(f.nativeElement)[3]!.click();
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([4]);
    dots(f.nativeElement)[3]!.click();
    await f.whenStable();
    expect(f.componentInstance.changes).toEqual([4]);
  });

  it('when disabled keeps the tab stop and the focus move, but selects nothing', async () => {
    const f = await mount(Host, (h) => {
      dotsHost(h);
      h.disabled.set(true);
    });
    const all = dots(f.nativeElement);
    expect(all[1]!.getAttribute('aria-disabled')).toBe('true');
    all[1]!.focus();
    press('ArrowRight');
    await f.whenStable();
    expect(document.activeElement).toBe(all[2]);
    expect(f.componentInstance.changes).toEqual([]);
  });

  it('reads a page count under 1 or not a number as one dot', async () => {
    const f = await mount(Host, (h) => {
      dotsHost(h);
      h.pageCount.set(-3);
    });
    expect(dots(f.nativeElement)).toHaveLength(1);
  });

  describe('compact, when the dots do not fit', () => {
    /** Dots of 24px with a gap of 4 in a root of the given width. */
    function layout(width: number) {
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('data-ds') === 'pagination' ? width : 0;
      });
      const real = window.getComputedStyle.bind(window);
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
        const style = real(el, pseudo);
        const part = el.getAttribute('data-part');
        if (part !== 'dot' && part !== 'track') return style;
        return new Proxy(style, {
          get(target, key) {
            if (part === 'dot' && key === 'flexBasis') return '24px';
            if (part === 'track' && key === 'columnGap') return '4px';
            const v = Reflect.get(target, key);
            return typeof v === 'function' ? v.bind(target) : v;
          },
        });
      });
    }

    it('stays full size while the dots fit', async () => {
      layout(400);
      const f = await mount(Host, dotsHost);
      expect(nav(f.nativeElement).hasAttribute('data-compact')).toBe(false);
    });

    it('turns compact past the width, and a press on either half goes back or forward', async () => {
      layout(100);
      const f = await mount(Host, (h) => {
        dotsHost(h);
        h.pageCount.set(40);
        h.page.set(12);
      });
      await f.whenStable();
      expect(nav(f.nativeElement).getAttribute('data-compact')).toBe('');
      const track = f.nativeElement.querySelector('[data-part="track"]') as HTMLElement;
      vi.spyOn(track, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 44));
      track.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 10 }));
      await f.whenStable();
      expect(f.componentInstance.changes).toEqual([11]);
      dots(f.nativeElement)[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 90 }));
      await f.whenStable();
      expect(f.componentInstance.changes).toEqual([11, 12]);
    });

    it('mirrors the halves in right to left and keeps the keys', async () => {
      layout(100);
      const f = await mount(Host, (h) => {
        dotsHost(h);
        h.pageCount.set(40);
        h.page.set(12);
        h.dir.set('rtl');
      });
      await f.whenStable();
      const track = f.nativeElement.querySelector('[data-part="track"]') as HTMLElement;
      vi.spyOn(track, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 44));
      track.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 10 }));
      await f.whenStable();
      expect(f.componentInstance.changes).toEqual([13]);
      dots(f.nativeElement)[12]!.focus();
      press('ArrowLeft');
      await f.whenStable();
      expect(f.componentInstance.changes).toEqual([13, 14]);
    });
  });
});
