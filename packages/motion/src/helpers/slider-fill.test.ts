// slider-rubber-band and the keys of slider-nudge (order 1.23). The rubber
// band test moved with the code from
// packages/angular/src/components/slider/slider.motion.spec.ts (order 1.29).
import { describe, expect, it } from 'vitest';
import { KEY_BUMP, sliderKeyEnd, sliderRubberBand } from './slider-fill';

describe('slider-fill helpers', () => {
  it('slider-rubber-band: the pull rises with the distance and stays under 1', () => {
    expect(sliderRubberBand(0, 24)).toBe(0);
    expect(sliderRubberBand(24, 24)).toBe(0.5);
    expect(sliderRubberBand(72, 24)).toBe(0.75);
    expect(sliderRubberBand(10, 0)).toBe(0);
  });

  it('slider-nudge: a key at the end pulls half way, toward the end the key reads in either direction', () => {
    expect(KEY_BUMP).toBe(0.5);
    expect(sliderKeyEnd('Home', 'ltr')).toBe('start');
    expect(sliderKeyEnd('PageUp', 'ltr')).toBe('end');
    expect(sliderKeyEnd('ArrowLeft', 'ltr')).toBe('start');
    expect(sliderKeyEnd('ArrowLeft', 'rtl')).toBe('end');
    expect(sliderKeyEnd('ArrowRight', 'rtl')).toBe('start');
    expect(sliderKeyEnd('Tab', 'ltr')).toBeNull();
  });
});
