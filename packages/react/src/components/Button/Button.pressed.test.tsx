import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from '../IconButton';
import { CloseButton } from '../CloseButton';
import { Button } from './index';

// Order M4: data-pressed from pointerdown to the release, so a press shows as the finger lands.
const down = (el: Element, init: Record<string, unknown> = {}) => fireEvent.pointerDown(el, { pointerId: 1, button: 0, isPrimary: true, ...init });
const pressed = (el: Element) => el.hasAttribute('data-pressed');

describe('Button press from touch down (M4)', () => {
  it('pointerdown sets data-pressed and pointerup clears it', () => {
    const { container } = render(<Button>Save draft</Button>);
    const el = container.querySelector('[data-ds="button"]')!;
    expect(pressed(el)).toBe(false);
    down(el);
    expect(el.getAttribute('data-pressed')).toBe('');
    fireEvent.pointerUp(el, { pointerId: 1 });
    expect(pressed(el)).toBe(false);
  });

  it('pointercancel, lost capture and pointer leave clear it', () => {
    const { container } = render(<Button>Save draft</Button>);
    const el = container.querySelector('[data-ds="button"]')!;
    down(el);
    fireEvent.pointerCancel(el, { pointerId: 1 });
    expect(pressed(el)).toBe(false);
    down(el);
    fireEvent.lostPointerCapture(el, { pointerId: 1 });
    expect(pressed(el)).toBe(false);
    down(el);
    fireEvent.pointerLeave(el, { pointerId: 1 });
    expect(pressed(el)).toBe(false);
  });

  it('never sets it while disabled, loading or aria-disabled', () => {
    const { container } = render(
      <>
        <Button disabled>Save draft</Button>
        <Button loading>Save draft</Button>
        <Button aria-disabled="true">Save draft</Button>
      </>,
    );
    for (const el of container.querySelectorAll('[data-ds="button"]')) {
      down(el);
      expect(pressed(el)).toBe(false);
    }
  });

  it('only the primary button of a primary pointer presses', () => {
    const { container } = render(<Button>Save draft</Button>);
    const el = container.querySelector('[data-ds="button"]')!;
    down(el, { button: 2 });
    expect(pressed(el)).toBe(false);
    down(el, { isPrimary: false });
    expect(pressed(el)).toBe(false);
  });

  it('a key press does not set it', () => {
    const { container } = render(<Button>Save draft</Button>);
    const el = container.querySelector('[data-ds="button"]')!;
    fireEvent.keyDown(el, { key: ' ' });
    fireEvent.keyDown(el, { key: 'Enter' });
    expect(pressed(el)).toBe(false);
  });

  it("the caller's own pointer handlers still run", () => {
    const onPointerDown = vi.fn();
    const onPointerUp = vi.fn();
    const onPointerCancel = vi.fn();
    const onLostPointerCapture = vi.fn();
    const onPointerLeave = vi.fn();
    const { container } = render(
      <Button onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onLostPointerCapture={onLostPointerCapture} onPointerLeave={onPointerLeave}>
        Save draft
      </Button>,
    );
    const el = container.querySelector('[data-ds="button"]')!;
    down(el);
    fireEvent.pointerUp(el);
    fireEvent.pointerCancel(el);
    fireEvent.lostPointerCapture(el);
    fireEvent.pointerLeave(el);
    for (const fn of [onPointerDown, onPointerUp, onPointerCancel, onLostPointerCapture, onPointerLeave]) expect(fn).toHaveBeenCalledTimes(1);
  });

  it('works with asChild on the link', () => {
    const { container } = render(
      <Button asChild>
        <a href="#plans">See plans</a>
      </Button>,
    );
    const el = container.querySelector('a[data-ds="button"]')!;
    down(el);
    expect(pressed(el)).toBe(true);
    fireEvent.pointerUp(el);
    expect(pressed(el)).toBe(false);
  });

  it('IconButton and CloseButton share it through ButtonBase', () => {
    const { container } = render(
      <>
        <IconButton icon="plus" label="Add file" />
        <CloseButton />
        <IconButton icon="plus" label="Add file" disabled />
        <CloseButton disabled />
      </>,
    );
    const [icon, close, iconOff, closeOff] = Array.from(container.querySelectorAll('button')) as [HTMLButtonElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement];
    for (const el of [icon, close]) {
      down(el);
      expect(pressed(el)).toBe(true);
      fireEvent.pointerCancel(el);
      expect(pressed(el)).toBe(false);
    }
    for (const el of [iconOff, closeOff]) {
      down(el);
      expect(pressed(el)).toBe(false);
    }
  });
});
