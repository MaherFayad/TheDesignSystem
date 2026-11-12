// Window manager logic, pure TypeScript: frame math, the z order stack and a
// small store. No DOM and no framework, so React, Angular and React Native
// share it. Ported from GoBanana `components/window/frame.ts`, the layer logic
// in `WindowLayer.tsx` and `clampToView` in `desktop/Window.tsx`.
//
// Two kinds of box, both `{ x, y, width, height }` in CSS px:
//
// - A frame is where a window sits inside its layer. `x` is the offset from
//   the inline start edge of the layer (the left edge in English, the right
//   edge in Arabic) and `y` the offset from the top, so the same frame means
//   the same place in both directions.
// - A rect is a box on the screen as the browser measures it (left to right,
//   always). Motion reads rects.

/** A box in CSS px. */
export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The size of the layer a window lives in. */
export interface WindowBounds {
  width: number;
  height: number;
}

/** How much of a window must stay inside its layer. */
export interface WindowKeep {
  /** Px of the window that stay inside the layer along the inline axis. */
  inline: number;
  /** Px of the window (its title bar) that stay inside the layer at the bottom. */
  block: number;
}

/** Arrow key step in px. */
export const WINDOW_STEP = 16;
/** Arrow key step with Shift, in px. */
export const WINDOW_STEP_LARGE = 64;
/**
 * The source keeps 160px of a window on screen sideways, and the title bar
 * reachable: a window never moves above the top edge, and at least one title
 * bar height (40px) stays above the bottom edge.
 */
export const WINDOW_KEEP: WindowKeep = { inline: 160, block: 40 };
/** A rect smaller than this on either side is not used as a motion origin. */
export const WINDOW_MIN_ORIGIN = 4;
/** The default minimize target: a 48px square, 8px above the bottom edge, centered. */
export const WINDOW_DOCK_SIZE = 48;
export const WINDOW_DOCK_GAP = 8;

