// Navbar: the Angular twin of packages/react/src/components/Navbar/Navbar.test.tsx
// and Navbar.wrap.test.tsx. WCAG 2.2 covered here: 1.3.1 and 2.4.6 (one
// h1, the inline title an attribute), 2.1.1 Keyboard (Enter, ArrowDown,
// Escape, the arrow keys), 2.4.3 Focus order (the same order in every
// placement; back, start, end, then the heading), 4.1.2 Name, role, value.
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButtonGroup } from '../button-group/button-group';
import { DsIconButton } from '../icon-button/icon-button';
import { DsPageShell } from '../page-shell/page-shell';
import NavbarDemo from './navbar.demo';
import { DsNavbar, type NavbarBack, type NavbarItem, type NavbarPlacement } from './navbar';

const items: NavbarItem[] = [
  { label: 'Overview', href: '#overview' },
  {
    label: 'Product',
    links: [
      { label: 'Boards', href: '#boards', description: 'Plan work' },
      { label: 'Docs', href: '#docs', active: true },
    ],
  },
  { label: 'Pricing', href: '#pricing', active: false },
];

@Component({
  imports: [DsNavbar, DsTheme],
  template: `
    <div dsTheme [lang]="lang()" [dir]="lang() === 'ar' ? 'rtl' : 'ltr'">
      <ng-template #brand><a href="#home">Brand</a></ng-template>
      <ng-template #end><a href="#account">Account</a></ng-template>
      <nav dsNavbar label="Main" [size]="size()" [sticky]="sticky()" [brand]="brand" [items]="items()" [end]="end" [placement]="placement()"></nav>
    </div>
  `,
})
class Basic {
  readonly items = signal<NavbarItem[]>(items);
  readonly size = signal<'md' | 'lg'>('md');
  readonly sticky = signal(false);
  readonly placement = signal<NavbarPlacement | undefined>(undefined);
  readonly lang = signal<'en' | 'ar'>('en');
}

@Component({
  imports: [DsNavbar, DsPageShell],
  template: `
    <div dsPageShell embedded [placement]="shellPlacement()" [header]="header">
      <ng-template #header><nav dsNavbar label="Main" [items]="items" [placement]="own()"></nav></ng-template>
      <p>Content</p>
    </div>
  `,
})
class InShell {
  readonly items = items;
  readonly shellPlacement = signal<NavbarPlacement>('side');
  readonly own = signal<NavbarPlacement | undefined>(undefined);
}

@Component({
  imports: [DsNavbar, DsIconButton, DsButtonGroup],
  template: `
    <ng-template #start>
      <div dsButtonGroup attached aria-label="Song tools"><button dsIconButton icon="shuffle" label="Shuffle songs"></button></div>
    </ng-template>
    <ng-template #end>
      <div dsButtonGroup attached aria-label="Song actions">
        <button dsIconButton icon="sort" label="Sort songs"></button>
        <button dsIconButton icon="more" label="More options"></button>
      </div>
    </ng-template>
    <ng-template #title><span>Songs</span> for the road</ng-template>
    <nav dsNavbar label="Songs" [items]="[]" [back]="back()" [start]="start" [end]="end" [heading]="node() ? title : heading()"></nav>
  `,
})
class Pushed {
  readonly back = signal<NavbarBack | undefined>({ label: 'Library', href: '#library' });
  readonly heading = signal<string | undefined>('Songs');
  readonly node = signal(false);
}

@Component({
  imports: [DsNavbar, DsPageShell, DsTheme],
  template: `
    <div dsTheme [platform]="platform()">
      <div dsPageShell embedded [header]="header">
        <ng-template #header>
          <nav dsNavbar label="Songs" [items]="[]" [back]="{ label: 'Library', href: '#library' }" [heading]="heading()"></nav>
        </ng-template>
        <a href="#one">One</a>
      </div>
    </div>
  `,
})
class Collapse {
  readonly platform = signal<'ios' | 'web'>('ios');
  readonly heading = signal<string | undefined>('Songs');
}

