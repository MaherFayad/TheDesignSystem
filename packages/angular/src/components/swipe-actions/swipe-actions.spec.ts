// SwipeActions: the Angular twin of
// packages/react/src/components/SwipeActions/SwipeActions.test.tsx. WCAG 2.2
// covered here: 2.5.7 Dragging movements (the menu of every action is the
// path with no drag, by the menu button or Shift+F10), 2.1.1 Keyboard
// (Escape closes, the menu keys open), 4.1.2 Name, role, value (named
// groups and menu button; action groups inert while closed).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DsList, DsListItem } from '../list/list';
import SwipeActionsDemo from './swipe-actions.demo';
import { DsSwipeActions, type SwipeAction, type SwipeActionsOptions } from './swipe-actions';

// No layout in the test DOM: every action is 60px wide and every other element 360px. The stand
// in is an own property of the prototype, put back after each test, so it never leaks.
let hadRect: PropertyDescriptor | undefined;
let hadCapture: PropertyDescriptor | undefined;
beforeEach(() => {
  hadRect = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getBoundingClientRect');
  hadCapture = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'setPointerCapture');
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: function (this: HTMLElement) {
      const w = this.getAttribute('data-part') === 'action' ? 60 : 360;
      return { x: 0, y: 0, left: 0, top: 0, width: w, height: 52, right: w, bottom: 52, toJSON: () => ({}) } as DOMRect;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, writable: true, value: () => {} });
});
afterEach(() => {
  if (hadRect) Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', hadRect);
  else Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');
  if (hadCapture) Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', hadCapture);
  else Reflect.deleteProperty(HTMLElement.prototype, 'setPointerCapture');
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

async function mount<T>(type: Type<T>): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

@Component({
  imports: [DsList, DsListItem],
  template: `
    <ul dsList aria-label="Inbox">
      <li dsListItem href="#m1" title="Sara Alqahtani" description="Brand review moved to Thursday" [disabled]="disabled()" [swipe]="options()"></li>
    </ul>
    <p>Outside</p>
  `,
})
class Row {
  readonly onSelect = vi.fn();
  readonly disabled = signal(false);
  readonly options = signal<SwipeActionsOptions>(this.make());
  make(extra: Partial<SwipeActionsOptions> = {}): SwipeActionsOptions {
    return {
      start: [{ label: 'Archive', icon: 'inbox', tone: 'accent', undoable: true, onSelect: () => this.onSelect() }],
      end: [
        { label: 'Delete', icon: 'trash', tone: 'danger', onSelect: () => this.onSelect() },
        { label: 'Mute', icon: 'bell-off', onSelect: () => this.onSelect() },
      ],
      menuLabel: 'Actions for Sara Alqahtani',
      ...extra,
    };
  }
}

const row = () => document.querySelector<HTMLElement>("[data-part='item']")!;
const swipeRoot = () => document.querySelector<HTMLElement>("[data-ds='swipe-actions']")!;
const group = (side: 'start' | 'end') => document.querySelector<HTMLElement>(`[data-part='actions'][data-side='${side}']`)!;
const link = () => document.querySelector<HTMLElement>("[data-part='item'] > a[data-part='title']")!;

function pointer(target: Element, type: string, init: PointerEventInit) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, ...init }));
}

/** A drag on the row's title from the first x through the rest, then a release at the last x. */
async function drag(f: ComponentFixture<unknown>, xs: number[], pointerType = 'touch') {
  const target = link();
  pointer(target, 'pointerdown', { clientX: xs[0], clientY: 10, button: 0, pointerType });
  for (const x of xs.slice(1)) pointer(target, 'pointermove', { clientX: x, clientY: 10, pointerType });
  pointer(target, 'pointerup', { clientX: xs[xs.length - 1], clientY: 10, pointerType });
  await f.whenStable();
}

