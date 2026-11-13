// The framework free helpers of the feedback family, copied from React
// (Alert/ghost.ts, Toast/stackShift.ts, Stat/useDigitRoll.ts,
// AvatarGroup/useFlipList.ts): each calls the same @the-system/motion
// function with the same arguments as React.
import { flipExit, flipPlay, rectOf } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Celebrate, DigitRoller, dismissWithExit, FlipList, popMark, shiftToast, watchStackShift } from './motion-feedback';

interface Call {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

/** Records every el.animate call; rects come from `top` per element (default its order among visible siblings). */
function stage() {
  const calls: Call[] = [];
  const frames: FrameRequestCallback[] = [];
  // Stub on Element and HTMLElement: another spec may have left an own property on HTMLElement.prototype.
  const protos = [Element.prototype, HTMLElement.prototype];
  const names = ['animate', 'getBoundingClientRect'];
  const saved = protos.map((p) => names.map((n) => Object.getOwnPropertyDescriptor(p, n)));
  const raf = window.requestAnimationFrame;
  const animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    calls.push({ target: this, keyframes, options });
    return { id: options.id, playState: 'running', finished: Promise.resolve(), cancel() {}, effect: { getTiming: () => options } };
  };
  const rect = function (this: Element) {
    const siblings = this.parentElement ? [...this.parentElement.children] : [];
    const y = this.hasAttribute('inert') ? 0 : siblings.slice(0, siblings.indexOf(this)).filter((c) => !c.hasAttribute('inert')).length * 50;
    return { x: 0, y, top: y, left: 0, width: 100, height: 40, right: 100, bottom: y + 40, toJSON() {} } as DOMRect;
  };
  for (const p of protos) {
    Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
    Object.defineProperty(p, 'getBoundingClientRect', { configurable: true, writable: true, value: rect });
  }
  window.requestAnimationFrame = (cb) => frames.push(cb);
  return {
    take: () => calls.splice(0),
    flush: () => frames.splice(0).forEach((f) => f(0)),
    restore: () => {
      protos.forEach((p, i) =>
        names.forEach((n, j) => {
          const d = saved[i]![j];
          if (d) Object.defineProperty(p, n, d);
          else delete (p as unknown as Record<string, unknown>)[n];
        }),
      );
      window.requestAnimationFrame = raf;
    },
  };
}

function list(): { root: HTMLElement; items: HTMLElement[] } {
  const root = document.createElement('div');
  const items = ['a', 'b', 'c'].map((id) => {
    const el = document.createElement('p');
    el.id = id;
    root.append(el);
    return el;
  });
  document.body.append(root);
  return { root, items };
}

