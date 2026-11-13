import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { createToastStore, type ToastClock, type ToastStore } from '@the-system/shared';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsToast } from './toast';
import { DsToaster, toastAnnouncement } from './toaster';
import { isInsideToaster } from './is-inside-toaster';

/** A clock the test moves by hand. */
function fakeClock() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const clock: ToastClock = {
    now: () => now,
    setTimeout: (fn, ms) => {
      seq += 1;
      timers.set(seq, { at: now + ms, fn });
      return seq;
    },
    clearTimeout: (h) => {
      timers.delete(h as number);
    },
  };
  const advance = (ms: number) => {
    now += ms;
    for (const [id, t] of [...timers].sort((a, b) => a[1].at - b[1].at)) {
      if (t.at <= now && timers.has(id)) {
        timers.delete(id);
        t.fn();
      }
    }
  };
  return { clock, advance };
}

@Component({
  imports: [DsToaster, DsTheme, DsButton],
  template: `
    <div dsTheme="desk" scheme="light" [lang]="lang()">
      <ng-container dsToaster [store]="store" position="top-end" />
      <button id="outside" dsButton>Open board</button>
    </div>
  `,
})
class ToasterHost {
  store!: ToastStore;
  readonly lang = signal<'en' | 'ar'>('en');
}

let fixture: ComponentFixture<ToasterHost> | null = null;
let advance: (ms: number) => void = () => undefined;

async function setup(): Promise<{ store: ToastStore; fixture: ComponentFixture<ToasterHost> }> {
  const fake = fakeClock();
  advance = fake.advance;
  const store = createToastStore({ clock: fake.clock });
  TestBed.configureTestingModule({});
  fixture = TestBed.createComponent(ToasterHost);
  fixture.componentInstance.store = store;
  fixture.detectChanges();
  await settle();
  return { store, fixture };
}

/** Lets effects, render hooks and promise callbacks run. */
async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await fixture?.whenStable();
    await Promise.resolve();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const layer = () => document.body.querySelector('[data-toaster-layer]') as HTMLElement | null;
const list = () => document.body.querySelector('[data-ds="toaster"]') as HTMLElement;
const toasts = () => Array.from(document.body.querySelectorAll('[data-ds="toaster"] > [data-ds="toast"]')) as HTMLElement[];

afterEach(() => {
  fixture?.destroy();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-toaster-layer]'))) el.remove();
});

