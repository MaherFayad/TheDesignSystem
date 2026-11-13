// progress-spring and progress-celebrate on ProgressCircle, as React plays
// them (round 3): the arc is an SVG circle the CSS draws with
// stroke-dashoffset (no script turn), the value rolls digit by digit, and
// reaching max pops the ring and sends a halo from the indicator.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { haloBurst, popMark } from '@the-system/motion';
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

  it('renders the arc svg, rolls the value with no turn, and pops with a halo on completion, as React', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(s.take()).toEqual([]);
    const root = fixture.nativeElement.querySelector('[data-ds="progress-circle"]');
    const indicator = root.querySelector(':scope > [data-part="indicator"]');
    const arc = indicator.querySelector(':scope > svg[data-part="arc"]');
    expect(arc.getAttribute('aria-hidden')).toBe('true');
    expect(arc.getAttribute('focusable')).toBe('false');
    expect(arc.querySelector(':scope > circle').getAttribute('pathLength')).toBe('100');
    fixture.componentInstance.v.set(60);
    await fixture.whenStable();
    let played = s.take();
    expect(played.length).toBeGreaterThan(0);
    expect(played.every((p) => String(p.options.id).startsWith('ds-motion:digit-roll'))).toBe(true);
    expect(root.querySelector('[data-part="value"]').textContent).toBe('60%');
    fixture.componentInstance.v.set(100);
    await fixture.whenStable();
    played = s.take();
    popMark(root, 'full', 'both');
    haloBurst(indicator, 'full');
    const [pop, halo] = s.take();
    expect(played[0]).toEqual(pop);
    expect(played[1]).toEqual(halo);
    expect(played[1]!.target).toBe(indicator);
    expect(played.some((p) => p.options.id === 'ds-motion:progress-sweep')).toBe(false);
  });

  it('the progress-spring off row (--_progress-circle-duration: 0s) changes the text with no roll, as React (order 1.29, N31)', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    s.take();
    const value = fixture.nativeElement.querySelector('[data-ds="progress-circle"] [data-part="value"]') as HTMLElement;
    value.style.setProperty('--_progress-circle-duration', '0s');
    fixture.componentInstance.v.set(60);
    await fixture.whenStable();
    expect(s.take().filter((p) => String(p.options.id).startsWith('ds-motion:digit-roll'))).toEqual([]);
    expect(value.textContent).toBe('60%');
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
    expect(ids.includes('ds-motion:progress-halo')).toBe(false);
  });
});
