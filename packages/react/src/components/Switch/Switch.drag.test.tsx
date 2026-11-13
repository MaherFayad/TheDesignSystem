// Order 1.23: the glass and dot hooks of the thumb, and the drag (switch-drag).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInteraction } from '@the-system/motion';
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

  it('B4 (order 1.29): while dragging, the root shows the side the thumb is on; the control keeps aria-checked', () => {
    const { container } = render(<Switch label="Wi-Fi" defaultChecked />);
    const control = screen.getByRole('switch');
    const root = container.querySelector<HTMLElement>('[data-ds="switch"]');
    fireEvent.pointerDown(control, { pointerId: 1, clientX: 30, button: 0, isPrimary: true });
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 24 });
    expect(root?.getAttribute('data-state')).toBe('checked');
    // Past the middle back toward off: 14px of a 24px travel.
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 16 });
    expect(root?.getAttribute('data-state')).toBe('unchecked');
    expect(control.getAttribute('aria-checked')).toBe('true');
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 16 });
    fireEvent.pointerUp(control, { pointerId: 1, clientX: 16 });
    fireEvent.click(control);
    expect(root?.getAttribute('data-state')).toBe('unchecked');
    expect(control.getAttribute('aria-checked')).toBe('false');
  });

  it('N10 (order 1.29): a lost pointer capture ends the drag where it is, and leaves no data-dragging', () => {
    const { container } = render(<Switch label="Wi-Fi" />);
    const control = screen.getByRole('switch');
    const root = container.querySelector<HTMLElement>('[data-ds="switch"]');
    fireEvent.pointerDown(control, { pointerId: 1, clientX: 10, button: 0, isPrimary: true });
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 30 });
    expect(root?.hasAttribute('data-dragging')).toBe(true);
    fireEvent.lostPointerCapture(control, { pointerId: 1 });
    expect(root?.hasAttribute('data-dragging')).toBe(false);
    expect(root?.style.getPropertyValue('--_switch-drag-progress')).toBe('');
    expect(control.getAttribute('aria-checked')).toBe('false');
  });

  it('N1 (order 1.29): the root is data-released from a pointer release to the next press', () => {
    const { container } = render(<Switch label="Wi-Fi" />);
    const control = screen.getByRole('switch');
    const root = container.querySelector<HTMLElement>('[data-ds="switch"]');
    expect(root?.hasAttribute('data-released')).toBe(false);
    fireEvent.pointerDown(control, { pointerId: 1, clientX: 10, button: 0, isPrimary: true });
    expect(root?.hasAttribute('data-released')).toBe(false);
    fireEvent.pointerUp(control, { pointerId: 1, clientX: 10 });
    expect(root?.hasAttribute('data-released')).toBe(true);
    fireEvent.click(control);
    // The tap toggles; the flag holds while a lingering :active would.
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(root?.hasAttribute('data-released')).toBe(true);
    fireEvent.keyDown(control, { key: ' ' });
    expect(root?.hasAttribute('data-released')).toBe(false);
    fireEvent.pointerDown(control, { pointerId: 2, clientX: 10, button: 0, isPrimary: true });
    fireEvent.pointerCancel(control, { pointerId: 2 });
    expect(root?.hasAttribute('data-released')).toBe(true);
  });

  it('does not drag while disabled or read only', () => {
    const { container } = render(<Switch label="Wi-Fi" readOnly />);
    const control = screen.getByRole('switch');
    drag(control, [10, 30]);
    expect(container.querySelector('[data-ds="switch"]')?.hasAttribute('data-dragging')).toBe(false);
    expect(control.getAttribute('aria-checked')).toBe('false');
  });
});

describe('Switch thumb icon (platform hook, order 1.23)', () => {
  it('renders no thumb icon by default, and an aria-hidden check and cross with thumbIcon', () => {
    const { container, rerender } = render(<Switch label="Wi-Fi" />);
    expect(container.querySelector('[data-part="thumb-icon"]')).toBeNull();
    rerender(<Switch label="Wi-Fi" thumbIcon />);
    const icon = container.querySelector('[data-part="thumb"] > [data-part="thumb-icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelectorAll('path')).toHaveLength(2);
    // Hidden unless a style or a platform shows it.
    expect(css).toMatch(/--_switch-thumb-icon-opacity: 0;/);
    expect(css).toMatch(/--_switch-thumb-size: calc\(var\(--_switch-height\) - var\(--_switch-inset\) \* 2\);/);
  });

  it('zeroes its motion under the reduced form, by the media query and the page setting', () => {
    expect(css).toMatch(/:root\[data-motion='reduce'\] \[data-ds='switch'\] \{[^}]*--_switch-motion: 0;/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-ds='switch'\] \{[^}]*--_switch-motion: 0;/);
  });
});

