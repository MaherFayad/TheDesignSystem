// The motion of OTPField, as React's OTPField.tsx plays it: each new
// character lands in its cell (otp-fill), a paste as one run spread over two
// stagger steps; a full code lifts the cells as one wave (otp-complete); the
// row shakes when the code turns invalid (error-shake).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { landPop, shakeBeat, token } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsOTPField } from './otp-field';

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
  imports: [DsTheme, DsOTPField],
  template: `<div [dsTheme]="style()"><div dsOTPField aria-label="Verification code" [length]="4" [invalid]="invalid()"></div></div>`,
})
class Host {
  readonly invalid = signal(false);
  /** Neutral plays otp-fill and error-shake; Desk also plays the otp-complete wave. */
  readonly style = signal('neutral');
}

const byId = (calls: Recorded[], id: string) => calls.filter((c) => c.options.id === `ds-motion:${id}`);

/** Token timing as the style sheet would give it: every delay step 10ms, every duration 100ms. */
function tokens(): void {
  const real = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
    const style = real(el);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue')
          return (name: string) => (name.startsWith('--ds-delay-') ? '10ms' : name.startsWith('--ds-duration-') ? '100ms' : target.getPropertyValue(name));
        const value = Reflect.get(target, prop) as unknown;
        return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
      },
    });
  });
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('OTPField motion', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-motion');
    vi.restoreAllMocks();
  });

  it('lands one typed character on the bouncy spring (otp-fill)', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      typeInto(root.querySelector('input') as HTMLInputElement, '4');
      await fixture.whenStable();
      const fills = byId(rec.calls, 'otp-fill');
      const cell = root.querySelector('[data-part="cell"]');
      expect(fills.map((c) => c.target)).toEqual([cell?.firstElementChild]);
      expect(fills[0]?.keyframes).toEqual(landPop().keyframes);
      expect(fills[0]?.options.delay).toBe(0);
    } finally {
      rec.restore();
    }
  });

  it('lands a paste as one run over two stagger steps and lifts the cells in a wave (otp-fill, otp-complete)', async () => {
    const rec = recordAnimate();
    tokens();
    try {
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.style.set('desk');
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      typeInto(root.querySelector('input') as HTMLInputElement, '4826');
      await fixture.whenStable();
      const cells = [...root.querySelectorAll('[data-part="cell"]')];
      const fills = byId(rec.calls, 'otp-fill');
      expect(fills.map((c) => c.target)).toEqual(cells.map((c) => c.firstElementChild));
      // runStep(i, 4) steps of 10ms: 0, 2/3, 4/3 and 2 steps.
      expect(fills.map((c) => Math.round(Number(c.options.delay) * 100) / 100)).toEqual([0, 6.67, 13.33, 20]);
      expect(fills[1]?.options.fill).toBe('backwards');
      const wave = byId(rec.calls, 'otp-complete');
      expect(wave.map((c) => c.target)).toEqual(cells);
      expect(wave[0]?.keyframes.map((k) => k.transform)).toEqual(['none', `translateY(calc(-1 * ${token.lift}))`, 'none']);
      expect(wave[0]?.keyframes[1]?.offset).toBe(0.35);
      expect(wave.map((c) => Math.round(Number(c.options.delay) * 100) / 100)).toEqual([0, 6.67, 13.33, 20]);
    } finally {
      rec.restore();
    }
  });

  it('fades the characters in and holds the wave under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      document.documentElement.setAttribute('data-motion', 'reduce');
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.style.set('desk');
      await fixture.whenStable();
      typeInto((fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement, '4826');
      await fixture.whenStable();
      expect(byId(rec.calls, 'otp-fill').map((c) => c.keyframes)).toEqual(Array(4).fill([{ opacity: 0 }, { opacity: 1 }]));
      expect(byId(rec.calls, 'otp-complete')).toHaveLength(0);
    } finally {
      rec.restore();
    }
  });

  it('shakes the row when the code turns invalid (error-shake)', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      fixture.componentInstance.invalid.set(true);
      await fixture.whenStable();
      const shakes = byId(rec.calls, 'error-shake');
      expect(shakes.map((c) => c.target)).toEqual([(fixture.nativeElement as HTMLElement).querySelector('[data-ds="otp-field"]')]);
      expect(shakes[0]?.keyframes).toEqual(shakeBeat(1).keyframes);
    } finally {
      rec.restore();
    }
  });
});
