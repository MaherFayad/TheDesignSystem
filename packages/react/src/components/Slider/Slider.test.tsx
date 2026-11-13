import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import SliderDemo from './Slider.demo';
import { formatSliderValue, Slider } from './index';
import { KEY_BUMP } from '@the-system/motion';
import { RangeSlider } from '../RangeSlider';

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

  describe('slider-pull and slider-nudge', () => {
    it('slider-nudge: a key past the maximum pulls the thumb and the fill toward the end, then lets go, and the value stays', () => {
      vi.useFakeTimers();
      try {
        const { container } = render(
          <Theme style="desk">
            <Slider aria-label="Volume" defaultValue={100} />
          </Theme>,
        );
        const el = root(container);
        const thumb = screen.getByRole('slider');
        thumb.focus();
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(Number(el.style.getPropertyValue('--_slider-pull-end'))).toBe(KEY_BUMP);
        expect(thumb.getAttribute('aria-valuenow')).toBe('100');
        act(() => {
          vi.runAllTimers();
        });
        expect(Number(el.style.getPropertyValue('--_slider-pull-end'))).toBe(0);
        // A held key does not pull again.
        fireEvent.keyDown(thumb, { key: 'ArrowRight', repeat: true });
        expect(Number(el.style.getPropertyValue('--_slider-pull-end'))).toBe(0);
        // A key that moves the value does not pull.
        fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('99');
        expect(Number(el.style.getPropertyValue('--_slider-pull-end'))).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('slider-nudge: in right to left text the start is on the right, and a vertical slider does not pull', () => {
      const { container } = render(
        <Theme style="desk" dir="rtl" lang="ar">
          <Slider aria-label="الصوت" defaultValue={0} />
          <Slider aria-label="المستوى" orientation="vertical" defaultValue={100} />
        </Theme>,
      );
      const [h, v] = screen.getAllByRole('slider');
      h!.focus();
      fireEvent.keyDown(h!, { key: 'ArrowRight' });
      const roots = container.querySelectorAll<HTMLElement>('[data-ds="slider"]');
      expect(Number(roots[0]!.style.getPropertyValue('--_slider-pull-start'))).toBe(KEY_BUMP);
      v!.focus();
      fireEvent.keyDown(v!, { key: 'ArrowUp' });
      expect(Number(roots[1]!.style.getPropertyValue('--_slider-pull-end'))).toBe(0);
    });

    it('lifts the grabbed thumb in CSS on the catalog timing, and turns it off under reduced motion', () => {
      const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Slider.css'), 'utf8');
      // Order 1.22: the lift on the snappy spring, the release on the bouncy spring, the size from scale.stretch (N10).
      expect(css).toMatch(/--_slider-lift: var\(--ds-scale-stretch\);/);
      expect(css).toMatch(/--_slider-duration: var\(--ds-duration-spring-bouncy\);/);
      expect(css).toMatch(/--_slider-ease: var\(--ds-ease-spring-bouncy\);/);
      expect(css).toMatch(/--_slider-duration-in: var\(--ds-duration-spring-snappy\);/);
      expect(css).toMatch(/\[data-dragging\] \[data-part='thumb'\]:focus \{\s*--_slider-lift-now: var\(--_slider-lift\);/);
      expect(css).not.toMatch(/window-enter/);
      const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
      expect(reduced).toMatch(/--_slider-lift: 1;/);
    });

    it('slider-rubber-band: a drag past the end pulls the thumb and the fill with resistance, and lets go on release', () => {
      const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 24));
      const capture = vi.spyOn(Element.prototype, 'hasPointerCapture').mockReturnValue(true);
      try {
        const { container } = render(
          <Theme style="desk">
            <Slider aria-label="Volume" defaultValue={40} />
          </Theme>,
        );
        const el = root(container);
        const pull = (end: 'start' | 'end') => Number(el.style.getPropertyValue(`--_slider-pull-${end}`));
        const control = container.querySelector<HTMLElement>('[data-part="control"]')!;
        fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientX: 40 });
        fireEvent.pointerMove(control, { pointerId: 1, clientX: 90 });
        expect(pull('end')).toBe(0);
        fireEvent.pointerMove(control, { pointerId: 1, clientX: 124 });
        const near = pull('end');
        expect(near).toBeGreaterThan(0);
        fireEvent.pointerMove(control, { pointerId: 1, clientX: 400 });
        const far = pull('end');
        // It resists: further out pulls more, but never the whole way.
        expect(far).toBeGreaterThan(near);
        expect(far).toBeLessThan(1);
        expect(pull('start')).toBe(0);
        fireEvent.pointerMove(control, { pointerId: 1, clientX: -30 });
        expect(pull('end')).toBe(0);
        expect(pull('start')).toBeGreaterThan(0);
        fireEvent.lostPointerCapture(control, { pointerId: 1 });
        expect(pull('start')).toBe(0);
        expect(pull('end')).toBe(0);
      } finally {
        rect.mockRestore();
        capture.mockRestore();
      }
    });

    it('slider-fill: the root carries where the fill starts and ends', () => {
      const one = render(<Slider aria-label="Volume" min={0} max={200} defaultValue={50} />);
      expect(root(one.container).style.getPropertyValue('--_slider-from')).toBe('0');
      expect(root(one.container).style.getPropertyValue('--_slider-to')).toBe('0.25');
      one.unmount();
      const two = render(<RangeSlider thumbLabels={['Lowest', 'Highest']} defaultValue={[20, 80]} />);
      const range = two.container.querySelector<HTMLElement>('[data-ds="range-slider"]')!;
      expect(range.style.getPropertyValue('--_slider-from')).toBe('0.2');
      expect(range.style.getPropertyValue('--_slider-to')).toBe('0.8');
    });

    it('slider-fill: the fill is a clip-path on the track, and the range has no paint', () => {
      const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Slider.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      const at = css.indexOf("> [data-part='track']::before {");
      expect(css.slice(at, css.indexOf('}', at))).toMatch(/clip-path: inset\(0 var\(--_slider-clip-right\) 0 var\(--_slider-clip-left\)/);
      const range = css.indexOf("> [data-part='track'] > [data-part='range'] {");
      expect(css.slice(range, css.indexOf('}', range))).not.toMatch(/background/);
      expect(css).not.toMatch(/transition[^;]*\b(width|inset|left|right)\b/);
    });

    it('marks the root while a pointer holds the thumb', () => {
      const { container } = render(<Slider aria-label="Volume" defaultValue={40} />);
      const control = container.querySelector<HTMLElement>('[data-part="control"]')!;
      fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientX: 10 });
      expect(root(container).hasAttribute('data-dragging')).toBe(true);
      fireEvent.lostPointerCapture(control, { pointerId: 1 });
      expect(root(container).hasAttribute('data-dragging')).toBe(false);
    });
  });
});
