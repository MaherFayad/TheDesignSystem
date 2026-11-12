// meter-fill, as React's useFillOnView plays it: a meter on screen at mount
// fills at once on ease.spring-soft over duration.reveal; one off screen
// holds an inline scaleX(0) until an IntersectionObserver sees it.
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
  const proto = Element.prototype as unknown as Record<string, unknown>;
  const had = { animate: proto['animate'], rect: proto['getBoundingClientRect'], raf: window.requestAnimationFrame };
  proto['animate'] = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    calls.push({ target: this, keyframes, options });
    return { id: options.id, playState: 'running', finished: Promise.resolve(), cancel() {}, effect: { getTiming: () => options } };
  };
  proto['getBoundingClientRect'] = function (this: Element) {
    const siblings = this.parentElement ? [...this.parentElement.children] : [];
    const y = this.hasAttribute('inert') ? 0 : siblings.slice(0, siblings.indexOf(this)).filter((c) => !c.hasAttribute('inert')).length * 50;
    return { x: 0, y, top: y, left: 0, width: 100, height: 40, right: 100, bottom: y + 40, toJSON() {} } as DOMRect;
  };
  window.requestAnimationFrame = (cb) => frames.push(cb);
  return {
    take: () => calls.splice(0),
    flush: () => frames.splice(0).forEach((f) => f(0)),
    restore: () => {
      proto['animate'] = had.animate;
      proto['getBoundingClientRect'] = had.rect;
      window.requestAnimationFrame = had.raf;
      document.documentElement.removeAttribute('data-motion');
    },
  };
}

const FILL = 'transform var(--ds-duration-reveal) var(--ds-ease-spring-soft)';
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

  it('on screen at mount: the fill transitions from 0 on the soft spring over duration.reveal', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = indicator(fixture);
    expect(el.style.transition).toBe(FILL);
    expect(el.style.transform).toBe('');
  });

  it('off screen: held at scaleX(0) until seen, then fills', async () => {
    const proto = Element.prototype as unknown as Record<string, unknown>;
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
  });
});
