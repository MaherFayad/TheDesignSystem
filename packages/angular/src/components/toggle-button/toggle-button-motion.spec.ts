// The pressed pop of ToggleButton (interaction toggle-pop), as React's
// ToggleButton.tsx plays it: on a change from the person, each part plays
// toggleLandSpec(on, step) through play(), one stagger step apart.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { play } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { TOGGLE_POP_PARTS, toggleLandSpec } from '../../internal/motion-actions';
import { DsToggleButton } from './toggle-button';

/** Records every el.animate call. */
function recordAnimate() {
  const calls: { target: Element; keyframes: unknown; options: unknown }[] = [];
  // On every prototype a spec may stub, so no leftover own property shadows it.
  const protos = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
  const had = protos.map((p) => Object.getOwnPropertyDescriptor(p, 'animate'));
  const animate = function (this: Element, keyframes: unknown, options: KeyframeAnimationOptions) {
    calls.push({ target: this, keyframes, options });
    return { id: options.id, playState: 'running', finished: Promise.resolve(), cancel() {} };
  };
  for (const p of protos) Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
  return {
    take: () => calls.splice(0),
    restore: () =>
      protos.forEach((p, i) => {
        const d = had[i];
        if (d) Object.defineProperty(p, 'animate', d);
        else Reflect.deleteProperty(p, 'animate');
      }),
  };
}

@Component({
  imports: [DsToggleButton, DsTheme],
  // Neutral pops; Studio plays no pop (its preset turns the pattern off).
  template: `<div dsTheme="neutral"><button id="grid" dsToggleButton start="grid" end="check">Grid view</button></div>`,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement.querySelector('#grid') as HTMLElement };
}

describe('DsToggleButton motion', () => {
  let rec: ReturnType<typeof recordAnimate>;
  beforeEach(() => (rec = recordAnimate()));
  afterEach(() => {
    rec.restore();
    document.documentElement.removeAttribute('data-motion');
  });

  it('on pops each part, off sinks each part, one stagger step apart, as React', async () => {
    const { el, fixture } = await setup();
    rec.take();
    for (const on of [true, false]) {
      el.click();
      const played = rec.take();
      await fixture.whenStable();
      expect(el.getAttribute('aria-pressed')).toBe(String(on));
      const parts = Array.from(el.querySelectorAll(TOGGLE_POP_PARTS));
      expect(parts.map((p) => p.getAttribute('data-part'))).toEqual(['start', 'label', 'end']);
      parts.forEach((part, i) => play(part, toggleLandSpec(on, i), 'toggle-pop'));
      expect(played).toEqual(rec.take());
      expect(played.map((c) => c.target)).toEqual(parts);
    }
  });

  it('reduced motion plays nothing: the fill and the ring carry the state', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const { el, fixture } = await setup();
    rec.take();
    el.click();
    expect(rec.take()).toEqual([]);
    await fixture.whenStable();
    expect(el.getAttribute('aria-pressed')).toBe('true');
  });
});
