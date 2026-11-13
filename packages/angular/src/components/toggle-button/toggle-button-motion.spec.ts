// The flood of ToggleButton (interaction toggle-pop, round 3, order 1.23), as
// React's ToggleButton.tsx plays it: on a change from the person, the
// state-layer part plays toggleLayerSpec(on) through play(), from the press
// point the pointer wrote, or from the centre after Space or Enter.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { play } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { toggleLayerSpec } from '@the-system/motion';
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
  // Neutral floods; Studio plays no flood (its preset turns the pattern off).
  template: `<div dsTheme="neutral"><button id="grid" dsToggleButton start="grid" end="check">Grid view</button><button id="eye" dsToggleButton icon="eye" label="Show guides"></button></div>`,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement.querySelector('#grid') as HTMLElement, eye: fixture.nativeElement.querySelector('#eye') as HTMLElement };
}

describe('DsToggleButton motion', () => {
  let rec: ReturnType<typeof recordAnimate>;
  beforeEach(() => (rec = recordAnimate()));
  afterEach(() => {
    rec.restore();
    document.documentElement.removeAttribute('data-motion');
  });

  it('renders the aria-hidden state-layer first, in both forms, as React', async () => {
    const { el, eye } = await setup();
    for (const button of [el, eye]) {
      const layer = button.firstElementChild;
      expect(layer?.getAttribute('data-part')).toBe('state-layer');
      expect(layer?.getAttribute('aria-hidden')).toBe('true');
      expect(layer?.childElementCount).toBe(0);
    }
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['state-layer', 'start', 'label', 'end', 'hit']);
    expect(Array.from(eye.children).map((c) => c.getAttribute('data-part'))).toEqual(['state-layer', 'icon', 'hit']);
  });

  it('on floods the state layer, off drains it, with React spec, and nothing else moves', async () => {
    const { el, fixture } = await setup();
    rec.take();
    const layer = el.querySelector(':scope > [data-part="state-layer"]') as Element;
    for (const on of [true, false]) {
      el.click();
      const played = rec.take();
      await fixture.whenStable();
      expect(el.getAttribute('aria-pressed')).toBe(String(on));
      play(layer, toggleLayerSpec(on), 'toggle-pop');
      expect(played).toEqual(rec.take());
      expect(played.map((c) => c.target)).toEqual([layer]);
    }
  });

  it('the flood keyframes: from the pool to the whole button and out on, the whole button to the point off', () => {
    const on = toggleLayerSpec(true);
    expect(on.duration).toBe('duration.morph');
    expect(on.easing).toBe('ease.out');
    expect(on.keyframes).toHaveLength(3);
    expect(String(on.keyframes[0]?.['clipPath'])).toContain('var(--_toggle-button-press-radius) at var(--_toggle-button-x, 50%) var(--_toggle-button-y, 50%)');
    expect(on.keyframes[2]?.['opacity']).toBe(0);
    const off = toggleLayerSpec(false);
    expect(off.duration).toBe('duration.quick');
    expect(off.easing).toBe('ease.exit');
    expect(String(off.keyframes[1]?.['clipPath'])).toBe('circle(0% at var(--_toggle-button-x, 50%) var(--_toggle-button-y, 50%))');
  });

  it('pointer down writes the press point as a share of the box; Space and Enter clear it for a centre flood', async () => {
    const { el } = await setup();
    const had = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getBoundingClientRect');
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      writable: true,
      value: () => ({ x: 10, y: 20, left: 10, top: 20, width: 80, height: 40, right: 90, bottom: 60, toJSON: () => ({}) }),
    });
    try {
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 30, clientY: 50 }));
      expect(el.style.getPropertyValue('--_toggle-button-x')).toBe('25%');
      expect(el.style.getPropertyValue('--_toggle-button-y')).toBe('75%');
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 0 }));
      expect(el.style.getPropertyValue('--_toggle-button-x')).toBe('100%');
      expect(el.style.getPropertyValue('--_toggle-button-y')).toBe('0%');
      el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
      expect(el.style.getPropertyValue('--_toggle-button-x')).toBe('100%');
      el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
      expect(el.style.getPropertyValue('--_toggle-button-x')).toBe('');
      expect(el.style.getPropertyValue('--_toggle-button-y')).toBe('');
    } finally {
      if (had) Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', had);
      else Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');
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
