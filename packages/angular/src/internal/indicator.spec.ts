// The shared indicator (helpers/indicator.ts in @the-system/motion, order
// 1.29) as Angular calls it: the same keyframes, ids and timing as React,
// and nothing when reduced.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANSWER_ID,
  SLIDE_ID,
  activated,
  answerLabels,
  createTrack,
  followIndicator,
  hoverFollow,
  popIn,
  slideFrames,
  slideTo,
} from '@the-system/motion';

type AnimateMock = ReturnType<typeof vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => Animation>>;

/** An element with the spring tokens set on it and a mocked animate. */
function el(box: { x: number; y: number; width: number; height: number }): HTMLElement & { animate: AnimateMock } {
  const e = document.createElement('span') as unknown as HTMLElement & { animate: AnimateMock };
  e.style.setProperty('--ds-duration-spring-snappy', '180ms');
  e.style.setProperty('--ds-ease-spring-snappy', 'linear(0, 1.015, 1)');
  e.style.setProperty('--ds-duration-spring-bouncy', '220ms');
  e.style.setProperty('--ds-ease-spring-bouncy', 'linear(0, 1.06, 1)');
  e.style.setProperty('--ds-scale-stretch', '1.15');
  e.style.setProperty('--ds-scale-anticipate', '0.97');
  e.getBoundingClientRect = () => DOMRect.fromRect(box);
  e.animate = vi.fn(() => ({ playState: 'running', cancel: vi.fn() }) as unknown as Animation);
  (e as unknown as { getAnimations: () => Animation[] }).getAnimations = () => [];
  document.body.append(e);
  return e;
}

describe('indicator (Angular port)', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('slideFrames stretches along the travel and rests at none, with the center origin', () => {
    const frames = slideFrames({ x: 0, y: 0, width: 60, height: 26 }, { x: 120, y: 0, width: 60, height: 26 }, 1.15);
    expect(frames).toEqual([
      { transform: 'translate(-120px, 0px) scale(1, 1)', offset: 0 },
      { transform: 'translate(-60px, 0px) scale(1.15, 1)', offset: 0.45 },
      { transform: 'none', offset: 1 },
    ]);
    const ghost = slideFrames({ x: 0, y: 0, width: 24, height: 24 }, { x: 0, y: 48, width: 24, height: 24 }, 1.15, 'auto', true);
    expect(ghost.map((f) => f.opacity)).toEqual([1, 1, 0]);
  });

  it('slideTo plays the slide on the snappy spring read from the element, as React', () => {
    const pill = el({ x: 120, y: 0, width: 60, height: 26 });
    slideTo({ el: pill }, { x: 0, y: 0, width: 60, height: 26 }, pill.getBoundingClientRect(), { mode: 'full', axis: 'x' });
    expect(pill.animate).toHaveBeenCalledTimes(1);
    const [frames, options] = pill.animate.mock.calls[0]!;
    expect(frames[1]?.transform).toBe('translate(-60px, 0px) scale(1.15, 1)');
    expect(options).toMatchObject({ id: SLIDE_ID, duration: 180, easing: 'linear(0, 1.015, 1)' });
    expect(SLIDE_ID).toBe('ds-motion:indicator-slide');
  });

  it('plays nothing when reduced or turned off', () => {
    const pill = el({ x: 120, y: 0, width: 60, height: 26 });
    const label = el({ x: 0, y: 0, width: 30, height: 16 });
    expect(slideTo({ el: pill }, { x: 0, y: 0, width: 60, height: 26 }, pill.getBoundingClientRect(), { mode: 'reduced' })).toBeNull();
    expect(slideTo({ el: pill }, { x: 0, y: 0, width: 60, height: 26 }, pill.getBoundingClientRect(), { mode: 'none' })).toBeNull();
    answerLabels(label, pill, 'reduced');
    expect(popIn(pill, 'reduced')).toBeNull();
    expect(pill.animate).not.toHaveBeenCalled();
    expect(label.animate).not.toHaveBeenCalled();
  });

  it('followIndicator slides from the last key only when the key changed, and the labels answer', () => {
    const anchor = el({ x: 0, y: 0, width: 300, height: 30 });
    const a = el({ x: 0, y: 0, width: 60, height: 26 });
    const b = el({ x: 120, y: 0, width: 60, height: 26 });
    const la = el({ x: 10, y: 5, width: 30, height: 16 });
    const lb = el({ x: 130, y: 5, width: 30, height: 16 });
    const track = createTrack();
    expect(followIndicator(track, 'a', { el: a }, { mode: 'full', anchor, label: la })).toBeNull();
    expect(followIndicator(track, 'a', { el: a }, { mode: 'full', anchor, label: la })).toBeNull();
    followIndicator(track, 'b', { el: b }, { mode: 'full', anchor, label: lb });
    expect(b.animate).toHaveBeenCalledTimes(1);
    expect(b.animate.mock.calls[0]![0][0]?.transform).toBe('translate(-120px, 0px) scale(1, 1)');
    // The label it leaves dips (soft spring, composite add), the one it reaches pops (bouncy).
    expect(la.animate.mock.calls[0]![1]).toMatchObject({ id: ANSWER_ID, composite: 'add' });
    expect(lb.animate.mock.calls[0]![0]).toEqual([{ transform: 'scale(0.97)' }, { transform: 'none' }]);
    expect(lb.animate.mock.calls[0]![1]).toMatchObject({ id: ANSWER_ID, duration: 220, easing: 'linear(0, 1.06, 1)', composite: 'add' });
  });

  it('activated runs only when the value turns from false to true, never on the first paint', () => {
    const run = vi.fn();
    const next = activated(run);
    next(true);
    next(false);
    next(true);
    next(true);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('hoverFollow stops listening when disposed', () => {
    const root = el({ x: 0, y: 0, width: 300, height: 30 });
    const remove = vi.spyOn(root, 'removeEventListener');
    const stop = hoverFollow(root, { item: 'a', pseudo: '::before', mode: () => 'full' });
    stop();
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
