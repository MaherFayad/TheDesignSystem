// @vitest-environment jsdom
// The ink of the shared pill (order 1.23): the twins, their clip and their removal.
// Moved with the code from packages/react/src/components/Tabs/ink.test.tsx (order 1.29).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearInk, insetFor, INK_PART, playInk, slideBoxes } from './nav-ink';

function fakeAnimation(frames: Keyframe[], duration = 180): Animation {
  return {
    startTime: 0,
    finished: new Promise(() => undefined),
    effect: {
      getKeyframes: () => frames.map((f, i) => ({ ...f, computedOffset: f.offset ?? i / (frames.length - 1) })),
      getTiming: () => ({ duration, easing: 'linear' }),
    },
    cancel: vi.fn(),
  } as unknown as Animation;
}

const box = (x: number, width: number) => ({ x, y: 0, width, height: 20 });

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('ink', () => {
  it('reads the box of each keyframe of a slide', () => {
    const slide = fakeAnimation([
      { transform: 'translate(-100px, 0px) scale(1, 1)', offset: 0 },
      { transform: 'translate(-50px, 0px) scale(1.2, 1)', offset: 0.45 },
      { transform: 'none', offset: 1 },
    ]);
    const boxes = slideBoxes(slide, box(200, 100));
    expect(boxes.map((b) => b.offset)).toEqual([0, 0.45, 1]);
    expect(boxes[0]?.box.x).toBe(100);
    expect(boxes[1]?.box.width).toBe(120);
    expect(boxes[1]?.box.x).toBe(140);
    expect(boxes[2]?.box).toEqual(box(200, 100));
  });

  it('cuts a label to the pill along the travel axis, with negative insets kept', () => {
    expect(insetFor(box(100, 50), box(120, 100), 'x')).toBe('inset(-50px -70px -50px 20px)');
    expect(insetFor({ x: 0, y: 0, width: 40, height: 20 }, { x: 0, y: 10, width: 40, height: 20 }, 'y')).toBe('inset(10px -40px -10px -40px)');
  });

  it('lays a twin in the selected color over each label, holds the reached label, and clears both', () => {
    const list = document.createElement('div');
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = 'General';
    b.textContent = 'Members';
    a.style.color = 'rgb(1, 1, 1)';
    b.style.color = 'rgb(2, 2, 2)';
    for (const el of [a, b]) {
      const item = document.createElement('div');
      item.append(el);
      list.append(item);
      el.getBoundingClientRect = () => ({ x: 0, y: 0, width: 60, height: 20, top: 0, left: 0, right: 60, bottom: 20, toJSON() {} }) as DOMRect;
    }
    document.body.append(list);
    const animate = vi.fn(() => ({ startTime: 0, finished: new Promise(() => undefined), cancel: vi.fn() }) as unknown as Animation);
    for (const el of [a, b]) (el as unknown as { animate: typeof animate }).animate = animate;
    HTMLElement.prototype.animate = animate as unknown as HTMLElement['animate'];
    const slide = fakeAnimation([{ transform: 'translate(-80px, 0px) scale(1, 1)' }, { transform: 'none' }]);
    const twins = playInk({ slide, to: box(80, 60), anchor: list, parts: [a, b], reaching: [b], restFrom: a, inkFrom: b, axis: 'x' });
    expect(twins).toHaveLength(2);
    const drawn = list.querySelectorAll(`[data-part='${INK_PART}']`);
    expect(drawn).toHaveLength(2);
    for (const t of drawn) {
      expect(t.getAttribute('aria-hidden')).toBe('true');
      expect((t as HTMLElement).inert).toBe(true);
      expect((t as HTMLElement).style.color).toBe('rgb(2, 2, 2)');
    }
    // The clip-path frames, and the hold of the reached label in the rest color.
    const calls = animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][];
    expect(calls.filter(([f]) => 'clipPath' in (f[0] ?? {}))).toHaveLength(2);
    expect(calls.find(([f]) => 'color' in (f[0] ?? {}))?.[0][0]?.color).toBe('rgb(1, 1, 1)');
    clearInk(list);
    expect(list.querySelectorAll(`[data-part='${INK_PART}']`)).toHaveLength(0);
  });

  it('draws nothing without a slide (reduced motion or a first paint)', () => {
    const list = document.createElement('div');
    document.body.append(list);
    expect(playInk({ slide: null, to: box(0, 10), anchor: list, parts: [], reaching: [], restFrom: null, inkFrom: null, axis: 'x' })).toEqual([]);
  });
});
