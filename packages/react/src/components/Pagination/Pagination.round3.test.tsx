// Order 1.23, round 3 (review B5): two page changes in a row draw the right
// numbers, because each slot's last text comes from the data and React never
// writes into a host the roll owns. And the press point for a platform ripple.
import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Pagination } from './index';

const saved: [object, unknown][] = [];
beforeEach(() => {
  const animate = vi.fn(
    () => ({ playState: 'running', finished: new Promise(() => undefined), effect: { getTiming: () => ({ duration: 200, delay: 0 }) }, cancel() {} }) as unknown as Animation,
  );
  saved.push([HTMLElement.prototype, (HTMLElement.prototype as unknown as { animate?: unknown }).animate]);
  (HTMLElement.prototype as unknown as { animate?: unknown }).animate = animate;
});
afterEach(() => {
  for (const [proto, fn] of saved.splice(0)) (proto as { animate?: unknown }).animate = fn;
});

const LEAVING = '[data-digit-out]';

const numbers = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('[data-part="page"]')).map((el) => el.getAttribute('aria-label'));

describe('pagination-roll, round 3', () => {
  it('keeps the right page names after two quick changes', () => {
    const { container, rerender } = render(<Theme style="desk"><Pagination page={8} pageCount={25} onPageChange={() => undefined} /></Theme>);
    rerender(<Theme style="desk"><Pagination page={11} pageCount={25} onPageChange={() => undefined} /></Theme>);
    rerender(<Theme style="desk"><Pagination page={14} pageCount={25} onPageChange={() => undefined} /></Theme>);
    const root = container.querySelector('[data-ds="pagination"]') as HTMLElement;
    const current = root.querySelector('[data-part="page"][data-active]');
    expect(current?.getAttribute('aria-current')).toBe('page');
    // Each host holds exactly the number its page names.
    for (const page of root.querySelectorAll<HTMLElement>('[data-part="page"]')) {
      const label = page.getAttribute('aria-label') ?? '';
      const host = page.querySelector('[data-part="label"] span[aria-hidden="true"]')?.cloneNode(true) as HTMLElement | undefined;
      // Leaving digits of a roll still in flight (the mock never finishes) are not the number.
      for (const old of host?.querySelectorAll(LEAVING) ?? []) old.remove();
      expect(label).toContain(host?.textContent?.replace(/\D/g, '') ?? 'missing');
    }
    expect(numbers(root).length).toBeGreaterThan(2);
  });

  it('writes the press point for a platform ripple', () => {
    const { container } = render(<Pagination page={2} pageCount={9} onPageChange={() => undefined} />);
    const page = container.querySelector<HTMLElement>('[data-part="page"]') as HTMLElement;
    page.getBoundingClientRect = () => ({ x: 10, y: 20, left: 10, top: 20, right: 50, bottom: 52, width: 40, height: 32, toJSON() {} }) as DOMRect;
    fireEvent.pointerDown(page, { clientX: 15, clientY: 30 });
    expect(page.style.getPropertyValue('--_pagination-press-x')).toBe('5px');
    expect(page.style.getPropertyValue('--_pagination-press-y')).toBe('10px');
  });
});
