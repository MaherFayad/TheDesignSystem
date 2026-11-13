// Order 1.23 in the toaster, as React's Toaster.tsx: the stack (stack.ts,
// here internal/toast-stack.ts) with data-stacked and the place values,
// toast-expand (data-expanded on hover or focus inside), toast-timer (the
// progress line and data-paused from the boolean that pauses the store),
// toast-swipe (internal/toast-swipe.ts), and position auto.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { createToastStore, type ToastClock, type ToastStore } from '@the-system/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { stackLayout } from '../../internal/toast-stack';
import { RUBBER_MAX, rubberBand, swipeCloses, swipeVelocity } from '../../internal/toast-swipe';
import { DsToaster, resolveToasterPosition, type ToasterPositionProp } from './toaster';

/** A clock that never fires on its own, so toasts stay until a test closes them. */
function stillClock(): ToastClock {
  let seq = 0;
  return { now: () => 0, setTimeout: () => ++seq, clearTimeout: () => undefined };
}

@Component({
  imports: [DsToaster, DsTheme],
  template: `
    <div dsTheme="neutral" [platform]="platform()" [dir]="dir()">
      <ng-container dsToaster [store]="store" [position]="position()" />
    </div>
    <button id="away" type="button">Away</button>
  `,
})
class Host {
  store!: ToastStore;
  readonly position = signal<ToasterPositionProp>('bottom-end');
  readonly platform = signal<'web' | 'ios'>('web');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

let fixture: ComponentFixture<Host> | null = null;

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await fixture?.whenStable();
    await Promise.resolve();
  }
}

/** Whether the store was last told to pause. */
let storePaused = false;

async function setup(): Promise<{ store: ToastStore; host: Host }> {
  const store = createToastStore({ clock: stillClock() });
  const { pause, resume } = store;
  storePaused = false;
  store.pause = () => {
    storePaused = true;
    pause();
  };
  store.resume = () => {
    storePaused = false;
    resume();
  };
  fixture = TestBed.createComponent(Host);
  fixture.componentInstance.store = store;
  fixture.detectChanges();
  await settle();
  return { store, host: fixture.componentInstance };
}

const list = () => document.body.querySelector('[data-ds="toaster"]') as HTMLElement;
const toasts = () => Array.from(document.body.querySelectorAll('[data-ds="toaster"] > [data-ds="toast"]')) as HTMLElement[];

/** Each toast is 40px tall, or 60px when its title says "tall". */
function heights(): () => void {
  const had = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.textContent?.includes('tall') ? 60 : 40;
    },
  });
  return () => {
    if (had) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', had);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)['offsetHeight'];
  };
}

let stamp = 0;
function pointer(target: Element, type: string, clientX: number, clientY: number, time?: number): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY, button: 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  stamp = time ?? stamp + 16;
  Object.defineProperty(event, 'timeStamp', { value: stamp });
  target.dispatchEvent(event);
  return event;
}

let restoreHeights: () => void = () => undefined;
beforeEach(() => {
  restoreHeights = heights();
});
afterEach(() => {
  restoreHeights();
  fixture?.destroy();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-toaster-layer]'))) el.remove();
  document.documentElement.removeAttribute('data-motion');
});