beforeAll(() => {
  const g = globalThis as unknown as { ResizeObserver?: unknown };
  g.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function settle(f: ComponentFixture<unknown>, ms = 0) {
  await f.whenStable();
  await tick(ms);
  await f.whenStable();
}

const nav = () => document.querySelector<HTMLElement>('[data-ds="navbar"]')!;
const part = (name: string) => nav().querySelector<HTMLElement>(`[data-part="${name}"]`);
const trigger = () => part('trigger')!;

function press(key: string, target: Element = document.activeElement ?? document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('Navbar', () => {
  it('renders a labelled nav with the anatomy and the default axes', async () => {
    await mount(Basic);
    const el = nav();
    expect(el.tagName).toBe('NAV');
    expect(el.getAttribute('aria-label')).toBe('Main');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.hasAttribute('data-sticky')).toBe(false);
    for (const name of ['brand', 'list', 'item', 'link', 'trigger', 'end', 'menu-button']) expect(part(name), name).not.toBeNull();
    expect(trigger().getAttribute('data-ds')).toBe('button');
    expect(trigger().getAttribute('data-emphasis')).toBe('ghost');
    expect(part('menu-button')!.getAttribute('data-ds')).toBe('icon-button');
    expect(part('list')!.parentElement!.getAttribute('style')).toBe('position: relative;');
    expect(part('viewport')).toBeNull();
    expect(part('indicator')).toBeNull();
    expect(el.hasAttribute('label') || el.hasAttribute('items') || el.hasAttribute('dsnavbar')).toBe(false);
  });

  it('size and sticky set their attributes', async () => {
    await mount(Basic, (h) => {
      h.size.set('lg');
      h.sticky.set(true);
    });
    expect(nav().getAttribute('data-size')).toBe('lg');
    expect(nav().getAttribute('data-sticky')).toBe('');
    expect(trigger().getAttribute('data-size')).toBe('lg');
  });

  it('marks the current link and the menu that holds it', async () => {
    const f = await mount(Basic, (h) => h.items.set([{ label: 'Pricing', href: '#pricing', active: true }, items[1]!]));
    await settle(f);
    const link = part('link')!;
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.hasAttribute('data-active')).toBe(true);
    expect(trigger().hasAttribute('data-active')).toBe(true);
  });

  it('a trigger opens its panel on a press and closes it with Escape, back to the trigger', async () => {
    const f = await mount(Basic);
    const t = trigger();
    expect(t.getAttribute('data-state')).toBe('closed');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    t.focus();
    t.click();
    await settle(f);
    expect(t.getAttribute('data-state')).toBe('open');
    expect(t.getAttribute('aria-expanded')).toBe('true');
    const content = part('viewport')!.querySelector<HTMLElement>('[data-part="content"]')!;
    expect(t.getAttribute('aria-controls')).toBe(content.id);
    expect(content.getAttribute('aria-labelledby')).toBe(t.id);
    expect(content.querySelector('[data-part="content-list"] [data-part="link-label"]')?.textContent).toBe('Boards');
    expect(part('indicator')!.getAttribute('data-state')).toBe('visible');
    // Radix's focus proxy and aria-owns follow the open trigger.
    expect(t.nextElementSibling?.getAttribute('tabindex')).toBe('0');
    expect(t.nextElementSibling?.nextElementSibling?.getAttribute('aria-owns')).toBe(content.id);
    press('ArrowDown', t);
    expect(document.activeElement?.textContent).toContain('Boards');
    press('Escape');
    await settle(f, 20);
    expect(t.getAttribute('data-state')).toBe('closed');
    expect(document.activeElement).toBe(t);
    await settle(f, 20);
    expect(part('viewport')).toBeNull();
  });

  it('the trigger chevron is the Button end part, not a part of the Navbar', async () => {
    await mount(Basic);
    expect(nav().querySelector('[data-part="trigger-icon"]')).toBeNull();
    expect(nav().querySelector('[data-part="trigger"] > [data-part="end"] svg')).not.toBeNull();
  });

  it('draws no menu button with no items', async () => {
    await mount(Basic, (h) => h.items.set([]));
    expect(part('menu-button')).toBeNull();
  });

  it('arrow keys follow the reading direction in RTL', async () => {
    await mount(Basic, (h) => h.lang.set('ar'));
    const first = part('link')!;
    first.focus();
    press('ArrowLeft', first);
    await tick(5);
    expect(document.activeElement).toBe(trigger());
    press('Home', trigger());
    await tick(5);
    expect(document.activeElement).toBe(first);
  });

  it('the menu button opens the phone list as a Drawer root with the Sidebar markup, and Escape closes it, back to the button', async () => {
    const f = await mount(Basic);
    const button = part('menu-button')!;
    expect(button.getAttribute('aria-label')).toBe('Menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.focus();
    button.click();
    await settle(f);
    const mobile = document.querySelector<HTMLElement>('[data-part="mobile"]')!;
    expect(mobile.getAttribute('data-ds')).toBe('drawer');
    expect(mobile.getAttribute('data-side')).toBe('start');
    expect(mobile.getAttribute('data-state')).toBe('open');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const sidebar = mobile.querySelector<HTMLElement>('[data-ds="sidebar"]')!;
    expect(sidebar.getAttribute('aria-label')).toBe('Site menu');
    expect(sidebar.querySelectorAll('[data-part="group"]')).toHaveLength(3);
    const productList = Array.from(sidebar.querySelectorAll('ul[data-part="list"]')).find(
      (ul) => document.getElementById(ul.getAttribute('aria-labelledby') ?? '')?.textContent === 'Product',
    );
    expect(productList).toBeTruthy();
    expect(mobile.querySelector('[data-part="footer"]')?.textContent).toContain('Account');
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    (document.activeElement ?? document.body).dispatchEvent(event);
    await settle(f);
    await settle(f);
    expect(document.querySelector('[data-part="mobile"]')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('following a link in the phone list closes it; plain links share one group', async () => {
    const f = await mount(Basic, (h) => h.items.set([{ label: 'A', href: '#a' }, { label: 'B', href: '#b' }, items[1]!]));
    part('menu-button')!.click();
    await settle(f);
    const mobile = document.querySelector<HTMLElement>('[data-part="mobile"]')!;
    expect(mobile.querySelectorAll('[data-ds="sidebar"] [data-part="group"]')).toHaveLength(2);
    const link = mobile.querySelector<HTMLElement>('[data-part="item"]')!;
    link.addEventListener('click', (e) => e.preventDefault());
    link.click();
    await settle(f);
    await settle(f);
    expect(document.querySelector('[data-part="mobile"]')).toBeNull();
  });

  it('uses Arabic menu button words under an Arabic theme', async () => {
    await mount(Basic, (h) => h.lang.set('ar'));
    expect(part('menu-button')!.getAttribute('aria-label')).toBe('القائمة');
    expect(nav().getAttribute('dir')).toBe('rtl');
  });

  it('the demo sets no native title', async () => {
    const f = await mount(NavbarDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'pushed', 'title-wrap', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
    expect(c.querySelector('[title]')).toBeNull();
  });
});

describe('Navbar placement', () => {
  it('stamps no data-placement for auto, and the value for bottom and side', async () => {
    const f = await mount(Basic);
    expect(nav().hasAttribute('data-placement')).toBe(false);
    for (const p of ['bottom', 'side'] as const) {
      f.componentInstance.placement.set(p);
      await settle(f);
      expect(nav().getAttribute('data-placement')).toBe(p);
    }
  });

  it('inherits the PageShell placement, and its own placement wins', async () => {
    const f = await mount(InShell);
    expect(nav().getAttribute('data-placement')).toBe('side');
    f.componentInstance.own.set('auto');
    await settle(f);
    expect(nav().hasAttribute('data-placement')).toBe(false);
  });

  it('keeps the parts and the tab order in every placement', async () => {
    const f = await mount(Basic);
    const order = () => Array.from(nav().querySelectorAll<HTMLElement>('a[href], button')).map((n) => n.textContent?.trim() || n.getAttribute('aria-label'));
    const parts = () => Array.from(nav().children).map((c) => c.getAttribute('data-part'));
    const auto = order();
    const autoParts = parts();
    f.componentInstance.placement.set('side');
    await settle(f);
    expect(order()).toEqual(auto);
    expect(parts()).toEqual(autoParts);
    expect(auto.indexOf('Account')).toBeGreaterThan(auto.indexOf('Pricing'));
  });
});

describe('Navbar pushed screen (order C2)', () => {
  it('draws the heading as the h1, last in the bar; back is a named IconButton link first in start', async () => {
    await mount(Pushed);
    const el = nav();
    const h1 = el.querySelector('h1')!;
    expect(h1.getAttribute('data-part')).toBe('heading');
    expect(el.lastElementChild).toBe(h1);
    const start = part('start')!;
    const back = start.firstElementChild as HTMLElement;
    expect(back.getAttribute('data-part')).toBe('back');
    expect(back.getAttribute('data-ds')).toBe('icon-button');
    expect(back.tagName).toBe('A');
    expect(back.getAttribute('href')).toBe('#library');
    expect(back.getAttribute('aria-label')).toBe('Library');
    expect(back.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('back without href is a button that calls onClick', async () => {
    let pressed = 0;
    const f = await mount(Pushed, (h) => h.back.set({ label: 'Library', onClick: () => (pressed += 1) }));
    await settle(f);
    const back = part('back')!;
    expect(back.tagName).toBe('BUTTON');
    back.click();
    expect(pressed).toBe(1);
  });

  it('no heading and no start without the inputs', async () => {
    const f = await mount(Pushed, (h) => {
      h.heading.set(undefined);
      h.back.set(undefined);
    });
    await settle(f);
    expect(part('heading')).toBeNull();
  });

  it('a bar group is a named group; focus goes back, start, end; the heading is not a stop', async () => {
    await mount(Pushed);
    const groups = Array.from(nav().querySelectorAll<HTMLElement>('[data-ds="button-group"]'));
    expect(groups.map((g) => g.parentElement?.getAttribute('data-part'))).toEqual(['start', 'end']);
    for (const g of groups) expect(g.hasAttribute('data-attached')).toBe(true);
    const stops = Array.from(nav().querySelectorAll<HTMLElement>('a[href], button')).map((n) => n.getAttribute('aria-label'));
    expect(stops).toEqual(['Library', 'Shuffle songs', 'Sort songs', 'More options']);
    expect(nav().textContent?.trim().endsWith('Songs')).toBe(true);
  });

  it('the inline title is the heading text, from a string or a template', async () => {
    const f = await mount(Pushed);
    expect(nav().getAttribute('data-inline-title')).toBe('Songs');
    f.componentInstance.node.set(true);
    await settle(f);
    await settle(f);
    expect(nav().getAttribute('data-inline-title')).toBe('Songs for the road');
  });
});

describe('Navbar large title collapse (order K1)', () => {
  const main = () => document.querySelector<HTMLElement>('[data-ds="page-shell"] > [data-part="main"]')!;
  const scrollTo = async (f: ComponentFixture<unknown>, top: number) => {
    main().scrollTop = top;
    main().dispatchEvent(new Event('scroll'));
    await settle(f, 30);
  };

  it('rests expanded, collapses once main scrolls, and expands again at the top', async () => {
    const f = await mount(Collapse);
    await settle(f);
    expect(nav().hasAttribute('data-collapsed')).toBe(false);
    await scrollTo(f, 40);
    expect(nav().getAttribute('data-collapsed')).toBe('');
    await scrollTo(f, 0);
    expect(nav().hasAttribute('data-collapsed')).toBe(false);
  });

  it('writes the heading height on the shell as --_navbar-heading-size', async () => {
    const f = await mount(Collapse);
    await settle(f);
    const shell = document.querySelector<HTMLElement>('[data-ds="page-shell"]')!;
    expect(shell.style.getPropertyValue('--_navbar-heading-size')).toBe('0px');
    f.componentInstance.platform.set('web');
    await settle(f);
    expect(shell.style.getPropertyValue('--_navbar-heading-size')).toBe('');
  });

  it('keeps one h1 in both states; the inline title is an attribute', async () => {
    const f = await mount(Collapse);
    await settle(f);
    expect(nav().getAttribute('data-inline-title')).toBe('Songs');
    await scrollTo(f, 40);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('h1')!.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('never collapses on web or without a heading', async () => {
    const f = await mount(Collapse, (h) => h.platform.set('web'));
    await settle(f);
    await scrollTo(f, 40);
    expect(nav().hasAttribute('data-collapsed')).toBe(false);
    f.componentInstance.platform.set('ios');
    f.componentInstance.heading.set(undefined);
    await settle(f);
    await scrollTo(f, 50);
    expect(nav().hasAttribute('data-collapsed')).toBe(false);
    expect(nav().hasAttribute('data-inline-title')).toBe(false);
  });
});
