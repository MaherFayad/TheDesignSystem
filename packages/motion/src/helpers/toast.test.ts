// @vitest-environment jsdom
// The toast stack and swipe (order 1.23): the pure parts of the toaster.
// Moved with the code from packages/react/src/components/Toast/Toast.test.tsx
// (order 1.29); the Toaster's own wiring keeps its tests there.
import { describe, expect, it } from 'vitest';
import { stackLayout, watchStack } from './toast-stack';
import { RUBBER_MAX, SWIPE_DISTANCE, swipeCloses, swipeOffset, swipeRubberBand, swipeVelocity } from './toast-swipe';

function fakeHeights(height = 40) {
  const li = HTMLLIElement.prototype;
  Object.defineProperty(li, 'offsetHeight', { configurable: true, get: () => height });
  return () => {
    delete (li as unknown as Record<string, unknown>).offsetHeight;
  };
}

describe('the toast stack (interaction toast-stack)', () => {
  it('orders the open toasts from the newest and sums the expanded offsets', () => {
    const els = [0, 1, 2, 3].map(() => document.createElement('li'));
    const layout = stackLayout(
      [
        { el: els[0] as HTMLElement, height: 40, open: true },
        { el: els[1] as HTMLElement, height: 60, open: true },
        { el: els[2] as HTMLElement, height: 50, open: false },
        { el: els[3] as HTMLElement, height: 30, open: true },
      ],
      8,
    );
    expect(layout.places.get(els[3] as HTMLElement)).toEqual({ index: 0, offset: 0 });
    expect(layout.places.get(els[1] as HTMLElement)).toEqual({ index: 1, offset: 38 });
    expect(layout.places.get(els[0] as HTMLElement)).toEqual({ index: 2, offset: 106 });
    // A closing toast keeps no place.
    expect(layout.places.has(els[2] as HTMLElement)).toBe(false);
    expect(layout.front).toBe(30);
    expect(layout.total).toBe(146);
    expect(stackLayout([], 8)).toMatchObject({ front: 0, total: 0 });
  });

  it('writes each toast its place, and a closing toast keeps its last one', async () => {
    const restore = fakeHeights(40);
    const viewport = document.createElement('ol');
    document.body.append(viewport);
    const add = () => {
      const li = document.createElement('li');
      li.setAttribute('data-ds', 'toast');
      li.setAttribute('data-state', 'open');
      viewport.append(li);
      return li;
    };
    const first = add();
    const stop = watchStack(viewport);
    expect(first.style.getPropertyValue('--_toast-index')).toBe('0');
    const second = add();
    await Promise.resolve();
    expect(second.style.getPropertyValue('--_toast-index')).toBe('0');
    expect(first.style.getPropertyValue('--_toast-index')).toBe('1');
    expect(first.style.getPropertyValue('--_toast-height')).toBe('40px');
    expect(viewport.style.getPropertyValue('--_toaster-front-height')).toBe('40px');
    second.setAttribute('data-state', 'closed');
    await Promise.resolve();
    expect(first.style.getPropertyValue('--_toast-index')).toBe('0');
    expect(second.style.getPropertyValue('--_toast-index')).toBe('0');
    stop();
    viewport.remove();
    restore();
  });
});

describe('the swipe (interaction toast-swipe)', () => {
  it('gives less and less against the edge and never passes the most', () => {
    expect(swipeRubberBand(30)).toBe(30);
    expect(swipeRubberBand(-24)).toBeCloseTo(-12);
    expect(swipeRubberBand(-10_000)).toBeGreaterThan(-RUBBER_MAX);
    expect(Math.abs(swipeRubberBand(-100))).toBeLessThan(Math.abs(swipeRubberBand(-200)));
  });

  it('closes past the distance or on a fast flick, and reads the speed of the last moments', () => {
    expect(swipeCloses(SWIPE_DISTANCE, 0)).toBe(true);
    expect(swipeCloses(20, 0)).toBe(false);
    expect(swipeCloses(20, 1)).toBe(true);
    expect(swipeCloses(-20, 5)).toBe(false);
    expect(swipeVelocity([{ t: 0, along: 0 }, { t: 50, along: 25 }])).toBe(0.5);
    // A finger that stopped before it lifted has no speed left.
    expect(swipeVelocity([{ t: 0, along: 0 }, { t: 50, along: 25 }, { t: 300, along: 25 }])).toBe(0);
    expect(swipeOffset('left', 10)).toEqual({ x: -10, y: 0 });
    expect(swipeOffset('down', 10)).toEqual({ x: 0, y: 10 });
  });
});
