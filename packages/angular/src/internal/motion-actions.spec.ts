// toggleLandSpec is a copy of React's: the same spec for every step.
import { describe, expect, it } from 'vitest';
import { toggleLandSpec } from './motion-actions';

describe('toggleLandSpec', () => {
  it('pops past rest when on and sinks when off, one stagger step per part, at most six', () => {
    const on = toggleLandSpec(true, 0);
    expect(on.duration).toBe('duration.celebrate');
    expect(on.easing).toBe('ease.out');
    expect(on.keyframes).toHaveLength(3);
    expect(on.delay).toBeUndefined();
    const off = toggleLandSpec(false, 2);
    expect(off.duration).toBe('duration.spring-soft');
    expect(off.easing).toBe('ease.spring-soft');
    expect(off.delay).toBe('delay.stagger');
    expect(off.delaySteps).toBe(2);
    expect(toggleLandSpec(true, 9).delaySteps).toBe(6);
  });
});
