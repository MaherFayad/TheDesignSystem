// TabBar: the Angular twin of the React tests in
// packages/react/src/components/TabBar/ (TabBar, accessory, search and
// pressed tests). WCAG 2.2 covered here: 2.1.1 Keyboard (arrow keys, Home,
// End, Tab in every placement), 2.4.3 Focus order (accessory first; the DOM
// order never changes with placement; focus follows the search item into
// its field and back), 4.1.2 Name, role, value (the badge words in the link
// name, aria-current on the current item).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsSearchField } from '../search-field/search-field';
import { DS_BAR_PLACEMENT, type BarPlacement } from '../../internal/placement';
import TabBarDemo from './tab-bar.demo';
import { DsTabBar, DsTabBarItem, DsTabBarSearch, type TabBarPlacement, type TabBarSize } from './tab-bar';

const bar = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-ds="tab-bar"]')!;
const parts = (el: HTMLElement) => Array.from(el.children).map((c) => c.getAttribute('data-part') ?? '');
const link = (root: HTMLElement, name: string) => {
  const found = Array.from(root.querySelectorAll<HTMLElement>('a')).find((a) => accessibleText(a) === name);
  if (!found) throw new Error(`no link named ${name}`);
  return found;
};
/** The link name as a screen reader builds it here: every text of the link but the aria-hidden parts. */
function accessibleText(el: HTMLElement): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') return '';
    return Array.from(node.childNodes).map(walk).join('');
  };
  return walk(el).trim();
}

/** A key press on the focused element, bubbling, as a person makes it. */
function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

@Component({
  imports: [DsTabBar, DsTabBarItem],
  template: `
    <nav dsTabBar aria-label="Main" [size]="size()">
      <a dsTabBarItem href="#home" icon="home" label="Home" active></a>
      <a dsTabBarItem href="#inbox" icon="inbox" label="Inbox" [badge]="3"></a>
      <a dsTabBarItem href="#alerts" icon="bell" label="Alerts" [badge]="true"></a>
      <a dsTabBarItem href="#more" icon="user" label="Profile" [badge]="250"></a>
    </nav>
  `,
})
class Example {
  readonly size = signal<TabBarSize>('md');
}

@Component({
  imports: [DsTabBar, DsTabBarItem],
  template: `
    <div [attr.dir]="dir()">
      <nav dsTabBar aria-label="Main" size="lg" [placement]="placement()" (keydown)="own($event)">
        <a dsTabBarItem href="#home" icon="home" label="Home" active></a>
        <a dsTabBarItem href="#inbox" icon="inbox" label="Inbox"></a>
        <a dsTabBarItem href="#alerts" icon="bell" label="Alerts"></a>
        <a dsTabBarItem href="#profile" icon="user" label="Profile"></a>
      </nav>
    </div>
  `,
})
class Placed {
  readonly placement = signal<TabBarPlacement | undefined>(undefined);
  readonly dir = signal<'ltr' | 'rtl' | null>(null);
  own = (_event: KeyboardEvent) => {};
}

