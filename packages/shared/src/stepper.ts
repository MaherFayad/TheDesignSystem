// The state of a process in steps: which step is current, which are
// complete, and which the user may move to. Pure TypeScript, no DOM, so
// React, Angular and React Native share it. Stepper (1.7.7) draws it,
// FormWizard (1.4.4) drives it, Tour (1.6.13) reuses it.
//
// Two modes:
// - linear: the user may go back to any step, and forward only to a step
//   whose earlier steps are all complete. The default.
// - free: the user may go to any step that is not disabled.
//
// Every function returns a new state and never changes the one it is given.
// A move that is not allowed returns the same state object, so a caller can
// compare with `===` to see that nothing happened.

export type StepperMode = 'linear' | 'free';
export type StepStatus = 'complete' | 'current' | 'upcoming';

export interface StepperState {
  /** How many steps there are. At least 1. */
  readonly count: number;
  /** The index of the current step, from 0. */
  readonly current: number;
  /** Indexes of the complete steps, sorted, no repeats. */
  readonly completed: readonly number[];
  /** Indexes of the steps that cannot be reached, sorted, no repeats. */
  readonly disabled: readonly number[];
  readonly mode: StepperMode;
}

export interface StepperOptions {
  count: number;
  /** Default 0, or the first step that is not disabled. */
  current?: number;
  /** Default none. */
  completed?: readonly number[];
  /** Default none. */
  disabled?: readonly number[];
  /** Default linear. */
  mode?: StepperMode;
}

function clean(list: readonly number[] | undefined, count: number): number[] {
  const out = new Set<number>();
  for (const i of list ?? []) if (Number.isInteger(i) && i >= 0 && i < count) out.add(i);
  return [...out].sort((a, b) => a - b);
}

function inRange(state: StepperState, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < state.count;
}

/** A new state. Out of range and repeated indexes are dropped. */
export function createStepperState(options: StepperOptions): StepperState {
  const count = Math.max(1, Math.floor(options.count));
  const disabled = clean(options.disabled, count);
  let current = options.current ?? 0;
  if (!Number.isInteger(current) || current < 0 || current >= count) current = 0;
  if (disabled.includes(current)) {
    // The nearest step that is not disabled, looking forward first.
    const order = Array.from({ length: count }, (_, i) => i).sort((x, y) => Math.abs(x - current) - Math.abs(y - current) || y - x);
    const nearest = order.find((i) => !disabled.includes(i));
    if (nearest !== undefined) current = nearest;
  }
  return { count, current, completed: clean(options.completed, count), disabled, mode: options.mode ?? 'linear' };
}

export function isStepComplete(state: StepperState, index: number): boolean {
  return state.completed.includes(index);
}

export function isStepDisabled(state: StepperState, index: number): boolean {
  return state.disabled.includes(index);
}

/** complete, current or upcoming. The current step reads as current even when it is also complete. */
export function stepStatus(state: StepperState, index: number): StepStatus {
  if (index === state.current) return 'current';
  return isStepComplete(state, index) ? 'complete' : 'upcoming';
}

/**
 * Whether the user may move to this step now. Never a disabled step or an
 * index out of range. The current step is always reachable. Linear: any
 * earlier step, or a later one whose earlier steps are all complete. Free:
 * any step.
 */
export function canGoTo(state: StepperState, index: number): boolean {
  if (!inRange(state, index) || isStepDisabled(state, index)) return false;
  if (state.mode === 'free' || index <= state.current) return true;
  for (let i = 0; i < index; i += 1) {
    if (!isStepComplete(state, i) && !isStepDisabled(state, i)) return false;
  }
  return true;
}

/** Moves to the step when `canGoTo` allows it, else returns the same state. */
export function goTo(state: StepperState, index: number): StepperState {
  if (index === state.current || !canGoTo(state, index)) return state;
  return { ...state, current: index };
}

/** Marks a step complete, or not complete with `done` false. */
export function setStepComplete(state: StepperState, index: number, done = true): StepperState {
  if (!inRange(state, index) || isStepComplete(state, index) === done) return state;
  const completed = done ? clean([...state.completed, index], state.count) : state.completed.filter((i) => i !== index);
  return { ...state, completed };
}

function nextEnabled(state: StepperState, from: number, step: 1 | -1): number | undefined {
  for (let i = from + step; i >= 0 && i < state.count; i += step) {
    if (!isStepDisabled(state, i)) return i;
  }
  return undefined;
}

/**
 * Marks the current step complete and moves to the next step that is not
 * disabled. On the last step it only marks it complete: the process is done
 * when `isDone` says so.
 */
export function next(state: StepperState): StepperState {
  const marked = setStepComplete(state, state.current, true);
  const to = nextEnabled(marked, marked.current, 1);
  return to === undefined ? marked : { ...marked, current: to };
}

/** Moves to the previous step that is not disabled. Keeps what is complete. */
export function back(state: StepperState): StepperState {
  const to = nextEnabled(state, state.current, -1);
  return to === undefined ? state : { ...state, current: to };
}

/** Back to the first step with nothing complete. Disabled steps stay disabled. */
export function resetStepper(state: StepperState): StepperState {
  return createStepperState({ count: state.count, disabled: state.disabled, mode: state.mode });
}

/** No earlier step that is not disabled. */
export function isFirstStep(state: StepperState): boolean {
  return nextEnabled(state, state.current, -1) === undefined;
}

/** No later step that is not disabled. */
export function isLastStep(state: StepperState): boolean {
  return nextEnabled(state, state.current, 1) === undefined;
}

/** Every step that is not disabled is complete. */
export function isDone(state: StepperState): boolean {
  for (let i = 0; i < state.count; i += 1) {
    if (!isStepDisabled(state, i) && !isStepComplete(state, i)) return false;
  }
  return true;
}

/** The position words a screen reader says on a step change. Western digits in both languages. */
export function formatStepPosition(index: number, count: number, lang: 'en' | 'ar' = 'en'): string {
  return lang === 'ar' ? `الخطوة ${index + 1} من ${count}` : `Step ${index + 1} of ${count}`;
}

export interface StepperMachine {
  readonly state: StepperState;
  readonly current: number;
  readonly completed: readonly number[];
  canGoTo(index: number): boolean;
  status(index: number): StepStatus;
  goTo(index: number): boolean;
  next(): boolean;
  back(): boolean;
  complete(index: number, done?: boolean): boolean;
  reset(): void;
  /** Called after every change with the new state. Returns the unsubscribe function. */
  subscribe(listener: (state: StepperState) => void): () => void;
}

/**
 * The same functions as a small store, for a caller that keeps the state
 * outside a framework (Tour). A move returns true when the state changed.
 */
export function createStepper(options: StepperOptions): StepperMachine {
  let state = createStepperState(options);
  const listeners = new Set<(s: StepperState) => void>();
  const apply = (nextState: StepperState) => {
    if (nextState === state) return false;
    state = nextState;
    for (const l of listeners) l(state);
    return true;
  };
  return {
    get state() {
      return state;
    },
    get current() {
      return state.current;
    },
    get completed() {
      return state.completed;
    },
    canGoTo: (index) => canGoTo(state, index),
    status: (index) => stepStatus(state, index),
    goTo: (index) => apply(goTo(state, index)),
    next: () => apply(next(state)),
    back: () => apply(back(state)),
    complete: (index, done = true) => apply(setStepComplete(state, index, done)),
    reset: () => {
      apply(resetStepper(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
