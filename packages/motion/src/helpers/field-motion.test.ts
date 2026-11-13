// @vitest-environment jsdom
// The field motion helpers (orders 1.21 to 1.23): the beats, the shake with a
// settle, the run spread, the shake of one field and the digit roll layer.
// Moved with the code from packages/angular/src/internal/motion-fields.spec.ts
// (order 1.29); the Angular wiring of errorShake keeps its spec there.
import { afterEach, describe, expect, it } from 'vitest';
import {
  diagonalWipe,
  digitLayerControl,
  emerge,
  ErrorShaker,
  fadeOutBeat,
  landPop,
  parentBox,
  measureFloatBox,
  placeDigitLayer,
  placeFloatingLabel,
  playBeat,
  runStep,
  shakeBeat,
  shakeSwings,
  styleTurnsOff,
  token,
} from './field-motion';

interface Recorded {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  finish: () => void;
}

/**
 * Records every el.animate call and returns a stand in Animation. It goes on
 * Element, HTMLElement and SVGElement, since another spec may leave an own
 * property on one of the lower prototypes.
 */
function recordAnimate() {
  const calls: Recorded[] = [];
  type Proto = { animate?: unknown; getAnimations?: unknown };
  const protos = [Element.prototype, HTMLElement.prototype, SVGElement.prototype] as unknown as Proto[];
  const saved = protos.map((p) => ({
    animate: Object.getOwnPropertyDescriptor(p, 'animate'),
    getAnimations: Object.getOwnPropertyDescriptor(p, 'getAnimations'),
  }));
  const animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    let done: () => void = () => undefined;
    const anim = { id: options.id, playState: 'running', finished: new Promise<void>((r) => (done = r)), cancel() {} };
    calls.push({ target: this, keyframes, options, finish: () => ((anim.playState = 'finished'), done()) });
    return anim;
  };
  for (const p of protos) {
    Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
    Object.defineProperty(p, 'getAnimations', { configurable: true, writable: true, value: () => [] });
  }
  return {
    calls,
    take: () => calls.splice(0).map(({ target, keyframes, options }) => ({ target, keyframes, options })),
    restore: () => {
      protos.forEach((p, i) => {
        for (const name of ['animate', 'getAnimations'] as const) {
          const d = saved[i]?.[name];
          if (d) Object.defineProperty(p, name, d);
          else delete p[name];
        }
      });
    },
  };
}

