// Motion of Slider and RangeSlider: slider-bubble (order 1.22, the value
// bubble with rolled digits) and order 1.23 slider-fill, slider-rubber-band
// and slider-nudge (a key pull at the end), with React's arguments. jsdom has no Web Animations API, so Element.animate
// records each call; a replay of the primitive with React's arguments must
// record the same calls.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDigits, rollDigits } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { DsRangeSlider } from '../range-slider/range-slider';
import { KEY_BUMP, sliderRubberBand } from '@the-system/motion';
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

describe('slider motion, orders 1.22 and 1.23', () => {
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

  it('slider-bubble: a quick click on the track rolls, as React, even when the pointer lets go before the render', async () => {
    const { root, settle } = await setup();
    const control = root('one').querySelector('[data-part="control"]') as HTMLElement;
    const rect = { x: 0, y: 0, left: 0, top: 0, width: 100, height: 20, right: 100, bottom: 20, toJSON: () => ({}) } as DOMRect;
    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(rect);
    vi.spyOn(control.querySelector('[data-part="track"]') as HTMLElement, 'getBoundingClientRect').mockReturnValue(rect);
    const track = control.querySelector('[data-part="track"]') as HTMLElement;
    take();
    // Down and up in one task: no render runs while the pointer is held.
    pointer(track, 'pointerdown', 70);
    pointer(track, 'pointerup', 70);
    await settle();
    const thumb = root('one').querySelector('[role="slider"]') as HTMLElement;
    expect(thumb.getAttribute('aria-valuenow')).toBe('70');
    const bubble = thumb.querySelector(':scope > span') as HTMLElement;
    expect(take().some((c) => bubble.contains(c.el))).toBe(true);
  });

  it('slider-nudge: a key past the maximum pulls the thumb and the fill toward the end, then lets go, and the value stays', async () => {
    // The hold is one snappy spring, read from the token.
    document.documentElement.style.setProperty('--ds-duration-spring-snappy', '60ms');
    try {
      const { root, settle } = await setup();
      const el = root('range');
      const pullEnd = () => Number(el.style.getPropertyValue('--_slider-pull-end'));
      const thumb = el.querySelector('[data-thumb="end"]') as HTMLElement;
      thumb.focus();
      thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
      await settle();
      expect(pullEnd()).toBe(0);
      thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      await settle();
      expect(pullEnd()).toBe(KEY_BUMP);
      expect(thumb.getAttribute('aria-valuenow')).toBe('100');
      await new Promise((resolve) => setTimeout(resolve, 120));
      await settle();
      expect(pullEnd()).toBe(0);
      // A held key does not pull again.
      thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true, cancelable: true }));
      await settle();
      expect(pullEnd()).toBe(0);
      // A key that moves the value does not pull.
      thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
      await settle();
      expect(Number(el.style.getPropertyValue('--_slider-pull-start'))).toBe(0);
      expect(thumb.getAttribute('aria-valuenow')).toBe('99');
    } finally {
      document.documentElement.style.removeProperty('--ds-duration-spring-snappy');
    }
  });

  it('slider-nudge: nothing animates under the page reduced setting (the CSS sets --_slider-pull-max to 0px)', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { root, settle } = await setup();
    const thumb = root('one').querySelector('[role="slider"]') as HTMLElement;
    thumb.focus();
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    await settle();
    take();
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    await settle();
    expect(take()).toEqual([]);
  });

  it('slider-fill: the host carries where the fill starts and ends and the pull, in React order', async () => {
    const { root } = await setup();
    expect(root('one').getAttribute('style')).toBe('--_slider-from: 0; --_slider-to: 0.4; --_slider-pull-start: 0; --_slider-pull-end: 0;');
    expect(root('range').getAttribute('style')).toBe('--_slider-from: 0.2; --_slider-to: 0.8; --_slider-pull-start: 0; --_slider-pull-end: 0;');
  });

  it('slider-rubber-band: a drag past the end pulls with resistance, and lets go on release', async () => {
    const { root, settle } = await setup();
    const el = root('one');
    const pull = (end: 'start' | 'end') => Number(el.style.getPropertyValue(`--_slider-pull-${end}`));
    const rect = { x: 0, y: 0, left: 0, top: 0, width: 100, height: 24, right: 100, bottom: 24, toJSON: () => ({}) } as DOMRect;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect);
    const thumb = el.querySelector('[role="slider"]') as HTMLElement;
    const control = el.querySelector('[data-part="control"]') as HTMLElement;
    pointer(thumb, 'pointerdown', 40);
    await settle();
    pointer(thumb, 'pointermove', 90);
    await settle();
    expect(pull('end')).toBe(0);
    pointer(thumb, 'pointermove', 124);
    await settle();
    const near = pull('end');
    expect(near).toBe(sliderRubberBand(24, 100));
    pointer(thumb, 'pointermove', 400);
    await settle();
    const far = pull('end');
    expect(far).toBeGreaterThan(near);
    expect(far).toBeLessThan(1);
    expect(pull('start')).toBe(0);
    pointer(thumb, 'pointermove', -30);
    await settle();
    expect(pull('end')).toBe(0);
    expect(pull('start')).toBeGreaterThan(0);
    control.dispatchEvent(new Event('lostpointercapture', { bubbles: true }));
    await settle();
    expect(pull('start')).toBe(0);
    expect(pull('end')).toBe(0);
    expect(el.hasAttribute('data-dragging')).toBe(false);
  });

  it('slider-rubber-band: the pull rises with the distance and stays under 1', () => {
    expect(sliderRubberBand(0, 24)).toBe(0);
    expect(sliderRubberBand(24, 24)).toBe(0.5);
    expect(sliderRubberBand(72, 24)).toBe(0.75);
    expect(sliderRubberBand(10, 0)).toBe(0);
  });

  it('slider-fill: a key glides the fill clip and the thumb wrapper on the snappy spring; a drag follows at once; reduced lands at once', async () => {
    const { root, settle } = await setup();
    const el = root('one');
    const control = el.querySelector('[data-part="control"]') as HTMLElement;
    const track = control.querySelector('[data-part="track"]') as HTMLElement;
    const thumb = el.querySelector('[role="slider"]') as HTMLElement;
    const wrapper = thumb.parentElement as HTMLElement;
    // jsdom has no layout or pseudo element styles: give the motion tokens and the fill clip values.
    document.documentElement.style.setProperty('--ds-duration-spring-snappy', '200ms');
    document.documentElement.style.setProperty('--ds-ease-spring-snappy', 'ease-out');
    Object.defineProperty(track, 'offsetWidth', { configurable: true, value: 200 });
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((target: Element, pseudo?: string | null) => {
      const style = real(target);
      if (pseudo !== '::before' || target !== track) return style;
      const to = el.style.getPropertyValue('--_slider-to');
      return { getPropertyValue: (name: string) => (name === 'clip-path' ? `inset(0 ${to} 0 0)` : '') } as CSSStyleDeclaration;
    });
    try {
      thumb.focus();
      // The first key records the clip the stand in draws; the second glides from it.
      thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
      await settle();
      take();
      thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      await settle();
      const got = take().filter((c) => String(c.opts.id) === 'ds-motion:slider-fill');
      const fill = got.find((c) => c.el === track);
      expect(fill?.frames).toEqual({ clipPath: ['inset(0 0.39 0 0)', 'inset(0 0.4 0 0)'] });
      expect(fill?.opts).toMatchObject({ duration: 200, easing: 'ease-out', pseudoElement: '::before' });
      const move = got.find((c) => c.el === wrapper);
      expect(move?.frames).toEqual({ transform: ['translateX(-2px)', 'translateX(0)'] });
      expect(move?.opts).toMatchObject({ duration: 200, easing: 'ease-out', composite: 'add' });

      // A drag follows the pointer: no glide.
      const rect = { x: 0, y: 0, left: 0, top: 0, width: 100, height: 24, right: 100, bottom: 24, toJSON: () => ({}) } as DOMRect;
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect);
      pointer(thumb, 'pointerdown', 41);
      await settle();
      take();
      pointer(thumb, 'pointermove', 60);
      await settle();
      expect(thumb.getAttribute('aria-valuenow')).toBe('60');
      expect(take().filter((c) => String(c.opts.id) === 'ds-motion:slider-fill')).toEqual([]);
      control.dispatchEvent(new Event('lostpointercapture', { bubbles: true }));
      await settle();

      // Reduced: the value moves, nothing glides.
      document.documentElement.setAttribute('data-motion', 'reduce');
      take();
      thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      await settle();
      expect(thumb.getAttribute('aria-valuenow')).toBe('61');
      expect(take().filter((c) => String(c.opts.id) === 'ds-motion:slider-fill')).toEqual([]);
    } finally {
      document.documentElement.style.removeProperty('--ds-duration-spring-snappy');
      document.documentElement.style.removeProperty('--ds-ease-spring-snappy');
    }
  });
});
