// PageShell: the Angular twin of
// packages/react/src/components/PageShell/PageShell.test.tsx. WCAG 2.2
// covered here: 2.4.1 Bypass blocks (the skip link is the first tab stop and
// moves focus to main), 1.3.1 Info and relationships (one landmark per part,
// none when embedded), 2.4.3 Focus order and 1.3.2 Meaningful sequence
// (placement never reorders the DOM), 4.1.2 Name, role, value (the menu
// button and the aside name).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsTabBar, DsTabBarItem } from '../tab-bar/tab-bar';
import PageShellDemo from './page-shell.demo';
import { DsPageShell, type PageShellSidebar } from './page-shell';

const rootEl = () => document.querySelector<HTMLElement>('[data-ds="page-shell"]');
const childParts = () => Array.from(rootEl()?.children ?? []).map((c) => c.getAttribute('data-part'));

@Component({
  imports: [DsPageShell, DsButton, DsTheme],
  template: `
    <div dsTheme [lang]="lang()">
      <div dsPageShell #shell="dsPageShell" [nav]="withNav() ? navTemplate : undefined" [header]="withHeader() ? headerTemplate : undefined"
        [aside]="asideTemplate" asideLabel="Board details" [footer]="footerTemplate" [embedded]="embedded()" [(sidebar)]="sidebar">
        <ng-template #headerTemplate><span>Northwind</span></ng-template>
        <ng-template #navTemplate>
          <nav aria-label="Main">
            <a href="#home">Home</a>
            <button dsButton id="toggle" (click)="shell.setSidebar(shell.shownSidebar() === 'collapsed' ? 'expanded' : 'collapsed')">Collapse navigation</button>
          </nav>
        </ng-template>
        <ng-template #asideTemplate><p>Details</p></ng-template>
        <ng-template #footerTemplate>2026</ng-template>
        <button dsButton>Create board</button>
      </div>
    </div>
  `,
})
class Basic {
  readonly sidebar = signal<PageShellSidebar | undefined>(undefined);
  readonly embedded = signal(false);
  readonly withNav = signal(true);
  readonly withHeader = signal(true);
  readonly lang = signal<'en' | 'ar'>('en');
}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** Makes matchMedia report a narrow (true) or wide (false) window, for the CDK MediaMatcher. */
function mockNarrow(matches: boolean) {
  const listeners = new Set<(q: unknown) => void>();
  const query = {
    matches,
    media: '(width < 48rem)',
    addListener: (fn: (q: unknown) => void) => listeners.add(fn),
    removeListener: (fn: (q: unknown) => void) => listeners.delete(fn),
    addEventListener: (_: string, fn: (q: unknown) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (q: unknown) => void) => listeners.delete(fn),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => query));
  return {
    set(next: boolean) {
      query.matches = next;
      listeners.forEach((fn) => fn(query));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  TestBed.resetTestingModule();
  document.body.replaceChildren();
  history.replaceState(null, '', window.location.pathname + window.location.search);
});

