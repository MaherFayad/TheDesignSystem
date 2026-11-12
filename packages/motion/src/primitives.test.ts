// @vitest-environment jsdom
// Tests for the primitives of order 1.22. jsdom has no Web Animations API,
// so each element gets a recording `animate` and a fixed box.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { animatedProperties } from './core';
import { buttonMorph, digitSlots, flipPlay, flipSnapshot, iconMorph, iconParts, iconTurn, invert, renderDigits, resolveMode, rollDigits, rollDirection, staggerGroup, staggerStep } from './primitives';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];

/** A fake running animation that records its keyframes. */
function fakeAnim(id: string) {
  const a = { id, playState: 'running' as AnimationPlayState, finished: new Promise<void>(() => {}), cancel: vi.fn(() => (a.playState = 'idle')) };
  return a;
}

/** An element with a recording animate() and a box. */
function el(box = { x: 0, y: 0, width: 40, height: 20 }, tag = 'span'): HTMLElement {
  const e = document.createElement(tag);
  document.body.append(e);
  const anims: ReturnType<typeof fakeAnim>[] = [];
  Object.assign(e, {
    animate: (frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      calls.push({ el: e, frames, opts });
      const a = fakeAnim(String(opts.id));
      anims.push(a);
      return a;
    },
    getAnimations: () => anims.filter((a) => a.playState !== 'idle'),
    getBoundingClientRect: () => ({ ...box, top: box.y, left: box.x, right: box.x + box.width, bottom: box.y + box.height, toJSON: () => box }),
  });
  return e;
}

function setBox(e: HTMLElement, box: { x: number; y: number; width: number; height: number }) {
  e.getBoundingClientRect = () => ({ ...box, top: box.y, left: box.x, right: box.x + box.width, bottom: box.y + box.height, toJSON: () => box }) as DOMRect;
}

afterEach(() => {
  calls = [];
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-motion');
});

/** Every call moved only transform and opacity. */
function onlyTransformAndOpacity() {
  for (const c of calls) for (const p of animatedProperties(c.frames)) expect(['opacity', 'transform']).toContain(p);
}

describe('resolveMode', () => {
  it('follows the style, then the person', () => {
    expect(resolveMode({ mode: 'none' })).toBe('none');
    expect(resolveMode({ mode: 'reduced', reduced: false })).toBe('reduced');
    expect(resolveMode({ reduced: true })).toBe('reduced');
    expect(resolveMode({ reduced: false })).toBe('full');
    document.documentElement.setAttribute('data-motion', 'reduce');
    expect(resolveMode({})).toBe('reduced');
  });
});

describe('flip move', () => {
  it('moves an item from its old box to the new one on the snappy spring', () => {
    const a = el({ x: 0, y: 0, width: 40, height: 20 });
    const snap = flipSnapshot([a]);
    setBox(a, { x: 0, y: 30, width: 40, height: 20 });
    const out = flipPlay(snap, { reduced: false });
    expect(out).toHaveLength(1);
    expect(calls[0]!.frames[0]!.transform).toBe('translate(0px, -30px)');
    expect(calls[0]!.frames.at(-1)!.transform).toBe('none');
    onlyTransformAndOpacity();
  });

  it('stretches along the travel when asked', () => {
    const a = el({ x: 0, y: 0, width: 40, height: 20 });
    const snap = flipSnapshot([a]);
    setBox(a, { x: 100, y: 0, width: 40, height: 20 });
    flipPlay(snap, { reduced: false, stretch: 'auto' });
    expect(calls[0]!.frames).toHaveLength(3);
    expect(String(calls[0]!.frames[1]!.transform)).toContain('scale(var(--ds-scale-stretch');
  });

  it('pops new items in, a stagger step apart, and skips items that did not move', () => {
    const still = el();
    const snap = flipSnapshot([still]);
    const n1 = el();
    const n2 = el();
    flipPlay(snap, { reduced: false, items: [still, n1, n2] });
    expect(calls.map((c) => c.el)).toEqual([n1, n2]);
    expect(calls[0]!.frames[0]!.opacity).toBe(0);
    onlyTransformAndOpacity();
  });

  it('reduced: no travel, new items fade', () => {
    const a = el();
    const snap = flipSnapshot([a]);
    setBox(a, { x: 0, y: 50, width: 40, height: 20 });
    const b = el();
    flipPlay(snap, { reduced: true, items: [a, b] });
    expect(calls).toHaveLength(1);
    expect(animatedProperties(calls[0]!.frames)).toEqual(['opacity']);
  });

  it('mode none plays nothing', () => {
    const a = el();
    const snap = flipSnapshot([a]);
    setBox(a, { x: 0, y: 50, width: 40, height: 20 });
    expect(flipPlay(snap, { mode: 'none' })).toEqual([]);
  });

  it('a second change cancels the move in flight before measuring', () => {
    const a = el();
    let snap = flipSnapshot([a]);
    setBox(a, { x: 0, y: 30, width: 40, height: 20 });
    const [first] = flipPlay(snap, { reduced: false });
    snap = flipSnapshot([a]);
    setBox(a, { x: 0, y: 60, width: 40, height: 20 });
    flipPlay(snap, { reduced: false });
    expect(first!.cancel).toHaveBeenCalled();
  });

  it('invert keeps size unless asked', () => {
    expect(invert({ x: 0, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 20, height: 20 }, false)).toBeNull();
    expect(invert({ x: 0, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 20, height: 20 }, true)).toContain('scale(0.5, 0.5)');
  });
});