describe('Switch thumb contrast on every frame (order 1.29, B3, B4, N1)', () => {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = (selector: string) => {
    const at = code.indexOf(`${selector} {`);
    return at === -1 ? '' : code.slice(at, code.indexOf('\n  }', at));
  };
  const thumb = "[data-ds='switch'] > [data-part='control'] > [data-part='track'] > [data-part='thumb']";
  const fill = "[data-ds='switch'] > [data-part='control'] > [data-part='track'] > span:not([data-part])";

  it('B3: the thumb takes its on color at once and holds it to the middle of the travel turning off, with the fill', () => {
    expect(rule("[data-ds='switch']")).toMatch(/--_switch-color-ease: steps\(2, jump-none\);/);
    expect(rule("[data-ds='switch'][data-state='checked']")).toMatch(/--_switch-color-ease: step-start;/);
    expect(rule(thumb)).toMatch(/color: var\(--_switch-thumb-bg\);/);
    expect(rule(thumb)).toMatch(/color calc\(var\(--_switch-duration\) \* var\(--_switch-motion\)\) var\(--_switch-color-ease\)/);
    expect(rule(fill)).toMatch(/opacity calc\(var\(--_switch-duration\) \* var\(--_switch-motion\)\) var\(--_switch-color-ease\)/);
    // The fill never fades on its own curve under the thumb.
    expect(code).not.toMatch(/opacity calc\(var\(--_switch-duration\) \* var\(--_switch-motion\)\) var\(--ds-ease-in\)/);
  });

  it('B3, B4: a clear lens keeps a ring of the solid thumb color inside its edge, under the style shadows', () => {
    expect(rule(thumb)).toMatch(/box-shadow:\s*var\(--_switch-thumb-shadow\),\s*inset 0 0 0 var\(--_switch-thumb-ring-width\) currentColor;/);
    expect(rule(thumb)).toMatch(/background-color: color-mix\(in srgb, currentColor calc\(var\(--_switch-thumb-solid-now\) \* 100%\), transparent\);/);
  });

  it('B4: a drag steps the fill and the thumb color at progress 0.5', () => {
    const drag = rule("[data-ds='switch'][data-dragging]");
    expect(drag).toMatch(/--_switch-fill-now: clamp\(0, \(var\(--_switch-drag-progress\) - 0\.5\) \* 1000000 \+ 1, 1\);/);
    expect(drag).not.toMatch(/calc\(clamp\(0, var\(--_switch-drag-progress\), 1\) \* 100%\)/);
  });

  it('N1: the travel is in the transform, which the press times only until the pointer is released', () => {
    const pressed = rule(
      `[data-ds='switch']:not([data-disabled], [data-readonly], [data-released]) > [data-part='control']:active > [data-part='track'] > [data-part='thumb']`,
    );
    expect(pressed).toMatch(/transform calc\(var\(--_switch-duration-in\) \* var\(--_switch-motion\)\) var\(--_switch-ease-in\)/);
    expect(rule(thumb)).toMatch(/transform:\s*translateX\(calc\(\(var\(--_switch-travel\) \+ var\(--_switch-lean-now\)/);
    expect(rule(thumb)).toMatch(/transform calc\(var\(--_switch-duration\) \* var\(--_switch-motion\)\) var\(--_switch-ease\)/);
    // The motion ruling (ds/animate-transform-opacity-only) animates no translate property.
    expect(code).not.toMatch(/^\s*translate:/m);
    expect(code).not.toMatch(/(transition:|,)\s*translate calc/);
    expect(code).not.toMatch(/background-color calc\(var\(--_switch-duration\) \* var\(--_switch-motion\)\) step-end;/);
  });

  it('declares the shape hooks with defaults that keep the look', () => {
    expect(code).toMatch(/--_switch-radius: var\(--ds-radius-pill\);/);
    expect(code).toMatch(/--_switch-thumb-radius: var\(--ds-radius-pill\);/);
    expect(code).toMatch(/--_switch-thumb-width: var\(--_switch-thumb-size\);/);
    expect(code).toMatch(/--_switch-thumb-ring-width: var\(--ds-border-width-strong\);/);
    expect(rule(thumb)).toMatch(/inline-size: var\(--_switch-thumb-width\);/);
    expect(code).toMatch(/--_switch-travel-max: calc\(var\(--_switch-width\) - var\(--_switch-thumb-width\)/);
  });
});
