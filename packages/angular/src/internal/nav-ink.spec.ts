// The ink of the shared pill (order 1.23), for Angular: the twins, their clip
// and their removal. The same cases as React's Tabs/ink.test.tsx.
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
const animateOwn = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');

afterEach(() => {
  document.body.innerHTML = '';
  if (animateOwn) Object.defineProperty(HTMLElement.prototype, 'animate', animateOwn);
  else delete (HTMLElement.prototype as unknown as Record<string, unknown>)['animate'];
  vi.restoreAllMocks();
});

describe('nav-ink', () => {
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
      el.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 60, height: 20 });
    }
    document.body.append(list);
    const animate = vi.fn(() => ({ startTime: 0, finished: new Promise(() => undefined), cancel: vi.fn() }) as unknown as Animation);
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
    const calls = animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][];
    const clips = calls.filter(([f]) => 'clipPath' in (f[0] ?? {}));
    expect(clips).toHaveLength(2);
    expect(clips[0]![1]).toMatchObject({ id: 'ds-motion:indicator-ink', duration: 180, easing: 'linear', fill: 'forwards' });
    expect(calls.find(([f]) => 'color' in (f[0] ?? {}))?.[0][0]?.color).toBe('rgb(1, 1, 1)');
    clearInk(list);
    expect(list.querySelectorAll(`[data-part='${INK_PART}']`)).toHaveLength(0);
  });

  it('draws nothing when the switch property is 0', () => {
    const list = document.createElement('div');
    list.style.setProperty('--_tabs-ink', '0');
    document.body.append(list);
    const slide = fakeAnimation([{ transform: 'translate(-80px, 0px) scale(1, 1)' }, { transform: 'none' }]);
    expect(playInk({ switch: '--_tabs-ink', slide, to: box(0, 10), anchor: list, parts: [], reaching: [], restFrom: null, inkFrom: null, axis: 'x' })).toEqual([]);
  });

  it('draws nothing without a slide (reduced motion or a first paint)', () => {
    const list = document.createElement('div');
    document.body.append(list);
    expect(playInk({ slide: null, to: box(0, 10), anchor: list, parts: [], reaching: [], restFrom: null, inkFrom: null, axis: 'x' })).toEqual([]);
  });
});
