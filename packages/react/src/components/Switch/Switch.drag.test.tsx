// Order 1.23: the glass and dot hooks of the thumb, and the drag (switch-drag).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInteraction } from '@the-system/motion';
import { rubberBand, snapChecked } from './drag';
import { Switch } from './index';

const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Switch.css'), 'utf8');

describe('Switch round 3 anatomy and hooks', () => {
  it('puts the aria-hidden thumb-lens part inside the thumb', () => {
    render(<Switch label="Auto save" />);
    const lens = document.querySelector('[data-part="thumb"] > [data-part="thumb-lens"]');
    expect(lens).not.toBeNull();
    expect(lens?.getAttribute('aria-hidden')).toBe('true');
  });

  it('declares the glass and dot hooks with defaults', () => {
    for (const name of [
      '--_switch-thumb-size-rest',
      '--_switch-thumb-size-on',
      '--_switch-thumb-size-pressed',
      '--_switch-thumb-shadow',
      '--_switch-thumb-backdrop',
      '--_switch-thumb-highlight',
      '--_switch-thumb-solid-pressed',
    ]) {
      expect(css).toMatch(new RegExp(`${name}: [^;]+;`));
    }
    // The dot grows by transform, never by layout.
    expect(css).toMatch(/scale\(var\(--_switch-thumb-size-now\)\)/);
  });

  it('sweeps the fill with a clip that reads the same travel as the thumb', () => {
    expect(css).toMatch(/clip-path: inset\(/);
    expect(css).toMatch(/--_switch-cut: max\(/);
    expect(css).toMatch(/clip-path calc\(var\(--_switch-duration\) \* var\(--_switch-motion\)\) var\(--_switch-ease\)/);
  });

  it('drops the glass where backdrop-filter is missing and under reduced transparency and more contrast', () => {
    expect(css).toMatch(/@supports not \(\(backdrop-filter: none\) or \(-webkit-backdrop-filter: none\)\)/);
    expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
    expect(css).toMatch(/@media \(prefers-contrast: more\)/);
    expect(css).toMatch(/\[data-contrast='more'\] \[data-ds='switch'\]/);
  });

  it('registers switch-drag', () => {
    expect(getInteraction('switch-drag')?.components).toContain('Switch');
  });
});

describe('switch-drag math', () => {
  it('damps the thumb past either end', () => {
    expect(rubberBand(0.4)).toBe(0.4);
    expect(rubberBand(1.2)).toBeCloseTo(1.06);
    expect(rubberBand(3)).toBeCloseTo(1.12);
    expect(rubberBand(-0.2)).toBeCloseTo(-0.06);
  });

  it('snaps by velocity first, else by the nearer end', () => {
    expect(snapChecked(0.3, 0.02)).toBe(true);
    expect(snapChecked(0.8, -0.02)).toBe(false);
    expect(snapChecked(0.6, 0)).toBe(true);
    expect(snapChecked(0.4, 0.001)).toBe(false);
  });
});

describe('switch-drag on the control', () => {
  // jsdom has no layout: give the track 44px and a 20px thumb (no padding), so the travel is 24px.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('data-part') === 'thumb' ? 20 : 44;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 44);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ x: 0, y: 0, left: 0, top: 0, width: 44, height: 24, right: 44, bottom: 24, toJSON: () => ({}) }) as DOMRect,
    );
    HTMLElement.prototype.setPointerCapture = () => {};
  });
  afterEach(() => vi.restoreAllMocks());

  const drag = (control: HTMLElement, xs: number[]) => {
    fireEvent.pointerDown(control, { pointerId: 1, clientX: xs[0], button: 0, isPrimary: true });
    for (const x of xs.slice(1)) fireEvent.pointerMove(control, { pointerId: 1, clientX: x });
    fireEvent.pointerUp(control, { pointerId: 1, clientX: xs[xs.length - 1] });
    // The click that ends a pointer press.
    fireEvent.click(control);
  };

  it('follows the pointer while dragging, then snaps on and toggles once', () => {
    const onChange = vi.fn();
    const { container } = render(<Switch label="Wi-Fi" onCheckedChange={onChange} />);
    const control = screen.getByRole('switch');
    const root = container.querySelector<HTMLElement>('[data-ds="switch"]');
    fireEvent.pointerDown(control, { pointerId: 1, clientX: 10, button: 0, isPrimary: true });
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 18 });
    expect(root?.hasAttribute('data-dragging')).toBe(true);
    expect(Number(root?.style.getPropertyValue('--_switch-drag-progress'))).toBeCloseTo(8 / 24);
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 26 });
    fireEvent.pointerUp(control, { pointerId: 1, clientX: 26 });
    fireEvent.click(control);
    expect(root?.hasAttribute('data-dragging')).toBe(false);
    expect(root?.style.getPropertyValue('--_switch-drag-progress')).toBe('');
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('springs back when let go short of half, and the click after the drag toggles nothing', () => {
    const onChange = vi.fn();
    render(<Switch label="Wi-Fi" defaultChecked onCheckedChange={onChange} />);
    const control = screen.getByRole('switch');
    // A short drag back: 6px of a 24px travel.
    fireEvent.pointerDown(control, { pointerId: 1, clientX: 30, button: 0, isPrimary: true });
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 24 });
    // The pointer rests before the release, so there is no flick.
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 24 });
    fireEvent.pointerUp(control, { pointerId: 1, clientX: 24 });
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('a tap under the slop still toggles through the click, and keys still toggle', () => {
    const onChange = vi.fn();
    render(<Switch label="Wi-Fi" onCheckedChange={onChange} />);
    const control = screen.getByRole('switch');
    drag(control, [10, 11]);
    expect(control.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not drag while disabled or read only', () => {
    const { container } = render(<Switch label="Wi-Fi" readOnly />);
    const control = screen.getByRole('switch');
    drag(control, [10, 30]);
    expect(container.querySelector('[data-ds="switch"]')?.hasAttribute('data-dragging')).toBe(false);
    expect(control.getAttribute('aria-checked')).toBe('false');
  });
});
