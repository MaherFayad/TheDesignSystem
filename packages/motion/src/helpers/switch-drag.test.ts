// @vitest-environment jsdom
// switch-drag (order 1.23): the math and the run of one drag. The math tests
// moved with the code from packages/react/src/components/Switch/Switch.drag.test.tsx
// (order 1.29); the pointer wiring keeps its tests in both frameworks.
import { describe, expect, it } from 'vitest';
import {
  DRAG_PROGRESS,
  beginSwitchDrag,
  clearDragProgress,
  followPointer,
  pastSlop,
  releaseChecked,
  releaseSpeed,
  snapChecked,
  switchRubberBand,
} from './switch-drag';

describe('switch-drag math', () => {
  it('damps the thumb past either end', () => {
    expect(switchRubberBand(0.4)).toBe(0.4);
    expect(switchRubberBand(1.2)).toBeCloseTo(1.06);
    expect(switchRubberBand(3)).toBeCloseTo(1.12);
    expect(switchRubberBand(-0.2)).toBeCloseTo(-0.06);
  });

  it('snaps by velocity first, else by the nearer end', () => {
    expect(snapChecked(0.3, 0.02)).toBe(true);
    expect(snapChecked(0.8, -0.02)).toBe(false);
    expect(snapChecked(0.6, 0)).toBe(true);
    expect(snapChecked(0.4, 0.001)).toBe(false);
  });
});

/** A root, a control, a 44px track and a 20px thumb (no padding): the travel is 24px. */
function control(): HTMLElement {
  const root = document.createElement('div');
  const button = document.createElement('button');
  const track = document.createElement('span');
  track.setAttribute('data-part', 'track');
  const thumb = document.createElement('span');
  thumb.setAttribute('data-part', 'thumb');
  track.append(thumb);
  button.append(track);
  root.append(button);
  for (const [el, w] of [
    [track, 44],
    [thumb, 20],
  ] as const) {
    Object.defineProperty(el, 'offsetWidth', { value: w });
    Object.defineProperty(el, 'clientWidth', { value: w });
  }
  track.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 44, height: 24 });
  document.body.append(root);
  return button;
}

describe('switch-drag run', () => {
  it('starts from the state, passes the slop, follows the pointer with the rubber band and clears', () => {
    const button = control();
    const run = beginSwitchDrag(button, false, 1, 100, 0);
    expect(run).not.toBeNull();
    expect(run!.travel).toBe(24);
    expect(pastSlop(run!, 102)).toBe(false);
    expect(pastSlop(run!, 103)).toBe(true);
    followPointer(run!, 112, 16);
    expect(run!.raw).toBe(0.5);
    expect(button.parentElement!.style.getPropertyValue(DRAG_PROGRESS)).toBe('0.5000');
    followPointer(run!, 148, 32);
    expect(button.parentElement!.style.getPropertyValue(DRAG_PROGRESS)).toBe('1.1200');
    clearDragProgress(run!);
    expect(button.parentElement!.style.getPropertyValue(DRAG_PROGRESS)).toBe('');
    button.parentElement!.remove();
  });

  it('a release reads the speed of the last move, and none after a rest', () => {
    const button = control();
    const run = beginSwitchDrag(button, true, 1, 100, 0)!;
    followPointer(run, 94, 10);
    followPointer(run, 88, 20);
    expect(releaseSpeed(run, 20)).toBeCloseTo(-0.025);
    expect(releaseChecked(run, 20)).toBe(false);
    expect(releaseSpeed(run, 200)).toBe(0);
    expect(releaseChecked(run, 200)).toBe(true);
    button.parentElement!.remove();
  });

  it('no run without a root or a travel', () => {
    const lone = document.createElement('button');
    expect(beginSwitchDrag(lone, false, 1, 0, 0)).toBeNull();
  });
});