async function mount<T>(type: Type<T>): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('TabBar', () => {
  it('renders a named nav with link items and the default size', async () => {
    const f = await mount(Example);
    const nav = bar(f.nativeElement);
    expect(nav.tagName).toBe('NAV');
    expect(nav.getAttribute('aria-label')).toBe('Main');
    expect(nav.getAttribute('data-ds')).toBe('tab-bar');
    expect(nav.getAttribute('data-size')).toBe('md');
    const links = Array.from(nav.querySelectorAll('a'));
    expect(links).toHaveLength(4);
    for (const l of links) expect(l.getAttribute('data-part')).toBe('item');
    expect(parts(links[0]!)).toEqual(['item-icon', 'item-label']);
    expect(nav.querySelector('[data-part="item-icon"] [data-ds="icon"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves no marker or input attribute on the hosts', async () => {
    const f = await mount(Example);
    const nav = bar(f.nativeElement);
    expect(nav.getAttributeNames().sort()).toEqual(['aria-label', 'data-ds', 'data-size']);
    const home = link(f.nativeElement, 'Home');
    expect(home.getAttributeNames().sort()).toEqual(['aria-current', 'data-active', 'data-part', 'href']);
  });

  it('marks the current item with aria-current and data-active', async () => {
    const f = await mount(Example);
    const home = link(f.nativeElement, 'Home');
    expect(home.getAttribute('aria-current')).toBe('page');
    expect(home.getAttribute('data-active')).toBe('');
    const inbox = link(f.nativeElement, 'Inbox, 3 new');
    expect(inbox.hasAttribute('aria-current')).toBe(false);
    expect(inbox.hasAttribute('data-active')).toBe(false);
  });

  it('adds the badge to the link name; a dot says New; past 99 shows 99+', async () => {
    const f = await mount(Example);
    f.componentInstance.size.set('lg');
    await f.whenStable();
    expect(link(f.nativeElement, 'Alerts, New')).toBeTruthy();
    expect(link(f.nativeElement, 'Profile, 99+ new')).toBeTruthy();
    const badges = f.nativeElement.querySelectorAll('[data-part="item-badge"]');
    expect(badges[0]?.textContent).toBe('3');
    expect(badges[0]?.getAttribute('dir')).toBe('ltr');
    expect(badges[0]?.hasAttribute('data-dot')).toBe(false);
    expect(badges[1]?.getAttribute('data-dot')).toBe('');
    expect(badges[1]?.getAttribute('aria-hidden')).toBe('true');
    expect(badges[2]?.textContent).toBe('99+');
    expect(bar(f.nativeElement).getAttribute('data-size')).toBe('lg');
    expect(parts(link(f.nativeElement, 'Inbox, 3 new'))).toEqual(['item-icon', 'item-label', 'item-status']);
  });

  it('shows nothing for a badge of 0 or false', async () => {
    @Component({
      imports: [DsTabBar, DsTabBarItem],
      template: `
        <nav dsTabBar aria-label="Main">
          <a dsTabBarItem href="#a" icon="inbox" label="Inbox" [badge]="0"></a>
          <a dsTabBarItem href="#b" icon="bell" label="Alerts" [badge]="false"></a>
        </nav>
      `,
    })
    class Host {}
    const f = await mount(Host);
    expect(f.nativeElement.querySelector('[data-part="item-badge"]')).toBeNull();
    expect(f.nativeElement.querySelector('[data-part="item-status"]')).toBeNull();
    expect(link(f.nativeElement, 'Inbox')).toBeTruthy();
  });

  it('sizes the icon with the bar', async () => {
    const f = await mount(Example);
    const icon = () => f.nativeElement.querySelector('[data-part="item-icon"] [data-ds="icon"]')?.getAttribute('data-size');
    expect(icon()).toBe('md');
    f.componentInstance.size.set('lg');
    await f.whenStable();
    expect(icon()).toBe('lg');
  });

  it('speaks the badge in Arabic', async () => {
    @Component({
      imports: [DsTabBar, DsTabBarItem, DsTheme],
      template: `
        <div dsTheme lang="ar">
          <nav dsTabBar aria-label="التنقل"><a dsTabBarItem href="#in" icon="inbox" label="الوارد" [badge]="2"></a></nav>
        </div>
      `,
    })
    class Host {}
    const f = await mount(Host);
    expect(link(f.nativeElement, 'الوارد، 2 جديد')).toBeTruthy();
  });

  it('sets data-pressed from pointerdown to the release, with the press point, and never while aria-disabled', async () => {
    @Component({
      imports: [DsTabBar, DsTabBarItem],
      template: `
        <nav dsTabBar aria-label="Main">
          <a dsTabBarItem href="#a" icon="home" label="Home"></a>
          <a dsTabBarItem href="#b" icon="inbox" label="Inbox" aria-disabled="true"></a>
        </nav>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const home = link(f.nativeElement, 'Home');
    home.getBoundingClientRect = () => DOMRect.fromRect({ x: 10, y: 20, width: 80, height: 48 });
    home.dispatchEvent(new PointerEvent('pointerdown', { button: 0, isPrimary: true, clientX: 30, clientY: 30, bubbles: true }));
    expect(home.hasAttribute('data-pressed')).toBe(true);
    expect(home.style.getPropertyValue('--_tab-bar-press-x')).toBe('20px');
    expect(home.style.getPropertyValue('--_tab-bar-press-y')).toBe('10px');
    home.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    expect(home.hasAttribute('data-pressed')).toBe(false);
    home.dispatchEvent(new PointerEvent('pointerdown', { button: 2, isPrimary: true, bubbles: true }));
    expect(home.hasAttribute('data-pressed')).toBe(false);
    const inbox = link(f.nativeElement, 'Inbox');
    inbox.dispatchEvent(new PointerEvent('pointerdown', { button: 0, isPrimary: true, bubbles: true }));
    expect(inbox.hasAttribute('data-pressed')).toBe(false);
  });

  it('renders the demo with every case', async () => {
    const f = await mount(TabBarDemo);
    const ids = Array.from(f.nativeElement.querySelectorAll('[data-demo-case]')).map((c) => (c as Element).getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'many', 'too-many', 'long-text', 'long-arabic']);
    expect(f.nativeElement.querySelectorAll('[data-ds="tab-bar"]').length).toBeGreaterThan(20);
  });
});

describe('TabBar placement', () => {
  it('stamps no data-placement for auto, the default', async () => {
    const f = await mount(Placed);
    expect(bar(f.nativeElement).hasAttribute('data-placement')).toBe(false);
    f.componentInstance.placement.set('auto');
    await f.whenStable();
    expect(bar(f.nativeElement).hasAttribute('data-placement')).toBe(false);
  });

  it.each(['bottom', 'side'] as const)('stamps data-placement="%s"', async (placement) => {
    const f = await mount(Placed);
    f.componentInstance.placement.set(placement);
    await f.whenStable();
    expect(bar(f.nativeElement).getAttribute('data-placement')).toBe(placement);
  });

  it.each(['bottom', 'side'] as const)('takes "%s" from the nearest PageShell, and its own value wins, auto included', async (inherited) => {
    TestBed.configureTestingModule({ providers: [{ provide: DS_BAR_PLACEMENT, useValue: signal<BarPlacement>(inherited) }] });
    const f = await mount(Placed);
    expect(bar(f.nativeElement).getAttribute('data-placement')).toBe(inherited);
    f.componentInstance.placement.set('auto');
    await f.whenStable();
    expect(bar(f.nativeElement).hasAttribute('data-placement')).toBe(false);
    f.componentInstance.placement.set(inherited === 'side' ? 'bottom' : 'side');
    await f.whenStable();
    expect(bar(f.nativeElement).getAttribute('data-placement')).toBe(inherited === 'side' ? 'bottom' : 'side');
  });

  it('keeps the same links, names and DOM order in every placement', async () => {
    const f = await mount(Placed);
    for (const placement of ['auto', 'bottom', 'side'] as const) {
      f.componentInstance.placement.set(placement);
      await f.whenStable();
      const nav = bar(f.nativeElement);
      expect(Array.from(nav.querySelectorAll('a')).map((a) => a.textContent?.trim())).toEqual(['Home', 'Inbox', 'Alerts', 'Profile']);
      expect(nav.querySelectorAll('[data-part="item-label"]')).toHaveLength(4);
      expect(nav.hasAttribute('aria-orientation')).toBe(false);
      for (const a of Array.from(nav.querySelectorAll('a'))) expect(a.hasAttribute('tabindex')).toBe(false);
    }
  });
});

describe('TabBar keys', () => {
  async function placed(placement: TabBarPlacement | undefined, dir: 'ltr' | 'rtl' | null = null) {
    const f = await mount(Placed);
    f.componentInstance.placement.set(placement);
    f.componentInstance.dir.set(dir);
    await f.whenStable();
    return f;
  }

  it('side: ArrowDown and ArrowUp move along the column and wrap; Left and Right do nothing', async () => {
    const f = await placed('side');
    const root = f.nativeElement as HTMLElement;
    link(root, 'Home').focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(link(root, 'Inbox'));
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Inbox'));
    press('ArrowUp');
    press('ArrowUp');
    expect(document.activeElement).toBe(link(root, 'Profile'));
  });

  it('bottom: ArrowRight and ArrowLeft move along the row; Up and Down do nothing', async () => {
    const f = await placed('bottom');
    const root = f.nativeElement as HTMLElement;
    link(root, 'Home').focus();
    press('ArrowRight');
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Alerts'));
    const down = press('ArrowDown');
    expect(down.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(link(root, 'Alerts'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(link(root, 'Inbox'));
  });

  it('bottom in right to left: ArrowLeft moves to the next item; side does not flip', async () => {
    const f = await placed('bottom', 'rtl');
    const root = f.nativeElement as HTMLElement;
    link(root, 'Home').focus();
    press('ArrowLeft');
    expect(document.activeElement).toBe(link(root, 'Inbox'));
    press('ArrowRight');
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Profile'));
    f.componentInstance.placement.set('side');
    await f.whenStable();
    link(root, 'Home').focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(link(root, 'Inbox'));
  });

  it('Home and End go to the first and last item', async () => {
    const f = await placed('side');
    const root = f.nativeElement as HTMLElement;
    link(root, 'Inbox').focus();
    press('End');
    expect(document.activeElement).toBe(link(root, 'Profile'));
    press('Home');
    expect(document.activeElement).toBe(link(root, 'Home'));
  });

  it('auto follows the layout at the key press: a row, or a column when the items stand one under the other', async () => {
    const f = await placed(undefined);
    const root = f.nativeElement as HTMLElement;
    link(root, 'Home').focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Inbox'));
    // An own property on each item, so nothing leaks to the prototype or another test.
    Array.from(bar(root).querySelectorAll<HTMLElement>('[data-part="item"]')).forEach((item, i) => {
      item.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: i * 48, width: 48, height: 48 });
    });
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Inbox'));
    press('ArrowDown');
    expect(document.activeElement).toBe(link(root, 'Alerts'));
  });

  it('leaves modified keys and a handled event alone', async () => {
    const f = await placed('bottom');
    const root = f.nativeElement as HTMLElement;
    // The caller's own keydown runs first on the host and may handle the key.
    f.componentInstance.own = (event) => {
      if (event.key === 'End') event.preventDefault();
    };
    link(root, 'Home').focus();
    press('End');
    expect(document.activeElement).toBe(link(root, 'Home'));
    press('ArrowRight', { shiftKey: true });
    expect(document.activeElement).toBe(link(root, 'Home'));
  });
});

@Component({
  imports: [DsTabBar, DsTabBarItem, DsTabBarSearch, DsButton],
  template: `
    <nav dsTabBar aria-label="Main" size="lg" [compact]="compact()" [accessory]="accessory() ? player : undefined">
      <a dsTabBarItem href="#home" icon="home" label="Home"></a>
      <a dsTabBarItem href="#radio" icon="radio" label="Radio"></a>
      <a dsTabBarItem href="#library" icon="library" label="Library" active></a>
      @if (search()) {
        <ng-container dsTabBarSearch href="#search" label="Search" />
      }
    </nav>
    <ng-template #player>
      <div role="group" aria-label="Now playing"><button dsButton>Rain on the dunes</button></div>
    </ng-template>
  `,
})
class Accessory {
  readonly compact = signal(false);
  readonly accessory = signal(true);
  readonly search = signal(true);
}

describe('TabBar accessory and compact (order C2)', () => {
  it('draws no accessory part without the input, and stamps no data-compact by default', async () => {
    const f = await mount(Accessory);
    f.componentInstance.accessory.set(false);
    await f.whenStable();
    expect(bar(f.nativeElement).querySelector('[data-part="accessory"]')).toBeNull();
    expect(bar(f.nativeElement).hasAttribute('data-compact')).toBe(false);
  });

  it('puts the accessory first, before the items, with its content named on its own', async () => {
    const f = await mount(Accessory);
    const nav = bar(f.nativeElement);
    expect(parts(nav)).toEqual(['accessory', 'item', 'item', 'item', 'search']);
    const accessory = nav.querySelector('[data-part="accessory"]')!;
    expect(accessory.getAttribute('role')).toBeNull();
    expect(accessory.firstElementChild?.getAttribute('aria-label')).toBe('Now playing');
  });

  it("the bar's arrow keys skip the accessory, and leave keys pressed in it alone", async () => {
    const f = await mount(Accessory);
    const root = f.nativeElement as HTMLElement;
    link(root, 'Search').focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Home'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(link(root, 'Search'));
    const song = root.querySelector<HTMLElement>('[data-part="accessory"] button')!;
    song.focus();
    expect(press('ArrowRight').defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(song);
  });

  it('compact stamps data-compact and moves the accessory to just before the search item, or last', async () => {
    const f = await mount(Accessory);
    f.componentInstance.compact.set(true);
    await f.whenStable();
    expect(bar(f.nativeElement).getAttribute('data-compact')).toBe('');
    expect(parts(bar(f.nativeElement))).toEqual(['item', 'item', 'item', 'accessory', 'search']);
    f.componentInstance.search.set(false);
    await f.whenStable();
    expect(parts(bar(f.nativeElement))).toEqual(['item', 'item', 'item', 'accessory']);
  });

  it('in the compact bar the arrow keys move among the current item and the search item only', async () => {
    const f = await mount(Accessory);
    f.componentInstance.compact.set(true);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    link(root, 'Library').focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Search'));
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Library'));
    press('Home');
    expect(document.activeElement).toBe(link(root, 'Library'));
  });

  it('keeps the accessory first in every placement', async () => {
    for (const placement of ['bottom', 'side'] as const) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: DS_BAR_PLACEMENT, useValue: signal<BarPlacement>(placement) }] });
      const f = await mount(Accessory);
      expect(parts(bar(f.nativeElement))[0]).toBe('accessory');
      expect(bar(f.nativeElement).getAttribute('data-placement')).toBe(placement);
    }
  });
});

@Component({
  imports: [DsTabBar, DsTabBarItem, DsTabBarSearch, DsSearchField],
  template: `
    <nav dsTabBar aria-label="Main" size="lg" [placement]="placement()">
      <a dsTabBarItem href="#home" icon="home" label="Home" [active]="!active()"></a>
      <a dsTabBarItem href="#new" icon="inbox" label="New"></a>
      <a dsTabBarItem href="#library" icon="folder" label="Library"></a>
      <ng-container
        dsTabBarSearch
        label="Search"
        [href]="href()"
        [active]="active()"
        [field]="field() === 'none' ? undefined : field() === 'named' ? named : plain"
        (select)="selected($event)"
      />
    </nav>
    <ng-template #plain><div dsSearchField placeholder="Songs and artists"></div></ng-template>
    <ng-template #named let-label><div dsSearchField [aria-label]="label + ' the library'"></div></ng-template>
  `,
})
class Search {
  readonly active = signal(false);
  readonly field = signal<'none' | 'plain' | 'named'>('none');
  readonly placement = signal<TabBarPlacement | undefined>(undefined);
  readonly href = signal<string | undefined>('#search');
  selected = vi.fn((_event: MouseEvent) => {});
}

describe('TabBarSearch', () => {
  const searchbox = (root: HTMLElement) => root.querySelector<HTMLInputElement>('input[type="search"]');

  it('is a link with the search part, the icon and the label, last in the bar', async () => {
    const f = await mount(Search);
    const search = link(f.nativeElement, 'Search');
    expect(search.getAttribute('data-part')).toBe('search');
    expect(search.getAttribute('href')).toBe('#search');
    expect(parts(search)).toEqual(['item-icon', 'item-label']);
    expect(search.querySelector('[data-ds="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(search.querySelector('[data-ds="icon"]')?.getAttribute('data-size')).toBe('lg');
    expect(search.hasAttribute('aria-current')).toBe(false);
    expect(search.hasAttribute('data-expanded')).toBe(false);
    expect(search.hasAttribute('role')).toBe(false);
    expect(search.hasAttribute('tabindex')).toBe(false);
    expect(parts(bar(f.nativeElement))).toEqual(['item', 'item', 'item', 'search']);
  });

  it('marks the current page with aria-current and data-active', async () => {
    const f = await mount(Search);
    f.componentInstance.active.set(true);
    await f.whenStable();
    const search = link(f.nativeElement, 'Search');
    expect(search.getAttribute('aria-current')).toBe('page');
    expect(search.getAttribute('data-active')).toBe('');
  });

  it('turns into its field while active, named by the label, and stamps data-expanded', async () => {
    const f = await mount(Search);
    f.componentInstance.field.set('plain');
    f.componentInstance.active.set(true);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('a[data-part="search"]')).toBeNull();
    const box = root.querySelector('[data-ds="tab-bar"] > [data-part="search"]')!;
    expect(box.tagName).toBe('DIV');
    expect(box.getAttribute('data-expanded')).toBe('');
    expect(box.getAttribute('data-active')).toBe('');
    expect(box.querySelector('[data-ds="search-field"]')).toBeTruthy();
    expect(searchbox(root)?.getAttribute('aria-label')).toBe('Search');
  });

  it('keeps the field own aria-label when it has one', async () => {
    const f = await mount(Search);
    f.componentInstance.field.set('named');
    f.componentInstance.active.set(true);
    await f.whenStable();
    expect(searchbox(f.nativeElement)?.getAttribute('aria-label')).toBe('Search the library');
  });

  it('stays a link when not active, even with a field', async () => {
    const f = await mount(Search);
    f.componentInstance.field.set('plain');
    await f.whenStable();
    expect(link(f.nativeElement, 'Search')).toBeTruthy();
    expect(searchbox(f.nativeElement)).toBeNull();
  });

  it('moves focus into the field when the pressed item expands, and back when it collapses', async () => {
    const f = await mount(Search);
    f.componentInstance.field.set('plain');
    f.componentInstance.href.set(undefined);
    f.componentInstance.selected = vi.fn(() => f.componentInstance.active.set(true));
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    link(root, 'Search').focus();
    press('Enter');
    await f.whenStable();
    expect(document.activeElement).toBe(searchbox(root));
    f.componentInstance.active.set(false);
    await f.whenStable();
    expect(document.activeElement).toBe(link(root, 'Search'));
  });

  it('leaves focus alone when the item was neither focused nor pressed', async () => {
    const f = await mount(Search);
    f.componentInstance.field.set('plain');
    await f.whenStable();
    const home = link(f.nativeElement, 'Home');
    home.focus();
    f.componentInstance.active.set(true);
    await f.whenStable();
    expect(document.activeElement).toBe(home);
  });

  it('without href it is a focusable link that emits select on a press and on Enter', async () => {
    const f = await mount(Search);
    f.componentInstance.href.set(undefined);
    await f.whenStable();
    const search = link(f.nativeElement, 'Search');
    expect(search.hasAttribute('href')).toBe(false);
    expect(search.getAttribute('role')).toBe('link');
    expect(search.getAttribute('tabindex')).toBe('0');
    search.click();
    search.focus();
    press('Enter');
    expect(f.componentInstance.selected).toHaveBeenCalledTimes(2);
    expect(f.componentInstance.selected.mock.calls[0]?.[0].defaultPrevented).toBe(true);
  });

  it('emits select before a link with href is followed, and lets it cancel', async () => {
    const f = await mount(Search);
    f.componentInstance.selected = vi.fn((event: MouseEvent) => event.preventDefault());
    await f.whenStable();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link(f.nativeElement, 'Search').dispatchEvent(click);
    expect(f.componentInstance.selected).toHaveBeenCalledTimes(1);
    expect(click.defaultPrevented).toBe(true);
  });

  it('is part of the arrow key path of the bar, in a row and in a column, and is left out while a field', async () => {
    const f = await mount(Search);
    const root = f.nativeElement as HTMLElement;
    f.componentInstance.placement.set('bottom');
    await f.whenStable();
    link(root, 'Library').focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Search'));
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Home'));
    press('End');
    expect(document.activeElement).toBe(link(root, 'Search'));
    f.componentInstance.placement.set('side');
    await f.whenStable();
    press('ArrowUp');
    expect(document.activeElement).toBe(link(root, 'Library'));
    f.componentInstance.placement.set('bottom');
    f.componentInstance.field.set('plain');
    f.componentInstance.active.set(true);
    await f.whenStable();
    link(root, 'Library').focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(link(root, 'Home'));
  });

  it('does not take the arrow keys of its field', async () => {
    const f = await mount(Search);
    f.componentInstance.field.set('plain');
    f.componentInstance.active.set(true);
    f.componentInstance.placement.set('bottom');
    await f.whenStable();
    const field = searchbox(f.nativeElement)!;
    field.focus();
    expect(press('ArrowLeft').defaultPrevented).toBe(false);
    expect(press('Home').defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(field);
  });

  it('flips the arrows in right to left and keeps its place last in the DOM', async () => {
    @Component({
      imports: [DsTabBar, DsTabBarItem, DsTabBarSearch, DsTheme],
      template: `
        <div dsTheme dir="rtl" lang="ar">
          <nav dsTabBar aria-label="التنقل الرئيسي" placement="bottom">
            <a dsTabBarItem href="#home" icon="home" label="الرئيسية"></a>
            <a dsTabBarItem href="#new" icon="inbox" label="الجديد"></a>
            <ng-container dsTabBarSearch href="#search" label="بحث" />
          </nav>
        </div>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const root = f.nativeElement as HTMLElement;
    expect(parts(bar(root))).toEqual(['item', 'item', 'search']);
    link(root, 'الجديد').focus();
    press('ArrowLeft');
    expect(document.activeElement).toBe(link(root, 'بحث'));
  });
});
