// The motion of Input, as React's Input.tsx plays it: the box shakes once
// when the field turns invalid (interaction error-shake), never on first
// paint, never as the control part of another field, never when reduced.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { shakeBeat } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsInput } from './input';

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
  imports: [DsTheme, DsInput],
  template: `
    <div dsTheme="neutral">
      <div data-test="own" dsInput aria-label="Email" [invalid]="invalid()"></div>
      <div data-test="part" dsInput data-part="control" aria-label="Code" [invalid]="invalid()"></div>
    </div>
  `,
})
class Host {
  readonly invalid = signal(true);
}

const shakes = (calls: Recorded[]) => calls.filter((c) => c.options.id === 'ds-motion:error-shake');

describe('Input motion (error-shake)', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('shakes its own box once when it turns invalid, with React shakeBeat', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      expect(shakes(rec.calls)).toHaveLength(0);
      fixture.componentInstance.invalid.set(false);
      await fixture.whenStable();
      fixture.componentInstance.invalid.set(true);
      await fixture.whenStable();
      const own = (fixture.nativeElement as HTMLElement).querySelector('[data-test="own"]');
      expect(shakes(rec.calls).map((c) => c.target)).toEqual([own]);
      expect(shakes(rec.calls)[0]?.keyframes).toEqual(shakeBeat(1).keyframes);
      // The box keeps no transform origin of its own: the DOM stays as React's.
      expect(own?.getAttribute('style')).toBeNull();
    } finally {
      rec.restore();
    }
  });

  it('plays nothing under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      document.documentElement.setAttribute('data-motion', 'reduce');
      const fixture = TestBed.createComponent(Host);
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