describe('SwipeActions in a ListItem', () => {
  it('renders the swipe part with closed, inert action groups and a named menu button', async () => {
    await mount(Row);
    const root = swipeRoot();
    expect(root.parentElement).toBe(row());
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('data-part')).toBe('swipe');
    expect(root.getAttribute('data-state')).toBe('closed');
    expect(root.getAttributeNames().sort()).toEqual(['data-ds', 'data-part', 'data-state']);
    expect(group('start').hasAttribute('inert')).toBe(true);
    expect(group('end').hasAttribute('inert')).toBe(true);
    expect(group('end').getAttribute('data-tone')).toBe('danger');
    expect(group('end').getAttribute('role')).toBe('group');
    expect(group('end').getAttribute('aria-label')).toBe('Actions for Sara Alqahtani');
    // The first end action sits at the outer edge: the end group is drawn in reverse.
    expect(Array.from(group('end').querySelectorAll('[data-part="action"]')).map((b) => b.textContent?.trim())).toEqual(['Mute', 'Delete']);
    const menu = root.querySelector<HTMLElement>('[data-part="menu"]')!;
    expect(menu.getAttribute('aria-label')).toBe('Actions for Sara Alqahtani');
    expect(menu.parentElement?.tagName).toBe('SPAN');
    expect(menu.parentElement?.parentElement).toBe(root);
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(Array.from(root.children).map((c) => c.getAttribute('data-part') ?? c.tagName)).toEqual(['actions', 'actions', 'SPAN']);
    // The row's own parts stay the List's.
    expect(row().querySelector(':scope > [data-part="title"]')).not.toBeNull();
    // Each action label sits in the Button label part.
    expect([...document.querySelectorAll("[data-part='action'] > [data-part='label']")].map((el) => el.textContent?.trim())).toEqual(['Archive', 'Mute', 'Delete']);
  });

  it('follows a touch drag and opens the end actions past half their width', async () => {
    const f = await mount(Row);
    const target = link();
    pointer(target, 'pointerdown', { clientX: 300, clientY: 10, button: 0, pointerType: 'touch' });
    pointer(target, 'pointermove', { clientX: 285, clientY: 11, pointerType: 'touch' });
    await f.whenStable();
    expect(swipeRoot().hasAttribute('data-dragging')).toBe(true);
    pointer(target, 'pointermove', { clientX: 250, clientY: 11, pointerType: 'touch' });
    expect(row().style.getPropertyValue('--_list-shift')).toBe('-50px');
    expect(swipeRoot().style.getPropertyValue('--_swipe-actions-x')).toBe('-50px');
    pointer(target, 'pointerup', { clientX: 250, clientY: 11, pointerType: 'touch' });
    await f.whenStable();
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
    expect(swipeRoot().hasAttribute('data-dragging')).toBe(false);
    expect(group('end').hasAttribute('inert')).toBe(false);
    expect(row().style.getPropertyValue('--_list-shift')).toBe('-60px');
  });

  it('springs back under half and opens the start side the other way', async () => {
    const f = await mount(Row);
    await drag(f, [100, 111, 108]);
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
    await drag(f, [100, 115, 150]);
    expect(swipeRoot().getAttribute('data-state')).toBe('open-start');
  });

  it('leaves a steep move to the page scroll', async () => {
    const f = await mount(Row);
    const target = link();
    pointer(target, 'pointerdown', { clientX: 100, clientY: 10, button: 0, pointerType: 'touch' });
    pointer(target, 'pointermove', { clientX: 104, clientY: 40, pointerType: 'touch' });
    pointer(target, 'pointermove', { clientX: 60, clientY: 60, pointerType: 'touch' });
    await f.whenStable();
    expect(swipeRoot().hasAttribute('data-dragging')).toBe(false);
    expect(row().style.getPropertyValue('--_list-shift')).toBe('');
  });

  it('does not drag with a mouse unless pointer is set', async () => {
    const f = await mount(Row);
    await drag(f, [300, 280, 240], 'mouse');
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
    f.componentInstance.options.set(f.componentInstance.make({ pointer: true }));
    await f.whenStable();
    await drag(f, [300, 280, 240], 'mouse');
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
  });

  it('swallows the click that ends a swipe, so the row link does not follow', async () => {
    const f = await mount(Row);
    const onLink = vi.fn();
    document.addEventListener('click', onLink);
    await drag(f, [300, 280, 240]);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
    link().dispatchEvent(click);
    document.removeEventListener('click', onLink);
    expect(click.defaultPrevented).toBe(true);
    expect(onLink).not.toHaveBeenCalled();
  });

  it('runs the first start action on a full swipe and closes', async () => {
    const f = await mount(Row);
    f.componentInstance.options.set(f.componentInstance.make({ fullSwipe: 'start' }));
    await f.whenStable();
    const target = link();
    pointer(target, 'pointerdown', { clientX: 10, clientY: 10, button: 0, pointerType: 'touch' });
    pointer(target, 'pointermove', { clientX: 30, clientY: 10, pointerType: 'touch' });
    pointer(target, 'pointermove', { clientX: 260, clientY: 10, pointerType: 'touch' });
    await f.whenStable();
    expect(swipeRoot().hasAttribute('data-armed')).toBe(true);
    pointer(target, 'pointerup', { clientX: 260, clientY: 10, pointerType: 'touch' });
    await f.whenStable();
    expect(f.componentInstance.onSelect).toHaveBeenCalledTimes(1);
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
  });

  it('never arms a full swipe on a danger first action with no undo by default', async () => {
    const f = await mount(Row);
    await drag(f, [340, 320, 20]);
    expect(f.componentInstance.onSelect).not.toHaveBeenCalled();
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
  });

  it('runs an action from the open group and closes the row', async () => {
    const f = await mount(Row);
    await drag(f, [300, 280, 240]);
    const del = Array.from(group('end').querySelectorAll<HTMLElement>('[data-part="action"]')).find((b) => b.textContent?.trim() === 'Delete')!;
    del.click();
    await f.whenStable();
    expect(f.componentInstance.onSelect).toHaveBeenCalledTimes(1);
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
  });

  it('closes on a press outside, a tap on the open content and Escape', async () => {
    const f = await mount(Row);
    await drag(f, [300, 280, 240]);
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
    pointer(document.querySelector('p')!, 'pointerdown', { pointerId: 2, button: 0 });
    await f.whenStable();
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');

    await drag(f, [300, 280, 240]);
    pointer(link(), 'pointerdown', { pointerId: 3, clientX: 100, clientY: 10, button: 0, pointerType: 'touch' });
    pointer(link(), 'pointerup', { pointerId: 3, clientX: 100, clientY: 10, pointerType: 'touch' });
    await f.whenStable();
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');

    await drag(f, [300, 280, 240]);
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    link().dispatchEvent(esc);
    await f.whenStable();
    expect(esc.defaultPrevented).toBe(true);
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
  });

  it('keeps one row open at a time', async () => {
    @Component({
      imports: [DsList, DsListItem],
      template: `
        <ul dsList aria-label="Inbox">
          @for (name of names; track name) {
            <li dsListItem [href]="'#' + name" [title]="name" [swipe]="{ end, menuLabel: 'Actions for ' + name }"></li>
          }
        </ul>
      `,
    })
    class Two {
      readonly names = ['Sara', 'Omar'];
      readonly end: SwipeAction[] = [{ label: 'Delete', icon: 'trash', tone: 'danger', onSelect: () => undefined }];
    }
    const f = await mount(Two);
    const open = async (name: string) => {
      const target = document.querySelector<HTMLElement>(`a[href="#${name}"]`)!;
      pointer(target, 'pointerdown', { clientX: 300, clientY: 10, button: 0, pointerType: 'touch' });
      pointer(target, 'pointermove', { clientX: 280, clientY: 10, pointerType: 'touch' });
      pointer(target, 'pointermove', { clientX: 240, clientY: 10, pointerType: 'touch' });
      pointer(target, 'pointerup', { clientX: 240, clientY: 10, pointerType: 'touch' });
      await f.whenStable();
    };
    await open('Sara');
    await open('Omar');
    expect(Array.from(document.querySelectorAll("[data-ds='swipe-actions']")).map((el) => el.getAttribute('data-state'))).toEqual(['closed', 'open-end']);
  });

  it('opens the menu of every action with Shift+F10 and the context menu key', async () => {
    const f = await mount(Row);
    link().focus();
    const event = new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true });
    link().dispatchEvent(event);
    await f.whenStable();
    expect(event.defaultPrevented).toBe(true);
    const items = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Archive', 'Delete', 'Mute']);
    expect(items[1]?.getAttribute('data-tone')).toBe('danger');
    expect(document.querySelector('[role="menu"] [data-part="separator"], [role="menu"] [role="separator"]')).not.toBeNull();
    expect(swipeRoot().querySelector('[data-part="menu"]')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('the context menu key opens it too', async () => {
    const f = await mount(Row);
    link().dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
    await f.whenStable();
    expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(3);
  });

  it('draws no swipe on a disabled row', async () => {
    const f = await mount(Row);
    f.componentInstance.disabled.set(true);
    await f.whenStable();
    expect(document.querySelector("[data-ds='swipe-actions']")).toBeNull();
  });

  it('keeps at most three actions a side', async () => {
    const f = await mount(Row);
    f.componentInstance.options.set({ menuLabel: 'Actions for Guide', end: ['A', 'B', 'C', 'D'].map((label) => ({ label, onSelect: () => undefined })) });
    await f.whenStable();
    expect(group('end').querySelectorAll('[data-part="action"]')).toHaveLength(3);
    expect(document.querySelector("[data-part='actions'][data-side='start']")).toBeNull();
  });
});

