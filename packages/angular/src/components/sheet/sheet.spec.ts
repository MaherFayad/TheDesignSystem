// Sheet: the Angular twin of packages/react/src/components/Sheet/Sheet.test.tsx,
// Sheet.headerAction.test.tsx and Sheet.confirm.test.tsx. WCAG 2.2 covered
// here: 2.1.1 Keyboard (Escape, the detent keys), 2.4.3 Focus order (focus
// returns to the trigger; the header order close, action, confirm), 2.5.7
// Dragging movements (the detent handle is a button), 4.1.2 Name, role,
// value.
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsList, DsListItem } from '../list/list';
import SheetDemo from './sheet.demo';
import { DS_SHEET, type SheetSize } from './sheet';

@Component({
  imports: [DS_SHEET, DsButton, DsTheme],
  template: `
    <div dsTheme [lang]="lang()" [style]="style()" [platform]="platform()">
      <ng-container dsSheet [(open)]="open" [size]="size()" [dismissible]="dismissible()" [detents]="detents()" [(detent)]="detent">
        <button dsButton dsSheetTrigger>Share board</button>
        <ng-template dsSheetContent title="Share Spring launch" description="People with the link can view it.">
          <div dsSheetBody>Body</div>
          <div dsSheetFooter><button dsButton dsSheetClose>Discard invite</button></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Basic {
  readonly open = signal(false);
  readonly size = signal<SheetSize>('md');
  readonly dismissible = signal(true);
  readonly detents = signal<number[] | undefined>(undefined);
  readonly detent = signal<number | undefined>(undefined);
  readonly lang = signal<'en' | 'ar'>('en');
  readonly style = signal<string>('studio');
  readonly platform = signal<'web' | 'ios'>('web');
}

@Component({
  imports: [DS_SHEET, DsButton, DsIconButton, DsTheme],
  template: `
    <div dsTheme [lang]="lang()">
      <ng-container dsSheet [(open)]="open">
        <button dsButton dsSheetTrigger>Pass details</button>
        <ng-template dsSheetContent [title]="lang() === 'ar' ? 'تفاصيل البطاقة' : 'Pass details'">
          @if (action()) {
            <ng-template dsSheetHeaderAction>
              <button dsIconButton icon="share" [label]="lang() === 'ar' ? 'مشاركة البطاقة' : 'Share pass'" (click)="shared = shared + 1"></button>
            </ng-template>
          }
          @if (second()) {
            <ng-template dsSheetHeaderAction><button dsIconButton icon="more" label="More pass actions"></button></ng-template>
          }
          @if (withConfirm()) {
            <ng-container dsSheetConfirm [label]="lang() === 'ar' ? 'حفظ التغييرات' : 'Save changes'" [disabled]="confirmOff()" (click)="onConfirm($event)" />
          }
          <div dsSheetBody><p>Seat 14, hall B.</p></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Header {
  readonly open = signal(false);
  readonly lang = signal<'en' | 'ar'>('en');
  readonly action = signal(true);
  readonly second = signal(false);
  readonly withConfirm = signal(true);
  readonly confirmOff = signal(false);
  shared = 0;
  confirmed = 0;
  keepOpen = false;
  onConfirm(event: MouseEvent): void {
    this.confirmed += 1;
    if (this.keepOpen) event.preventDefault();
  }
}

@Component({
  imports: [DS_SHEET, DsList, DsListItem],
  template: `
    <ul dsList>
      <ng-container dsSheet [(open)]="open">
        <li dsListItem dsSheetTrigger title="Pass details"></li>
        <ng-template dsSheetContent title="Pass details"><div dsSheetBody>Seat 14</div></ng-template>
      </ng-container>
    </ul>
  `,
})
class Row {
  readonly open = signal(false);
}

const proto = Element.prototype as unknown as Record<string, unknown>;
proto['setPointerCapture'] ??= () => undefined;
proto['releasePointerCapture'] ??= () => undefined;

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="sheet"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;
const button = (name: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('button')).find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name) ?? null;
const tick = () => new Promise((r) => setTimeout(r, 0));

async function settle(f: ComponentFixture<unknown>) {
  await f.whenStable();
  await tick();
  await f.whenStable();
}

async function openSheet<T>(f: ComponentFixture<T>, name = 'Share board') {
  button(name)!.click();
  await settle(f);
}

function press(key: string, target: Element = document.activeElement ?? document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function pointer(el: HTMLElement, type: string, clientY: number, timeStamp: number, pointerId = 1) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId, clientY });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  el.dispatchEvent(event);
}

