import { describe, expect, it } from 'vitest';
import desk from '../../styles/desk/motion';
import studio from '../../styles/studio/motion';
import { catalog } from './catalog';
import { PATTERN_IDS } from './core';
import { patternPreset, resolvePreset } from './preset';
import { durationMs } from './tokens';

describe('style motion presets', () => {
  it('pick a form for every pattern', () => {
    for (const style of [studio, desk]) {
      expect(Object.keys(resolvePreset(style)).sort()).toEqual([...PATTERN_IDS].sort());
    }
  });

  it('Studio is flat: windows fade, zoom is still, numbers change in place', () => {
    expect(patternPreset(studio, 'window-grow').mode).toBe('reduced');
    expect(patternPreset(studio, 'window-minimize').mode).toBe('reduced');
    expect(patternPreset(studio, 'window-zoom').mode).toBe('none');
    expect(patternPreset(studio, 'number-roll').mode).toBe('reduced');
    expect(patternPreset(studio, 'dialog').mode).toBe('full');
  });

  it('Studio stays inside 70 to 220ms', () => {
    for (const p of Object.values(resolvePreset(studio))) {
      if (p.duration) expect(durationMs[p.duration as keyof typeof durationMs]).toBeLessThanOrEqual(220);
    }
  });

  it('Desk grows its windows and rolls its numbers', () => {
    for (const id of ['window-grow', 'window-zoom', 'window-minimize', 'number-roll'] as const) {
      expect(patternPreset(desk, id).mode).toBe('full');
    }
  });

  it('a window mode of none turns off every window pattern', () => {
    const still = { id: 'still', window: 'none' as const };
    expect(patternPreset(still, 'window-grow').mode).toBe('none');
    expect(patternPreset(still, 'window-zoom').mode).toBe('none');
    expect(patternPreset(still, 'dialog').mode).toBe('full');
  });
});

describe('preset timing per phase (N12)', () => {
  it('an enter row changes the enter only, and no row changes the reduced form', () => {
    const preset = { mode: 'full' as const, enter: { easing: 'ease.out' as const, duration: 'duration.slow' as const } };
    expect(catalog['menu-scale'].specFor({}, { reduced: false, preset })).toMatchObject({ easing: 'ease.out', duration: 'duration.slow' });
    const exit = catalog['menu-scale'].specFor({ phase: 'exit' }, { reduced: false, preset });
    expect(exit?.easing).toBe(catalog['menu-scale'].spec({ phase: 'exit' }).easing);
    expect(exit?.duration).toBe(catalog['menu-scale'].spec({ phase: 'exit' }).duration);
    const both = { mode: 'full' as const, duration: 'duration.slow' as const };
    expect(catalog.dialog.specFor({}, { reduced: true, preset: both })?.duration).toBe(catalog.dialog.reducedSpec().duration);
    expect(catalog.dialog.specFor({ phase: 'exit' }, { reduced: false, preset: both })?.duration).toBe('duration.slow');
  });
});
