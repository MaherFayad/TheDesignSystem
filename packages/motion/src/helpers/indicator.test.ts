// @vitest-environment jsdom
// The shared sliding indicator (orders 1.22 and 1.29): moved with the code from
// packages/react/src/internal/indicator.test.ts, with the runner tests of
// packages/angular/src/internal/indicator.spec.ts.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANSWER_ID,
  SLIDE_ID,
  answerLabels,
  rectBetween,
  createTrack,
  followIndicator,
  fromLocal,
  rollText,
  slideFrames,
  slideTo,
  stretchAlong,
  toLocal,
  activated,
  hoverFollow,
  windUp,
} from './indicator';

type Call = [Keyframe[], KeyframeAnimationOptions];

function mockAnimate() {
  const calls: Call[] = [];
  const proto = Element.prototype as unknown as { animate?: unknown; getAnimations?: unknown };
  const saved = { animate: proto.animate, getAnimations: proto.getAnimations };
  proto.animate = function (frames: Keyframe[], options: KeyframeAnimationOptions) {
    calls.push([frames, options]);
    return { finished: Promise.resolve(), cancel() {}, playState: 'running', currentTime: 0, effect: null } as unknown as Animation;
  };
  proto.getAnimations = () => [];
  return {
    calls,
    restore() {
      proto.animate = saved.animate;
      proto.getAnimations = saved.getAnimations;
    },
  };
}

function rect(el: Element, r: { x: number; y: number; width: number; height: number }) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect(r));
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('slideFrames', () => {
  it('draws the layer over the old box, stretched halfway along the travel, then at rest', () => {
    const frames = slideFrames({ x: 0, y: 0, width: 80, height: 2 }, { x: 200, y: 0, width: 80, height: 2 }, 1.2);
    expect(frames[0]?.transform).toBe('translate(-200px, 0px) scale(1, 1)');
    // A hop longer than the box stretches by the whole token.
    expect(frames[1]?.transform).toBe('translate(-100px, 0px) scale(1.2, 1)');
    expect(frames[1]?.offset).toBe(0.45);
    expect(frames[2]?.transform).toBe('none');
    for (const f of frames) expect(Object.keys(f).filter((k) => k !== 'offset')).toEqual(['transform']);
  });

  it('stretches less for a short hop, and along y for a column', () => {
    const frames = slideFrames({ x: 0, y: 0, width: 40, height: 32 }, { x: 0, y: 16, width: 40, height: 32 }, 1.2);
    expect(frames[1]?.transform).toBe('translate(0px, -8px) scale(1, 1.1)');
  });

  it('a ghost fades as it lands', () => {
    const frames = slideFrames({ x: 0, y: 0, width: 10, height: 10 }, { x: 50, y: 0, width: 10, height: 10 }, 1.15, 'auto', true);
    expect(frames.map((f) => f.opacity)).toEqual([1, 1, 0]);
  });
});

describe('boxes', () => {
  it('converts to the anchor and back, scroll included', () => {
    const anchor = document.createElement('div');
    document.body.append(anchor);
    rect(anchor, { x: 100, y: 50, width: 300, height: 40 });
    anchor.scrollLeft = 0;
    const local = toLocal({ x: 160, y: 60, width: 20, height: 10 }, anchor);
    expect(local).toEqual({ x: 60, y: 10, width: 20, height: 10 });
    expect(fromLocal(local, anchor)).toEqual({ x: 160, y: 60, width: 20, height: 10 });
    expect(rectBetween({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 20, width: 30, height: 10 }, 0.5)).toEqual({ x: 5, y: 10, width: 20, height: 10 });
  });
});

