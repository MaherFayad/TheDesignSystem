import { describe, expect, it, vi } from 'vitest';
import {
  WINDOW_STEP,
  WINDOW_STEP_LARGE,
  arrowDelta,
  centerFrame,
  clampFrame,
  createWindowManager,
  minimizeTarget,
  moveFrame,
  transformBetween,
  transformToCss,
  usableRect,
  zoomFrame,
} from './window';

const bounds = { width: 1000, height: 800 };
const frame = { x: 100, y: 100, width: 400, height: 300 };

describe('frame math', () => {
  it('keeps 160px of the window inside sideways and the title bar reachable', () => {
    expect(clampFrame({ ...frame, x: -1000 }, bounds).x).toBe(160 - 400);
    expect(clampFrame({ ...frame, x: 5000 }, bounds).x).toBe(1000 - 160);
    expect(clampFrame({ ...frame, y: -50 }, bounds).y).toBe(0);
    expect(clampFrame({ ...frame, y: 5000 }, bounds).y).toBe(800 - 40);
    expect(clampFrame(frame, bounds)).toEqual(frame);
  });

  it('never changes the size, and a small window keeps all of itself', () => {
    const small = { x: -500, y: 0, width: 100, height: 20 };
    const out = clampFrame(small, bounds);
    expect(out.width).toBe(100);
    expect(out.x).toBe(0);
    expect(clampFrame({ ...small, y: 900 }, bounds).y).toBe(780);
  });

  it('moves by a delta and clamps', () => {
    expect(moveFrame(frame, { x: 16, y: -16 }, bounds)).toEqual({ ...frame, x: 116, y: 84 });
    expect(moveFrame(frame, { x: 0, y: -500 }, bounds).y).toBe(0);
  });

  it('maps arrow keys to a step, Shift to the large step, and flips left and right in RTL', () => {
    expect(arrowDelta('ArrowRight')).toEqual({ x: WINDOW_STEP, y: 0 });
    expect(arrowDelta('ArrowLeft', true)).toEqual({ x: -WINDOW_STEP_LARGE, y: 0 });
    expect(arrowDelta('ArrowUp')).toEqual({ x: 0, y: -WINDOW_STEP });
    expect(arrowDelta('ArrowDown', true)).toEqual({ x: 0, y: WINDOW_STEP_LARGE });
    expect(arrowDelta('ArrowLeft', false, 'rtl')).toEqual({ x: WINDOW_STEP, y: 0 });
    expect(arrowDelta('ArrowRight', false, 'rtl')).toEqual({ x: -WINDOW_STEP, y: 0 });
    expect(arrowDelta('Enter')).toBeNull();
  });

  it('centers, zooms to fill and picks a minimize target', () => {
    expect(centerFrame({ width: 400, height: 200 }, bounds)).toEqual({ x: 300, y: 300, width: 400, height: 200 });
    expect(centerFrame({ width: 4000, height: 200 }, bounds).width).toBe(1000);
    expect(zoomFrame(bounds)).toEqual({ x: 0, y: 0, width: 1000, height: 800 });
    expect(minimizeTarget(bounds)).toEqual({ x: 476, y: 744, width: 48, height: 48 });
    const dock = { x: 10, y: 700, width: 60, height: 60 };
    expect(minimizeTarget(bounds, dock)).toBe(dock);
    expect(minimizeTarget(bounds, { x: 0, y: 0, width: 0, height: 0 }).width).toBe(48);
  });

  it('computes the transform that draws the window over its trigger', () => {
    const trigger = { x: 20, y: 30, width: 100, height: 40 };
    const win = { x: 220, y: 130, width: 400, height: 200 };
    const t = transformBetween(trigger, win);
    expect(t).toEqual({ translateX: -200, translateY: -100, scaleX: 0.25, scaleY: 0.2 });
    // Applying it to the window corners gives the trigger corners.
    expect(win.x + t.translateX).toBe(trigger.x);
    expect(win.width * t.scaleX).toBe(trigger.width);
    expect(transformToCss(t)).toBe('translate(-200px, -100px) scale(0.25, 0.2)');
    expect(transformToCss(transformBetween(win, win))).toBe('none');
  });

  it('only uses rects with a real size as an origin', () => {
    expect(usableRect(null)).toBe(false);
    expect(usableRect({ x: 0, y: 0, width: 2, height: 40 })).toBe(false);
    expect(usableRect({ x: 0, y: 0, width: 24, height: 24 })).toBe(true);
  });
});

