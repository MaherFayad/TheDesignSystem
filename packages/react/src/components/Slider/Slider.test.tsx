import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import SliderDemo from './Slider.demo';
import { formatSliderValue, Slider } from './index';

// jsdom has no ResizeObserver; Radix Slider measures the thumb with it.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  // Nor pointer capture, which Radix calls on pointer down.
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
});

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="slider"]');
  if (!el) throw new Error('no slider root');
  return el;
}

describe('Slider', () => {
  it('renders the parts and names the thumb from the label', () => {
    const { container } = render(<Slider label="Volume" unit="%" defaultValue={40} marks={[0, 50, 100]} />);
    const box = root(container);
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-tone')).toBe('accent');
    expect(box.getAttribute('data-orientation')).toBe('horizontal');
    for (const part of ['label', 'value', 'control', 'track', 'range', 'thumb', 'marks']) {
      expect(container.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    expect(thumb.getAttribute('aria-valuenow')).toBe('40');
    expect(thumb.getAttribute('aria-valuetext')).toBe('40%');
    expect(container.querySelector('[data-part="value"]')?.textContent).toBe('40%');
    expect(container.querySelectorAll('[data-mark]')).toHaveLength(3);
  });

  it('moves by step with arrows, by ten steps with PageUp, and to the ends with Home and End', () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Level" defaultValue={50} onValueChange={onChange} />);
    const thumb = screen.getByRole('slider', { name: 'Level' });
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(thumb.getAttribute('aria-valuenow')).toBe('51');
    fireEvent.keyDown(thumb, { key: 'PageUp' });
    expect(thumb.getAttribute('aria-valuenow')).toBe('61');
    fireEvent.keyDown(thumb, { key: 'Home' });
    expect(thumb.getAttribute('aria-valuenow')).toBe('0');
    fireEvent.keyDown(thumb, { key: 'End' });
    expect(thumb.getAttribute('aria-valuenow')).toBe('100');
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('ArrowRight follows the reading direction in right to left text', () => {
    render(
      <Theme lang="ar">
        <Slider aria-label="rtl" defaultValue={50} />
      </Theme>,
    );
    const thumb = screen.getByRole('slider');
    fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
    expect(thumb.getAttribute('aria-valuenow')).toBe('51');
  });

  it('follows a controlled value and reports the commit', () => {
    const onCommit = vi.fn();
    const { rerender } = render(<Slider aria-label="c" value={10} onValueCommit={onCommit} />);
    const thumb = screen.getByRole('slider');
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(onCommit).toHaveBeenCalledWith(11);
    expect(thumb.getAttribute('aria-valuenow')).toBe('10');
    rerender(<Slider aria-label="c" value={20} onValueCommit={onCommit} />);
    expect(thumb.getAttribute('aria-valuenow')).toBe('20');
  });

  it('sets disabled, invalid and dragging states', () => {
    const { container } = render(
      <Field error="Too low.">
        <Slider label="Scale" disabled />
      </Field>,
    );
    const box = root(container);
    expect(box.hasAttribute('data-disabled')).toBe(true);
    expect(box.hasAttribute('data-invalid')).toBe(true);
    const thumb = screen.getByRole('slider');
    expect(thumb.getAttribute('aria-invalid')).toBe('true');
    expect(thumb.getAttribute('aria-describedby')).toBeTruthy();
    const live = render(<Slider aria-label="d" />).container;
    const control = live.querySelector('[data-part="control"]') as HTMLElement;
    fireEvent.pointerDown(control);
    expect(root(live).hasAttribute('data-dragging')).toBe(true);
    fireEvent.lostPointerCapture(control);
    expect(root(live).hasAttribute('data-dragging')).toBe(false);
  });

  it('takes its name from a Field label, and hides the visible value', () => {
    const { container } = render(
      <Field label="Export scale">
        <Slider unit="%" defaultValue={5} />
      </Field>,
    );
    expect(screen.getByRole('slider', { name: 'Export scale' })).toBeTruthy();
    const labelled = render(<Slider label="Blur" defaultValue={2} />).container;
    const thumb = labelled.querySelector('[role="slider"]');
    expect(thumb?.getAttribute('aria-labelledby')).toBe(labelled.querySelector('[data-part="label"]')?.id);
    expect(labelled.querySelector('[data-part="value"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(container).toBeTruthy();
  });

  it('PageDown and ArrowDown lower the value; formatValue reaches aria-valuetext', () => {
    render(<Slider aria-label="f" defaultValue={50} formatValue={(v) => `${v} points`} />);
    const thumb = screen.getByRole('slider');
    fireEvent.keyDown(thumb, { key: 'PageDown' });
    fireEvent.keyDown(thumb, { key: 'ArrowDown' });
    expect(thumb.getAttribute('aria-valuenow')).toBe('39');
    expect(thumb.getAttribute('aria-valuetext')).toBe('39 points');
  });

  it('shows no marks when vertical', () => {
    const { container } = render(<Slider aria-label="v" orientation="vertical" marks={[0, 50]} />);
    expect(container.querySelector('[data-part="marks"]')).toBeNull();
  });

  it('sends the ref to the thumb, className and style to the root', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<Slider ref={ref} aria-label="r" className="s" rootProps={{ id: 'root' }} />);
    expect(ref.current).toBe(screen.getByRole('slider'));
    expect(root(container).className).toBe('s');
    expect(root(container).id).toBe('root');
  });

  it('formats with Western digits and the unit', () => {
    expect(formatSliderValue(12500, 'ar', { unit: 'ريال' })).toBe('12,500 ريال');
    expect(formatSliderValue(40, 'en', { unit: '%' })).toBe('40%');
    expect(formatSliderValue(1.5, 'en')).toBe('1.5');
  });

  it('renders the demo with every case', () => {
    const { container } = render(<SliderDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled']);
  });
});
