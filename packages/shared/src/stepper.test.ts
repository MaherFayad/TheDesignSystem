import { describe, expect, it, vi } from 'vitest';
import {
  back,
  canGoTo,
  createStepper,
  createStepperState,
  formatStepPosition,
  goTo,
  isDone,
  isFirstStep,
  isLastStep,
  next,
  resetStepper,
  setStepComplete,
  stepStatus,
} from './stepper';

describe('createStepperState', () => {
  it('defaults to the first step, nothing complete, linear', () => {
    expect(createStepperState({ count: 4 })).toEqual({ count: 4, current: 0, completed: [], disabled: [], mode: 'linear' });
  });

  it('drops out of range and repeated indexes and sorts them', () => {
    const s = createStepperState({ count: 3, completed: [2, 0, 0, 5, -1, 1.5], disabled: [9, 1] });
    expect(s.completed).toEqual([0, 2]);
    expect(s.disabled).toEqual([1]);
  });

  it('keeps at least one step and a current step in range', () => {
    expect(createStepperState({ count: 0 }).count).toBe(1);
    expect(createStepperState({ count: 3, current: 7 }).current).toBe(0);
  });

  it('starts on the first step that is not disabled when no current is given', () => {
    expect(createStepperState({ count: 3, disabled: [0] }).current).toBe(1);
  });

  it('moves a disabled current step to the nearest step that is not disabled', () => {
    expect(createStepperState({ count: 4, current: 2, disabled: [2] }).current).toBe(3);
    expect(createStepperState({ count: 4, current: 3, disabled: [3] }).current).toBe(2);
  });
});

describe('status and canGoTo', () => {
  it('reads current, complete and upcoming', () => {
    const s = createStepperState({ count: 4, current: 1, completed: [0, 1] });
    expect([0, 1, 2, 3].map((i) => stepStatus(s, i))).toEqual(['complete', 'current', 'upcoming', 'upcoming']);
  });

  it('linear: back is always open, forward only past complete steps', () => {
    const s = createStepperState({ count: 4, current: 1, completed: [0] });
    expect(canGoTo(s, 0)).toBe(true);
    expect(canGoTo(s, 1)).toBe(true);
    expect(canGoTo(s, 2)).toBe(false);
    const done1 = setStepComplete(s, 1);
    expect(canGoTo(done1, 2)).toBe(true);
    expect(canGoTo(done1, 3)).toBe(false);
  });

  it('linear: a disabled step does not block the steps after it', () => {
    const s = createStepperState({ count: 3, current: 0, completed: [0], disabled: [1] });
    expect(canGoTo(s, 1)).toBe(false);
    expect(canGoTo(s, 2)).toBe(true);
  });

  it('free: any step that is not disabled', () => {
    const s = createStepperState({ count: 4, mode: 'free', disabled: [2] });
    expect(canGoTo(s, 3)).toBe(true);
    expect(canGoTo(s, 2)).toBe(false);
    expect(canGoTo(s, 4)).toBe(false);
    expect(canGoTo(s, -1)).toBe(false);
  });
});

describe('moves', () => {
  it('next marks the current step complete and moves on', () => {
    const s = next(createStepperState({ count: 3 }));
    expect(s.current).toBe(1);
    expect(s.completed).toEqual([0]);
  });

  it('next skips disabled steps', () => {
    const s = next(createStepperState({ count: 3, disabled: [1] }));
    expect(s.current).toBe(2);
  });

  it('next on the last step only marks it complete, then the process is done', () => {
    let s = createStepperState({ count: 2 });
    s = next(s);
    expect(isDone(s)).toBe(false);
    s = next(s);
    expect(s.current).toBe(1);
    expect(s.completed).toEqual([0, 1]);
    expect(isDone(s)).toBe(true);
  });

  it('back keeps what is complete, and does nothing on the first step', () => {
    const start = createStepperState({ count: 3 });
    expect(back(start)).toBe(start);
    const s = back(next(next(start)));
    expect(s.current).toBe(1);
    expect(s.completed).toEqual([0, 1]);
  });

  it('goTo returns the same state when the move is not allowed', () => {
    const s = createStepperState({ count: 3 });
    expect(goTo(s, 2)).toBe(s);
    expect(goTo(s, 0)).toBe(s);
    expect(goTo(next(s), 0).current).toBe(0);
  });

  it('setStepComplete adds and removes, and is a no-op when nothing changes', () => {
    const s = createStepperState({ count: 3 });
    expect(setStepComplete(s, 0, false)).toBe(s);
    const done = setStepComplete(s, 2);
    expect(done.completed).toEqual([2]);
    expect(setStepComplete(done, 2, false).completed).toEqual([]);
    expect(setStepComplete(s, 8)).toBe(s);
  });

  it('first, last and reset', () => {
    const s = createStepperState({ count: 3, current: 2, completed: [0, 1], disabled: [0] });
    expect(isLastStep(s)).toBe(true);
    expect(isFirstStep(back(s))).toBe(true);
    const r = resetStepper(s);
    expect(r.current).toBe(1);
    expect(r.completed).toEqual([]);
    expect(r.disabled).toEqual([0]);
  });
});

describe('formatStepPosition', () => {
  it('says the position in English and Arabic with Western digits', () => {
    expect(formatStepPosition(1, 4)).toBe('Step 2 of 4');
    expect(formatStepPosition(1, 4, 'ar')).toBe('الخطوة 2 من 4');
  });
});

describe('createStepper', () => {
  it('runs the same moves as a store and tells listeners about changes only', () => {
    const m = createStepper({ count: 3 });
    const listener = vi.fn();
    const off = m.subscribe(listener);
    expect(m.goTo(2)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(m.next()).toBe(true);
    expect(m.current).toBe(1);
    expect(m.completed).toEqual([0]);
    expect(m.status(0)).toBe('complete');
    expect(m.canGoTo(2)).toBe(false);
    expect(m.complete(1)).toBe(true);
    expect(m.goTo(2)).toBe(true);
    expect(m.back()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(4);
    m.reset();
    expect(m.state.current).toBe(0);
    off();
    m.next();
    expect(listener).toHaveBeenCalledTimes(5);
  });
});
