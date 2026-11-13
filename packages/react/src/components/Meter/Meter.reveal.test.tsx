// Review N33 (and angular-sync-3 section 6 item 3): the first view fill of a
// Meter holds with an attribute the CSS styles, not an inline transform (so
// print and a meter below the fold show the value), and the reveal timing is
// never cut by a timer (a style's longer --_meter-reveal-duration plays out,
// and StrictMode keeps no inline transition behind).
import { StrictMode } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Meter } from './index';

let fire: (seen: boolean) => void = () => undefined;
let onScreen = false;

beforeEach(() => {
  onScreen = false;
  vi.useFakeTimers();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
        fire = (seen) => cb([{ isIntersecting: seen }]);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() =>
    onScreen ? new DOMRect(0, 10, 100, 8) : new DOMRect(0, 5000, 100, 8),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const indicator = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-part="indicator"]') as HTMLElement;

describe('Meter first view fill', () => {
  it('holds a meter below the fold with data-held, never an inline transform', () => {
    const { container } = render(<Meter value={40} label="Storage" />);
    const el = indicator(container);
    expect(el.hasAttribute('data-held')).toBe(true);
    expect(el.style.transform).toBe('');
    act(() => fire(true));
    expect(el.hasAttribute('data-held')).toBe(false);
    expect(el.hasAttribute('data-revealing')).toBe(true);
  });

  it('keeps the reveal timing until the next value, not for a fixed time', () => {
    const { container, rerender } = render(<Meter value={40} label="Storage" />);
    act(() => fire(true));
    act(() => vi.advanceTimersByTime(5000));
    const el = indicator(container);
    expect(el.hasAttribute('data-revealing')).toBe(true);
    expect(el.style.transition).toBe('');
    rerender(<Meter value={70} label="Storage" />);
    expect(el.hasAttribute('data-revealing')).toBe(false);
  });

  it('leaves no inline transition behind under StrictMode', () => {
    onScreen = true;
    const { container } = render(
      <StrictMode>
        <Meter value={40} label="Storage" />
      </StrictMode>,
    );
    act(() => vi.advanceTimersByTime(5000));
    const el = indicator(container);
    expect(el.style.transition).toBe('');
    expect(el.style.transform).toBe('');
    expect(el.hasAttribute('data-held')).toBe(false);
  });
});
