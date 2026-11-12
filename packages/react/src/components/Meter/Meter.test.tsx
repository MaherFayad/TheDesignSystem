import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme';
import MeterDemo from './Meter.demo';
import { meterLevel, meterTone, resolveRange } from './level';
import { Meter } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="meter"]');
  if (!el) throw new Error('no meter rendered');
  return el;
}

const part = (el: HTMLElement, name: string) => el.querySelector<HTMLElement>(`[data-part="${name}"]`);
const storage = { max: 100, low: 60, high: 85, optimum: 0 };

describe('Meter', () => {
  it('renders a labelled meter with the anatomy and the aria values', () => {
    const el = root(render(<Meter value={46} label="Usage" />).container);
    expect(screen.getByRole('meter', { name: 'Usage' })).toBe(el);
    expect(el.getAttribute('aria-valuenow')).toBe('46');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuetext')).toBe('46%');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-level')).toBe('medium');
    expect(part(el, 'value')?.textContent).toBe('46%');
    expect(part(el, 'indicator')?.parentElement).toBe(part(el, 'track'));
    expect(part(el, 'indicator')?.style.getPropertyValue('--_meter-fraction')).toBe('0.46');
  });

  it('sets level and tone from the thresholds and says the level in text', () => {
    const cases = [
      [30, 'low', 'success', 'Low'],
      [70, 'medium', 'warning', 'Medium'],
      [95, 'high', 'danger', 'High'],
    ] as const;
    for (const [value, level, tone, word] of cases) {
      const el = root(render(<Meter value={value} {...storage} label="Storage" />).container);
      expect(el.getAttribute('data-level')).toBe(level);
      expect(el.getAttribute('data-tone')).toBe(tone);
      expect(el.getAttribute('aria-valuetext')).toBe(`${value}%, ${word}`);
      expect(part(el, 'value')?.textContent).toBe(`${value}%, ${word}`);
    }
  });

  it('takes custom value text, level words, a tone override, min and size', () => {
    const el = root(
      render(
        <Meter
          value={150}
          min={50}
          max={250}
          high={200}
          valueText={(v, min, max) => `${v} of ${max} (from ${min})`}
          levelLabels={{ medium: 'Fine' }}
          tone="accent"
          size="lg"
          label="Load"
        />,
      ).container,
    );
    expect(el.getAttribute('aria-valuemin')).toBe('50');
    expect(el.getAttribute('aria-valuetext')).toBe('150 of 250 (from 50), Fine');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(part(el, 'indicator')?.style.getPropertyValue('--_meter-fraction')).toBe('0.5');
  });

  it('clamps, hides the level on request and uses aria-label', () => {
    const el = root(render(<Meter value={140} {...storage} showLevel={false} aria-label="Storage" />).container);
    expect(el.getAttribute('aria-valuenow')).toBe('100');
    expect(el.getAttribute('aria-valuetext')).toBe('100%');
    expect(part(el, 'label')).toBeNull();
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('speaks Arabic level words with Western digits', () => {
    const el = root(
      render(
        <Theme lang="ar">
          <Meter value={95} {...storage} label="المساحة" />
        </Theme>,
      ).container,
    );
    expect(el.getAttribute('aria-valuetext')).toMatch(/مرتفع$/);
    expect(el.getAttribute('aria-valuetext')).not.toMatch(/[٠-٩]/);
  });

  it('passes the ref and other props to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const el = root(render(<Meter ref={ref} value={1} label="x" className="c" data-testid="m" />).container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('c');
    expect(el.getAttribute('data-testid')).toBe('m');
  });

  it('renders every demo case, with Arabic in the variants case', () => {
    const { container } = render(<MeterDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic', 'error']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
  });
});

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
});
