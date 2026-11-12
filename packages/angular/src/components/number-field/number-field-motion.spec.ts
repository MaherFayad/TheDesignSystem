// The motion of NumberField, as React's NumberField.tsx plays it: a step
// from a key or a stepper rolls the value digit by digit in the decorative
// layer (an unnamed aria-hidden span, a child of the root, empty at rest;
// field-step); typing never rolls and empties the layer; the box shakes when
// the value turns invalid (error-shake).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { rollDigits, type DigitRollOptions } from '@the-system/motion';
import { afterEach, describe, expect, it } from 'vitest';
import { shakeBeat } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsNumberField } from './number-field';

interface Recorded {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  finish: () => void;
}

/** Records every el.animate call and returns a stand in Animation. */
function recordAnimate() {
  const calls: Recorded[] = [];
  const proto = Element.prototype as unknown as { animate?: unknown; getAnimations?: unknown };
  const had = proto.animate;
  const hadGet = proto.getAnimations;
  proto.animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    let done: () => void = () => undefined;
    const anim = { id: options.id, playState: 'running', finished: new Promise<void>((r) => (done = r)), cancel() {} };
    calls.push({ target: this, keyframes, options, finish: () => ((anim.playState = 'finished'), done()) });
    return anim;
  };
  proto.getAnimations = () => [];
  return {
    calls,
    take: () => calls.splice(0).map(({ target, keyframes, options }) => ({ target, keyframes, options })),
    restore: () => {
      if (had === undefined) delete proto.animate;
      else proto.animate = had;
      if (hadGet === undefined) delete proto.getAnimations;
      else proto.getAnimations = hadGet;
    },
  };
}

const byId = (calls: Recorded[], id: string) => calls.filter((c) => c.options.id?.startsWith(`ds-motion:${id}`));

/** What rollDigits plays for these arguments, replayed on a spare host. */
function expectedRoll(rec: ReturnType<typeof recordAnimate>, from: string, to: string, opts: DigitRollOptions) {
  const spare = document.createElement('span');
  document.body.append(spare);
  rollDigits(spare, from, to, opts);
  spare.remove();
  return rec.take().map(({ keyframes, options }) => ({ keyframes, id: options.id }));
}

function key(input: HTMLInputElement, k: string): void {
  input.focus();
  input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true, cancelable: true }));
}

@Component({
  imports: [DsTheme, DsNumberField],
  template: `<div dsTheme="neutral"><div dsNumberField aria-label="Quantity" [value]="98" [min]="0" [max]="1000" [invalid]="invalid()"></div></div>`,
})
class Host {
  readonly invalid = signal(false);
}

describe('NumberField motion', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('keeps an empty aria-hidden layer after the input at rest', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    const layer = input.nextElementSibling as HTMLElement;
    expect(layer.tagName).toBe('SPAN');
    expect([...layer.attributes].map((a) => `${a.name}=${a.value}`)).toEqual(['aria-hidden=true']);
    expect(layer.childElementCount).toBe(0);
  });

  it('rolls 98 to 99 on ArrowUp and 99 to 98 on the decrement button, as rollDigits with React arguments (field-step)', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const input = root.querySelector('input') as HTMLInputElement;
      const layer = input.nextElementSibling as HTMLElement;
      console.log('DEBUG before', JSON.stringify(input.value));
      key(input, 'ArrowUp');
      console.log('DEBUG after', JSON.stringify(input.value), layer.outerHTML);
      expect(input.value).toBe('99');
      const played = rec.take().map(({ keyframes, options }) => ({ keyframes, id: options.id }));
      expect(played.length).toBeGreaterThan(0);
      expect(layer.textContent).toBe('99');
      expect(played).toEqual(expectedRoll(rec, '98', '99', { mode: 'full', direction: 'up' }));
      const down = root.querySelector('[data-part="decrement"]') as HTMLElement;
      down.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, cancelable: true, pointerType: 'mouse' }));
      down.dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true, cancelable: true, pointerType: 'mouse' }));
      expect(input.value).toBe('98');
      const back = rec.take().map(({ keyframes, options }) => ({ keyframes, id: options.id }));
      expect(back).toEqual(expectedRoll(rec, '99', '98', { mode: 'full', direction: 'down' }));
      // Typing empties the layer at once and never rolls.
      input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: '7', bubbles: true, cancelable: true }));
      expect(layer.childElementCount).toBe(0);
      input.value = '987';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      expect(rec.calls).toHaveLength(0);
    } finally {
      rec.restore();
    }
  });

  it('fades the new digits in, with no travel, under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      document.documentElement.setAttribute('data-motion', 'reduce');
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      key((fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement, 'ArrowUp');
      const played = rec.take().map(({ keyframes, options }) => ({ keyframes, id: options.id }));
      expect(played.length).toBeGreaterThan(0);
      expect(played.flatMap((p) => p.keyframes).some((f) => 'transform' in f)).toBe(false);
      expect(played).toEqual(expectedRoll(rec, '98', '99', { mode: 'reduced', direction: 'up' }));
    } finally {
      rec.restore();
    }
  });

  it('shakes the box when the value turns invalid (error-shake)', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      fixture.componentInstance.invalid.set(true);
      await fixture.whenStable();
      const shakes = byId(rec.calls, 'error-shake');
      expect(shakes.map((c) => c.target)).toEqual([(fixture.nativeElement as HTMLElement).querySelector('[data-ds="number-field"]')]);
      expect(shakes[0]?.keyframes).toEqual(shakeBeat(1).keyframes);
    } finally {
      rec.restore();
    }
  });
});
