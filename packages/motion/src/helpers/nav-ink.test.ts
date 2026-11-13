// @vitest-environment jsdom
// The ink of the shared pill (order 1.23): the twins, their clip and their removal.
// Moved with the code from packages/react/src/components/Tabs/ink.test.tsx (order 1.29).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearInk, insetFor, INK_PART, playInk, slideBoxes, type InkOptions } from './nav-ink';
import { slideFrames } from './indicator';

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

// Order 1.29: review B2 (forced colors), B14 (one press, one layout pass) and N30 (zoom).
describe('ink, order 1.29', () => {
  const rect = (x: number, width: number) => () => ({ x, y: 0, width, height: 20, top: 0, left: x, right: x + width, bottom: 20, toJSON() {} }) as DOMRect;

  /** A list of `n` labels side by side, 60px wide each, with animate stubbed. */
  function list(n: number, width = 60) {
    const anchor = document.createElement('div');
    const parts: HTMLElement[] = [];
    for (let i = 0; i < n; i++) {
      const item = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = `Label ${i}`;
      label.style.color = i === 1 ? 'rgb(2, 2, 2)' : 'rgb(1, 1, 1)';
      label.getBoundingClientRect = rect(i * width, width);
      item.append(label);
      anchor.append(item);
      parts.push(label);
    }
    document.body.append(anchor);
    HTMLElement.prototype.animate = vi.fn(() => ({ startTime: 0, finished: new Promise(() => undefined), cancel: vi.fn() }) as unknown as Animation) as unknown as HTMLElement['animate'];
    return { anchor, parts };
  }

  /** The pill slides from label 0 to label 1. */
  const opts = (anchor: Element, parts: HTMLElement[], extra: Partial<InkOptions> = {}): InkOptions => ({
    slide: fakeAnimation([{ transform: 'translate(-60px, 0px) scale(1, 1)' }, { transform: 'none' }]),
    to: box(60, 60),
    anchor,
    parts,
    reaching: [parts[1]!],
    restFrom: parts[0],
    inkFrom: parts[1],
    axis: 'x',
    ...extra,
  });

  const twinsIn = (el: Element) => el.querySelectorAll(`[data-part='${INK_PART}']`);

  it('B2: draws no ink under forced colors', () => {
    const { anchor, parts } = list(2);
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('forced-colors: active'), media: q }) as MediaQueryList);
    try {
      expect(playInk(opts(anchor, parts))).toEqual([]);
      expect(twinsIn(anchor)).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('B2: draws no ink when the pill is not drawn', () => {
    const { anchor, parts } = list(2);
    const pill = document.createElement('span');
    pill.style.visibility = 'hidden';
    anchor.append(pill);
    expect(playInk(opts(anchor, parts, { indicator: pill }))).toEqual([]);
    expect(twinsIn(anchor)).toHaveLength(0);
  });

  it('B14: a style that turns the ink off costs one read, of the switch, and nothing else', () => {
    const { anchor, parts } = list(3);
    anchor.style.setProperty('--_tabs-ink', '0');
    const gcs = vi.spyOn(window, 'getComputedStyle');
    const boxes = parts.map((p) => vi.spyOn(p, 'getBoundingClientRect'));
    expect(playInk(opts(anchor, parts, { switch: '--_tabs-ink' }))).toEqual([]);
    expect(gcs).toHaveBeenCalledTimes(1);
    expect(gcs.mock.calls[0]?.[0]).toBe(anchor);
    for (const b of boxes) expect(b).not.toHaveBeenCalled();
  });

  it('B14: reads every box and color before the first write', () => {
    const { anchor, parts } = list(3);
    const log: string[] = [];
    const gcs = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => {
      log.push('read');
      return gcs(el, p);
    });
    for (const part of parts) {
      const own = part.getBoundingClientRect;
      part.getBoundingClientRect = () => {
        log.push('read');
        return own();
      };
    }
    const append = Element.prototype.append;
    vi.spyOn(Element.prototype, 'append').mockImplementation(function (this: Element, ...nodes) {
      log.push('write');
      append.apply(this, nodes);
    });
    playInk(opts(anchor, parts));
    expect(twinsIn(anchor).length).toBeGreaterThan(0);
    const firstWrite = log.indexOf('write');
    expect(firstWrite).toBeGreaterThan(0);
    expect(log.slice(firstWrite)).not.toContain('read');
  });

  it('B14: builds the twins once per label and reuses them on the next slide', () => {
    const { anchor, parts } = list(2);
    playInk(opts(anchor, parts));
    const first = [...twinsIn(anchor)];
    expect(first.length).toBe(2);
    playInk(opts(anchor, parts));
    const second = [...twinsIn(anchor)];
    expect(second).toHaveLength(2);
    expect(second.every((t) => first.includes(t))).toBe(true);
    // A label whose text changed gets a new twin.
    parts[0]!.textContent = 'Renamed';
    playInk(opts(anchor, parts));
    expect([...twinsIn(anchor)].filter((t) => first.includes(t))).toHaveLength(1);
  });

  it('B14: a label the pill never passes gets no twin', () => {
    const { anchor, parts } = list(6);
    playInk(opts(anchor, parts));
    // The pill travels over labels 0 and 1 only.
    expect(twinsIn(anchor)).toHaveLength(2);
  });

  it('N30: a slide written under zoom lands on its first box, and the ink reads it back in box px', () => {
    const from = { x: 0, y: 0, width: 80, height: 20 };
    const to = { x: 200, y: 0, width: 80, height: 20 };
    const frames = slideFrames(from, to, 1.2, 'x', false, 2);
    // 200 box px at zoom 2 is a translate of 100 CSS px.
    expect(frames[0]?.transform).toBe('translate(-100px, 0px) scale(1, 1)');
    const slide = fakeAnimation(frames.map((f) => ({ transform: f.transform, offset: f.offset })) as Keyframe[]);
    expect(slideBoxes(slide, to, 2)[0]?.box.x).toBe(0);
  });
});

