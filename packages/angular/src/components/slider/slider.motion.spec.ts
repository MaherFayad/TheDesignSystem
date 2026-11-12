// Order 1.22 motion of Slider and RangeSlider: slider-bubble (the value
// bubble with rolled digits) and slider-nudge (one swing toward the end), with
// React's arguments. jsdom has no Web Animations API, so Element.animate
// records each call; a replay of the primitive with React's arguments must
// record the same calls.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDigits, rollDigits } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { DsRangeSlider } from '../range-slider/range-slider';
import { DsSlider } from './slider';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];
const take = (): Call[] => {
  const out = calls;
  calls = [];
  return out;
};
/** A call without its element, to compare a replay on another element. */
const shape = (c: Call) => ({ frames: c.frames, opts: c.opts });

const PROTOS = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
const saved = new Map<object, PropertyDescriptor | undefined>();

beforeEach(() => {
  calls = [];
  // On every prototype a spec may stub, so a stub another spec file left on HTMLElement does not shadow this one.
  const record = vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
      calls.push({ el: this, frames, opts });
      const effect = { composite: 'replace', getTiming: () => ({ duration: Number(opts?.duration ?? 0) }) };
      return { id: String(opts?.id ?? ''), effect, finished: new Promise(() => undefined), cancel: vi.fn() } as unknown as Animation;
    });
  for (const proto of PROTOS) {
    saved.set(proto, Object.getOwnPropertyDescriptor(proto, 'animate'));
    Object.defineProperty(proto, 'animate', { configurable: true, writable: true, value: record });
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto['hasPointerCapture'] = () => true;
  proto['setPointerCapture'] = () => undefined;
  proto['releasePointerCapture'] = () => undefined;
});

afterEach(() => {
  for (const proto of PROTOS) {
    const before = saved.get(proto);
    if (before) Object.defineProperty(proto, 'animate', before);
    else Reflect.deleteProperty(proto, 'animate');
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  for (const k of ['hasPointerCapture', 'setPointerCapture', 'releasePointerCapture']) Reflect.deleteProperty(proto, k);
  document.documentElement.removeAttribute('data-motion');
  vi.restoreAllMocks();
});

@Component({
  imports: [DsSlider, DsRangeSlider],
  template: `
    <div data-test="one" dsSlider aria-label="Zoom" unit="%" [min]="0" [max]="100" [defaultValue]="40"></div>
    <div data-test="range" dsRangeSlider label="Budget" [thumbLabels]="['Lowest', 'Highest']" [min]="0" [max]="100" [defaultValue]="[20, 80]"></div>
  `,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const motion = TestBed.runInInjectionContext(() => injectMotion());
  return { fixture, root, settle, motion };
}

function pointer(target: Element, type: string, clientX: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  target.dispatchEvent(event);
}

describe('slider motion, order 1.22', () => {
  it('slider-bubble: each thumb holds an aria-hidden bubble with the value text, written still at rest', async () => {
    const { root } = await setup();
    for (const id of ['one', 'range']) {
      for (const thumb of Array.from(root(id).querySelectorAll('[role="slider"]'))) {
        const bubble = thumb.querySelector(':scope > span');
        expect(bubble?.getAttribute('aria-hidden')).toBe('true');
        expect(bubble?.textContent).toBe(thumb.getAttribute('aria-valuetext'));
      }
    }
    expect(take()).toEqual([]);
  });

  for (const reduced of [false, true]) {
    it(`slider-bubble: a drag rolls the digits with React's rollDigits arguments${reduced ? ' (reduced)' : ''}`, async () => {
      if (reduced) document.documentElement.setAttribute('data-motion', 'reduce');
      const { root, settle, motion } = await setup();
      const control = root('one').querySelector('[data-part="control"]') as HTMLElement;
      const rect = { x: 0, y: 0, left: 0, top: 0, width: 100, height: 20, right: 100, bottom: 20, toJSON: () => ({}) } as DOMRect;
      vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(rect);
      vi.spyOn(control.querySelector('[data-part="track"]') as HTMLElement, 'getBoundingClientRect').mockReturnValue(rect);
      const thumb = root('one').querySelector('[role="slider"]') as HTMLElement;
      pointer(thumb, 'pointerdown', 40);
      await settle();
      take();
      pointer(thumb, 'pointermove', 57);
      await settle();
      expect(thumb.getAttribute('aria-valuenow')).toBe('57');
      const got = take();
      expect(got.length).toBeGreaterThan(0);
      const replay = document.createElement('span');
      document.body.append(replay);
      renderDigits(replay, '40%');
      take();
      rollDigits(replay, '40%', '57%', { direction: 'up', mode: motion.mode('slider-bubble') });
      expect(got.map(shape)).toEqual(take().map(shape));
      if (reduced) expect(motion.mode('slider-bubble')).toBe('reduced');
      replay.remove();
    });
  }

  it("slider-nudge: a key past the end nudges the thumb with React's shake arguments, added to the lift", async () => {
    const { root, settle, motion } = await setup();
    const thumb = root('range').querySelector('[data-thumb="end"]') as HTMLElement;
    thumb.focus();
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    await settle();
    take();
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await settle();
    const got = take();
    expect(got.map((c) => c.el)).toEqual([thumb]);
    motion.play(thumb, 'shake', 'slider-nudge', { swings: 1, toward: 'end' });
    expect(got).toEqual(take());
    // A held key does not nudge again.
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true, cancelable: true }));
    await settle();
    expect(take()).toEqual([]);
  });

  it('slider-nudge: nothing plays under the page reduced setting', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { root, settle } = await setup();
    const thumb = root('one').querySelector('[role="slider"]') as HTMLElement;
    thumb.focus();
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    await settle();
    take();
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    await settle();
    expect(take().filter((c) => c.el === thumb)).toEqual([]);
  });
});