describe('staggered group', () => {
  it('caps the steps', () => {
    expect([0, 1, 5, 6, 9].map((i) => staggerStep(i))).toEqual([0, 1, 5, 6, 6]);
    expect(staggerStep(2, { offset: 1, maxSteps: 2 })).toBe(2);
  });

  it('enters in order on the soft spring and waits hidden', () => {
    const parts = [el(), el(), el()];
    staggerGroup(parts, { reduced: false });
    expect(calls).toHaveLength(3);
    expect(calls[1]!.opts.fill).toBe('backwards');
    expect(calls[0]!.opts.fill).toBe('none');
    onlyTransformAndOpacity();
  });

  it('exits all at once and holds the last frame', () => {
    staggerGroup([el(), el()], { reduced: false, phase: 'exit' });
    expect(calls.every((c) => c.opts.delay === 0 && c.opts.fill === 'forwards')).toBe(true);
  });

  it('reduced: fades with no delay', () => {
    staggerGroup([el(), el()], { reduced: true });
    expect(calls.every((c) => animatedProperties(c.frames).join() === 'opacity' && c.opts.delay === 0)).toBe(true);
  });
});

describe('icon morph', () => {
  it('turns the old glyph out and the new one in, at once', () => {
    const from = el();
    const to = el();
    iconMorph({ from, to, reduced: false });
    expect(calls).toHaveLength(2);
    expect(String(calls[0]!.frames.at(-1)!.transform)).toContain('rotate(90deg)');
    expect(String(calls[1]!.frames[0]!.transform)).toContain('rotate(-90deg)');
    expect(calls[1]!.opts.delay).toBe(0);
    onlyTransformAndOpacity();
  });

  it('reduced: a cross fade', () => {
    iconMorph({ from: el(), to: el(), reduced: true });
    expect(calls.every((c) => animatedProperties(c.frames).join() === 'opacity')).toBe(true);
  });

  it('a turn plays only in full motion', () => {
    expect(iconTurn(el(), 0, 180, { reduced: true })).toBeNull();
    expect(iconTurn(el(), 0, 180, { reduced: false })).not.toBeNull();
  });

  it('parts settle a step apart', () => {
    iconParts([el(), el()], { reduced: false });
    expect(calls[1]!.opts.fill).toBe('backwards');
  });
});