describe('field-motion', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('swings toward the inline end first, with a settle, from rest to rest (React shakeBeat)', () => {
    const beat = shakeBeat(1);
    expect(beat.duration).toBe('duration.spring-bouncy');
    expect(beat.easing).toBe('ease.out');
    expect(beat.keyframes.map((k) => k.offset)).toEqual([0, 0.14, 0.34, 0.54, 0.74, 1]);
    expect(beat.keyframes[1]?.transform).toBe(`translateX(calc(1 * ${token.shift}))`);
    expect(shakeBeat(-1).keyframes[1]?.transform).toBe(`translateX(calc(-1 * ${token.shift}))`);
  });

  it('emerges from under the control on the soft spring, as React emerge() (order 1.23)', () => {
    const beat = emerge();
    expect(beat.keyframes).toEqual([
      { transform: 'translateY(-100%)', clipPath: 'inset(100% 0 0 0)', opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.3 },
      { transform: 'none', clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 1 },
    ]);
    expect(beat.duration).toBe('duration.spring-soft');
    expect(beat.easing).toBe('ease.spring-soft');
    expect(fadeOutBeat.keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
  });

  it('wipes along a 45 degree line with five point polygons, as React diagonalWipe() (order 1.23)', () => {
    const into = diagonalWipe('behind');
    expect(into.duration).toBe('duration.morph');
    expect(into.easing).toBe('ease.standard');
    expect(into.keyframes.map((f) => f['offset'])).toEqual([0, 0.5, 1]);
    expect(into.keyframes[1]?.['clipPath']).toBe('polygon(0% 0%, 100% 0%, 100% 0%, 0% 100%, 0% 100%)');
    expect(diagonalWipe('ahead').keyframes[0]?.['clipPath']).toBe('polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)');
    // back runs from the bottom right corner.
    expect(diagonalWipe('behind', true).keyframes[1]?.['clipPath']).toBe('polygon(100% 100%, 0% 100%, 0% 100%, 100% 0%, 100% 0%)');
  });

  it('spreads a run over two stagger steps', () => {
    expect([0, 1, 2, 3, 4].map((i) => runStep(i, 5))).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(runStep(0, 1)).toBe(0);
  });

  it('plays a beat with its id, its origin and the reduced beat, and nothing for none', () => {
    const rec = recordAnimate();
    try {
      const el = document.createElement('span');
      playBeat(el, landPop(), 'otp-fill', 'full');
      expect(rec.calls[0]?.options.id).toBe('ds-motion:otp-fill');
      expect(el.style.transformOrigin).toBe('50% 50%');
      expect(rec.calls[0]?.keyframes[0]).toEqual({ transform: `scale(${token.morph})`, opacity: 0, offset: 0 });
      playBeat(el, landPop(), 'otp-fill', 'reduced');
      expect(rec.calls[1]?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
      expect(playBeat(el, shakeBeat(1), 'error-shake', 'reduced', null)).toBeNull();
      expect(playBeat(el, landPop(), 'otp-fill', 'none')).toBeNull();
      expect(rec.calls).toHaveLength(2);
    } finally {
      rec.restore();
    }
  });

  it('shakes the box of an input once, not again while it plays, and nothing under reduced', () => {
    const rec = recordAnimate();
    try {
      const box = document.createElement('div');
      const input = document.createElement('input');
      box.append(input);
      document.body.append(box);
      const shaker = new ErrorShaker();
      shaker.shake(input, parentBox, 'full');
      expect(rec.calls).toHaveLength(1);
      expect(rec.calls[0]?.target).toBe(box);
      expect(rec.calls[0]?.options.id).toBe('ds-motion:error-shake');
      expect(rec.calls[0]?.keyframes).toEqual(shakeBeat(1).keyframes);
      shaker.shake(input, parentBox, 'full');
      expect(rec.calls).toHaveLength(1);
      rec.calls[0]?.finish();
      shaker.shake(input, parentBox, 'full');
      expect(rec.calls).toHaveLength(2);
      new ErrorShaker().shake(input, parentBox, 'reduced');
      expect(rec.calls).toHaveLength(2);
    } finally {
      rec.restore();
      document.body.replaceChildren();
    }
  });

  it('places the digit layer from layout offsets, on physical sides', () => {
    const root = document.createElement('div');
    const input = document.createElement('input');
    const layer = document.createElement('span');
    root.append(input, layer);
    Object.defineProperty(input, 'offsetParent', { value: root });
    Object.defineProperty(input, 'offsetLeft', { value: 12 });
    Object.defineProperty(input, 'offsetTop', { value: 4 });
    Object.defineProperty(input, 'offsetWidth', { value: 80 });
    Object.defineProperty(input, 'offsetHeight', { value: 24 });
    placeDigitLayer(layer, input, root);
    expect(layer.style.left).toBe('12px');
    expect(layer.style.top).toBe('4px');
    expect(layer.style.inlineSize).toBe('80px');
    expect(layer.style.blockSize).toBe('24px');
    expect(layer.style.display).toBe('flex');
  });

  it('a digit layer clears at once for the same text, keeps still for mode none, and needs a layer', () => {
    const rec = recordAnimate();
    try {
      const root = document.createElement('div');
      const input = document.createElement('input');
      const layer = document.createElement('span');
      layer.append(document.createElement('span'));
      root.append(input, layer);
      const control = digitLayerControl(() => layer);
      control.roll(input, '5', '5', { mode: 'none' });
      expect(layer.childElementCount).toBe(1);
      control.roll(input, '5', '5', { mode: 'full' });
      expect(layer.childElementCount).toBe(0);
      expect(() => digitLayerControl(() => null).roll(input, '1', '2', { mode: 'full' })).not.toThrow();
      expect(rec.calls).toHaveLength(0);
    } finally {
      rec.restore();
    }
  });
});

describe('floating label box (review B6)', () => {
  // jsdom has no layout: give the box and the control the sizes a browser would.
  function floatingField(dir: 'ltr' | 'rtl', zoom = 1) {
    const field = document.createElement('div');
    field.dir = dir;
    const box = document.createElement('div');
    const input = document.createElement('input');
    input.style.paddingLeft = '0px';
    input.style.paddingRight = '0px';
    box.append(input);
    const label = document.createElement('label');
    field.append(box, label);
    document.body.append(field);
    Object.defineProperty(box, 'offsetHeight', { value: 44 });
    Object.defineProperty(box, 'offsetWidth', { value: 200 });
    box.getBoundingClientRect = () => new DOMRect(10 * zoom, 0, 200 * zoom, 44 * zoom);
    // The text starts 17px in from the box's start edge on either side.
    input.getBoundingClientRect = () => new DOMRect((10 + 17) * zoom, 0, 166 * zoom, 44 * zoom);
    return field;
  }
  afterEach(() => document.body.replaceChildren());

  it('reads the box height and the text inset from the control', () => {
    expect(measureFloatBox(floatingField('ltr'))).toEqual({ box: 44, inset: 17 });
    expect(measureFloatBox(floatingField('rtl'))).toEqual({ box: 44, inset: 17 });
  });

  it('reads layout px under a zoom on an ancestor', () => {
    expect(measureFloatBox(floatingField('ltr', 2.5))).toEqual({ box: 44, inset: 17 });
  });

  it('writes the box and the inset on the field, and clears them without a control', () => {
    const field = floatingField('ltr');
    placeFloatingLabel(field);
    expect(field.style.getPropertyValue('--_field-float-box')).toBe('44px');
    expect(field.style.getPropertyValue('--_field-float-inset')).toBe('17px');
    field.querySelector('input')?.remove();
    placeFloatingLabel(field);
    expect(field.style.getPropertyValue('--_field-float-box')).toBe('');
  });
});

describe('error shake reversal rate (review N17)', () => {
  const reversals = (n: 1 | 2 | 3 | 4) => shakeBeat(1, n).keyframes.length - 2;
  it('turns at most 12 times a second at every style duration', () => {
    // Neutral 200ms, Desk 380ms, Liquid 496ms (review Part 1).
    for (const ms of [200, 380, 496]) expect(reversals(shakeSwings(ms)) / (ms / 1000)).toBeLessThanOrEqual(12);
  });
  it('keeps four swings where there is time, and two in Neutral', () => {
    expect(shakeSwings(380)).toBe(4);
    expect(shakeSwings(200)).toBe(2);
    expect(shakeSwings(0)).toBe(4);
  });
  it('starts toward the inline end and ends at rest with any swing count', () => {
    for (const n of [1, 2, 3, 4] as const) {
      const frames = shakeBeat(-1, n).keyframes;
      expect(String(frames[1]?.transform)).toBe(`translateX(calc(-1 * ${token.shift}))`);
      expect(frames[frames.length - 1]?.transform).toBe('none');
    }
  });
});

describe('off rows reach motion played from code (review N31)', () => {
  afterEach(() => document.body.replaceChildren());
  it('reads none, 0 and 0s as off, anything else as on', () => {
    const el = document.createElement('div');
    document.body.append(el);
    expect(styleTurnsOff(el, '--_skeleton-swap')).toBe(false);
    for (const v of ['none', '0', '0s', '0ms']) {
      el.style.setProperty('--_skeleton-swap', v);
      expect(styleTurnsOff(el, '--_skeleton-swap')).toBe(true);
    }
    el.style.setProperty('--_skeleton-swap', 'wipe');
    expect(styleTurnsOff(el, '--_skeleton-swap')).toBe(false);
  });

  it('rolls no digits when the root says --_<component>-roll: none (scrub-roll off row)', () => {
    const root = document.createElement('div');
    root.dataset.ds = 'scrub-input';
    root.style.setProperty('--_scrub-input-roll', 'none');
    const layer = document.createElement('span');
    const input = document.createElement('input');
    root.append(input, layer);
    document.body.append(root);
    let calls = 0;
    input.animate = (() => {
      calls += 1;
      return null;
    }) as unknown as typeof input.animate;
    digitLayerControl(() => layer).roll(input, '12', '13', { mode: 'full' });
    // The layer is never placed over the input (placeDigitLayer shows it with display flex).
    expect(layer.style.display).toBe('');
    expect(layer.childElementCount).toBe(0);
    expect(calls).toBe(0);
  });
});
