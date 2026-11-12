// The field motion helpers, as React's fieldMotion.ts and useErrorShake.ts
// give them: the beats, the shake with a settle, the run spread, and the
// error shake wiring of errorShake().
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../theme/theme';
import { errorShake, landPop, playBeat, runStep, shakeBeat, token } from './motion-fields';

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

@Component({
  selector: 'ds-shake-probe',
  template: `<div id="box"><input #input /></div>`,
})
class ShakeProbe {
  readonly invalid = signal(true);
  readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  constructor() {
    errorShake(() => this.input().nativeElement, () => this.invalid());
  }
}

/** The probe inside a theme whose style plays the shake in full. */
@Component({
  imports: [DsTheme, ShakeProbe],
  template: `<div dsTheme="neutral"><ds-shake-probe /></div>`,
})
class ShakeHost {
  readonly probe = viewChild.required(ShakeProbe);
  get invalid() {
    return this.probe().invalid;
  }
  input() {
    return this.probe().input();
  }
}

describe('motion-fields', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('swings toward the inline end first, with a settle, from rest to rest (React shakeBeat)', () => {
    const beat = shakeBeat(1);
    expect(beat.duration).toBe('duration.spring-bouncy');
    expect(beat.easing).toBe('ease.out');
    expect(beat.keyframes.map((k) => k.offset)).toEqual([0, 0.14, 0.34, 0.54, 0.74, 1]);
    expect(beat.keyframes[1]?.transform).toBe(`translateX(calc(1 * ${token.shift}))`);
    expect(shakeBeat(-1).keyframes[1]?.transform).toBe(`translateX(calc(-1 * ${token.shift}))`);
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

  it('shakes once when invalid turns on, never on first paint, and on the native invalid event', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(ShakeHost);
      await fixture.whenStable();
      expect(rec.calls).toHaveLength(0);
      fixture.componentInstance.invalid.set(false);
      await fixture.whenStable();
      fixture.componentInstance.invalid.set(true);
      await fixture.whenStable();
      const box = (fixture.nativeElement as HTMLElement).querySelector('#box');
      expect(rec.calls).toHaveLength(1);
      expect(rec.calls[0]?.target).toBe(box);
      expect(rec.calls[0]?.keyframes).toEqual(shakeBeat(1).keyframes);
      // Not again while a shake plays; again once it ended.
      const input = fixture.componentInstance.input().nativeElement;
      input.dispatchEvent(new Event('invalid'));
      expect(rec.calls).toHaveLength(1);
      rec.calls[0]?.finish();
      input.dispatchEvent(new Event('invalid'));
      expect(rec.calls).toHaveLength(2);
    } finally {
      rec.restore();
    }
  });

  it('does not shake under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      document.documentElement.setAttribute('data-motion', 'reduce');
      const fixture = TestBed.createComponent(ShakeHost);
      await fixture.whenStable();
      fixture.componentInstance.invalid.set(false);
      await fixture.whenStable();
      fixture.componentInstance.invalid.set(true);
      await fixture.whenStable();
      expect(rec.calls).toHaveLength(0);
    } finally {
      rec.restore();
    }
  });
});
