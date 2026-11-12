import { describe, expect, it } from 'vitest';
import { tokenValue } from './testing/base-tokens';
import { distancePx, durationMs, easeBezier, scaleValue, spacePx, springValue } from './tokens';

describe('the token values the catalog copies match packages/tokens/src/base', () => {
  it.each(Object.entries(durationMs))('%s is %d ms', (path, ms) => {
    expect(tokenValue(path)).toBe(ms);
  });
  it.each(Object.entries(easeBezier))('%s', (path, bezier) => {
    expect(tokenValue(path)).toEqual(bezier);
  });
  it.each(Object.entries(scaleValue))('%s is %d', (path, n) => {
    expect(tokenValue(path)).toBe(n);
  });
  it.each(Object.entries(spacePx))('%s is %d px', (path, px) => {
    expect(tokenValue(path)).toBe(px);
  });
  it.each(Object.entries(distancePx))('%s is %d px', (path, px) => {
    expect(tokenValue(path)).toBe(px);
  });
  it.each(Object.entries(springValue))('%s', (path, spring) => {
    expect({
      stiffness: tokenValue(`${path}.stiffness`),
      damping: tokenValue(`${path}.damping`),
      mass: tokenValue(`${path}.mass`),
    }).toEqual(spring);
  });
});
