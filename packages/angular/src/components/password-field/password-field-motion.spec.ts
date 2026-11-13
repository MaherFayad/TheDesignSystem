// The motion of PasswordField, as React's PasswordField.tsx plays it: a
// press on the toggle morphs the eye (password-reveal: since order 1.23 the
// two glyphs trade places along a 45 degree clip-path wipe, the leaving
// glyph in an unnamed aria-hidden span inside the toggle icon) and
// fades the text back in; the box shakes when it turns invalid (error-shake).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { diagonalWipe, shakeBeat } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsPasswordField } from './password-field';

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
  imports: [DsTheme, DsPasswordField],
  template: `<div dsTheme="neutral"><div dsPasswordField aria-label="Password" value="spring-launch-26" [invalid]="invalid()"></div></div>`,
})
class Host {
  readonly invalid = signal(false);
}

const byId = (calls: Recorded[], id: string) => calls.filter((c) => c.options.id === `ds-motion:${id}`);

describe('PasswordField motion', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('morphs the eye into the eye off, the leaving glyph in an aria-hidden span, and fades the text in (password-reveal)', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const input = root.querySelector('input') as HTMLInputElement;
      (root.querySelector('[data-part="toggle"]') as HTMLElement).click();
      await fixture.whenStable();
      expect(input.type).toBe('text');
      const icon = root.querySelector('[data-part="toggle"] > [data-part="icon"]') as HTMLElement;
      const incoming = icon.firstElementChild;
      const leaving = icon.lastElementChild as HTMLElement;
      expect(incoming?.getAttribute('data-icon')).toBe('eye-off');
      expect(leaving.tagName).toBe('SPAN');
      expect(leaving.getAttribute('aria-hidden')).toBe('true');
      expect(leaving.hasAttribute('data-part')).toBe(false);
      expect(leaving.firstElementChild?.getAttribute('data-icon')).toBe('eye');
      // diagonalWipe('ahead') on the leaving span and diagonalWipe('behind') on the new glyph, as React calls it.
      const out = byId(rec.calls, 'password-reveal-out');
      const into = byId(rec.calls, 'password-reveal-in');
      expect(out.map((c) => c.target)).toEqual([leaving]);
      expect(out[0]?.keyframes).toEqual(diagonalWipe('ahead').keyframes);
      expect(String(out[0]?.keyframes[2]?.['clipPath'])).toBe('polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%)');
      expect(into.map((c) => c.target)).toEqual([incoming]);
      expect(String(into[0]?.keyframes[0]?.['clipPath'])).toBe('polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%)');
      expect(String(into[0]?.keyframes[2]?.['clipPath'])).toBe('polygon(0% 0%, 100% 0%, 100% 100%, 100% 100%, 0% 100%)');
      expect(into[0]?.options.duration).toBeTypeOf('number');
      for (const c of rec.calls) expect(JSON.stringify(c.keyframes)).not.toContain('rotate');
      expect(byId(rec.calls, 'fade').map((c) => c.target)).toEqual([input]);
      // The leaving glyph goes once the morph settles.
      for (const c of rec.calls) c.finish();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
      expect(icon.querySelector(':scope > span')).toBeNull();
      // Hiding again wipes from the other corner.
      rec.take();
      (root.querySelector('[data-part="toggle"]') as HTMLElement).click();
      await fixture.whenStable();
      expect(input.type).toBe('password');
      expect(byId(rec.calls, 'password-reveal-in')[0]?.keyframes).toEqual(diagonalWipe('behind', true).keyframes);
      expect(String(byId(rec.calls, 'password-reveal-in')[0]?.keyframes[0]?.['clipPath'])).toBe('polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%)');
    } finally {
      rec.restore();
    }
  });

  it('cross fades with no wipe under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      document.documentElement.setAttribute('data-motion', 'reduce');
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      (root.querySelector('[data-part="toggle"]') as HTMLElement).click();
      await fixture.whenStable();
      const frames = rec.calls.flatMap((c) => c.keyframes);
      // The leaving glyph fades out, the new one fades in, the text fades in: opacity only.
      expect(rec.calls).toHaveLength(3);
      expect(frames.some((f) => 'transform' in f || 'clipPath' in f)).toBe(false);
    } finally {
      rec.restore();
    }
  });

  it('shakes its own box when it turns invalid, not the inner Input box', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      fixture.componentInstance.invalid.set(true);
      await fixture.whenStable();
      const shakes = byId(rec.calls, 'error-shake');
      expect(shakes.map((c) => c.target)).toEqual([(fixture.nativeElement as HTMLElement).querySelector('[data-ds="password-field"]')]);
      expect(shakes[0]?.keyframes).toEqual(shakeBeat(1).keyframes);
    } finally {
      rec.restore();
    }
  });
});
