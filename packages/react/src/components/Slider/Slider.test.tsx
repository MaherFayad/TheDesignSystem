import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

  describe('slider-pull and slider-nudge', () => {
    function withAnimate(run: (animate: ReturnType<typeof vi.fn>) => void) {
      const animate = vi.fn(
        () =>
          ({
            finished: Promise.resolve(),
            cancel() {},
            effect: { composite: 'replace', getTiming: () => ({ duration: 0 }) },
          }) as unknown as Animation,
      );
      const proto = HTMLElement.prototype as unknown as { animate?: unknown };
      const original = proto.animate;
      proto.animate = animate;
      try {
        run(animate);
      } finally {
        proto.animate = original;
      }
    }
    const call = (animate: ReturnType<typeof vi.fn>, i = 0) => animate.mock.calls[i] as unknown as [Keyframe[], KeyframeAnimationOptions];

    it('nudges the thumb toward the end once when a key pushes past the maximum', () =>
      withAnimate((animate) => {
        render(
          <Theme style="desk">
            <Slider aria-label="Volume" defaultValue={100} />
          </Theme>,
        );
        const thumb = screen.getByRole('slider');
        thumb.focus();
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(animate).toHaveBeenCalledTimes(1);
        const [frames, timing] = call(animate);
        expect(timing.id).toBe('ds-motion:shake');
        expect(frames).toHaveLength(3);
        expect(String(frames[1]?.transform)).toMatch(/^translateX\(calc\(1 \* /);
        // Added on top of the lift instead of replacing it.
        expect((animate.mock.results[0]?.value as Animation).effect).toMatchObject({ composite: 'add' });
        // A held key nudges once.
        fireEvent.keyDown(thumb, { key: 'ArrowRight', repeat: true });
        expect(animate).toHaveBeenCalledTimes(1);
        // A key that moves the value does not nudge, and the value changes at once.
        fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('99');
        expect(animate).toHaveBeenCalledTimes(1);
      }));

    it('nudges toward the start at the minimum, with the keys of the reading direction', () =>
      withAnimate((animate) => {
        render(
          <Theme style="desk" dir="rtl" lang="ar">
            <Slider aria-label="الصوت" defaultValue={0} />
          </Theme>,
        );
        const thumb = screen.getByRole('slider');
        thumb.focus();
        // In right to left text ArrowLeft moves toward the end, so it moves the value.
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(animate).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('1');
        expect(animate).toHaveBeenCalledTimes(1);
      }));

    it('plays no nudge under reduced motion and never on a vertical slider', () =>
      withAnimate((animate) => {
        const original = window.matchMedia;
        window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
        try {
          render(
            <Theme style="desk">
              <Slider aria-label="Volume" defaultValue={100} />
              <Slider aria-label="Level" orientation="vertical" defaultValue={100} />
            </Theme>,
          );
          for (const thumb of screen.getAllByRole('slider')) {
            thumb.focus();
            fireEvent.keyDown(thumb, { key: 'ArrowUp' });
          }
          expect(animate).not.toHaveBeenCalled();
        } finally {
          window.matchMedia = original;
        }
      }));

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

    it('nudges once when a drag goes past the end of the track, and again only after it comes back', () =>
      withAnimate((animate) => {
        const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 24));
        const capture = vi.spyOn(Element.prototype, 'hasPointerCapture').mockReturnValue(true);
        try {
          render(
            <Theme style="desk">
              <Slider aria-label="Volume" defaultValue={40} />
            </Theme>,
          );
          const control = document.querySelector<HTMLElement>('[data-part="control"]')!;
          // The value bubble rolls its digits during the drag (slider-bubble); count the nudges only.
          const nudges = () => animate.mock.calls.filter((c) => (c as unknown as [Keyframe[], KeyframeAnimationOptions])[1].id === 'ds-motion:shake') as unknown as [Keyframe[], KeyframeAnimationOptions][];
          fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientX: 40 });
          fireEvent.pointerMove(control, { pointerId: 1, clientX: 90 });
          expect(nudges()).toHaveLength(0);
          fireEvent.pointerMove(control, { pointerId: 1, clientX: 130 });
          fireEvent.pointerMove(control, { pointerId: 1, clientX: 140 });
          expect(nudges()).toHaveLength(1);
          expect(String(nudges()[0]![0][1]?.transform)).toMatch(/^translateX\(calc\(1 \* /);
          fireEvent.pointerMove(control, { pointerId: 1, clientX: 50 });
          fireEvent.pointerMove(control, { pointerId: 1, clientX: -20 });
          expect(nudges()).toHaveLength(2);
          expect(String(nudges()[1]![0][1]?.transform)).toMatch(/^translateX\(calc\(-1 \* /);
        } finally {
          rect.mockRestore();
          capture.mockRestore();
        }
      }));

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
