// meter-fill, as React's useFillOnView plays it: a meter on screen at mount
// fills at once on --_meter-reveal-ease over --_meter-reveal-duration (round
// 3); one off screen holds an inline scaleX(0) until an IntersectionObserver
// sees it. Round 3: the value text lands at --_meter-value-at of the reveal.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsMeter } from './meter';

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

const FILL = 'transform var(--_meter-reveal-duration) var(--_meter-reveal-ease)';
let seen: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
class FakeObserver {
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    seen = cb;
  }
  observe() {}
  disconnect() {}
}

@Component({
  imports: [DsMeter, DsTheme],
  template: `<div dsTheme="neutral"><div dsMeter label="Storage used" [value]="v()"></div></div>`,
})
class Host {
  readonly v = signal(72);
}

describe('DsMeter motion', () => {
  let s: ReturnType<typeof stage>;
  const had = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  beforeEach(() => {
    s = stage();
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeObserver;
    seen = null;
  });
  afterEach(() => {
    s.restore();
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = had;
  });

  const indicator = (f: { nativeElement: HTMLElement }) => f.nativeElement.querySelector('[data-part="indicator"]') as HTMLElement;

  it('on screen at mount: the fill transitions from 0 on the private reveal timing, and the value lands on the bouncy spring', async () => {
    const root = document.documentElement.style;
    root.setProperty('--ds-duration-reveal', '640ms');
    root.setProperty('--ds-duration-spring-bouncy', '220ms');
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const el = indicator(fixture);
      expect(el.style.transition).toBe(FILL);
      expect(el.style.transform).toBe('');
      const [land, ...rest] = s.take();
      expect(rest).toEqual([]);
      expect(land!.target).toBe(fixture.nativeElement.querySelector('[data-ds="meter"] > [data-part="value"]'));
      expect(land!.keyframes).toEqual([{ transform: 'translateY(var(--ds-distance-nudge))', color: 'var(--ds-color-text-muted)' }, { transform: 'none' }]);
      // --_meter-value-at is 0.6 by default (the CSS is not loaded here): the beat waits 60% of the reveal.
      expect(land!.options).toMatchObject({ id: 'ds-motion:meter-value', duration: 220, delay: 384, fill: 'backwards' });
    } finally {
      root.removeProperty('--ds-duration-reveal');
      root.removeProperty('--ds-duration-spring-bouncy');
    }
  });

  it('off screen: held at scaleX(0) until seen, then fills', async () => {
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    const rect = proto['getBoundingClientRect'];
    proto['getBoundingClientRect'] = () => ({ top: 5000, bottom: 5040 }) as DOMRect;
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    proto['getBoundingClientRect'] = rect;
    const el = indicator(fixture);
    expect(el.style.transform).toBe('scaleX(0)');
    expect(el.style.transition).toBe('none');
    seen?.([{ isIntersecting: true }]);
    expect(el.style.transform).toBe('');
    expect(el.style.transition).toBe(FILL);
  });

  it('reduced motion: the value at once, no hold and no transition', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = indicator(fixture);
    expect(el.style.transform).toBe('');
    expect(el.style.transition).toBe('');
    expect(s.take()).toEqual([]);
  });
});