describe('digit roll', () => {
  it('aligns from the last digit', () => {
    expect(digitSlots('99', '100')).toEqual([
      { from: '', to: '1', changed: true },
      { from: '9', to: '0', changed: true },
      { from: '9', to: '0', changed: true },
    ]);
    expect(digitSlots('1,240', '1,277').map((s) => s.changed)).toEqual([false, false, false, true, true]);
  });

  it('reads the direction from the numbers', () => {
    expect(rollDirection('1,240', '1,277')).toBe('up');
    expect(rollDirection('12', '9')).toBe('down');
    expect(rollDirection('a', 'b')).toBe('up');
  });

  it('renders still columns, one per character, with tabular figures', () => {
    const host = el();
    renderDigits(host, '1,240');
    expect(host.children).toHaveLength(5);
    expect(host.textContent).toBe('1,240');
    expect(host.style.fontVariantNumeric).toBe('tabular-nums');
  });

  it('rolls only the changed digits, the last first', () => {
    const host = el();
    renderDigits(host, '1,240');
    // Columns are new elements: give them the recording animate too.
    const real = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const e = real(tag) as HTMLElement;
      Object.assign(e, {
        animate: (frames: Keyframe[], opts: KeyframeAnimationOptions) => {
          calls.push({ el: e, frames, opts });
          return fakeAnim(String(opts.id));
        },
      });
      return e;
    });
    rollDigits(host, '1,240', '1,277', { reduced: false });
    vi.restoreAllMocks();
    expect([...host.children].map((c) => c.firstElementChild?.textContent).join('')).toBe('1,277');
    expect(host.querySelectorAll('[data-digit-out]')).toHaveLength(2);
    const ins = calls.filter((c) => c.opts.id === 'ds-motion:digit-roll');
    expect(ins).toHaveLength(2);
    expect(ins[0]!.el.textContent).toBe('7');
    expect(ins[0]!.frames[0]!.transform).toBe('translateY(100%)');
    onlyTransformAndOpacity();
  });

  it('mode none only writes the text', () => {
    const host = el();
    expect(rollDigits(host, '1', '2', { mode: 'none' })).toEqual([]);
    expect(host.textContent).toBe('2');
  });
});

describe('button morph', () => {
  const parts = () => ({ root: el(), label: el(), spinner: el(), success: el(), error: el() });

  it('idle to loading: label out, spinner in a step later, the button dips', () => {
    const p = parts();
    buttonMorph(p, 'idle', 'loading', { reduced: false });
    expect(calls.map((c) => c.el)).toEqual([p.label, p.spinner, p.root]);
    expect(calls[1]!.opts.fill).toBe('backwards');
    expect(String(calls[2]!.frames[1]!.transform)).toContain('scale-anticipate');
    onlyTransformAndOpacity();
  });

  it('loading to success: the check turns in and the button swells once', () => {
    const p = parts();
    buttonMorph(p, 'loading', 'success', { reduced: false });
    expect(calls.map((c) => c.el)).toEqual([p.spinner, p.success, p.root]);
    expect(String(calls[1]!.frames[0]!.transform)).toContain('rotate(-45deg)');
    expect(String(calls[2]!.frames[1]!.transform)).toContain('scale-pop');
  });

  it('loading to error shakes the button', () => {
    const p = parts();
    buttonMorph(p, 'loading', 'error', { reduced: false });
    expect(calls.at(-1)!.el).toBe(p.root);
    expect(calls.at(-1)!.frames).toHaveLength(5);
  });

  it('never holds a part in its end frame', () => {
    const p = parts();
    for (const [a, b] of [
      ['idle', 'loading'],
      ['loading', 'success'],
      ['success', 'idle'],
      ['loading', 'error'],
    ] as const)
      buttonMorph(p, a, b, { reduced: false });
    expect(calls.every((c) => c.opts.fill !== 'forwards' && c.opts.fill !== 'both')).toBe(true);
  });

  it('reduced: a cross fade, the button still', () => {
    const p = parts();
    buttonMorph(p, 'loading', 'success', { reduced: true });
    expect(calls.map((c) => c.el)).toEqual([p.spinner, p.success]);
    expect(calls.every((c) => animatedProperties(c.frames).join() === 'opacity')).toBe(true);
  });

  it('the same state plays nothing', () => {
    expect(buttonMorph(parts(), 'idle', 'idle', { reduced: false })).toEqual([]);
  });
});