describe('DsToaster', () => {
  it('renders the layer in body with the copied theme, the live regions, the region and the list', async () => {
    await setup();
    const wrap = layer() as HTMLElement;
    expect(wrap.parentElement).toBe(document.body);
    expect(wrap.getAttribute('data-ds')).toBe('theme');
    expect(wrap.getAttribute('data-style')).toBe('desk');
    expect(wrap.getAttribute('data-scheme')).toBe('light');
    expect(wrap.getAttribute('aria-live')).toBe('off');
    const children = Array.from(wrap.children);
    expect(children.map((c) => c.getAttribute('data-toaster-announce') ?? c.getAttribute('role'))).toEqual(['polite', 'assertive', 'region']);
    expect(children[0]?.getAttribute('role')).toBe('status');
    expect(children[1]?.getAttribute('role')).toBe('alert');
    const region = children[2] as HTMLElement;
    expect(region.getAttribute('aria-label')).toBe('Notifications');
    expect(region.style.pointerEvents).toBe('none');
    expect(list().getAttribute('data-position')).toBe('top-end');
    expect(list().getAttribute('tabindex')).toBe('-1');
    // No focus proxies while empty.
    expect(region.children.length).toBe(1);
  });

  it('renders a toast with the anatomy, the tone, and the Radix attributes', async () => {
    const { store } = await setup();
    store.add({ tone: 'success', title: 'Draft saved', description: 'Saved a moment ago.' });
    await settle();
    const [el] = toasts();
    expect(el?.getAttribute('data-state')).toBe('open');
    expect(el?.getAttribute('data-tone')).toBe('success');
    expect(el?.getAttribute('data-swipe-direction')).toBe('right');
    expect(el?.getAttribute('tabindex')).toBe('0');
    expect(el?.hasAttribute('role')).toBe(false);
    // A timed toast ends with its progress line (toast-timer).
    expect(Array.from(el?.children ?? []).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'title', 'description', 'close', 'progress']);
    const close = el?.querySelector('[data-part="close"]') as HTMLElement;
    expect(close.getAttribute('data-ds')).toBe('close-button');
    expect(close.getAttribute('aria-label')).toBe('Close notification');
    expect(close.getAttribute('data-size')).toBe('xs');
    const region = layer()?.children[2] as HTMLElement;
    expect(region.style.pointerEvents).toBe('');
    expect(region.children.length).toBe(3);
  });

  it('times out a neutral toast through the store clock, and a danger toast stays', async () => {
    const { store } = await setup();
    store.add({ title: 'Board duplicated' });
    store.add({ tone: 'danger', title: 'Could not publish page' });
    await settle();
    expect(toasts().length).toBe(2);
    advance(4000);
    await settle();
    expect(toasts().map((t) => t.getAttribute('data-tone'))).toEqual(['danger']);
    advance(60_000);
    await settle();
    expect(toasts().length).toBe(1);
  });

  it('shows three and keeps the rest waiting', async () => {
    const { store } = await setup();
    for (let i = 0; i < 5; i += 1) store.add({ title: `File ${i} uploaded`, dedupeKey: false });
    await settle();
    expect(toasts().length).toBe(3);
    expect(store.getSnapshot().queued.length).toBe(2);
  });

  it('the close button closes the toast', async () => {
    const { store } = await setup();
    store.add({ tone: 'danger', title: 'Could not publish page' });
    await settle();
    (toasts()[0]?.querySelector('[data-part="close"]') as HTMLElement).click();
    await settle();
    expect(toasts().length).toBe(0);
    expect(store.getSnapshot().visible.length).toBe(0);
  });

  it('the action runs and closes the toast', async () => {
    const { store } = await setup();
    let runs = 0;
    store.add({ title: 'Card moved', action: { label: 'Undo move', onAction: () => (runs += 1), altText: 'Move it back from the list' } });
    await settle();
    const action = toasts()[0]?.querySelector('[data-part="action"]') as HTMLElement;
    expect(action.getAttribute('data-ds')).toBe('button');
    expect(action.getAttribute('data-radix-toast-announce-alt')).toBe('Move it back from the list');
    action.click();
    await settle();
    expect(runs).toBe(1);
    expect(toasts().length).toBe(0);
  });

  it('a repeat changes the toast in place: same element and a count', async () => {
    const { store } = await setup();
    store.add({ title: 'Link copied' });
    await settle();
    const first = toasts()[0];
    store.add({ title: 'Link copied' });
    await settle();
    expect(toasts()[0]).toBe(first);
    expect(first?.querySelector('[data-part="count"]')?.textContent).toBe('×2');
  });

  it('a toast with its own lang carries lang, dir and the close label of that language', async () => {
    const { store } = await setup();
    store.add({ lang: 'ar', title: 'المسودة محفوظة' });
    await settle();
    const el = toasts()[0] as HTMLElement;
    expect(el.getAttribute('lang')).toBe('ar');
    expect(el.getAttribute('dir')).toBe('rtl');
    expect(el.querySelector('[data-part="close"]')?.getAttribute('aria-label')).toBe('إغلاق التنبيه');
  });

  it('announces once per change, danger in the assertive region', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved' });
    store.add({ tone: 'danger', title: 'Upload stopped', action: { label: 'Retry upload', onAction: () => undefined, altText: 'Upload again from Files' } });
    await settle();
    await sleep(150);
    await settle();
    const [polite, assertive] = Array.from(layer()?.children ?? []);
    expect(polite?.textContent).toBe('Notification. Draft saved.');
    expect(assertive?.textContent).toBe('Notification. Upload stopped. Upload again from Files.');
    expect(toastAnnouncement({ title: 'Saved!', description: ' Done ' })).toBe('Saved! Done.');
  });

  it('F8 moves focus to the list', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved' });
    await settle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true }));
    expect(document.activeElement).toBe(list());
  });

  it('pauses the store while focus is inside', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved' });
    await settle();
    toasts()[0]?.focus();
    await settle();
    expect(store.isPaused()).toBe(true);
    (document.getElementById('outside') as HTMLElement).focus();
    await settle();
    expect(store.isPaused()).toBe(false);
  });

  it('Escape closes a toast only from inside the toaster', async () => {
    const { store } = await setup();
    store.add({ tone: 'danger', title: 'Could not publish page' });
    await settle();
    const outside = document.getElementById('outside') as HTMLElement;
    outside.focus();
    outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(toasts().length).toBe(1);
    const el = toasts()[0] as HTMLElement;
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(toasts().length).toBe(0);
    // Focus that was in the toast moves to the list.
    expect(document.activeElement).toBe(list());
  });

  it('isInsideToaster tells the toaster from the page', async () => {
    const { store } = await setup();
    store.add({ title: 'Draft saved' });
    await settle();
    expect(isInsideToaster(toasts()[0] as HTMLElement)).toBe(true);
    expect(isInsideToaster(document.getElementById('outside'))).toBe(false);
  });

  it('follows the theme language for the region name', async () => {
    const { fixture } = await setup();
    fixture.componentInstance.lang.set('ar');
    await settle();
    expect(layer()?.getAttribute('lang')).toBe('ar');
    expect(layer()?.children[2]?.getAttribute('aria-label')).toBe('التنبيهات');
  });
});

@Component({
  imports: [DsToast],
  template: `
    <div id="plain" dsToast title="Board duplicated"></div>
    <div id="full" dsToast lang="en" tone="danger" title="Could not publish page" description="Your draft is safe." [count]="3" [onClose]="onClose"></div>
  `,
})
class ToastHost {
  closes = 0;
  readonly onClose = () => {
    this.closes += 1;
  };
}

describe('DsToast', () => {
  it('renders the anatomy with no behavior, no data-state and no close button without onClose', async () => {
    const f = TestBed.createComponent(ToastHost);
    await f.whenStable();
    const el = f.nativeElement.querySelector('#plain') as HTMLElement;
    expect(el.getAttribute('data-ds')).toBe('toast');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.hasAttribute('data-state')).toBe(false);
    expect(el.hasAttribute('title')).toBe(false);
    expect(el.hasAttribute('lang')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'title']);
    expect(el.querySelector('[data-part="icon"] svg')?.getAttribute('data-icon')).toBe('bell');
  });

  it('onClose renders the close button, lang sets lang and dir, count shows', async () => {
    const f = TestBed.createComponent(ToastHost);
    await f.whenStable();
    const el = f.nativeElement.querySelector('#full') as HTMLElement;
    expect(el.getAttribute('lang')).toBe('en');
    expect(el.getAttribute('dir')).toBe('ltr');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'title', 'description', 'close']);
    expect(el.querySelector('[data-part="count"]')?.getAttribute('aria-hidden')).toBe('true');
    (el.querySelector('[data-part="close"]') as HTMLElement).click();
    expect(f.componentInstance.closes).toBe(1);
    for (const name of ['dstoast', 'tone', 'title', 'description', 'count', 'onclose']) expect(el.hasAttribute(name)).toBe(false);
  });
});
