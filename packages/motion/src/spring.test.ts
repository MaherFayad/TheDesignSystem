import { describe, expect, it } from 'vitest';
import { springAt, springCurve, springOvershoot } from './spring';
import { springValue } from './tokens';

describe('spring curves', () => {
  it('start at 0 and end at 1', () => {
    for (const name of Object.keys(springValue) as (keyof typeof springValue)[]) {
      const { easing, durationMs } = springCurve(name);
      expect(easing.startsWith('linear(0, ')).toBe(true);
      expect(easing.endsWith(', 1)')).toBe(true);
      expect(durationMs).toBeGreaterThan(100);
      expect(durationMs).toBeLessThan(1000);
    }
  });

  it('settle within the given share of the target at the end', () => {
    const s = springValue['spring.sheet'];
    const { durationMs } = springCurve(s, { settle: 0.01 });
    expect(Math.abs(1 - springAt(s, durationMs / 1000))).toBeLessThanOrEqual(0.01);
  });

  it('overshoot a little at most: the sheet spring stays under 1%', () => {
    expect(springOvershoot('spring.sheet')).toBeLessThan(0.01);
    expect(springOvershoot('spring.press')).toBeLessThan(0.06);
    expect(springOvershoot({ stiffness: 100, damping: 40, mass: 1 })).toBe(0);
  });

  it('writes the given number of stops', () => {
    expect(springCurve('spring.merge', { points: 8 }).easing.split(',').length).toBe(9);
  });
});
