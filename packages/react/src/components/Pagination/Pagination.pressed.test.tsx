import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pagination } from './index';

// Order M4: a page carries data-pressed from pointerdown to the release.
const down = (el: Element) => fireEvent.pointerDown(el, { pointerId: 1, button: 0, isPrimary: true });
const pressed = (el: Element) => el.hasAttribute('data-pressed');

describe('Pagination page press from touch down (M4)', () => {
  it('pointerdown on a page sets data-pressed, pointerup and pointercancel clear it', () => {
    const { container } = render(<Pagination defaultPage={5} pageCount={16} />);
    const page = container.querySelector('[data-part="page"]:not([aria-current])')!;
    down(page);
    expect(page.getAttribute('data-pressed')).toBe('');
    fireEvent.pointerUp(page);
    expect(pressed(page)).toBe(false);
    down(page);
    fireEvent.pointerCancel(page);
    expect(pressed(page)).toBe(false);
  });

  it('a disabled pagination never sets it, on pages or ends', () => {
    const { container } = render(<Pagination defaultPage={5} pageCount={16} disabled />);
    for (const el of container.querySelectorAll('[data-part="page"], [data-part="next"]')) {
      down(el);
      expect(pressed(el)).toBe(false);
    }
  });
});