/** Drags the handle by dy px over ms. jsdom gives the panel no height, so a fake one is set. */
function drag(dy: number, ms = 300, height = 400, dismissible = true) {
  const panel = part('panel')!;
  panel.getBoundingClientRect = () => new DOMRect(0, 0, 400, height);
  const handle = part('handle')!;
  pointer(handle, 'pointerdown', 100, 1);
  pointer(handle, 'pointermove', 100 + dy, 1 + ms / 2);
  const drawn = panel.style.getPropertyValue('--_dialog-drag-y');
  expect(drawn).toBe(`${dy < 0 || !dismissible ? dy * (1 / 3) : dy}px`);
  pointer(handle, 'pointerup', 100 + dy, 1 + ms);
}

afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('Sheet', () => {
  it('renders the root, backdrop and panel in a themed portal, the handle first', async () => {
    const f = await mount(Basic);
    await openSheet(f);
    const root = rootEl()!;
    expect(root.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(root.parentElement?.hasAttribute('data-dialog-layer')).toBe(true);
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.getAttribute('data-state')).toBe('open');
    expect(root.hasAttribute('data-dragging')).toBe(false);
    expect(root.hasAttribute('data-detent')).toBe(false);
    expect(root.hasAttribute('data-segment')).toBe(false);
    expect(Array.from(root.children).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    const panel = part('panel')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['handle', 'header', 'body', 'footer']);
    expect(part('handle')!.tagName).toBe('DIV');
    expect(part('handle')!.getAttribute('aria-hidden')).toBe('true');
    expect(part('handle')!.hasAttribute('tabindex')).toBe(false);
    expect(part('handle')!.firstElementChild?.getAttribute('data-part')).toBe('handle-bar');
    expect(Array.from(part('header')!.children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'close']);
    expect(part('close')!.getAttribute('data-ds')).toBe('close-button');
    expect(part('close')!.getAttribute('aria-label')).toBe('Close sheet');
    expect(document.getElementById(panel.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Share Spring launch');
    // No marker or input attribute leaks onto the DOM.
    expect(document.body.querySelector('[dssheettrigger], [dssheetclose], [dssheetbody], [dssheethandle]')).toBeNull();
  });

  it('sets data-size for every size', async () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const f = await mount(Basic, (h) => h.size.set(size));
      await openSheet(f);
      expect(rootEl()!.getAttribute('data-size')).toBe(size);
      f.destroy();
      document.body.replaceChildren();
    }
  });

  it('closes with Escape, the close control and dsSheetClose; focus returns to the trigger', async () => {
    const f = await mount(Basic);
    const trigger = button('Share board')!;
    for (const close of [() => press('Escape'), () => part('close')!.click(), () => button('Discard invite')!.click()]) {
      await openSheet(f);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      close();
      await settle(f);
      expect(rootEl()).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(f.componentInstance.open()).toBe(false);
    }
  });

  it('closes on a drag past a quarter of its height, and on a quick flick down', async () => {
    const f = await mount(Basic);
    await openSheet(f);
    drag(150, 1000);
    await settle(f);
    expect(rootEl()).toBeNull();
    await openSheet(f);
    drag(40, 20);
    await settle(f);
    expect(rootEl()).toBeNull();
  });

  it('snaps back on a short slow drag; above its place it gives a third; a pause before the release leaves no speed', async () => {
    const f = await mount(Basic);
    await openSheet(f);
    drag(40, 1000);
    await settle(f);
    expect(rootEl()!.hasAttribute('data-dragging')).toBe(false);
    expect(part('panel')!.style.getPropertyValue('--_dialog-drag-y')).toBe('');
    drag(-80, 1000);
    await settle(f);
    expect(rootEl()).not.toBeNull();
    const handle = part('handle')!;
    part('panel')!.getBoundingClientRect = () => new DOMRect(0, 0, 400, 400);
    pointer(handle, 'pointerdown', 100, 1);
    pointer(handle, 'pointermove', 120, 16);
    pointer(handle, 'pointermove', 140, 32);
    pointer(handle, 'pointerup', 140, 200);
    await settle(f);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
  });

  it('marks data-dragging while dragging, and clears the drag when pointer capture is lost', async () => {
    const f = await mount(Basic);
    await openSheet(f);
    const handle = part('handle')!;
    pointer(handle, 'pointerdown', 100, 1);
    await f.whenStable();
    expect(rootEl()!.getAttribute('data-dragging')).toBe('');
    pointer(handle, 'pointermove', 160, 50);
    pointer(handle, 'lostpointercapture', 160, 60);
    await f.whenStable();
    expect(rootEl()!.hasAttribute('data-dragging')).toBe(false);
    expect(part('panel')!.style.getPropertyValue('--_dialog-drag-y')).toBe('');
  });

  it('with dismissible false, a drag, Escape and the backdrop do nothing; the close control is aria-disabled', async () => {
    const f = await mount(Basic, (h) => h.dismissible.set(false));
    await openSheet(f);
    drag(300, 1000, 400, false);
    press('Escape');
    part('backdrop')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    part('backdrop')!.click();
    await settle(f);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    expect(button('Close sheet')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('labels the close control in Arabic under lang ar', async () => {
    const f = await mount(Basic, (h) => h.lang.set('ar'));
    await openSheet(f);
    expect(part('close')!.getAttribute('aria-label')).toBe('إغلاق النافذة السفلية');
    expect(rootEl()!.parentElement?.getAttribute('lang')).toBe('ar');
  });

  it('carries data-segment on a folded screen', async () => {
    Object.defineProperty(window, 'viewport', {
      configurable: true,
      value: { segments: [{ x: 0, y: 0, width: 800, height: 400 }, { x: 0, y: 420, width: 800, height: 400 }] },
    });
    try {
      const f = await mount(Basic);
      await openSheet(f);
      await settle(f);
      expect(rootEl()!.getAttribute('data-segment')).toBe('bottom');
    } finally {
      Object.defineProperty(window, 'viewport', { configurable: true, value: undefined });
    }
  });

  it('keeps the panel below toasts on the top edge (WCAG 2.4.11)', async () => {
    const f = await mount(Basic);
    await openSheet(f);
    expect(rootEl()!.style.getPropertyValue('--_sheet-toast-end')).toBe('');
    const toaster = document.createElement('div');
    toaster.setAttribute('data-ds', 'toaster');
    toaster.getBoundingClientRect = () => new DOMRect(0, 16, 400, 60);
    const toast = document.createElement('div');
    toast.setAttribute('data-ds', 'toast');
    toaster.append(toast);
    document.body.append(toaster);
    await new Promise((r) => setTimeout(r, 50));
    await settle(f);
    expect(rootEl()!.style.getPropertyValue('--_sheet-toast-end')).toBe('76px');
  });

  it('Desk: a title bar replaces the header; the close light closes the sheet', async () => {
    const f = await mount(Basic, (h) => h.style.set('desk'));
    await openSheet(f);
    const panel = part('panel')!;
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['handle', 'titlebar', 'description', 'body', 'footer']);
    const bar = part('titlebar')!;
    expect(bar.querySelector('[data-part="title"] [data-dialog-title]')?.textContent).toBe('Share Spring launch');
    expect(bar.querySelector('[data-ds="window-controls"]')?.getAttribute('aria-label')).toBe('Sheet controls');
    // With the lights on the web, the lights carry the close.
    expect(bar.querySelector('[data-part="close"]')).toBeNull();
    f.componentInstance.platform.set('ios');
    await settle(f);
    expect(bar.querySelector('[data-part="actions"] [data-part="close"]')?.getAttribute('aria-label')).toBe('Close sheet');
  });
});

describe('Sheet detents (order 1.29)', () => {
  const handle = () => part('handle')!;
  const vh = () => window.innerHeight;
  const openDetents = async (set?: (h: Basic) => void) => {
    const f = await mount(Basic, (h) => {
      h.detents.set([0.5, 1]);
      set?.(h);
    });
    await openSheet(f);
    await settle(f);
    return f;
  };

  it('rests at a detent: data-detent and the working heights on the root, the handle a named button', async () => {
    await openDetents();
    const root = rootEl()!;
    expect(root.getAttribute('data-detent')).toBe('0');
    expect(root.style.getPropertyValue('--_dialog-detent-height')).toBe(`${Math.round(vh() / 2)}px`);
    expect(root.style.getPropertyValue('--_dialog-detent-max')).toBe(`${vh()}px`);
    expect(handle().tagName).toBe('BUTTON');
    expect(handle().getAttribute('type')).toBe('button');
    expect(handle().getAttribute('data-ds')).toBe('button');
    expect(handle().getAttribute('data-emphasis')).toBe('ghost');
    expect(handle().hasAttribute('aria-hidden')).toBe(false);
    expect(handle().getAttribute('aria-label')).toBe('Sheet size, 1 of 2');
    expect(Array.from(handle().children).map((c) => c.getAttribute('data-part'))).toEqual(['handle-bar', 'hit']);
  });

  it('moves between detents with the keys and the button (WCAG 2.5.7)', async () => {
    const f = await openDetents();
    const changes: number[] = [];
    const sub = f.debugElement.injector;
    void sub;
    const step = async (fn: () => void) => {
      fn();
      await settle(f);
      changes.push(f.componentInstance.detent() ?? -1);
    };
    handle().focus();
    await step(() => press('ArrowUp', handle()));
    expect(rootEl()!.getAttribute('data-detent')).toBe('1');
    expect(handle().getAttribute('aria-label')).toBe('Sheet size, 2 of 2');
    await step(() => press('Home', handle()));
    expect(rootEl()!.getAttribute('data-detent')).toBe('0');
    await step(() => handle().click());
    expect(rootEl()!.getAttribute('data-detent')).toBe('1');
    await step(() => handle().click());
    expect(rootEl()!.getAttribute('data-detent')).toBe('0');
    expect(changes).toEqual([1, 0, 1, 0]);
  });

  it('settles on the nearest detent by position and speed, gives a rubber band past the largest, and closes on a flick down', async () => {
    const f = await openDetents();
    const panel = part('panel')!;
    pointer(handle(), 'pointerdown', 500, 1);
    pointer(handle(), 'pointermove', 460, 16);
    pointer(handle(), 'pointermove', 420, 32);
    pointer(handle(), 'pointerup', 420, 40);
    await settle(f);
    expect(rootEl()!.getAttribute('data-detent')).toBe('1');
    expect(panel.style.getPropertyValue('--_dialog-drag-y')).toBe('');
    pointer(handle(), 'pointerdown', 500, 100);
    pointer(handle(), 'pointermove', 300, 1100);
    const over = Number.parseFloat(panel.style.getPropertyValue('--_dialog-drag-y'));
    expect(over).toBeLessThan(0);
    expect(over).toBeGreaterThan(-48);
    pointer(handle(), 'pointerup', 300, 2100);
    await settle(f);
    expect(rootEl()!.getAttribute('data-detent')).toBe('1');
    press('Home', handle());
    await settle(f);
    expect(rootEl()!.getAttribute('data-detent')).toBe('0');
    pointer(handle(), 'pointerdown', 500, 3000);
    pointer(handle(), 'pointermove', 540, 3016);
    pointer(handle(), 'pointermove', 580, 3032);
    pointer(handle(), 'pointerup', 580, 3040);
    await settle(f);
    expect(rootEl()).toBeNull();
  });

  it('with dismissible false a flick down settles on the smallest detent', async () => {
    const f = await openDetents((h) => h.dismissible.set(false));
    pointer(handle(), 'pointerdown', 500, 1);
    pointer(handle(), 'pointermove', 540, 16);
    pointer(handle(), 'pointermove', 580, 32);
    pointer(handle(), 'pointerup', 580, 40);
    await settle(f);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    expect(rootEl()!.getAttribute('data-detent')).toBe('0');
  });

  it('names the handle in Arabic', async () => {
    await openDetents((h) => h.lang.set('ar'));
    expect(handle().getAttribute('aria-label')).toBe('حجم النافذة السفلية، 1 من 2');
  });
});

describe('Sheet header action and confirm (orders C5, M9.6)', () => {
  const headerParts = () => Array.from(part('header')!.children).map((c) => c.getAttribute('data-part'));

  it('moves into the header between the close control and the confirm, in its own part', async () => {
    const f = await mount(Header);
    await openSheet(f, 'Pass details');
    expect(headerParts()).toEqual(['title', 'close', 'header-action', 'confirm']);
    expect(button('Share pass')!.parentElement?.getAttribute('data-part')).toBe('header-action');
    expect(part('body')!.querySelector('[data-part="header-action"], [data-part="confirm"]')).toBeNull();
    const confirm = part('confirm')!;
    expect(confirm.getAttribute('data-ds')).toBe('button');
    expect(confirm.getAttribute('data-emphasis')).toBe('solid');
    expect(confirm.getAttribute('data-tone')).toBe('accent');
    expect(confirm.getAttribute('data-size')).toBe('sm');
    expect(confirm.querySelector('[data-part="start"] [data-ds="icon"]')).not.toBeNull();
    expect(confirm.textContent?.trim()).toBe('Save changes');
  });

  it('sits after the close control without a confirm; the confirm alone sits after close', async () => {
    const f = await mount(Header, (h) => h.withConfirm.set(false));
    await openSheet(f, 'Pass details');
    expect(headerParts()).toEqual(['title', 'close', 'header-action']);
    f.componentInstance.withConfirm.set(true);
    f.componentInstance.action.set(false);
    await settle(f);
    expect(headerParts()).toEqual(['title', 'close', 'confirm']);
  });

  it('a header action press keeps the sheet open; the confirm runs click and closes; preventDefault keeps it open', async () => {
    const f = await mount(Header);
    await openSheet(f, 'Pass details');
    button('Share pass')!.click();
    await settle(f);
    expect(f.componentInstance.shared).toBe(1);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    f.componentInstance.keepOpen = true;
    part('confirm')!.click();
    await settle(f);
    expect(f.componentInstance.confirmed).toBe(1);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    f.componentInstance.keepOpen = false;
    part('confirm')!.click();
    await settle(f);
    expect(f.componentInstance.confirmed).toBe(2);
    expect(rootEl()).toBeNull();
  });

  it('a disabled confirm is aria-disabled, stays a tab stop, and a press does nothing', async () => {
    const f = await mount(Header, (h) => h.confirmOff.set(true));
    await openSheet(f, 'Pass details');
    const confirm = part('confirm')!;
    expect(confirm.getAttribute('aria-disabled')).toBe('true');
    expect(confirm.hasAttribute('disabled')).toBe(false);
    confirm.click();
    await settle(f);
    expect(f.componentInstance.confirmed).toBe(0);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
  });

  it('keeps one: a second is left out with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const f = await mount(Header, (h) => h.second.set(true));
    await openSheet(f, 'Pass details');
    expect(button('More pass actions')).toBeNull();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('one SheetHeaderAction'))).toBe(true);
  });

  it('names the action in Arabic under an Arabic theme', async () => {
    const f = await mount(Header, (h) => h.lang.set('ar'));
    await openSheet(f, 'تفاصيل البطاقة');
    expect(headerParts()).toEqual(['title', 'close', 'header-action', 'confirm']);
    expect(button('مشاركة البطاقة')).not.toBeNull();
    expect(part('close')!.getAttribute('aria-label')).toBe('إغلاق النافذة السفلية');
  });
});