/** True when the rect is big enough to grow from or shrink into. */
export function usableRect(rect: WindowRect | null | undefined): rect is WindowRect {
  return Boolean(rect && rect.width > WINDOW_MIN_ORIGIN && rect.height > WINDOW_MIN_ORIGIN);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Keeps a frame reachable inside its layer: `keep.inline` px of it stay
 * inside sideways, it never goes above the top, and `keep.block` px stay
 * above the bottom. The size is never changed.
 */
export function clampFrame(frame: WindowRect, bounds: WindowBounds, keep: WindowKeep = WINDOW_KEEP): WindowRect {
  const keepX = Math.min(frame.width, keep.inline);
  const keepY = Math.min(frame.height, keep.block);
  return {
    ...frame,
    x: clamp(frame.x, keepX - frame.width, bounds.width - keepX),
    y: clamp(frame.y, 0, bounds.height - keepY),
  };
}

/** Moves a frame by a delta along the inline and block axes, then clamps it. */
export function moveFrame(
  frame: WindowRect,
  delta: { x: number; y: number },
  bounds: WindowBounds,
  keep: WindowKeep = WINDOW_KEEP,
): WindowRect {
  return clampFrame({ ...frame, x: frame.x + delta.x, y: frame.y + delta.y }, bounds, keep);
}

/**
 * The frame delta for an arrow key, or null for any other key. Left and
 * right are what the person sees: in a right to left layout the inline axis
 * runs from the right, so ArrowLeft adds to `x`. Shift takes the large step.
 */
export function arrowDelta(key: string, large = false, dir: 'ltr' | 'rtl' = 'ltr'): { x: number; y: number } | null {
  const step = large ? WINDOW_STEP_LARGE : WINDOW_STEP;
  const side = dir === 'rtl' ? -1 : 1;
  switch (key) {
    case 'ArrowLeft':
      return { x: -step * side, y: 0 };
    case 'ArrowRight':
      return { x: step * side, y: 0 };
    case 'ArrowUp':
      return { x: 0, y: -step };
    case 'ArrowDown':
      return { x: 0, y: step };
    default:
      return null;
  }
}

/** A frame of the given size in the middle of the layer. */
export function centerFrame(size: WindowBounds, bounds: WindowBounds): WindowRect {
  const width = Math.min(size.width, bounds.width);
  const height = Math.min(size.height, bounds.height);
  return { x: (bounds.width - width) / 2, y: (bounds.height - height) / 2, width, height };
}

/** The frame of a zoomed window: the whole layer. */
export function zoomFrame(bounds: WindowBounds): WindowRect {
  return { x: 0, y: 0, width: bounds.width, height: bounds.height };
}

/**
 * Where a minimized window goes: the dock rect when the app has one,
 * otherwise a 48px square at the bottom center of the layer.
 */
export function minimizeTarget(bounds: WindowBounds, dock?: WindowRect | null): WindowRect {
  if (usableRect(dock)) return dock;
  return {
    x: bounds.width / 2 - WINDOW_DOCK_SIZE / 2,
    y: bounds.height - WINDOW_DOCK_SIZE - WINDOW_DOCK_GAP,
    width: WINDOW_DOCK_SIZE,
    height: WINDOW_DOCK_SIZE,
  };
}

/** A translate and a scale, applied with transform origin 0 0. */
export interface WindowTransform {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
}

export const IDENTITY_TRANSFORM: WindowTransform = { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 };

/**
 * The transform (origin 0 0) that draws a box sitting at `to` over `from`.
 * Grow from a trigger: the window is at `to`, the first keyframe draws it
 * over the trigger at `from`, the last keyframe is no transform. Both are
 * screen rects.
 */
export function transformBetween(from: WindowRect, to: WindowRect): WindowTransform {
  return {
    translateX: from.x - to.x,
    translateY: from.y - to.y,
    scaleX: to.width ? from.width / to.width : 1,
    scaleY: to.height ? from.height / to.height : 1,
  };
}

/** The CSS text of a WindowTransform. */
export function transformToCss(t: WindowTransform): string {
  if (t.translateX === 0 && t.translateY === 0 && t.scaleX === 1 && t.scaleY === 1) return 'none';
  return `translate(${round(t.translateX)}px, ${round(t.translateY)}px) scale(${round(t.scaleX, 4)}, ${round(t.scaleY, 4)})`;
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

// ---------------------------------------------------------------- the store

/** One window as the manager knows it. */
export interface WindowEntry {
  id: string;
  /** Where the window sits, or null while the layout places it (no move yet). */
  frame: WindowRect | null;
  /** The frame to go back to when zoom ends. */
  restore: WindowRect | null;
  zoomed: boolean;
  minimized: boolean;
}

export interface WindowManagerState {
  /** Open window ids, back to front. The last one is drawn on top. */
  order: readonly string[];
  /** The window that has focus: the top window that is not minimized, or null. */
  active: string | null;
  windows: Readonly<Record<string, WindowEntry>>;
}

export interface WindowOpenOptions {
  frame?: WindowRect | null;
  zoomed?: boolean;
  minimized?: boolean;
  /** Open behind the others instead of on top, and do not take focus. Default false. */
  background?: boolean;
}

export interface WindowManager {
  getState(): WindowManagerState;
  /** Calls `listener` after every change. Returns the undo. */
  subscribe(listener: () => void): () => void;
  /** Adds a window on top and makes it active. Opening an open window focuses it. */
  open(id: string, options?: WindowOpenOptions): void;
  /** Removes a window. The next window from the top becomes active. */
  close(id: string): void;
  /** Brings a window to the front and makes it active. A minimized window stays minimized. */
  focus(id: string): void;
  /** Sets the frame. With bounds, the frame is clamped into them. */
  move(id: string, frame: WindowRect, bounds?: WindowBounds): void;
  /** Moves the frame by a delta, clamped. Needs a frame: pass `from` when the window has none yet. */
  moveBy(id: string, delta: { x: number; y: number }, bounds: WindowBounds, from?: WindowRect): void;
  /** Zoom on fills the layer and keeps the frame to restore; zoom off puts it back. Toggles without `on`. */
  zoom(id: string, bounds: WindowBounds, on?: boolean): void;
  /** Hides the window. The next window becomes active. */
  minimize(id: string): void;
  /** Shows a minimized window again, on top and active. */
  restore(id: string): void;
}

const emptyState: WindowManagerState = { order: [], active: null, windows: {} };

function topActive(order: readonly string[], windows: Readonly<Record<string, WindowEntry>>): string | null {
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    if (id !== undefined && windows[id] && !windows[id].minimized) return id;
  }
  return null;
}

/**
 * A small store for the windows of one layer: frames, the z order and the
 * active window. Every action makes a new state object, so `getState` works
 * with React's useSyncExternalStore.
 */
export function createWindowManager(initial?: Partial<WindowManagerState>): WindowManager {
  let state: WindowManagerState = { ...emptyState, ...initial };
  const listeners = new Set<() => void>();

  function set(next: WindowManagerState): void {
    if (next === state) return;
    state = { ...next, active: topActive(next.order, next.windows) };
    for (const l of [...listeners]) l();
  }

  function update(id: string, patch: Partial<WindowEntry>): void {
    const current = state.windows[id];
    if (!current) return;
    set({ ...state, windows: { ...state.windows, [id]: { ...current, ...patch } } });
  }

  function toFront(order: readonly string[], id: string): string[] {
    return [...order.filter((o) => o !== id), id];
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open(id, options = {}) {
      const existing = state.windows[id];
      if (existing) {
        if (!options.background) set({ ...state, order: toFront(state.order, id) });
        return;
      }
      const entry: WindowEntry = {
        id,
        frame: options.frame ?? null,
        restore: null,
        zoomed: options.zoomed ?? false,
        minimized: options.minimized ?? false,
      };
      set({
        ...state,
        order: options.background ? [id, ...state.order] : [...state.order, id],
        windows: { ...state.windows, [id]: entry },
      });
    },
    close(id) {
      if (!state.windows[id]) return;
      const windows = { ...state.windows };
      delete windows[id];
      set({ ...state, order: state.order.filter((o) => o !== id), windows });
    },
    focus(id) {
      if (!state.windows[id]) return;
      if (state.order[state.order.length - 1] === id && state.active === id) return;
      set({ ...state, order: toFront(state.order, id) });
    },
    move(id, frame, bounds) {
      update(id, { frame: bounds ? clampFrame(frame, bounds) : frame });
    },
    moveBy(id, delta, bounds, from) {
      const base = state.windows[id]?.frame ?? from;
      if (!base) return;
      update(id, { frame: moveFrame(base, delta, bounds) });
    },
    zoom(id, bounds, on) {
      const w = state.windows[id];
      if (!w) return;
      const next = on ?? !w.zoomed;
      if (next === w.zoomed) return;
      if (next) update(id, { zoomed: true, restore: w.frame, frame: zoomFrame(bounds) });
      else update(id, { zoomed: false, frame: w.restore, restore: null });
    },
    minimize(id) {
      update(id, { minimized: true });
    },
    restore(id) {
      const w = state.windows[id];
      if (!w) return;
      set({ ...state, order: toFront(state.order, id), windows: { ...state.windows, [id]: { ...w, minimized: false } } });
    },
  };
}
