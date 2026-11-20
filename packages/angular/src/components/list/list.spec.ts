// List: the Angular twin of the React tests in
// packages/react/src/components/List/ (List, rows, pressed and motion
// tests). WCAG 2.2 covered here: 1.3.1 Info and relationships (list roles,
// the section heading names its nested list and the footer describes it),
// 2.1.1 Keyboard and 4.1.2 Name, role, value (a linked row is one link, an
// action row a focusable button that answers Enter and Space, a disabled
// row stays focusable with aria-disabled), 2.4.3 Focus order (the row link,
// then its actions and footer buttons).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import ListDemo from './list.demo';
import { DsList, DsListItem, DsListSection, type ListLinkProps, type ListTitleLines, type ListVariant } from './list';

const list = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-ds="list"]')!;
const rows = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-part="item"]'));
const parts = (el: Element) => Array.from(el.children).map((c) => c.getAttribute('data-part'));

async function mount<T>(type: Type<T>): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

function key(el: Element, type: 'keydown' | 'keyup', k: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
}

// The stand in goes on the HTML, SVG and Element prototypes, so an own
// property another spec file left on one does not shadow it, and is taken
// off after each test, so it never leaks.
const PROTOS = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {}, addEventListener() {} }) as unknown as Animation);
  for (const proto of PROTOS) Object.defineProperty(proto, 'animate', { configurable: true, writable: true, value: animate });
});
afterEach(() => {
  for (const proto of PROTOS) Reflect.deleteProperty(proto, 'animate');
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('List', () => {
  it('renders a ul with rows and the defaults', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `
        <ul dsList aria-label="Inbox">
          <li dsListItem title="One"></li>
          <li dsListItem title="Two" description="Second line" start="mail" end="09:24"></li>
        </ul>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const el = list(f.nativeElement);
    expect(el.tagName).toBe('UL');
    expect(el.getAttribute('role')).toBe('list');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-variant')).toBe('plain');
    expect(el.getAttribute('aria-label')).toBe('Inbox');
    expect(el.getAttributeNames().sort()).toEqual(['aria-label', 'data-ds', 'data-size', 'data-variant', 'role']);
    const items = el.querySelectorAll(':scope > [data-part="item"]');
    expect(items).toHaveLength(2);
    expect(items[0]!.tagName).toBe('LI');
    // No marker or input attribute is left; the first paint stagger may write an inline style.
    expect(items[0]!.getAttributeNames().filter((n) => n !== 'style')).toEqual(['data-part']);
    const second = items[1]!;
    expect(parts(second)).toEqual(['separator', null, 'start', 'title', 'description', 'end']);
    expect(second.querySelector('[data-part="title"]')?.textContent).toBe('Two');
    expect(second.querySelector('[data-part="description"]')?.textContent).toBe('Second line');
    expect(second.querySelector('[data-part="end"]')?.textContent).toBe('09:24');
    expect(second.querySelector('[data-part="start"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(second.querySelector('[data-part="start"] [data-ds="icon"]')?.getAttribute('data-size')).toBe('md');
    expect(second.querySelector('[data-part="separator"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders an ol, and takes size and variant', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `<ol dsList size="sm" variant="inset"><li dsListItem title="Step"></li></ol>`,
    })
    class Host {}
    const f = await mount(Host);
    expect(list(f.nativeElement).tagName).toBe('OL');
    expect(list(f.nativeElement).getAttribute('role')).toBe('list');
    expect(list(f.nativeElement).getAttribute('data-size')).toBe('sm');
    expect(list(f.nativeElement).getAttribute('data-variant')).toBe('inset');
  });

  it('the div form draws the empty message; a labelled one is a group, an unlabelled one has no role', async () => {
    @Component({
      imports: [DsList],
      template: `
        <div data-t="a" dsList empty="No mail yet"></div>
        <div data-t="b" dsList aria-label="Inbox" empty="No mail yet"></div>
        <div data-t="c" dsList></div>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const q = (t: string) => f.nativeElement.querySelector(`[data-t="${t}"]`) as HTMLElement;
    expect(q('a').getAttribute('data-ds')).toBe('list');
    expect(q('a').querySelector('[data-part="empty"]')?.tagName).toBe('P');
    expect(q('a').querySelector('[data-part="empty"]')?.textContent).toBe('No mail yet');
    expect(q('a').hasAttribute('role')).toBe(false);
    expect(q('b').getAttribute('role')).toBe('group');
    expect(q('c').querySelector('[data-part="empty"]')).toBeNull();
    expect(q('c').hasAttribute('role')).toBe(false);
  });

  it('makes the title a link with href, with aria-current when active, and takes link props', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `
        <ul dsList>
          <li dsListItem title="Inbox" href="#inbox" active></li>
          <li dsListItem title="Home" href="/" active [linkProps]="props"></li>
        </ul>
      `,
    })
    class Host {
      readonly props: ListLinkProps = { 'aria-current': 'page', target: '_self' };
    }
    const f = await mount(Host);
    const [inbox, home] = Array.from(f.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(inbox!.getAttribute('href')).toBe('#inbox');
    expect(inbox!.getAttribute('data-part')).toBe('title');
    expect(inbox!.getAttribute('aria-current')).toBe('true');
    const item = inbox!.closest('[data-part="item"]')!;
    expect(item.getAttribute('data-active')).toBe('');
    expect(item.getAttribute('data-linked')).toBe('');
    expect(item.hasAttribute('aria-current')).toBe(false);
    expect(home!.getAttribute('aria-current')).toBe('page');
    expect(home!.getAttribute('target')).toBe('_self');
  });

  it('drops the href of a disabled link, keeps it focusable and blocks the click', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `<ul dsList><li dsListItem title="Finance" href="#finance" disabled></li></ul>`,
    })
    class Host {}
    const f = await mount(Host);
    const link = f.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('role')).toBe('link');
    expect(link.getAttribute('tabindex')).toBe('0');
    expect(f.nativeElement.querySelector('[data-part="item"]')?.getAttribute('data-disabled')).toBe('');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it('says which row is current when the row has no link', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `<ul dsList><li dsListItem title="Now" active></li></ul>`,
    })
    class Host {}
    const f = await mount(Host);
    expect(f.nativeElement.querySelector('[data-part="item"]')?.getAttribute('aria-current')).toBe('true');
  });

  it('puts the row link before its actions in the DOM, each its own Tab stop', async () => {
    @Component({
      imports: [DsList, DsListItem, DsIconButton],
      template: `
        <ul dsList>
          <li dsListItem title="Mail" href="#m" [actions]="del"></li>
          <li dsListItem title="Plain row"></li>
        </ul>
        <ng-template #del><button dsIconButton icon="trash" label="Delete mail"></button></ng-template>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const row = rows(f.nativeElement)[0]!;
    expect(parts(row)).toEqual(['separator', null, 'title', 'actions']);
    const stops = Array.from(f.nativeElement.querySelectorAll('a[href], button')) as HTMLElement[];
    expect(stops.map((s) => s.textContent?.trim() || s.getAttribute('aria-label'))).toEqual(['Mail', 'Delete mail']);
  });

  it('renders sections as presentation items holding a heading, a nested list named by it, and a footer', async () => {
    @Component({
      imports: [DsList, DsListItem, DsListSection],
      template: `
        <ul dsList aria-label="Settings" variant="inset" size="sm">
          <li dsListSection id="net" header="Network" footer="Large files wait for Wi-Fi.">
            <ng-container>
              <li dsListItem title="Mobile data"></li>
              <li dsListItem title="Wi-Fi"></li>
            </ng-container>
          </li>
          <li dsListSection header="Privacy" level="2">
            <ng-container>
              <li dsListItem title="Passcode"></li>
            </ng-container>
          </li>
        </ul>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const outer = list(f.nativeElement);
    expect(outer.tagName).toBe('UL');
    expect(outer.getAttribute('role')).toBe('group');
    expect(outer.getAttribute('aria-label')).toBe('Settings');
    expect(outer.hasAttribute('data-variant')).toBe(false);
    const sections = outer.querySelectorAll(':scope > [data-part="section"]');
    expect(sections).toHaveLength(2);
    const first = sections[0]!;
    expect(first.tagName).toBe('LI');
    expect(first.getAttribute('role')).toBe('presentation');
    expect(first.id).toBe('net');
    expect(first.getAttributeNames().sort()).toEqual(['data-part', 'id', 'role']);
    expect(parts(first)).toEqual(['section-header', null, 'section-footer']);
    const heading = first.querySelector('h3')!;
    expect(heading.getAttribute('data-part')).toBe('section-header');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent).toBe('Network');
    const nested = first.querySelector(':scope > [data-ds="list"]')!;
    expect(nested.tagName).toBe('UL');
    expect(nested.getAttribute('role')).toBe('list');
    expect(nested.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(nested.getAttribute('data-variant')).toBe('inset');
    expect(nested.getAttribute('data-size')).toBe('sm');
    expect(nested.querySelectorAll(':scope > [data-part="item"]')).toHaveLength(2);
    const footer = first.querySelector('[data-part="section-footer"]')!;
    expect(footer.tagName).toBe('P');
    expect(nested.getAttribute('aria-describedby')).toBe(footer.id);
    expect(sections[1]!.querySelector('h2')?.textContent).toBe('Privacy');
    expect(sections[1]!.querySelector('[data-part="section-footer"]')).toBeNull();
    expect(sections[1]!.querySelector('[data-ds="list"]')?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('gives an unnamed list of sections role none, an ordered one an ol, and an empty section its message', async () => {
    @Component({
      imports: [DsList, DsListItem, DsListSection],
      template: `
        <ol dsList>
          <li dsListSection header="Steps"><ng-container><li dsListItem title="One"></li></ng-container></li>
          <li dsListSection empty="No steps yet"></li>
        </ol>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const outer = list(f.nativeElement);
    expect(outer.tagName).toBe('OL');
    expect(outer.getAttribute('role')).toBe('none');
    expect(outer.querySelector('[data-part="section"] ol[data-ds="list"]')).not.toBeNull();
    const empty = outer.querySelectorAll('[data-part="section"]')[1]!;
    const box = empty.querySelector('[data-ds="list"]')!;
    expect(box.tagName).toBe('DIV');
    expect(box.hasAttribute('role')).toBe(false);
    expect(box.querySelector('[data-part="empty"]')?.textContent).toBe('No steps yet');
    expect(outer.querySelectorAll('[data-part="section-header"]')).toHaveLength(1);
  });

  it('renders the demo cases in order', async () => {
    const f = await mount(ListDemo);
    const ids = Array.from(f.nativeElement.querySelectorAll('[data-demo-case]')).map((s) => (s as Element).getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });
});

describe('List order C1 and S1: rows', () => {
  it('takes titleLines from the List, from a sectioned List, and from the row, which wins', async () => {
    @Component({
      imports: [DsList, DsListItem, DsListSection],
      template: `
        <ul dsList titleLines="3">
          <li dsListItem title="Three"></li>
          <li dsListItem title="Override" titleLines="1"></li>
          <li dsListItem title="Two" [titleLines]="2"></li>
          <li dsListItem title="Never cut" titleLines="all"></li>
        </ul>
        <ul dsList [titleLines]="two">
          <li dsListSection header="Sessions"><ng-container><li dsListItem title="In a section"></li></ng-container></li>
        </ul>
        <ul dsList><li dsListItem title="One line"></li></ul>
      `,
    })
    class Host {
      readonly two: ListTitleLines = 2;
    }
    const f = await mount(Host);
    expect(rows(f.nativeElement).map((r) => r.getAttribute('data-title-lines'))).toEqual(['3', null, '2', 'all', '2', null]);
  });

  it('stamps data-variant flush on the list and on the nested list of a section', async () => {
    @Component({
      imports: [DsList, DsListItem, DsListSection],
      template: `<ul dsList [variant]="variant" aria-label="Songs"><li dsListSection header="A"><ng-container><li dsListItem title="Amber gate"></li></ng-container></li></ul>`,
    })
    class Host {
      readonly variant: ListVariant = 'flush';
    }
    const f = await mount(Host);
    expect(f.nativeElement.querySelector('[data-part="section"] > [data-ds="list"]')?.getAttribute('data-variant')).toBe('flush');
  });

  @Component({
    imports: [DsList, DsListItem, DsIconButton],
    template: `
      <ul dsList>
        <li dsListItem title="Amber gate" description="Maha Saleh" [onSelect]="onSelect" [active]="active()" [disabled]="disabled()" [tone]="tone()" [actions]="more"></li>
      </ul>
      <ng-template #more><button dsIconButton icon="more" label="More for Amber gate"></button></ng-template>
    `,
  })
  class Action {
    onSelect = vi.fn();
    readonly active = signal(false);
    readonly disabled = signal(false);
    readonly tone = signal<'neutral' | 'danger' | undefined>(undefined);
  }

  it('an action row is a focusable button named by its title, with data-action and no link, that answers Enter and Space', async () => {
    const f = await mount(Action);
    const button = f.nativeElement.querySelector('[data-part="title"]') as HTMLElement;
    expect(button.tagName).toBe('SPAN');
    expect(button.getAttribute('role')).toBe('button');
    expect(button.getAttribute('tabindex')).toBe('0');
    expect(f.nativeElement.querySelector('a')).toBeNull();
    const row = rows(f.nativeElement)[0]!;
    expect(row.hasAttribute('data-action')).toBe(true);
    expect(row.hasAttribute('data-linked')).toBe(false);
    button.click();
    expect(f.componentInstance.onSelect).toHaveBeenCalledTimes(1);
    expect(key(button, 'keydown', 'Enter').defaultPrevented).toBe(true);
    expect(f.componentInstance.onSelect).toHaveBeenCalledTimes(2);
    key(button, 'keydown', 'Enter', { repeat: true });
    expect(f.componentInstance.onSelect).toHaveBeenCalledTimes(2);
    // Space runs at key up, as a native button; key down only stops the page scroll.
    expect(key(button, 'keydown', ' ').defaultPrevented).toBe(true);
    expect(f.componentInstance.onSelect).toHaveBeenCalledTimes(2);
    key(button, 'keyup', ' ');
    expect(f.componentInstance.onSelect).toHaveBeenCalledTimes(3);
  });

  it('a key on an action inside the row does not run the row', async () => {
    const f = await mount(Action);
    key(f.nativeElement.querySelector('[data-part="actions"] button'), 'keydown', 'Enter');
    expect(f.componentInstance.onSelect).not.toHaveBeenCalled();
  });

  it('disabled: stays focusable with aria-disabled and never runs', async () => {
    const f = await mount(Action);
    f.componentInstance.disabled.set(true);
    await f.whenStable();
    const button = f.nativeElement.querySelector('[data-part="title"]') as HTMLElement;
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('tabindex')).toBe('0');
    button.click();
    key(button, 'keydown', 'Enter');
    key(button, 'keyup', ' ');
    expect(f.componentInstance.onSelect).not.toHaveBeenCalled();
    const row = rows(f.nativeElement)[0]!;
    row.dispatchEvent(new PointerEvent('pointerdown', { button: 0, isPrimary: true, bubbles: true }));
    expect(row.hasAttribute('data-pressed')).toBe(false);
  });

  it('active sets aria-current on the button, and the press flag shows from pointer down with the press point', async () => {
    const f = await mount(Action);
    f.componentInstance.active.set(true);
    await f.whenStable();
    const button = f.nativeElement.querySelector('[data-part="title"]') as HTMLElement;
    expect(button.getAttribute('aria-current')).toBe('true');
    const row = rows(f.nativeElement)[0]!;
    expect(row.hasAttribute('aria-current')).toBe(false);
    row.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 100, width: 300, height: 60 });
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, isPrimary: true, clientX: 40, clientY: 130, bubbles: true }));
    expect(row.hasAttribute('data-pressed')).toBe(true);
    expect(row.style.getPropertyValue('--_list-press-x')).toBe('40px');
    expect(row.style.getPropertyValue('--_list-press-y')).toBe('30px');
    row.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    expect(row.hasAttribute('data-pressed')).toBe(false);
  });

  it('a plain row never carries data-pressed', async () => {
    @Component({ imports: [DsList, DsListItem], template: `<ul dsList><li dsListItem title="Plain"></li></ul>` })
    class Host {}
    const f = await mount(Host);
    const row = rows(f.nativeElement)[0]!;
    row.dispatchEvent(new PointerEvent('pointerdown', { button: 0, isPrimary: true, bubbles: true }));
    expect(row.hasAttribute('data-pressed')).toBe(false);
  });

  it('stamps data-tone danger and nothing for neutral or no tone', async () => {
    const f = await mount(Action);
    const row = rows(f.nativeElement)[0]!;
    expect(row.hasAttribute('data-tone')).toBe(false);
    f.componentInstance.tone.set('neutral');
    await f.whenStable();
    expect(row.hasAttribute('data-tone')).toBe(false);
    f.componentInstance.tone.set('danger');
    await f.whenStable();
    expect(row.getAttribute('data-tone')).toBe('danger');
  });

  it('href wins over onSelect, and chevron false marks only a linked row', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `
        <ul dsList>
          <li dsListItem title="Saved article" href="#a" [chevron]="false" [onSelect]="noop"></li>
          <li dsListItem title="Settings" href="#b"></li>
          <li dsListItem title="Play" [onSelect]="noop" [chevron]="false"></li>
        </ul>
      `,
    })
    class Host {
      readonly noop = () => undefined;
    }
    const f = await mount(Host);
    expect(f.nativeElement.querySelectorAll('a')).toHaveLength(2);
    expect(rows(f.nativeElement).map((r) => r.hasAttribute('data-no-chevron'))).toEqual([true, false, false]);
    expect(rows(f.nativeElement)[0]!.hasAttribute('data-action')).toBe(false);
  });

  it('a control row draws the control between the start and end, with no description or link; a title when given', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `
        <ul dsList>
          <li dsListItem start="bell-off" end="!" [control]="ctl" description="Not drawn" href="#ignored" [footer]="ctl"></li>
          <li dsListItem title="Text size" [control]="ctl"></li>
        </ul>
        <ng-template #ctl><input type="range" aria-label="Bell volume" /></ng-template>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const [first, second] = rows(f.nativeElement);
    expect(parts(first!)).toEqual(['separator', null, 'start', 'control', 'end']);
    expect(first!.hasAttribute('data-linked')).toBe(false);
    expect(first!.querySelector('[data-part="control"] input')?.getAttribute('aria-label')).toBe('Bell volume');
    expect(second!.querySelector(':scope > [data-part="title"]')?.textContent).toBe('Text size');
    expect(second!.hasAttribute('data-title-lines')).toBe(false);
  });

  it('draws the row footer after the text, its buttons after the row link', async () => {
    @Component({
      imports: [DsList, DsListItem, DsButton, DsIconButton],
      template: `
        <ul dsList><li dsListItem title="Why mud walls keep houses cool" href="#walls" description="Rawdah Review" [footer]="foot"></li></ul>
        <ng-template #foot>
          <button dsButton size="sm">Listen</button>
          <button dsIconButton size="sm" icon="more" label="More for Why mud walls keep houses cool"></button>
        </ng-template>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const row = rows(f.nativeElement)[0]!;
    expect(parts(row)).toEqual(['separator', null, 'title', 'description', 'footer']);
    expect(row.querySelectorAll(':scope > [data-part="footer"] button')).toHaveLength(2);
  });

  it('takes a TemplateRef for start, title, description and end; a template start is not hidden', async () => {
    @Component({
      imports: [DsList, DsListItem, DsTheme],
      template: `
        <ul dsList><li dsListItem [start]="s" [title]="t" [description]="t" [end]="t"></li></ul>
        <ng-template #s><img alt="Sara" src="data:," /></ng-template>
        <ng-template #t><b>Bold</b></ng-template>
      `,
    })
    class Host {}
    const f = await mount(Host);
    const row = rows(f.nativeElement)[0]!;
    expect(row.querySelector('[data-part="start"]')?.hasAttribute('aria-hidden')).toBe(false);
    expect(row.querySelector('[data-part="start"] img')?.getAttribute('alt')).toBe('Sara');
    expect(row.querySelector('[data-part="title"] b')?.textContent).toBe('Bold');
    expect(row.querySelector('[data-part="end"] b')).toBeTruthy();
  });
});

describe('List motion', () => {
  @Component({
    imports: [DsList, DsListItem, DsTheme],
    template: `
      <div dsTheme="desk">
        @if (rows().length) {
          <ul dsList aria-label="Rows">
            @for (r of rows(); track r) {
              <li dsListItem [title]="r"></li>
            }
          </ul>
        } @else {
          <div dsList empty="No rows yet"></div>
        }
      </div>
    `,
  })
  class Rows {
    readonly rows = signal<string[]>([]);
  }

  const ids = () => animate.mock.calls.map((c) => (c as unknown as [Keyframe[], KeyframeAnimationOptions])[1]?.id);

  it('fades and rises every row in on the first paint, and never again on an added row or a reorder', async () => {
    const f = TestBed.createComponent(Rows);
    document.body.appendChild(f.nativeElement);
    f.componentInstance.rows.set(Array.from({ length: 12 }, (_, i) => `Row ${i + 1}`));
    await f.whenStable();
    expect(ids().filter((id) => id === 'ds-motion:stagger')).toHaveLength(12);
    const [frames] = animate.mock.calls[0] as unknown as [Keyframe[]];
    expect(frames[0]?.opacity).toBe(0);
    expect(String(frames[0]?.transform)).toContain('translateY(');
    expect(rows(f.nativeElement)).toHaveLength(12);
    f.componentInstance.rows.update((r) => [...r, 'Row 13']);
    await f.whenStable();
    f.componentInstance.rows.update((r) => [...r].reverse());
    await f.whenStable();
    expect(ids().filter((id) => id === 'ds-motion:stagger')).toHaveLength(12);
  });

  it('plays nothing for an empty list, and plays when rows arrive', async () => {
    const f = await mount(Rows);
    expect(animate).not.toHaveBeenCalled();
    f.componentInstance.rows.set(['A', 'B']);
    await f.whenStable();
    expect(ids().filter((id) => id === 'ds-motion:stagger')).toHaveLength(2);
  });

  it('plays a fade with no rise under reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    try {
      const f = TestBed.createComponent(Rows);
      document.body.appendChild(f.nativeElement);
      f.componentInstance.rows.set(['A', 'B', 'C']);
      await f.whenStable();
      expect(animate).toHaveBeenCalledTimes(3);
      for (const call of animate.mock.calls) {
        const [frames, timing] = call as unknown as [Keyframe[], KeyframeAnimationOptions];
        expect(frames.every((fr) => !('transform' in fr))).toBe(true);
        expect(timing.delay).toBe(0);
      }
    } finally {
      window.matchMedia = original;
    }
  });
});