describe('PageShell', () => {
  it('renders the parts in order with their landmarks, one main with id main, and the skip link first', async () => {
    await mount(Basic);
    const root = rootEl()!;
    expect(root.getAttribute('data-sidebar')).toBe('expanded');
    expect(root.hasAttribute('data-placement')).toBe(false);
    expect(root.getAttributeNames().sort()).toEqual(['data-ds', 'data-sidebar']);
    expect(childParts()).toEqual(['skip', 'header', 'nav', 'main', 'aside', 'footer']);
    const [skip, header, , main, aside, footer] = Array.from(root.children) as HTMLElement[];
    expect(skip!.getAttribute('data-ds')).toBe('skip-link');
    expect(skip!.getAttribute('href')).toBe('#main');
    expect(skip!.textContent?.trim()).toBe('Skip to main content');
    expect(header!.tagName).toBe('HEADER');
    expect(main!.tagName).toBe('MAIN');
    expect(main!.id).toBe('main');
    expect(main!.getAttribute('tabindex')).toBe('-1');
    expect(aside!.tagName).toBe('ASIDE');
    expect(aside!.getAttribute('aria-label')).toBe('Board details');
    expect(footer!.tagName).toBe('FOOTER');
    // The menu button is drawn with a nav, as React; the CSS shows it only while the column is hidden.
    expect(header!.querySelector('[data-part="menu"]')).not.toBeNull();
    expect(document.querySelectorAll('main')).toHaveLength(1);
  });

  it('the skip link is the first tab stop, and activating it moves focus to main', async () => {
    await mount(Basic);
    const first = rootEl()!.querySelector<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])');
    expect(first?.getAttribute('data-part')).toBe('skip');
    first!.click();
    expect(document.activeElement).toBe(document.getElementById('main'));
  });

  it('follows the column toggle through the shell and emits sidebarChange', async () => {
    const f = await mount(Basic);
    document.getElementById('toggle')!.click();
    await f.whenStable();
    expect(rootEl()!.getAttribute('data-sidebar')).toBe('collapsed');
    expect(f.componentInstance.sidebar()).toBe('collapsed');
  });

  it('hidden on a wide screen: no column, and the menu button opens the navigation in a Drawer', async () => {
    const f = await mount(Basic, (h) => h.sidebar.set('hidden'));
    const root = rootEl()!;
    expect(root.getAttribute('data-sidebar')).toBe('hidden');
    const nav = root.querySelector<HTMLElement>(':scope > [data-part="nav"]')!;
    expect(nav.hasAttribute('hidden')).toBe(true);
    expect(nav.children).toHaveLength(0);
    const menu = root.querySelector<HTMLElement>('[data-part="menu"]')!;
    expect(menu.getAttribute('data-ds')).toBe('icon-button');
    expect(menu.getAttribute('aria-label')).toBe('Open navigation');
    expect(menu.getAttribute('aria-haspopup')).toBe('dialog');
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menu.hasAttribute('data-state')).toBe(false);
    menu.focus();
    menu.click();
    await f.whenStable();
    await tick();
    await f.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    const drawer = document.querySelector<HTMLElement>('[data-ds="drawer"]')!;
    expect(drawer.getAttribute('data-side')).toBe('start');
    expect(drawer.getAttribute('data-size')).toBe('sm');
    expect(drawer.querySelector('[data-part="title"]')?.textContent).toBe('Navigation');
    expect(drawer.querySelector('[data-part="body"] nav[aria-label="Main"]')).not.toBeNull();
    // Following a link closes it, and focus returns to the menu button.
    drawer.querySelector<HTMLElement>('[data-part="body"] a[href]')!.click();
    await f.whenStable();
    await tick();
    await f.whenStable();
    expect(document.querySelector('[data-ds="drawer"]')).toBeNull();
    expect(document.activeElement).toBe(menu);
  });

  it('under breakpoint.tablet says hidden, and closes the Drawer when the window grows', async () => {
    const media = mockNarrow(true);
    const f = await mount(Basic);
    await tick();
    await f.whenStable();
    expect(rootEl()!.getAttribute('data-sidebar')).toBe('hidden');
    rootEl()!.querySelector<HTMLElement>('[data-part="menu"]')!.click();
    await f.whenStable();
    await tick();
    await f.whenStable();
    expect(document.querySelector('[data-ds="drawer"]')).not.toBeNull();
    media.set(false);
    await tick(5);
    await f.whenStable();
    await tick();
    await f.whenStable();
    expect(rootEl()!.getAttribute('data-sidebar')).toBe('expanded');
    expect(document.querySelector('[data-ds="drawer"]')).toBeNull();
  });

  it('with no nav: no menu button and no nav part, the root says hidden', async () => {
    await mount(Basic, (h) => h.withNav.set(false));
    expect(rootEl()!.getAttribute('data-sidebar')).toBe('hidden');
    expect(childParts()).toEqual(['skip', 'header', 'main', 'aside', 'footer']);
    expect(rootEl()!.querySelector('[data-part="menu"]')).toBeNull();
  });

  it('embedded draws no landmarks; main is a named region', async () => {
    await mount(Basic, (h) => h.embedded.set(true));
    const root = rootEl()!;
    expect(root.querySelector('header, main, aside, footer')).toBeNull();
    const main = root.querySelector<HTMLElement>('[data-part="main"]')!;
    expect(main.tagName).toBe('DIV');
    expect(main.getAttribute('role')).toBe('region');
    expect(main.getAttribute('aria-label')).toBe('Main content');
    expect(root.querySelector('[data-part="aside"]')!.getAttribute('role')).toBe('group');
  });

  it('uses Arabic labels under lang ar', async () => {
    await mount(Basic, (h) => {
      h.lang.set('ar');
      h.sidebar.set('hidden');
    });
    const root = rootEl()!;
    expect(root.querySelector('[data-part="skip"]')!.textContent?.trim()).toBe('الانتقال للمحتوى الرئيسي');
    expect(root.querySelector('[data-part="menu"]')!.getAttribute('aria-label')).toBe('فتح التنقل');
  });

  it('renders no banner for a nav alone while the column shows', async () => {
    await mount(Basic, (h) => h.withHeader.set(false));
    expect(childParts()).toEqual(['skip', 'nav', 'main', 'aside', 'footer']);
  });

  it('renders every demo case with a unique main id', async () => {
    await mount(PageShellDemo);
    const cases = Array.from(document.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
    const mains = Array.from(document.querySelectorAll('[data-part="main"]')).map((m) => m.id);
    expect(new Set(mains).size).toBe(mains.length);
    expect(document.querySelector('[dsdemoshell], [dsdemophoneshell]')).toBeNull();
  });
});