describe('Sheet trigger on a List row (A5 item 5)', () => {
  it('the row title carries the trigger; it opens the sheet and focus returns to it', async () => {
    const f = await mount(Row);
    const li = document.querySelector('li')!;
    const title = li.querySelector<HTMLElement>('[role="button"], button') ?? li.querySelector<HTMLElement>('[data-part="title"]')!;
    expect(li.hasAttribute('aria-haspopup')).toBe(false);
    expect(title.getAttribute('aria-haspopup')).toBe('dialog');
    expect(title.getAttribute('aria-expanded')).toBe('false');
    title.focus();
    title.click();
    await settle(f);
    expect(rootEl()).not.toBeNull();
    expect(title.getAttribute('aria-expanded')).toBe('true');
    expect(title.getAttribute('data-state')).toBe('open');
    press('Escape');
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.activeElement).toBe(title);
  });
});

describe('Sheet demo', () => {
  it('renders a trigger per case, the React case ids, and no native title', async () => {
    const f = await mount(SheetDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'detents', 'detents-arabic', 'confirm', 'header-action', 'disabled']);
    for (const id of ids) expect(c.querySelector(`[data-demo-case="${id}"] [data-demo-trigger]`)).not.toBeNull();
    expect(c.querySelector('[title]')).toBeNull();
  });
});