describe('SwipeActions around content', () => {
  it('wraps the content in the content part and swipes it', async () => {
    @Component({
      imports: [DsSwipeActions],
      template: `<div dsSwipeActions [end]="end" menuLabel="Actions for the draft"><p>Launch note</p></div>`,
    })
    class Host {
      readonly end: SwipeAction[] = [
        { label: 'Delete', icon: 'trash', tone: 'danger', onSelect: () => undefined },
        { label: 'Mute', icon: 'bell-off', onSelect: () => undefined },
      ];
    }
    const f = await mount(Host);
    const root = swipeRoot();
    expect(root.hasAttribute('data-part')).toBe(false);
    expect(root.getAttributeNames().sort()).toEqual(['data-ds', 'data-state']);
    const content = root.querySelector<HTMLElement>(':scope > [data-part="content"]')!;
    expect(content.textContent).toBe('Launch note');
    pointer(content, 'pointerdown', { clientX: 300, clientY: 10, button: 0, pointerType: 'pen' });
    pointer(content, 'pointermove', { clientX: 280, clientY: 10, pointerType: 'pen' });
    pointer(content, 'pointermove', { clientX: 240, clientY: 10, pointerType: 'pen' });
    pointer(content, 'pointerup', { clientX: 240, clientY: 10, pointerType: 'pen' });
    await f.whenStable();
    expect(root.getAttribute('data-state')).toBe('open-end');
    expect(root.style.getPropertyValue('--_swipe-actions-x')).toBe('-60px');
  });

  it('renders the demo cases in order', async () => {
    const f = await mount(SwipeActionsDemo);
    const ids = Array.from(f.nativeElement.querySelectorAll('[data-demo-case]')).map((s) => (s as Element).getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    // The disabled row draws no swipe; the open one does.
    const disabled = f.nativeElement.querySelector('[data-demo-case="disabled"]') as HTMLElement;
    expect(disabled.querySelectorAll("[data-ds='swipe-actions']")).toHaveLength(1);
  });
});
