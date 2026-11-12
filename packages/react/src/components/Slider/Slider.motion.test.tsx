// Order 1.22 motion of Slider (slider-bubble, slider-pull) and the review fixes B1, B2 and N10.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { Slider } from './index';

// jsdom has no ResizeObserver; Radix Slider measures the thumb with it.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Slider.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('Slider motion (order 1.22)', () => {
  it('B1: the ring layer shows at once', () => {
    const at = css.indexOf(":is([data-ds='slider'], [data-ds='range-slider']) [data-part='thumb']::before {");
    expect(css.slice(at, css.indexOf('}', at))).not.toMatch(/transition/);
  });

  it('B2: no lift and no bubble travel under the page setting', () => {
    expect(css).toMatch(/:root\[data-motion='reduce'\] :is\(\[data-ds='slider'\], \[data-ds='range-slider'\]\) \{\s*--_slider-lift: 1;/);
  });

  it('slider-bubble: each thumb holds an aria-hidden bubble with the value, and the thumb keeps the accessible value', () => {
    render(<Slider aria-label="Zoom" unit="%" defaultValue={40} />);
    const thumb = screen.getByRole('slider');
    const bubble = thumb.querySelector(':scope > span');
    expect(bubble?.getAttribute('aria-hidden')).toBe('true');
    expect(bubble?.textContent).toBe(thumb.getAttribute('aria-valuetext'));
    expect(thumb.getAttribute('aria-valuetext')).toMatch(/40/);
  });
});