describe('toast-stack', () => {
  it('stackLayout: open toasts only, the newest at index 0, offsets with the gap', () => {
    const [a, b, c] = [document.createElement('li'), document.createElement('li'), document.createElement('li')];
    const layout = stackLayout(
      [
        { el: a, height: 40, open: true },
        { el: b, height: 60, open: false },
        { el: c, height: 50, open: true },
      ],
      8,
    );
    expect(layout.places.get(c)).toEqual({ index: 0, offset: 0 });
    expect(layout.places.get(a)).toEqual({ index: 1, offset: 58 });
    expect(layout.places.has(b)).toBe(false);
    expect(layout.front).toBe(50);
    expect(layout.total).toBe(98);
  });

  it('the list is stacked and each toast carries its place, as React writes it', async () => {
    const { store } = await setup();
    expect(list().hasAttribute('data-stacked')).toBe(true);
    store.add({ title: 'Draft 1 saved, tall' });
    await settle();
    store.add({ title: 'Draft 2 saved' });
    await settle();
    const [older, newer] = toasts();
    expect(newer!.style.getPropertyValue('--_toast-index')).toBe('0');
    expect(newer!.style.getPropertyValue('--_toast-offset')).toBe('0px');
    expect(newer!.style.getPropertyValue('--_toast-height')).toBe('40px');
    expect(older!.style.getPropertyValue('--_toast-index')).toBe('1');
    expect(older!.style.getPropertyValue('--_toast-height')).toBe('60px');
    expect(older!.style.getPropertyValue('--_toast-front-height')).toBe('40px');
    expect(list().style.getPropertyValue('--_toaster-front-height')).toBe('40px');
    // jsdom has no row gap, so the list is the two heights.
    expect(older!.style.getPropertyValue('--_toast-offset')).toBe('40px');
    expect(list().style.getPropertyValue('--_toaster-height')).toBe('100px');
    // The host style comes first, then the stack values, in React's order.
    expect(newer!.getAttribute('style')).toMatch(/^user-select: none; touch-action: none; --_toast-index: 0; --_toast-offset: 0px; --_toast-height: 40px; --_toast-front-height: 40px;$/);
  });

  it('a closing toast keeps its last place while the others move up', async () => {
    const { store } = await setup();
    const first = store.add({ title: 'Draft 1 saved' });
    await settle();
    store.add({ title: 'Draft 2 saved' });
    await settle();
    const [older] = toasts();
    store.dismiss(store.getSnapshot().visible[1]!.id);
    await settle();
    expect(older!.getAttribute('data-state')).toBe('open');
    expect(older!.style.getPropertyValue('--_toast-index')).toBe('0');
    expect(store.getSnapshot().visible.some((t) => t.id === first)).toBe(true);
  });
});

describe('toast-expand and toast-timer', () => {
  it('hover over a toast expands the stack and pauses; leaving the toaster collapses it', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved' });
    await settle();
    const toast = toasts()[0]!;
    toast.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
    await settle();
    expect(list().hasAttribute('data-expanded')).toBe(true);
    expect(list().hasAttribute('data-paused')).toBe(true);
    expect(storePaused).toBe(true);
    // Into the gap of the list: still inside the toaster, so it stays open.
    toast.dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: list() }));
    await settle();
    expect(list().hasAttribute('data-expanded')).toBe(true);
    toast.dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.getElementById('away') }));
    await settle();
    expect(list().hasAttribute('data-expanded')).toBe(false);
    expect(list().hasAttribute('data-paused')).toBe(false);
    expect(storePaused).toBe(false);
  });

  it('focus inside expands; a blurred window pauses without expanding', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved' });
    await settle();
    toasts()[0]!.focus();
    await settle();
    expect(list().hasAttribute('data-expanded')).toBe(true);
    (document.getElementById('away') as HTMLElement).focus();
    await settle();
    expect(list().hasAttribute('data-expanded')).toBe(false);
    window.dispatchEvent(new Event('blur'));
    await settle();
    expect(list().hasAttribute('data-paused')).toBe(true);
    expect(list().hasAttribute('data-expanded')).toBe(false);
    expect(storePaused).toBe(true);
    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(list().hasAttribute('data-paused')).toBe(false);
  });

  it('a timed toast has the progress line with its life; a danger or action toast has none', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved', tone: 'success' });
    store.add({ title: 'Could not publish', tone: 'danger' });
    store.add({ title: 'Card moved', action: { label: 'Undo move', onAction: () => undefined } });
    await settle();
    const [timed, danger, action] = toasts();
    const line = timed!.lastElementChild as HTMLElement;
    expect(line.getAttribute('data-part')).toBe('progress');
    expect(line.tagName).toBe('SPAN');
    expect(line.getAttribute('aria-hidden')).toBe('true');
    expect(line.getAttribute('style')).toBe(`--_toast-life: ${store.getSnapshot().visible[0]!.duration}ms;`);
    expect(danger!.querySelector('[data-part="progress"]')).toBeNull();
    expect(action!.querySelector('[data-part="progress"]')).toBeNull();
  });

  it('a repeat starts the line again (a new element per version)', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved' });
    await settle();
    const before = toasts()[0]!.querySelector('[data-part="progress"]');
    store.add({ title: 'Draft saved' });
    await settle();
    const after = toasts()[0]!.querySelector('[data-part="progress"]');
    expect(toasts().length).toBe(1);
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
  });
});

