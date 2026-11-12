// The motion of ScrubInput, as React's ScrubInput.tsx plays it: a nudge or
// a drag rolls the new value digit by digit in the decorative layer (an
// unnamed aria-hidden span, a child of the root, empty at rest;
// scrub-roll). Typing never rolls.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { rollDigits, type DigitRollOptions } from '@the-system/motion';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsScrubInput } from './scrub-input';

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
  imports: [DsTheme, DsScrubInput],
  template: `<div dsTheme="neutral"><div dsScrubInput label="W" aria-label="Width" [value]="128" [precision]="0"></div></div>`,
})
class Host {}

describe('ScrubInput motion', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('rolls 128 to 129 on ArrowUp, as rollDigits with React arguments (scrub-roll)', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
      const layer = input.nextElementSibling as HTMLElement;
      expect([...layer.attributes].map((a) => `${a.name}=${a.value}`)).toEqual(['aria-hidden=true']);
      key(input, 'ArrowUp');
      expect(input.value).toBe('129');
      const played = rec.take().map(({ keyframes, options }) => ({ keyframes, id: options.id }));
      expect(played.length).toBeGreaterThan(0);
      expect(played).toEqual(expectedRoll(rec, '128', '129', { mode: 'full' }));
      // Typing never rolls.
      input.value = '12*2';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      expect(rec.calls).toHaveLength(0);
    } finally {
      rec.restore();
    }
  });

  it('fades the new digits in under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      document.documentElement.setAttribute('data-motion', 'reduce');
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      key((fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement, 'ArrowUp');
      const played = rec.take().map(({ keyframes, options }) => ({ keyframes, id: options.id }));
      expect(played.flatMap((p) => p.keyframes).some((f) => 'transform' in f)).toBe(false);
      expect(played).toEqual(expectedRoll(rec, '128', '129', { mode: 'reduced' }));
    } finally {
      rec.restore();
    }
  });
});
