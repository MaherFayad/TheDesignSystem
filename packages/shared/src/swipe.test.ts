import { describe, expect, it } from 'vitest';
import {
  SWIPE_RUBBER_MAX,
  defaultSwipeFull,
  isSwipeMenuKey,
  swipeArmed,
  swipeAxis,
  swipeDrawnOffset,
  swipeFullThreshold,
  swipeRelease,
  swipeRestOffset,
  swipeRubber,
  swipeSideOf,
  swipeVelocity,
  toInline,
  toPhysical,
  type SwipeSizes,
} from './swipe';

const sizes: SwipeSizes = { start: 80, end: 160, row: 360 };

describe('swipeAxis', () => {
  it('waits under the slop', () => {
    expect(swipeAxis(6, 5)).toBe('pending');
  });

  it('is a swipe when the move is more across than down', () => {
    expect(swipeAxis(-12, 4)).toBe('horizontal');
    expect(swipeAxis(12, -11)).toBe('horizontal');
  });

  it('is a scroll when the move is steeper than 45 degrees', () => {
    expect(swipeAxis(4, 14)).toBe('vertical');
    expect(swipeAxis(8, 8)).toBe('vertical');
  });
});

describe('direction', () => {
  it('flips the screen x in right to left text', () => {
    expect(toInline(-30, 'ltr')).toBe(-30);
    expect(toInline(-30, 'rtl')).toBe(30);
    expect(toPhysical(-160, 'ltr')).toBe(-160);
    expect(toPhysical(-160, 'rtl')).toBe(160);
    expect(Object.is(toPhysical(0, 'rtl'), 0)).toBe(true);
  });

  it('a swipe toward the right in Arabic reveals the end actions, which sit at the left', () => {
    const inline = toInline(40, 'rtl');
    expect(swipeSideOf(inline)).toBe('end');
    expect(toPhysical(swipeRestOffset('open-end', sizes), 'rtl')).toBe(160);
  });

  it('a swipe toward the left in English reveals the end actions', () => {
    expect(swipeSideOf(toInline(-40, 'ltr'))).toBe('end');
    expect(swipeSideOf(toInline(40, 'ltr'))).toBe('start');
    expect(swipeSideOf(0)).toBeNull();
  });
});

describe('swipeDrawnOffset', () => {
  it('follows the finger up to the actions width', () => {
    expect(swipeDrawnOffset(-120, sizes, 'none')).toBe(-120);
    expect(swipeDrawnOffset(60, sizes, 'none')).toBe(60);
  });

  it('gives a rubber band past the actions width that never passes its maximum', () => {
    const drawn = swipeDrawnOffset(-400, sizes, 'none');
    expect(drawn).toBeLessThan(-160);
    expect(drawn).toBeGreaterThan(-160 - SWIPE_RUBBER_MAX);
    expect(swipeRubber(0)).toBe(0);
  });

  it('keeps following to the row width on a side with a full swipe', () => {
    expect(swipeDrawnOffset(-300, sizes, 'end')).toBe(-300);
    expect(swipeDrawnOffset(-500, sizes, 'end')).toBe(-360);
  });

  it('does not move toward a side with no actions', () => {
    expect(swipeDrawnOffset(50, { ...sizes, start: 0 }, 'none')).toBe(0);
  });
});

describe('full swipe', () => {
  it('arms past the larger of a share of the row and the actions width plus a margin', () => {
    expect(swipeFullThreshold('end', sizes, 'end')).toBe(216);
    expect(swipeFullThreshold('end', { ...sizes, row: 600 }, 'end')).toBe(360);
    expect(swipeFullThreshold('start', sizes, 'end')).toBe(Number.POSITIVE_INFINITY);
    expect(swipeArmed(-220, sizes, 'end')).toBe(true);
    expect(swipeArmed(-200, sizes, 'end')).toBe(false);
    expect(swipeArmed(-300, sizes, 'none')).toBe(false);
  });

  it('runs the first action and closes when let go armed', () => {
    expect(swipeRelease(-250, 0, sizes, 'end')).toEqual({ state: 'closed', run: 'end' });
  });

  it('defaults to none when the first end action is danger with no undo', () => {
    expect(defaultSwipeFull([{ tone: 'danger' }])).toBe('none');
    expect(defaultSwipeFull([{ tone: 'danger', undoable: true }])).toBe('end');
    expect(defaultSwipeFull([{ tone: 'accent' }])).toBe('end');
    expect(defaultSwipeFull([])).toBe('none');
    expect(defaultSwipeFull(undefined)).toBe('none');
  });
});

describe('swipeRelease', () => {
  it('opens past half the actions width and closes under it', () => {
    expect(swipeRelease(-90, 0, sizes, 'none')).toEqual({ state: 'open-end', run: null });
    expect(swipeRelease(-70, 0, sizes, 'none')).toEqual({ state: 'closed', run: null });
    expect(swipeRelease(41, 0, sizes, 'none')).toEqual({ state: 'open-start', run: null });
  });

  it('opens on a flick toward the actions and closes on a flick away', () => {
    expect(swipeRelease(-20, -0.8, sizes, 'none').state).toBe('open-end');
    expect(swipeRelease(-150, 0.8, sizes, 'none').state).toBe('closed');
    expect(swipeRelease(-5, -0.8, sizes, 'none').state).toBe('closed');
  });

  it('closes on a side with no actions', () => {
    expect(swipeRelease(60, 0, { ...sizes, start: 0 }, 'none')).toEqual({ state: 'closed', run: null });
  });
});

describe('swipeVelocity', () => {
  it('measures over the last moments only', () => {
    expect(
      swipeVelocity([
        { t: 0, offset: 0 },
        { t: 300, offset: -10 },
        { t: 350, offset: -40 },
        { t: 400, offset: -70 },
      ]),
    ).toBeCloseTo(-0.6, 5);
    expect(swipeVelocity([])).toBe(0);
    expect(swipeVelocity([{ t: 10, offset: 4 }])).toBe(0);
  });
});

describe('isSwipeMenuKey', () => {
  it('takes Shift+F10 and the context menu key', () => {
    expect(isSwipeMenuKey('F10', true)).toBe(true);
    expect(isSwipeMenuKey('F10', false)).toBe(false);
    expect(isSwipeMenuKey('ContextMenu', false)).toBe(true);
    expect(isSwipeMenuKey('Enter', true)).toBe(false);
  });

  it('rest offsets match the open states', () => {
    expect(swipeRestOffset('open-start', sizes)).toBe(80);
    expect(swipeRestOffset('open-end', sizes)).toBe(-160);
    expect(swipeRestOffset('closed', sizes)).toBe(0);
  });
});