describe('PageShell placement', () => {
  @Component({
    imports: [DsPageShell, DsTabBar, DsTabBarItem, DsButton],
    template: `
      <div dsPageShell embedded [placement]="placement()" [header]="headerTemplate" [footer]="footerTemplate">
        <ng-template #headerTemplate><button dsButton size="sm">Share</button></ng-template>
        <ng-template #footerTemplate>
          <nav dsTabBar aria-label="Sections" size="lg">
            <a dsTabBarItem href="#home" icon="home" label="Home" active></a>
            <a dsTabBarItem href="#inbox" icon="inbox" label="Inbox"></a>
          </nav>
        </ng-template>
        <p>Content</p>
      </div>
    `,
  })
  class Phone {
    readonly placement = signal<'auto' | 'bottom' | 'side'>('auto');
  }

  it('stamps no data-placement for auto, on the root or a bar', async () => {
    await mount(Phone);
    expect(document.querySelector('[data-placement]')).toBeNull();
  });

  it.each(['bottom', 'side'] as const)('stamps "%s" on the root and passes it to the TabBar', async (placement) => {
    await mount(Phone, (p) => p.placement.set(placement));
    expect(rootEl()!.getAttribute('data-placement')).toBe(placement);
    expect(document.querySelector('[data-ds="tab-bar"]')!.getAttribute('data-placement')).toBe(placement);
  });

  it('keeps the parts and the tab order in every placement', async () => {
    const tabOrder = () => Array.from(rootEl()!.querySelectorAll<HTMLElement>('a[href], button')).map((n) => n.textContent?.trim());
    const f = await mount(Phone);
    const parts = childParts();
    const order = tabOrder();
    f.componentInstance.placement.set('side');
    await f.whenStable();
    expect(childParts()).toEqual(parts);
    expect(tabOrder()).toEqual(order);
    expect(order.indexOf('Share')).toBeLessThan(order.indexOf('Home'));
  });

  it('a nested PageShell does not pass its parent placement on', async () => {
    @Component({
      imports: [DsPageShell, DsTabBar, DsTabBarItem],
      template: `
        <div dsPageShell embedded placement="side" mainId="outer">
          <div dsPageShell embedded mainId="inner" [footer]="innerFooter">
            <ng-template #innerFooter>
              <nav dsTabBar aria-label="Inner"><a dsTabBarItem href="#a" icon="home" label="Home"></a></nav>
            </ng-template>
            <p>Inner</p>
          </div>
        </div>
      `,
    })
    class Nested {}
    await mount(Nested);
    expect(document.querySelector('[data-ds="tab-bar"]')!.hasAttribute('data-placement')).toBe(false);
  });
});
