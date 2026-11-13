// skeleton-swap, as React's Skeleton.tsx plays it (Alert/ghost.ts,
// fadeAway): the skeleton leaves at once and, before the next paint, a
// ghost of it fades out over duration.morph on ease.exit.
//
// Angular calls the host's animate.leave only where the document has
// getAnimations (a browser, not jsdom), so these tests call the leave
// handler as Angular does: with the node still in the document. The
// gallery check runs the real removal in Chromium.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsSkeleton } from './skeleton';

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
  imports: [DsSkeleton, DsTheme],
  template: `<div dsTheme="neutral"><div id="box">@if (loading()) {<span dsSkeleton></span>} @else {<p>Loaded</p>}</div></div>`,
})
class Host {
  readonly loading = signal(true);
}

/** Runs the leave as Angular does, then the swap. Returns whether the removal was let go at once. */
async function swap() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const debug = fixture.debugElement.query(By.directive(DsSkeleton));
  const el = debug.nativeElement as HTMLElement;
  let completed = false;
  (debug.componentInstance as unknown as { leave(e: { target: Element; animationComplete(): void }): void }).leave({
    target: el,
    animationComplete: () => (completed = true),
  });
  fixture.componentInstance.loading.set(false);
  await fixture.whenStable();
  expect(el.isConnected).toBe(false);
  return { fixture, completed };
}

describe('DsSkeleton motion', () => {
  let s: ReturnType<typeof stage>;
  beforeEach(() => (s = stage()));
  afterEach(() => s.restore());

  it('the skeleton leaves at once and its ghost fades out over duration.morph, as React', async () => {
    const { fixture, completed } = await swap();
    expect(completed).toBe(true);
    s.take();
    s.flush();
    const played = s.take();
    expect(played.length).toBe(1);
    const ghost = played[0]!.target as HTMLElement;
    expect(ghost.getAttribute('data-ds')).toBe('skeleton');
    expect(ghost.hasAttribute('inert')).toBe(true);
    expect(ghost.parentElement).toBe(fixture.nativeElement.querySelector('#box'));
    expect(played[0]!.options.id).toBe('ds-motion:ghost-fade');
    expect(played[0]!.keyframes.map((k) => k.opacity)).toEqual([1, 0]);
    expect(played[0]!.options.fill).toBe('forwards');
  });

  it('reduced motion: the ghost only fades, never moves', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { completed } = await swap();
    expect(completed).toBe(true);
    s.take();
    s.flush();
    expect(s.take().every((p) => !p.keyframes.some((k) => k.transform !== undefined))).toBe(true);
  });
});
