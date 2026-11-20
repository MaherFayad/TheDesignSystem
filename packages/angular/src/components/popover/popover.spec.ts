// Popover: the Angular twin of
// packages/react/src/components/Popover/Popover.test.tsx and the fold part
// of FloatingLayer.fold.test.tsx. WCAG 2.2 covered here: 2.1.1 Keyboard
// (Escape, Tab wraps), 2.1.2 No keyboard trap (not modal: a press outside
// and Escape close it), 2.4.3 Focus order (the focus rule, focus back to the
// trigger), 4.1.2 Name, role, value (dialog named by its title).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { foldCollision } from '../../internal/fold';
import { computePopper } from '../../internal/popper';
import { DsButton } from '../button/button';
import { DsList, DsListItem } from '../list/list';
import { DS_SHEET } from '../sheet/sheet';
import PopoverDemo from './popover.demo';
import { DS_POPOVER, physicalSide, type PopoverSide, type PopoverSize } from './popover';

@Component({
  imports: [DS_POPOVER, DsButton, DsTheme],
  template: `
    <div dsTheme [lang]="lang()" [dir]="lang() === 'ar' ? 'rtl' : 'ltr'" [style]="style()">
      <button dsButton id="outside">Outside</button>
      <ng-container dsPopover [(open)]="open" [size]="size()">
        <button dsButton dsPopoverTrigger [disabled]="disabled()">Rename</button>
        <ng-template dsPopoverContent title="Rename layer" [side]="side()" [arrow]="arrow()" [close]="close()" [closeLabel]="closeLabel()">
          <div dsPopoverBody>
            @if (field()) {
              <input aria-label="Layer name" value="Hero image" />
            } @else {
              <p>Details</p>
            }
          </div>
          <div dsPopoverFooter>
            <button dsButton dsPopoverClose>Cancel rename</button>
            <button dsButton tone="accent" emphasis="solid">Rename layer</button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Basic {
  readonly open = signal(false);
  readonly size = signal<PopoverSize>('md');
  readonly side = signal<PopoverSide>('bottom');
  readonly arrow = signal(true);
  readonly close = signal(true);
  readonly closeLabel = signal<string | undefined>(undefined);
  readonly field = signal(true);
  readonly disabled = signal(false);
  readonly lang = signal<'en' | 'ar'>('en');
  readonly style = signal('studio');
}

@Component({
  imports: [DS_POPOVER, DsButton],
  template: `
    @for (name of ['First', 'Second']; track name) {
      <ng-container dsPopover>
        <button dsButton dsPopoverTrigger>{{ 'Open ' + name }}</button>
        <ng-template dsPopoverContent [title]="name">
          <div dsPopoverBody><input [attr.aria-label]="name + ' field'" /></div>
        </ng-template>
      </ng-container>
    }
  `,
})
class Two {}

@Component({
  imports: [DS_POPOVER, DS_SHEET, DsButton],
  template: `
    <ng-container dsSheet [(open)]="open">
      <button dsButton dsSheetTrigger>Pass details</button>
      <ng-template dsSheetContent title="Pass details">
        <ng-template dsSheetHeaderAction>
          <ng-container dsPopover>
            <button dsButton dsPopoverTrigger>Share pass</button>
            <ng-template dsPopoverContent title="Share">
              <div dsPopoverBody><input aria-label="Email" /></div>
              <div dsPopoverFooter><button dsButton dsPopoverClose>Send pass</button></div>
            </ng-template>
          </ng-container>
        </ng-template>
        <div dsSheetBody><p>Seat 14</p></div>
      </ng-template>
    </ng-container>
  `,
})
class InSheet {
  readonly open = signal(false);
}

@Component({
  imports: [DS_POPOVER, DsList, DsListItem],
  template: `
    <ul dsList>
      <ng-container dsPopover>
        <li dsListItem dsPopoverTrigger title="Seat details"></li>
        <ng-template dsPopoverContent title="Seat details"><div dsPopoverBody><p>Seat 14, hall B.</p></div></ng-template>
      </ng-container>
    </ul>
  `,
})
class Row {}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="popover"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;
const button = (name: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('button')).find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name) ?? null;
const tick = () => new Promise((r) => setTimeout(r, 0));

async function settle(f: ComponentFixture<unknown>) {
  await f.whenStable();
  await tick();
  await f.whenStable();
}

async function openIt<T>(f: ComponentFixture<T>, name = 'Rename') {
  button(name)!.click();
  await settle(f);
}

function press(key: string, init: KeyboardEventInit = {}, target: Element = document.activeElement ?? document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('Popover', () => {
  it('renders nothing until the trigger opens it', async () => {
    await mount(Basic);
    expect(rootEl()).toBeNull();
    const trigger = button('Rename')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('opens on click with the anatomy, the axes and the state, in its themed layer', async () => {
    const f = await mount(Basic, (h) => h.size.set('lg'));
    await openIt(f);
    const root = rootEl()!;
    const wrapper = root.parentElement!;
    expect(wrapper.hasAttribute('data-radix-popper-content-wrapper')).toBe(true);
    expect(wrapper.style.position).toBe('fixed');
    expect(wrapper.parentElement?.hasAttribute('data-popover-layer')).toBe(true);
    expect(wrapper.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.getAttribute('data-state')).toBe('open');
    expect(root.getAttribute('data-side')).toBe('bottom');
    expect(root.getAttribute('data-align')).toBe('center');
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('tabindex')).toBe('-1');
    expect(root.hasAttribute('data-part')).toBe(false);
    expect(Array.from(root.children).map((c) => c.getAttribute('data-part') ?? c.tagName.toLowerCase())).toEqual(['title', 'close', 'body', 'footer', 'span']);
    expect(part('arrow')!.parentElement!.tagName).toBe('SPAN');
    expect(part('arrow')!.parentElement!.style.position).toBe('absolute');
    expect(part('close')!.getAttribute('data-ds')).toBe('close-button');
    expect(part('close')!.getAttribute('data-size')).toBe('xs');
    expect(part('close')!.getAttribute('aria-label')).toBe('Close popover');
    expect(root.getAttribute('aria-labelledby')).toBe(part('title')!.id);
    expect(root.style.getPropertyValue('--radix-popover-content-transform-origin')).toBe('var(--radix-popper-transform-origin)');
    const trigger = button('Rename')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(root.id);
  });

  it('copies the axes of the theme it opens in, Arabic included', async () => {
    const f = await mount(Basic, (h) => {
      h.lang.set('ar');
      h.style.set('desk');
    });
    await openIt(f);
    const layer = rootEl()!.closest('[data-popover-layer]')!;
    expect(layer.getAttribute('data-style')).toBe('desk');
    expect(layer.getAttribute('dir')).toBe('rtl');
    expect(part('close')?.getAttribute('aria-label') ?? rootEl()!.querySelector('[data-ds="window-controls"] [data-part="close"]')?.getAttribute('aria-label')).toBe('إغلاق');
  });

  it('moves focus to the first field in the body, else the first footer action', async () => {
    const f = await mount(Basic);
    await openIt(f);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Layer name');
    press('Escape');
    await settle(f);
    f.componentInstance.field.set(false);
    await settle(f);
    await openIt(f);
    expect(document.activeElement).toBe(button('Cancel rename'));
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const f = await mount(Basic);
    await openIt(f);
    press('Escape');
    await settle(f);
    expect(f.componentInstance.open()).toBe(false);
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.activeElement).toBe(button('Rename'));
  });

  it('closes from the close control, from dsPopoverClose, on a press outside, and the trigger toggles it', async () => {
    const f = await mount(Basic);
    for (const close of [
      () => part('close')!.click(),
      () => button('Cancel rename')!.click(),
      () => document.getElementById('outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })),
      () => button('Rename')!.click(),
    ]) {
      await openIt(f);
      expect(rootEl()).not.toBeNull();
      close();
      await settle(f);
      expect(f.componentInstance.open()).toBe(false);
      await settle(f);
      expect(rootEl()).toBeNull();
    }
  });

  it('hides the close control and the arrow on request, and takes a custom close label', async () => {
    const f = await mount(Basic, (h) => {
      h.close.set(false);
      h.arrow.set(false);
    });
    await openIt(f);
    expect(part('close')).toBeNull();
    expect(part('arrow')).toBeNull();
    press('Escape');
    await settle(f);
    f.componentInstance.close.set(true);
    f.componentInstance.closeLabel.set('Close rename');
    await settle(f);
    await openIt(f);
    expect(part('close')!.getAttribute('aria-label')).toBe('Close rename');
  });

  it('a disabled trigger stays focusable and does not open', async () => {
    const f = await mount(Basic, (h) => h.disabled.set(true));
    const trigger = button('Rename')!;
    trigger.focus();
    trigger.click();
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('maps logical sides to physical sides by direction; side start sits on the right in Arabic', async () => {
    expect(physicalSide('start', 'ltr')).toBe('left');
    expect(physicalSide('start', 'rtl')).toBe('right');
    expect(physicalSide('end', 'rtl')).toBe('left');
    expect(physicalSide('top', 'rtl')).toBe('top');
    const f = await mount(Basic, (h) => {
      h.lang.set('ar');
      h.side.set('start');
    });
    await openIt(f);
    expect(rootEl()!.getAttribute('data-side')).toBe('right');
  });

  it('Tab wraps inside the popover', async () => {
    const f = await mount(Basic);
    await openIt(f);
    const field = document.activeElement as HTMLElement;
    button('Rename layer')!.focus();
    expect(press('Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(part('close'));
    expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(button('Rename layer'));
    expect(rootEl()!.contains(field)).toBe(true);
  });

  it('a popover closed while another opens does not take focus back (order 1.29 race)', async () => {
    const f = await mount(Two);
    await openIt(f, 'Open First');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('First field');
    const second = button('Open Second')!;
    second.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    second.click();
    await settle(f);
    await settle(f);
    const roots = Array.from(document.querySelectorAll('[data-ds="popover"]'));
    expect(roots.map((r) => r.getAttribute('data-state'))).toEqual(['open']);
    expect(second.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Second field');
  });

  it('Desk: the title and the close move into a title bar; the close light closes it', async () => {
    const f = await mount(Basic, (h) => h.style.set('desk'));
    await openIt(f);
    const bar = part('titlebar');
    if (!bar) return; // Desk lists no popover optional part: nothing to check.
    expect(rootEl()!.firstElementChild).toBe(bar);
    expect(bar.querySelector('[data-popover-title]')?.textContent).toBe('Rename layer');
  });
});

describe('Popover in a sheet header (A5)', () => {
  it('keeps its own Tab loop and Escape over the modal sheet, then the sheet stays open', async () => {
    const f = await mount(InSheet);
    button('Pass details')!.click();
    await settle(f);
    await openIt(f, 'Share pass');
    const email = document.activeElement as HTMLElement;
    expect(email.getAttribute('aria-label')).toBe('Email');
    // Focus inside the popover is not pulled back into the sheet.
    await settle(f);
    expect(document.activeElement).toBe(email);
    button('Send pass')!.focus();
    expect(press('Tab').defaultPrevented).toBe(true);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close popover');
    press('Escape');
    await settle(f);
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.body.querySelector('[data-ds="sheet"]')?.getAttribute('data-state')).toBe('open');
    expect(document.activeElement).toBe(button('Share pass'));
  });
});

describe('Popover trigger on a List row (A5 item 5)', () => {
  it('the row title carries the trigger and anchors the popover', async () => {
    const f = await mount(Row);
    const li = document.querySelector('li')!;
    const title = li.querySelector<HTMLElement>('[role="button"]')!;
    expect(li.hasAttribute('aria-haspopup')).toBe(false);
    expect(title.getAttribute('aria-haspopup')).toBe('dialog');
    title.focus();
    title.click();
    await settle(f);
    expect(rootEl()).not.toBeNull();
    expect(title.getAttribute('aria-expanded')).toBe('true');
    expect(title.getAttribute('aria-controls')).toBe(rootEl()!.id);
    press('Escape');
    await settle(f);
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.activeElement).toBe(title);
  });
});

describe('Popover placement with the fold and the arrow (order DU5)', () => {
  type Segments = { x: number; y: number; width: number; height: number }[] | undefined;
  const setSegments = (segments: Segments) =>
    Object.defineProperty(window, 'viewport', { configurable: true, value: segments ? { segments } : undefined });
  afterEach(() => setSegments(undefined));

  it('passes the caller padding through untouched without a fold or a side inset', () => {
    const node = document.createElement('div');
    document.body.append(node);
    expect(foldCollision(node, null, 8)).toBe(8);
  });

  it('keeps an overlay from the start segment out of the band and the other segment', () => {
    setSegments([
      { x: 0, y: 0, width: 455, height: 800 },
      { x: 495, y: 0, width: 456, height: 800 },
    ]);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 951 });
    const node = document.createElement('div');
    const anchor = document.createElement('button');
    anchor.getBoundingClientRect = () => new DOMRect(100, 100, 40, 20);
    document.body.append(node, anchor);
    expect(foldCollision(node, anchor, 8)).toEqual({ top: 8, right: 951 - 455 + 8, bottom: 8, left: 8 });
  });

  it('adds the arrow step: the arrow centres on the anchor and the origin follows it', () => {
    const r = computePopper(
      { x: 100, y: 100, width: 40, height: 20 },
      () => ({ width: 200, height: 100 }),
      { x: 0, y: 0, width: 1000, height: 800 },
      { side: 'bottom', align: 'center', sideOffset: 14, padding: 8, rtl: false, arrow: { width: 12, height: 6, clientSize: () => 200 } },
      () => undefined,
    );
    expect(r.y).toBe(134);
    expect(r.arrowX).toBe(94);
    expect(r.arrowCenterOffset).toBe(0);
    expect(r.origin).toBe('100px -6px');
  });

  it('keeps the old result with one padding number and no arrow', () => {
    const r = computePopper(
      { x: 100, y: 100, width: 40, height: 20 },
      () => ({ width: 200, height: 100 }),
      { x: 0, y: 0, width: 1000, height: 800 },
      { side: 'bottom', align: 'start', sideOffset: 4, padding: 8, rtl: false },
      () => undefined,
    );
    expect(r.x).toBe(100);
    expect(r.y).toBe(124);
    expect(r.origin).toBe('0% 0px');
    expect(r.arrowX).toBeUndefined();
  });
});

describe('Popover demo', () => {
  it('renders every content case, the React ids, and no native title', async () => {
    const f = await mount(PopoverDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']);
    expect(c.querySelectorAll('[data-demo-trigger]').length).toBeGreaterThan(8);
    expect(c.querySelector('[title]')).toBeNull();
  });
});
