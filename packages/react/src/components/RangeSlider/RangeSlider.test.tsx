import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import RangeSliderDemo from './RangeSlider.demo';
import { RangeSlider } from './index';

// jsdom has no ResizeObserver or pointer capture; Radix Slider uses both.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
});

const names: [string, string] = ['Minimum price', 'Maximum price'];

describe('RangeSlider', () => {
  it('renders two thumbs with their own names and data-thumb', () => {
    const { container } = render(<RangeSlider label="Price" unit="SAR" max={1000} defaultValue={[200, 700]} thumbLabels={names} />);
    const root = container.querySelector('[data-ds="range-slider"]');
    expect(root?.getAttribute('data-size')).toBe('md');
    const low = screen.getByRole('slider', { name: 'Minimum price' });
    const high = screen.getByRole('slider', { name: 'Maximum price' });
    expect(low.getAttribute('data-thumb')).toBe('start');
    expect(high.getAttribute('data-thumb')).toBe('end');
    expect(low.getAttribute('aria-valuetext')).toBe('200 SAR');
    expect(high.getAttribute('aria-valuetext')).toBe('700 SAR');
    expect(container.querySelector('[data-part="value"]')?.textContent).toBe('200 SAR - 700 SAR');
  });

  it('defaults to the full range', () => {
    render(<RangeSlider thumbLabels={names} min={10} max={90} />);
    expect(screen.getByRole('slider', { name: 'Minimum price' }).getAttribute('aria-valuenow')).toBe('10');
    expect(screen.getByRole('slider', { name: 'Maximum price' }).getAttribute('aria-valuenow')).toBe('90');
  });

  it('moves each thumb with keys, and the thumbs never cross', () => {
    const onChange = vi.fn();
    render(<RangeSlider thumbLabels={names} defaultValue={[40, 42]} onValueChange={onChange} />);
    const low = screen.getByRole('slider', { name: 'Minimum price' });
    const high = screen.getByRole('slider', { name: 'Maximum price' });
    fireEvent.focus(low);
    fireEvent.keyDown(low, { key: 'ArrowRight' });
    expect(low.getAttribute('aria-valuenow')).toBe('41');
    fireEvent.keyDown(low, { key: 'ArrowRight' });
    expect(low.getAttribute('aria-valuenow')).toBe('41');
    fireEvent.focus(high);
    fireEvent.keyDown(high, { key: 'End' });
    expect(high.getAttribute('aria-valuenow')).toBe('100');
    expect(onChange).toHaveBeenLastCalledWith([41, 100]);
  });

  it('Home and End move the focused thumb, stopping before the other', () => {
    render(<RangeSlider thumbLabels={names} defaultValue={[20, 60]} minStepsBetweenThumbs={5} />);
    const low = screen.getByRole('slider', { name: 'Minimum price' });
    const high = screen.getByRole('slider', { name: 'Maximum price' });
    fireEvent.focus(low);
    fireEvent.keyDown(low, { key: 'End' });
    expect(low.getAttribute('aria-valuenow')).toBe('55');
    expect(high.getAttribute('aria-valuenow')).toBe('60');
    fireEvent.focus(high);
    fireEvent.keyDown(high, { key: 'Home' });
    expect(high.getAttribute('aria-valuenow')).toBe('60');
    fireEvent.keyDown(high, { key: 'End' });
    expect(high.getAttribute('aria-valuenow')).toBe('100');
    fireEvent.focus(low);
    fireEvent.keyDown(low, { key: 'Home' });
    expect(low.getAttribute('aria-valuenow')).toBe('0');
  });

  it('is a group named by its label', () => {
    render(<RangeSlider label="Price" thumbLabels={names} />);
    expect(screen.getByRole('group', { name: 'Price' }).getAttribute('data-ds')).toBe('range-slider');
  });

  it('follows a controlled value and reports the commit as a pair', () => {
    const onCommit = vi.fn();
    const { rerender } = render(<RangeSlider thumbLabels={names} value={[10, 20]} onValueCommit={onCommit} />);
    // Radix moves the thumb that last had focus.
    const high = screen.getByRole('slider', { name: 'Maximum price' });
    fireEvent.focus(high);
    fireEvent.keyDown(high, { key: 'ArrowRight' });
    expect(onCommit).toHaveBeenCalledWith([10, 21]);
    rerender(<RangeSlider thumbLabels={names} value={[30, 40]} onValueCommit={onCommit} />);
    expect(screen.getByRole('slider', { name: 'Minimum price' }).getAttribute('aria-valuenow')).toBe('30');
  });

  it('sends the ref to the start thumb', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<RangeSlider ref={ref} thumbLabels={names} />);
    expect(ref.current).toBe(screen.getByRole('slider', { name: 'Minimum price' }));
  });

  it('renders the demo with every case', () => {
    const { container } = render(<RangeSliderDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled']);
  });
});