describe('toast-swipe', () => {
  it('the pure rules: rubber band capped, distance and flick close', () => {
    expect(rubberBand(30)).toBe(30);
    expect(rubberBand(-24)).toBe(-12);
    expect(rubberBand(-10000)).toBeGreaterThan(-RUBBER_MAX);
    expect(swipeCloses(50, 0)).toBe(true);
    expect(swipeCloses(49, 0)).toBe(false);
    expect(swipeCloses(10, 0.31)).toBe(true);
    expect(swipeCloses(7, 1)).toBe(false);
    expect(swipeVelocity([{ t: 0, along: 0 }, { t: 150, along: 10 }, { t: 200, along: 40 }])).toBeCloseTo(0.6);
  });

  it('follows toward the edge and closes past 50px', async () => {
    const { store } = await setup();
    store.add({ title: 'Board duplicated' });
    await settle();
    const toast = toasts()[0]!;
    pointer(toast, 'pointerdown', 100, 10, 0);
    pointer(toast, 'pointermove', 101, 10, 200);
    expect(toast.hasAttribute('data-swipe')).toBe(false);
    pointer(toast, 'pointermove', 130, 10, 400);
    expect(toast.getAttribute('data-swipe')).toBe('move');
    expect(toast.style.getPropertyValue('--radix-toast-swipe-move-x')).toBe('30px');
    expect(toast.style.getPropertyValue('--radix-toast-swipe-move-y')).toBe('0px');
    pointer(toast, 'pointermove', 160, 10, 1000);
    pointer(toast, 'pointerup', 160, 10, 1400);
    await settle();
    expect(toast.getAttribute('data-swipe')).toBe('end');
    expect(toast.style.getPropertyValue('--radix-toast-swipe-move-x')).toBe('');
    expect(toast.style.getPropertyValue('--radix-toast-swipe-end-x')).toBe('60px');
    expect(store.getSnapshot().visible[0]?.state ?? 'closed').toBe('closed');
  });

  it('gives at most 24px the other way and springs back short of the distance', async () => {
    const { store } = await setup();
    store.add({ title: 'Board duplicated' });
    await settle();
    const toast = toasts()[0]!;
    pointer(toast, 'pointerdown', 100, 10, 0);
    pointer(toast, 'pointermove', 76, 10, 500);
    expect(toast.getAttribute('data-swipe')).toBe('move');
    expect(toast.style.getPropertyValue('--radix-toast-swipe-move-x')).toBe('-12px');
    pointer(toast, 'pointermove', -900, 10, 1000);
    expect(Number.parseFloat(toast.style.getPropertyValue('--radix-toast-swipe-move-x'))).toBeGreaterThan(-24);
    pointer(toast, 'pointerup', -900, 10, 1500);
    await settle();
    expect(toast.getAttribute('data-swipe')).toBe('cancel');
    expect(store.getSnapshot().visible[0]!.state).toBe('open');
  });

  it('a short flick toward the edge closes', async () => {
    const { store } = await setup();
    store.add({ title: 'Board duplicated' });
    await settle();
    const toast = toasts()[0]!;
    pointer(toast, 'pointerdown', 100, 10, 0);
    pointer(toast, 'pointermove', 105, 10, 1000);
    pointer(toast, 'pointermove', 120, 10, 1040);
    pointer(toast, 'pointerup', 120, 10, 1050);
    await settle();
    expect(toast.getAttribute('data-swipe')).toBe('end');
  });

  it('a gesture across the axis is not a swipe; in rtl the edge is the left', async () => {
    const { store, host } = await setup();
    host.dir.set('rtl');
    store.add({ title: 'Board duplicated' });
    await settle();
    const toast = toasts()[0]!;
    expect(toast.getAttribute('data-swipe-direction')).toBe('left');
    pointer(toast, 'pointerdown', 100, 10, 0);
    pointer(toast, 'pointermove', 100, 40, 100);
    pointer(toast, 'pointermove', 40, 40, 200);
    expect(toast.hasAttribute('data-swipe')).toBe(false);
    pointer(toast, 'pointerup', 40, 40, 300);
    pointer(toast, 'pointerdown', 100, 10, 400);
    pointer(toast, 'pointermove', 40, 10, 600);
    expect(toast.style.getPropertyValue('--radix-toast-swipe-move-x')).toBe('-60px');
  });
});

describe('position auto', () => {
  it('resolves top-center on ios and bottom-end elsewhere', async () => {
    expect(resolveToasterPosition('auto', 'ios')).toBe('top-center');
    expect(resolveToasterPosition('auto', 'android')).toBe('bottom-end');
    expect(resolveToasterPosition('top-end', 'ios')).toBe('top-end');
    const { host, store } = await setup();
    host.position.set('auto');
    await settle();
    expect(list().getAttribute('data-position')).toBe('bottom-end');
    host.platform.set('ios');
    store.add({ title: 'Draft saved' });
    await settle();
    expect(list().getAttribute('data-position')).toBe('top-center');
    expect(toasts()[0]!.getAttribute('data-swipe-direction')).toBe('up');
  });
});
