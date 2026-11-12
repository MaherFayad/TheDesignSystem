// progress-spring and progress-celebrate on ProgressCircle, as React plays
// them: the arc turns back by the change and into place (progress-sweep),
// the value rolls digit by digit, and reaching max pops the ring.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { popMark, sweepRing } from '../../internal/motion-feedback';
import { DsProgressCircle } from './progress-circle';

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
  imports: [DsProgressCircle, DsTheme],
  template: `<div dsTheme="neutral"><div dsProgressCircle label="Upload" size="lg" [value]="v()"></div></div>`,
})
class Host {
  readonly v = signal(20);
}

describe('DsProgressCircle motion', () => {
  let s: ReturnType<typeof stage>;
  beforeEach(() => (s = stage()));
  afterEach(() => s.restore());

  it('turns the arc, rolls the value, and pops on completion, as React', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(s.take()).toEqual([]);
    const root = fixture.nativeElement.querySelector('[data-ds="progress-circle"]');
    const indicator = root.querySelector('[data-part="indicator"]');
    fixture.componentInstance.v.set(60);
    await fixture.whenStable();
    let played = s.take();
    sweepRing(indicator, 0.2, 0.6);
    expect(played[0]).toEqual(s.take()[0]);
    expect(played[0]!.keyframes[0]!.transform).toBe('rotate(-144deg)');
    expect(played.slice(1).every((p) => String(p.options.id).startsWith('ds-motion:digit-roll'))).toBe(true);
    expect(root.querySelector('[data-part="value"]').textContent).toBe('60%');
    fixture.componentInstance.v.set(100);
    await fixture.whenStable();
    played = s.take();
    popMark(root, 'full', 'both');
    expect(played[0]).toEqual(s.take()[0]);
    expect(played[1]!.options.id).toBe('ds-motion:progress-sweep');
  });

  it('reduced motion: no turn and no pop; the value fades in', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.componentInstance.v.set(100);
    await fixture.whenStable();
    const ids = s.take().map((p) => p.options.id);
    expect(ids.includes('ds-motion:progress-sweep')).toBe(false);
    expect(ids.includes('ds-motion:pop-mark')).toBe(false);
  });
});
