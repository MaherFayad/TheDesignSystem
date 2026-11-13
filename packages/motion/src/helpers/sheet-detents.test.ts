// The Sheet detents and drag, and the Drawer swipe (order 1.29).
import { describe, expect, it } from 'vitest';
import {
  DETENT_RUBBER_MAX,
  detentDragOffset,
  detentForKey,
  detentHeights,
  detentRubberBand,
  dragCloses,
  dragVelocity,
  settleDetent,
} from './sheet-detents';
import { drawerSwipeCloses, drawerSwipeDirection, drawerSwipeOffset } from './drawer-swipe';

describe('drag velocity (review 3, N28)', () => {
  it('reads the speed over the last moments, and a pause before the release leaves none', () => {
    const fling = [
      { t: 0, y: 0 },
      { t: 16, y: 20 },
      { t: 32, y: 40 },
    ];
    expect(dragVelocity(fling)).toBeCloseTo(1.25);
    // The same moves, then the finger rests 150ms and lifts where it was.
    const paused = [...fling, { t: 182, y: 40 }];
    expect(dragVelocity(paused)).toBe(0);
    expect(dragCloses(40, dragVelocity(paused), 400)).toBe(false);
    expect(dragCloses(40, dragVelocity(fling), 400)).toBe(true);
  });

  it('closes past a quarter of the height whatever the speed', () => {
    expect(dragCloses(101, 0, 400)).toBe(true);
    expect(dragCloses(99, 0, 400)).toBe(false);
  });
});

describe('detents', () => {
  it('turns fractions and px into heights, smallest first, clamped to the room', () => {
    expect(detentHeights([0.5, 1], 800, 700)).toEqual([400, 700]);
    expect(detentHeights([320, 0.25], 800, 700)).toEqual([200, 320]);
    expect(detentHeights([0.9, 1], 800, 700)).toEqual([700]);
    expect(detentHeights([0, -1, Number.NaN, 0.5], 800, 700)).toEqual([400]);
  });

  it('follows one to one between the detents and gives a rubber band past the largest', () => {
    const h = [300, 600];
    expect(detentDragOffset(-100, 300, h, true)).toBe(-100);
    // 100px past the top detent draws less than 100 and never past the max.
    const past = detentDragOffset(-400, 300, h, true);
    expect(300 - past).toBeGreaterThan(600);
    expect(300 - past).toBeLessThan(600 + DETENT_RUBBER_MAX);
    // Below the smallest: one to one when it may close, a rubber band when it may not.
    expect(detentDragOffset(200, 300, h, true)).toBe(200);
    expect(detentDragOffset(200, 300, h, false)).toBeLessThan(DETENT_RUBBER_MAX);
    expect(detentRubberBand(0)).toBe(0);
    expect(detentRubberBand(1e6)).toBeLessThan(DETENT_RUBBER_MAX);
  });

  it('settles on the nearest detent by position and speed, or closes', () => {
    const h = [300, 600];
    // Released halfway with no speed: the nearer one.
    expect(settleDetent(h, 300, -200, 0, true)).toEqual({ kind: 'detent', index: 1 });
    expect(settleDetent(h, 300, -100, 0, true)).toEqual({ kind: 'detent', index: 0 });
    // A short drag up with speed carries on to the larger one.
    expect(settleDetent(h, 300, -60, -1.2, true)).toEqual({ kind: 'detent', index: 1 });
    // A flick down from the smallest closes; not when it may not close.
    expect(settleDetent(h, 300, 60, 1.2, true)).toEqual({ kind: 'close' });
    expect(settleDetent(h, 300, 60, 1.2, false)).toEqual({ kind: 'detent', index: 0 });
  });

  it('moves with the keys: arrows step and stop at the ends, Enter and Space cycle', () => {
    expect(detentForKey('ArrowUp', 0, 3)).toBe(1);
    expect(detentForKey('ArrowUp', 2, 3)).toBe(2);
    expect(detentForKey('ArrowDown', 0, 3)).toBe(0);
    expect(detentForKey('Home', 2, 3)).toBe(0);
    expect(detentForKey('End', 0, 3)).toBe(2);
    expect(detentForKey('Enter', 2, 3)).toBe(0);
    expect(detentForKey(' ', 1, 3)).toBe(2);
    expect(detentForKey('a', 1, 3)).toBeNull();
  });
});

describe('drawer swipe', () => {
  it('goes toward the edge the drawer sits on, down on ios', () => {
    expect(drawerSwipeDirection('end', 'ltr', undefined)).toBe('right');
    expect(drawerSwipeDirection('end', 'rtl', 'web')).toBe('left');
    expect(drawerSwipeDirection('start', 'ltr', 'android')).toBe('left');
    expect(drawerSwipeDirection('start', 'rtl', undefined)).toBe('right');
    expect(drawerSwipeDirection('start', 'ltr', 'ios')).toBe('down');
  });

  it('follows toward the edge, gives a rubber band against it, and closes past a quarter or on a flick', () => {
    expect(drawerSwipeOffset(40, true)).toBe(40);
    expect(drawerSwipeOffset(40, false)).toBeLessThan(40);
    expect(drawerSwipeOffset(-200, true)).toBeGreaterThan(-DETENT_RUBBER_MAX);
    expect(drawerSwipeCloses(101, 0, 400)).toBe(true);
    expect(drawerSwipeCloses(20, 0.8, 400)).toBe(true);
    expect(drawerSwipeCloses(20, 0, 400)).toBe(false);
  });
});