describe('createWindowManager', () => {
  it('opens windows on top, focus brings one to the front, and the top window is active', () => {
    const m = createWindowManager();
    m.open('a');
    m.open('b');
    m.open('c');
    expect(m.getState().order).toEqual(['a', 'b', 'c']);
    expect(m.getState().active).toBe('c');
    m.focus('a');
    expect(m.getState().order).toEqual(['b', 'c', 'a']);
    expect(m.getState().active).toBe('a');
    m.open('b');
    expect(m.getState().order).toEqual(['c', 'a', 'b']);
  });

  it('opens a background window behind the others without taking focus', () => {
    const m = createWindowManager();
    m.open('a');
    m.open('b', { background: true });
    expect(m.getState().order).toEqual(['b', 'a']);
    expect(m.getState().active).toBe('a');
  });

  it('close removes the window and the next one from the top becomes active', () => {
    const m = createWindowManager();
    m.open('a');
    m.open('b');
    m.close('b');
    expect(m.getState().order).toEqual(['a']);
    expect(m.getState().active).toBe('a');
    expect(m.getState().windows.b).toBeUndefined();
    m.close('a');
    expect(m.getState().active).toBeNull();
  });

  it('moves with a frame or a delta and clamps into the bounds', () => {
    const m = createWindowManager();
    m.open('a');
    m.moveBy('a', { x: 16, y: 0 }, bounds);
    expect(m.getState().windows.a?.frame).toBeNull();
    m.moveBy('a', { x: 16, y: 0 }, bounds, frame);
    expect(m.getState().windows.a?.frame).toEqual({ ...frame, x: 116 });
    m.moveBy('a', { x: 0, y: -1000 }, bounds);
    expect(m.getState().windows.a?.frame?.y).toBe(0);
    m.move('a', { ...frame, x: 9000 }, bounds);
    expect(m.getState().windows.a?.frame?.x).toBe(840);
    m.move('a', { ...frame, x: 9000 });
    expect(m.getState().windows.a?.frame?.x).toBe(9000);
  });

  it('zoom fills the layer and restores the frame it had', () => {
    const m = createWindowManager();
    m.open('a', { frame });
    m.zoom('a', bounds);
    expect(m.getState().windows.a).toMatchObject({ zoomed: true, frame: zoomFrame(bounds), restore: frame });
    m.zoom('a', bounds, true);
    expect(m.getState().windows.a?.restore).toEqual(frame);
    m.zoom('a', bounds);
    expect(m.getState().windows.a).toMatchObject({ zoomed: false, frame, restore: null });
  });

  it('minimize hides a window and hands focus on; restore brings it back on top', () => {
    const m = createWindowManager();
    m.open('a');
    m.open('b');
    m.minimize('b');
    expect(m.getState().active).toBe('a');
    expect(m.getState().windows.b?.minimized).toBe(true);
    m.restore('b');
    expect(m.getState().active).toBe('b');
    expect(m.getState().windows.b?.minimized).toBe(false);
  });

  it('notifies subscribers with a new state object, and stops after unsubscribe', () => {
    const m = createWindowManager();
    const listener = vi.fn();
    const off = m.subscribe(listener);
    const before = m.getState();
    m.open('a');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(m.getState()).not.toBe(before);
    m.focus('a');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    m.close('a');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores actions on windows it does not know', () => {
    const m = createWindowManager();
    const listener = vi.fn();
    m.subscribe(listener);
    m.close('x');
    m.focus('x');
    m.minimize('x');
    m.restore('x');
    m.zoom('x', bounds);
    m.move('x', frame);
    expect(listener).not.toHaveBeenCalled();
  });
});