describe('slideTo and followIndicator', () => {
  it('plays nothing under reduced or none', () => {
    const m = mockAnimate();
    try {
      const el = document.createElement('span');
      expect(slideTo({ el }, { x: 0, y: 0, width: 10, height: 10 }, { x: 40, y: 0, width: 10, height: 10 }, { mode: 'reduced' })).toBeNull();
      expect(slideTo({ el }, { x: 0, y: 0, width: 10, height: 10 }, { x: 40, y: 0, width: 10, height: 10 }, { mode: 'none' })).toBeNull();
      expect(m.calls).toHaveLength(0);
    } finally {
      m.restore();
    }
  });

  it('passes the pseudo element to the animation', () => {
    const m = mockAnimate();
    try {
      const el = document.createElement('a');
      slideTo({ el, pseudo: '::before' }, { x: 0, y: 0, width: 2, height: 20 }, { x: 0, y: 40, width: 2, height: 20 }, { mode: 'full' });
      expect(m.calls[0]?.[1].pseudoElement).toBe('::before');
      expect(m.calls[0]?.[1].id).toBe(SLIDE_ID);
    } finally {
      m.restore();
    }
  });

  it('slides from the last key only when the key changes, and makes the labels answer', () => {
    const m = mockAnimate();
    try {
      const anchor = document.createElement('div');
      const a = document.createElement('span');
      const b = document.createElement('span');
      const la = document.createElement('span');
      const lb = document.createElement('span');
      anchor.append(a, b, la, lb);
      document.body.append(anchor);
      rect(anchor, { x: 0, y: 0, width: 300, height: 40 });
      rect(a, { x: 0, y: 0, width: 80, height: 32 });
      rect(b, { x: 100, y: 0, width: 80, height: 32 });
      const track = createTrack();
      expect(followIndicator(track, 'a', { el: a }, { mode: 'full', anchor, label: la })).toBeNull();
      expect(followIndicator(track, 'a', { el: a }, { mode: 'full', anchor, label: la })).toBeNull();
      expect(m.calls).toHaveLength(0);
      followIndicator(track, 'b', { el: b }, { mode: 'full', anchor, label: lb });
      const slide = m.calls.find((c) => c[1].id === SLIDE_ID);
      expect(slide?.[0][0]?.transform).toBe('translate(-100px, 0px) scale(1, 1)');
      expect(m.calls.filter((c) => c[1].id === ANSWER_ID)).toHaveLength(2);
      expect(track.key).toBe('b');
      expect(track.rect).toEqual({ x: 100, y: 0, width: 80, height: 32 });
    } finally {
      m.restore();
    }
  });

  it('does not slide when told the old item is still current', () => {
    const m = mockAnimate();
    try {
      const anchor = document.createElement('div');
      const a = document.createElement('span');
      const b = document.createElement('span');
      anchor.append(a, b);
      document.body.append(anchor);
      const track = createTrack();
      followIndicator(track, 'a', { el: a }, { mode: 'full', anchor });
      followIndicator(track, 'b', { el: b }, { mode: 'full', anchor, slide: false });
      expect(m.calls).toHaveLength(0);
    } finally {
      m.restore();
    }
  });
});

describe('small answers', () => {
  it('labels, arrows and stretches add to the element transform', () => {
    const m = mockAnimate();
    try {
      const a = document.createElement('span');
      const b = document.createElement('span');
      document.body.append(a, b);
      answerLabels(a, b, 'full');
      windUp(a, 1, 'full');
      stretchAlong(b, 'y', true, 'full');
      expect(m.calls).toHaveLength(4);
      for (const [, o] of m.calls) expect(o.composite).toBe('add');
      // The wind up goes back first, then forward.
      const wind = m.calls[2]![0];
      expect(wind[1]?.transform).toBe('translateX(-2px)');
      expect(wind[2]?.transform).toBe('translateX(4px)');
      expect(b.style.transformOrigin).toMatch(/^50% 0/);
      answerLabels(a, b, 'reduced');
      expect(m.calls).toHaveLength(4);
    } finally {
      m.restore();
    }
  });

  it('rolls a label with an aria-hidden copy of the old text', () => {
    const m = mockAnimate();
    try {
      const parent = document.createElement('span');
      const host = document.createElement('span');
      host.textContent = 'العربية';
      parent.append(host);
      document.body.append(parent);
      rollText(host, 'English', 'up', 'full');
      const copy = parent.lastElementChild;
      expect(copy).not.toBe(host);
      expect(copy?.getAttribute('aria-hidden')).toBe('true');
      expect(copy?.textContent).toBe('English');
      expect(m.calls[0]?.[0][0]?.transform).toBe('translateY(100%)');
      expect(m.calls[1]?.[0][1]?.transform).toBe('translateY(-100%)');
      // Reduced: the new text fades in, no copy.
      rollText(host, 'Français', 'up', 'reduced');
      expect(parent.children).toHaveLength(1);
      expect(Object.keys(m.calls.at(-1)![0][0]!)).toEqual(['opacity']);
    } finally {
      m.restore();
    }
  });
});

describe('the runners for the framework wiring', () => {
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
    const root = document.createElement('div');
    const remove = vi.spyOn(root, 'removeEventListener');
    const stop = hoverFollow(root, { item: 'a', pseudo: '::before', mode: () => 'full' });
    stop();
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it('hoverFollow reads options given as a function at each pointer move', () => {
    const root = document.createElement('div');
    const options = vi.fn(() => ({ item: 'a', pseudo: '::before' as const, mode: () => 'full' as const }));
    const stop = hoverFollow(root, options);
    root.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(options).toHaveBeenCalled();
    stop();
  });
});