describe('motion-feedback', () => {
  let s: ReturnType<typeof stage>;
  beforeEach(() => (s = stage()));
  afterEach(() => {
    s.restore();
    document.body.replaceChildren();
  });

  it('dismissWithExit closes at once, then the ghost shrinks (flipExit) and the neighbours close the gap (flipPlay snappy)', () => {
    const { items } = list();
    const [a, b, c] = items as [HTMLElement, HTMLElement, HTMLElement];
    let closed = 0;
    dismissWithExit(a, 'full', () => {
      closed += 1;
      a.remove();
    });
    expect(closed).toBe(1);
    expect(s.take()).toEqual([]);
    s.flush();
    const played = s.take();
    const ghost = played[0]!.target as HTMLElement;
    expect(ghost.getAttribute('aria-hidden')).toBe('true');
    expect(ghost.hasAttribute('inert')).toBe(true);
    expect(ghost.id).toBe('');
    // The same calls React makes: flipExit on the ghost, flipPlay on the neighbours.
    flipExit(ghost, { mode: 'full' });
    const snap = { rects: new Map<Element, ReturnType<typeof rectOf>>([[b, { x: 0, y: 50, width: 100, height: 40 }], [c, { x: 0, y: 100, width: 100, height: 40 }]]) };
    flipPlay(snap, { items: [b, c], spring: 'snappy', mode: 'full', enter: 'none' });
    expect(played).toEqual(s.take());
    expect(played.map((p) => p.options.id)).toEqual(['ds-motion:flip-exit', 'ds-motion:flip', 'ds-motion:flip']);
  });

  it('dismissWithExit under reduced motion fades the ghost and moves nothing', () => {
    const { items } = list();
    const a = items[0]!;
    dismissWithExit(a, 'reduced', () => a.remove());
    s.flush();
    const played = s.take();
    expect(played.map((p) => p.options.id)).toEqual(['ds-motion:flip-exit']);
    expect(played[0]!.keyframes.every((k) => k.transform === undefined)).toBe(true);
  });

  it('dismissWithExit plays nothing when the consumer keeps the element, or in mode none', () => {
    const { items } = list();
    dismissWithExit(items[0]!, 'full', () => undefined);
    s.flush();
    expect(s.take()).toEqual([]);
    let closed = false;
    dismissWithExit(items[0]!, 'none', () => (closed = true));
    expect(closed).toBe(true);
    expect(s.take()).toEqual([]);
  });

  it('FlipList pops the new item in, ghosts the removed one, and moves the rest', () => {
    const { root, items } = list();
    const flip = new FlipList();
    const movers = (r: HTMLElement) => [...r.querySelectorAll('p:not([inert])')];
    flip.measure(movers(root));
    items[0]!.remove();
    const added = document.createElement('p');
    root.append(added);
    s.flush();
    flip.play(root, movers, 'full');
    const ids = s.take().map((p) => [p.target === added ? 'new' : p.target.hasAttribute('inert') ? 'ghost' : (p.target as HTMLElement).id, p.options.id]);
    expect(ids).toEqual([
      ['ghost', 'ds-motion:flip-exit'],
      ['b', 'ds-motion:flip'],
      ['c', 'ds-motion:flip'],
      ['new', 'ds-motion:flip'],
    ]);
  });

  it('FlipList under reduced motion only fades the new item in', () => {
    const { root } = list();
    const flip = new FlipList();
    const movers = (r: HTMLElement) => [...r.querySelectorAll('p:not([inert])')];
    flip.measure(movers(root));
    const added = document.createElement('p');
    root.prepend(added);
    flip.play(root, movers, 'reduced');
    const played = s.take();
    expect(played.map((p) => p.target)).toEqual([added]);
    expect(played[0]!.keyframes.every((k) => k.transform === undefined)).toBe(true);
  });

  it('DigitRoller records first, rolls a change, and changes in place inside the window', () => {
    const host = document.createElement('span');
    host.textContent = '9';
    const roller = new DigitRoller();
    const rolled: string[] = [];
    roller.update(host, '9', 'full', 9, (d) => rolled.push(d));
    expect(s.take()).toEqual([]);
    roller.update(host, '10', 'full', 10, (d) => rolled.push(d));
    expect(rolled).toEqual(['up']);
    expect(s.take().some((p) => p.options.id === 'ds-motion:digit-roll')).toBe(true);
    roller.update(host, '11', 'full', 11, (d) => rolled.push(d));
    expect(rolled).toEqual(['up']);
    expect(s.take()).toEqual([]);
    expect(host.textContent).toBe('11');
  });

  it('popMark and Celebrate pop once per completion, never on a first paint at max, and not when reduced', () => {
    const el = document.createElement('span');
    const done = new Celebrate();
    expect(done.update(el, true, 'full')).toBeNull();
    done.update(el, false, 'full');
    done.update(el, true, 'full');
    const [call] = s.take();
    expect(call!.options.id).toBe('ds-motion:pop-mark');
    expect(call!.keyframes.map((k) => k.transform)).toEqual(['none', 'scale(1, var(--ds-scale-anticipate))', 'scale(1, var(--ds-scale-pop))', 'none']);
    expect(popMark(el, 'reduced')).toBeNull();
  });

  it('watchStackShift plays the flip of each toast the stack moved (shiftToast, snappy)', async () => {
    const viewport = document.createElement('ol');
    document.body.append(viewport);
    const tops = new Map<Element, number>();
    const toast = (top: number) => {
      const li = document.createElement('li');
      li.setAttribute('data-ds', 'toast');
      Object.defineProperty(li, 'offsetTop', { configurable: true, get: () => tops.get(li) ?? 0 });
      tops.set(li, top);
      return li;
    };
    const first = toast(0);
    viewport.append(first);
    const stop = watchStackShift(viewport, (el, from, to) => shiftToast(el, from, to, 'full'));
    tops.set(first, 60);
    viewport.append(toast(0));
    await Promise.resolve();
    const played = s.take();
    expect(played.map((p) => [p.target, p.options.id])).toEqual([[first, 'ds-motion:flip']]);
    expect(played[0]!.keyframes[0]!.transform).toBe('translate(0px, -60px)');
    stop();
  });
});
