// toast-stack, as React's Toaster.tsx plays it (stackShift.ts with the flip
// primitive on the snappy spring): when a toast leaves, the toasts that stay
// move from where they were to their new place with a transform.
import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { createToastStore, type ToastStore } from '@the-system/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsToaster } from './toaster';

interface Call {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

/** Records every el.animate call, gives each element a box from its order among visible siblings, and queues frames. */
function stage() {
  const calls: Call[] = [];
  const frames: FrameRequestCallback[] = [];
  // Stub on Element and HTMLElement: another spec may have left an own property on HTMLElement.prototype.
  const protos = [Element.prototype, HTMLElement.prototype];
  const names = ['animate', 'getBoundingClientRect'];
  const saved = protos.map((p) => names.map((n) => Object.getOwnPropertyDescriptor(p, n)));
  const raf = window.requestAnimationFrame;
  const animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    calls.push({ target: this, keyframes, options });
    return { id: options.id, playState: 'running', finished: Promise.resolve(), cancel() {}, effect: { getTiming: () => options } };
  };
  const rect = function (this: Element) {
    const siblings = this.parentElement ? [...this.parentElement.children] : [];
    const y = this.hasAttribute('inert') ? 0 : siblings.slice(0, siblings.indexOf(this)).filter((c) => !c.hasAttribute('inert')).length * 50;
    return { x: 0, y, top: y, left: 0, width: 100, height: 40, right: 100, bottom: y + 40, toJSON() {} } as DOMRect;
  };
  for (const p of protos) {
    Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
    Object.defineProperty(p, 'getBoundingClientRect', { configurable: true, writable: true, value: rect });
  }
  window.requestAnimationFrame = (cb) => frames.push(cb);
  return {
    take: () => calls.splice(0),
    flush: () => frames.splice(0).forEach((f) => f(0)),
    restore: () => {
      protos.forEach((p, i) =>
        names.forEach((n, j) => {
          const d = saved[i]![j];
          if (d) Object.defineProperty(p, n, d);
          else delete (p as unknown as Record<string, unknown>)[n];
        }),
      );
      window.requestAnimationFrame = raf;
      document.documentElement.removeAttribute('data-motion');
    },
  };
}

@Component({
  imports: [DsToaster, DsTheme],
  template: `<div dsTheme="neutral"><ng-container dsToaster [store]="store" /></div>`,
})
class Host {
  store!: ToastStore;
}

/** Each toast sits 60px below the one before it. */
function stackOffsets(): () => void {
  const had = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      const siblings = this.parentElement ? [...this.parentElement.children] : [];
      return siblings.indexOf(this) * 60;
    },
  });
  return () => {
    if (had) Object.defineProperty(HTMLElement.prototype, 'offsetTop', had);
  };
}

let fixture: ComponentFixture<Host> | null = null;
async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await fixture?.whenStable();
    await Promise.resolve();
  }
}

async function twoToasts(): Promise<{ store: ToastStore; second: HTMLElement }> {
  const store = createToastStore();
  fixture = TestBed.createComponent(Host);
  fixture.componentInstance.store = store;
  fixture.detectChanges();
  await settle();
  const first = store.add({ title: 'Draft 1 saved' });
  await settle();
  store.add({ title: 'Draft 2 saved' });
  await settle();
  const toasts = [...document.body.querySelectorAll('[data-ds="toaster"] > [data-ds="toast"]')] as HTMLElement[];
  expect(toasts.length).toBe(2);
  store.dismiss(first);
  store.remove(first);
  return { store, second: toasts[1]! };
}

describe('DsToaster motion', () => {
  let s: ReturnType<typeof stage>;
  let restoreOffsets: () => void;
  beforeEach(() => {
    s = stage();
    restoreOffsets = stackOffsets();
  });
  afterEach(() => {
    s.restore();
    restoreOffsets();
    fixture?.destroy();
    fixture = null;
    for (const el of Array.from(document.body.querySelectorAll('[data-toaster-layer]'))) el.remove();
  });

  it('a toast that stays moves into the gap on the snappy spring', async () => {
    const { second } = await twoToasts();
    s.take();
    await settle();
    const played = s.take().filter((p) => p.target === second);
    expect(played.map((p) => p.options.id)).toEqual(['ds-motion:flip']);
    expect(played[0]!.keyframes[0]!.transform).toBe('translate(0px, 60px)');
    expect(second.style.transformOrigin).toBe('');
  });

  it('reduced motion: the toast takes its new place at once', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { second } = await twoToasts();
    s.take();
    await settle();
    expect(s.take().filter((p) => p.target === second)).toEqual([]);
  });
});
