// toggle-pop (order 1.23): the state layer's spec. Moved with the code from
// packages/angular/src/components/toggle-button/toggle-button-motion.spec.ts
// (order 1.29); the Angular wiring keeps its tests there.
import { describe, expect, it } from 'vitest';
import { pressShare, toggleLayerSpec } from './toggle-layer';

describe('toggle layer', () => {
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

  it('writes the press point as a share of the box, clamped, to a tenth of a percent', () => {
    expect(pressShare(0.375)).toBe('37.5%');
    expect(pressShare(1.4)).toBe('100%');
    expect(pressShare(-0.2)).toBe('0%');
  });
});
