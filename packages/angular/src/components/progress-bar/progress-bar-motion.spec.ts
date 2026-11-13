// progress-celebrate on ProgressBar, as React's useCelebrate plays it: the
// track pops on the block axis (popMark) once per completion, never on a
// first paint at max, and not under reduced motion.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { haloBurst, popMark } from '../../internal/motion-feedback';
import { DsProgressBar } from './progress-bar';

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
  imports: [DsProgressBar, DsTheme],
  template: `<div dsTheme="neutral"><div dsProgressBar label="Upload" [value]="v()"></div></div>`,
})
class Host {
  readonly v = signal(60);
}

describe('DsProgressBar motion', () => {
  let s: ReturnType<typeof stage>;
  beforeEach(() => (s = stage()));
  afterEach(() => s.restore());

  it('pops the track once and sends one halo from it when the value reaches max, as React', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(s.take()).toEqual([]);
    fixture.componentInstance.v.set(100);
    await fixture.whenStable();
    const played = s.take();
    const track = fixture.nativeElement.querySelector('[data-part="track"]');
    popMark(track, 'full', 'block');
    haloBurst(track, 'full');
    expect(played).toEqual(s.take());
    expect(played.map((p) => [p.target, p.options.id])).toEqual([[track, 'ds-motion:pop-mark'], [track, 'ds-motion:progress-halo']]);
    fixture.componentInstance.v.set(100);
    await fixture.whenStable();
    expect(s.take()).toEqual([]);
  });

  it('never pops on a first paint at max', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.v.set(100);
    await fixture.whenStable();
    expect(s.take()).toEqual([]);
  });

  it('reduced motion: no pop', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.componentInstance.v.set(100);
    await fixture.whenStable();
    expect(s.take()).toEqual([]);
  });
});
