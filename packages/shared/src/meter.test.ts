import { describe, expect, it } from 'vitest';
import { meterLevel, meterLevelLabelsFor, meterTone, resolveRange } from './meter';

describe('meter level logic', () => {
  it('clamps thresholds like the HTML meter', () => {
    expect(resolveRange({ min: 0, max: 10, low: -5, high: 50 })).toEqual({
      min: 0,
      max: 10,
      low: 0,
      high: 10,
      optimum: undefined,
    });
    expect(resolveRange({ min: 0, max: 10, low: 8, high: 3 }).high).toBe(8);
  });

  it('places values in regions and tones them by the optimum', () => {
    const r = { min: 0, max: 10, low: 4, high: 7 };
    expect(meterLevel(3, r)).toBe('low');
    expect(meterLevel(4, r)).toBe('medium');
    expect(meterLevel(7, r)).toBe('medium');
    expect(meterLevel(8, r)).toBe('high');
    expect(meterTone(9, { ...r, optimum: 10 })).toBe('success');
    expect(meterTone(5, { ...r, optimum: 10 })).toBe('warning');
    expect(meterTone(1, { ...r, optimum: 10 })).toBe('danger');
    expect(meterTone(5, { ...r, optimum: 5 })).toBe('success');
    expect(meterTone(1, { ...r, optimum: 5 })).toBe('warning');
    expect(meterTone(5, r)).toBe('accent');
    expect(meterTone(5, { min: 0, max: 10, optimum: 2 })).toBe('accent');
  });

  it('picks the level words by language', () => {
    expect(meterLevelLabelsFor('ar-SA').high).toBe('مرتفع');
    expect(meterLevelLabelsFor('en').low).toBe('Low');
    expect(meterLevelLabelsFor(undefined).medium).toBe('Medium');
  });
});
