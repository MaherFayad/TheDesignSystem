import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './index';

// Order M4: data-pressed from pointerdown to the release, so a press shows as the finger lands.
const down = (el: Element) => fireEvent.pointerDown(el, { pointerId: 1, button: 0, isPrimary: true });
const pressed = (el: Element) => el.hasAttribute('data-pressed');

describe('Chip press from touch down (M4)', () => {
  it('pointerdown sets data-pressed, pointerup and pointercancel clear it', () => {
    const onPointerDown = vi.fn();
    const { container } = render(
      <Chip onClick={() => undefined} onPointerDown={onPointerDown}>
        Images
      </Chip>,
    );
    const el = container.querySelector('[data-ds="chip"]')!;
    down(el);
    expect(pressed(el)).toBe(true);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(el);
    expect(pressed(el)).toBe(false);
    down(el);
    fireEvent.pointerCancel(el);
    expect(pressed(el)).toBe(false);
  });

  it('a disabled chip never sets it', () => {
    const { container } = render(
      <Chip onClick={() => undefined} disabled>
        Images
      </Chip>,
    );
    const el = container.querySelector('[data-ds="chip"]')!;
    down(el);
    expect(pressed(el)).toBe(false);
  });
});
