import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import ColorSliderDemo from './ColorSlider.demo';
import { ColorSlider } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="color-slider"]')!;
const ARABIC_INDIC = /[٠-٩۰-۹]/;

describe('ColorSlider', () => {
  it('renders the anatomy with no React Aria classes or data attributes', () => {
    const { container } = render(<ColorSlider channel="hue" defaultValue="hsl(214, 76%, 48%)" locale="en" />);
    const el = root(container);
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('data-size')).toBe('md');
    for (const part of ['label', 'value', 'track', 'thumb']) expect(el.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    expect(el.querySelector('[class]')).toBeNull();
    expect(el.querySelector('[data-rac]')).toBeNull();
    expect(el.querySelector('[data-part="label"]')!.textContent).toBe('Hue');
    expect(el.querySelector('[data-part="value"]')!.textContent).toBe('214°');
  });

  it('names the value with the number and a colour name, not React Aria words', () => {
    render(<ColorSlider channel="hue" defaultValue="hsl(214, 76%, 48%)" locale="en" />);
    const input = screen.getByRole('slider', { name: 'Hue' });
    expect(input.getAttribute('aria-valuetext')).toBe('214°, Blue');
  });

  it('gives the gradient and the thumb colour as custom properties', () => {
    const { container } = render(<ColorSlider channel="alpha" defaultValue="#1e6fd980" locale="en" />);
    const track = root(container).querySelector<HTMLElement>('[data-part="track"]')!;
    const thumb = root(container).querySelector<HTMLElement>('[data-part="thumb"]')!;
    expect(track.style.getPropertyValue('--_color-slider-fill')).toMatch(/^linear-gradient\(to right/);
    expect(track.style.background).toBe('');
    expect(thumb.style.getPropertyValue('--_color-slider-thumb-bg')).toMatch(/^rgba\(30, 111, 217, 0\.5/);
    expect(thumb.style.backgroundColor).toBe('');
    expect(screen.getByRole('slider', { name: 'Opacity' }).getAttribute('aria-valuetext')).toBe('50%');
  });

  it('keeps Western digits and Arabic order in ar-SA, and mirrors the gradient', () => {
    const { container } = render(<ColorSlider channel="hue" defaultValue="hsl(214, 76%, 48%)" locale="ar-SA" />);
    const input = screen.getByRole('slider', { name: 'درجة اللون' });
    expect(input.getAttribute('aria-valuetext')).toBe('214 درجة، أزرق');
    expect(ARABIC_INDIC.test(root(container).textContent ?? '')).toBe(false);
    expect(root(container).querySelector<HTMLElement>('[data-part="track"]')!.style.getPropertyValue('--_color-slider-fill')).toMatch(/to left/);
  });

  it('names the colour now for a channel other than hue', () => {
    render(<ColorSlider channel="lightness" defaultValue="hsl(214, 76%, 30%)" locale="ar" />);
    const input = screen.getByRole('slider', { name: 'الإضاءة' });
    // Intl wraps the percent sign in left to right marks in Arabic; the digits stay Western.
    expect(input.getAttribute('aria-valuetext')!.replace(/\u200e/g, '')).toBe('30%، أزرق داكن');
  });

  it('steps with the keys, the path that needs no drag, and keeps the value text current', async () => {
    const onChange = vi.fn();
    render(<ColorSlider channel="hue" defaultValue="hsl(214, 76%, 48%)" locale="en" onChange={onChange} />);
    const input = screen.getByRole('slider');
    act(() => input.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('hsla(215, 76%, 48%, 1)', expect.anything());
    expect(input.getAttribute('aria-valuetext')).toBe('215°, Blue');
    await userEvent.keyboard('{End}');
    expect(input.getAttribute('aria-valuetext')).toBe('360°, Red');
    await userEvent.keyboard('{Home}');
    expect(input.getAttribute('aria-valuetext')).toBe('0°, Red');
    await userEvent.keyboard('{PageUp}');
    expect(Number((input as HTMLInputElement).value)).toBeGreaterThan(1);
  });

  it('mirrors the arrow keys in right to left: ArrowLeft goes up', async () => {
    render(
      <Theme lang="ar">
        <ColorSlider channel="hue" defaultValue="hsl(100, 76%, 48%)" />
      </Theme>,
    );
    const input = screen.getByRole('slider') as HTMLInputElement;
    act(() => input.focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(input.value).toBe('101');
  });

  it('takes a label, hides it, disables, and takes sizes', () => {
    const { container, rerender } = render(<ColorSlider channel="alpha" defaultValue="#000" label="Shadow opacity" size="lg" locale="en" />);
    expect(screen.getByRole('slider', { name: 'Shadow opacity' })).toBeTruthy();
    expect(root(container).getAttribute('data-size')).toBe('lg');
    rerender(<ColorSlider channel="alpha" defaultValue="#000" hideLabel locale="en" disabled />);
    expect(root(container).querySelector('[data-part="label"]')).toBeNull();
    expect(screen.getByRole('slider', { name: 'Opacity' })).toBeTruthy();
    expect(root(container).getAttribute('data-disabled')).toBe('');
    expect((screen.getByRole('slider') as HTMLInputElement).disabled).toBe(true);
  });

  it('marks the thumb while it is dragged', () => {
    const { container } = render(<ColorSlider channel="hue" defaultValue="hsl(214, 76%, 48%)" locale="en" />);
    const thumb = root(container).querySelector<HTMLElement>('[data-part="thumb"]')!;
    fireEvent.pointerDown(thumb, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 });
    expect(thumb.getAttribute('data-dragging')).toBe('');
    fireEvent.pointerUp(window, { pointerId: 1, pointerType: 'mouse', button: 0 });
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = render(<ColorSliderDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'long-text', 'long-arabic', 'disabled']);
    expect(ARABIC_INDIC.test(container.textContent ?? '')).toBe(false);
  });
});
