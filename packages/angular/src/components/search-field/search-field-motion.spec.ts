// The motion of SearchField, as React's SearchField.tsx plays it: the
// clear glyph turns in when the box gets a value and a decorative copy of
// the clear button turns out when it is cleared (search-clear); Enter dips
// the search glyph (search-submit).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { iconInFrames } from '@the-system/motion';
import { afterEach, describe, expect, it } from 'vitest';
import { token } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsSearchField } from './search-field';

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
  imports: [DsTheme, DsSearchField],
  template: `<div dsTheme="neutral"><div dsSearchField aria-label="Search files" [(value)]="query"></div></div>`,
})
class Host {
  readonly query = signal('');
}

const byId = (calls: Recorded[], id: string) => calls.filter((c) => c.options.id === `ds-motion:${id}`);

/** jsdom lays nothing out: give every box a size, so the clear button can be copied. On HTMLElement too, as another spec may shadow Element. */
function sized(): () => void {
  const protos = [Element.prototype, HTMLElement.prototype];
  const saved = protos.map((p) => Object.getOwnPropertyDescriptor(p, 'getBoundingClientRect'));
  const rect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 24, bottom: 24, width: 24, height: 24, toJSON: () => ({}) }) as DOMRect;
  for (const p of protos) Object.defineProperty(p, 'getBoundingClientRect', { configurable: true, writable: true, value: rect });
  return () =>
    protos.forEach((p, i) => {
      const d = saved[i];
      if (d) Object.defineProperty(p, 'getBoundingClientRect', d);
      else delete (p as { getBoundingClientRect?: unknown }).getBoundingClientRect;
    });
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('SearchField motion', () => {
  afterEach(() => document.documentElement.removeAttribute('data-motion'));

  it('turns the clear glyph in on the first character and turns a copy out on clear (search-clear)', async () => {
    const rec = recordAnimate();
    const unsize = sized();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      expect(rec.calls).toHaveLength(0);
      const root = (fixture.nativeElement as HTMLElement).querySelector('[data-ds="search-field"]') as HTMLElement;
      typeInto(root.querySelector('input') as HTMLInputElement, 'b');
      await fixture.whenStable();
      const glyph = root.querySelector(':scope > [data-part="clear"] > [data-part="icon"]');
      const into = byId(rec.calls, 'icon-morph-in');
      // iconMorph({ to: the clear icon part, turn: 90 }), as React calls it.
      expect(into.map((c) => c.target)).toEqual([glyph]);
      expect(into[0]?.keyframes).toEqual(iconInFrames(90));
      rec.take();
      (root.querySelector('[data-part="clear"]') as HTMLElement).click();
      await fixture.whenStable();
      expect(fixture.componentInstance.query()).toBe('');
      const out = byId(rec.calls, 'search-clear-out');
      expect(out).toHaveLength(1);
      const copy = out[0]?.target as HTMLElement;
      expect(copy.parentElement).toBe(root);
      expect(copy.getAttribute('aria-hidden')).toBe('true');
      expect(copy.hasAttribute('inert')).toBe(true);
      expect(copy.hasAttribute('data-part')).toBe(false);
      expect(out[0]?.keyframes).toEqual([
        { transform: 'none', opacity: 1 },
        { transform: `rotate(90deg) scale(${token.morph})`, opacity: 0 },
      ]);
      expect(out[0]?.options.fill).toBe('forwards');
      // The copy goes once its exit ends.
      out[0]?.finish();
      await new Promise((r) => setTimeout(r));
      expect(copy.isConnected).toBe(false);
    } finally {
      unsize();
      rec.restore();
    }
  });

  it('dips the search glyph on Enter (search-submit), and not under reduced motion', async () => {
    const rec = recordAnimate();
    try {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const input = root.querySelector('input') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      const dips = byId(rec.calls, 'search-submit');
      expect(dips.map((c) => c.target)).toEqual([root.querySelector('[data-ds="search-field"] > [data-part="icon"]')]);
      expect(dips[0]?.keyframes.map((k) => k.transform)).toEqual(['none', `scale(${token.anticipate}) rotate(-12deg)`, 'none']);
      expect(dips[0]?.keyframes[1]?.offset).toBe(0.25);
      expect(dips[0]?.options.easing).toBe('linear');
      document.documentElement.setAttribute('data-motion', 'reduce');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(byId(rec.calls, 'search-submit')).toHaveLength(1);
    } finally {
      rec.restore();
    }
  });
});
