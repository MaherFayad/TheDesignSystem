// The web helper against a fake Animation that behaves like the browser on
// the points that matter: cancel rejects the current `finished` promise and
// puts a new pending one in its place, and the play state turns idle.
import { describe, expect, it, vi } from 'vitest';
import { catalog } from './catalog';
import * as core from './core';
import { settled } from './core';
import { animateWindow } from './window';

/** A fake Animation with the browser's cancel behavior. */
export function fakeAnimation(id = 'ds-motion:dialog') {
  let reject: (e: Error) => void = () => {};
  const pending = () =>
    new Promise<Animation>((_, rej) => {
      reject = rej;
    });
  const a = {
    id,
    playState: 'running' as AnimationPlayState,
    finished: pending(),
    cancel() {
      if (a.playState === 'idle') return;
      a.playState = 'idle';
      reject(new DOMException('cancelled', 'AbortError'));
      a.finished = pending();
    },
  };
  a.finished.catch(() => {});
  return a;
}

/** Resolves to 'settled' or 'pending' after a few ticks. */
async function race(p: Promise<void>): Promise<string> {
  return Promise.race([p.then(() => 'settled'), new Promise<string>((r) => setTimeout(() => r('pending'), 20))]);
}

describe('settled', () => {
  it('resolves when it is taken before a cancel', async () => {
    const a = fakeAnimation();
    const p = settled(a as unknown as Animation);
    a.cancel();
    expect(await race(p)).toBe('settled');
  });

  it('resolves when it is called after a cancel (B1)', async () => {
    const a = fakeAnimation();
    a.cancel();
    expect(await race(settled(a as unknown as Animation))).toBe('settled');
  });
});

// ---------------------------------------------------------------- loops (B3)


/** A fake element whose `animate` returns a fake Animation with timing. */
function loopEl(vars: Record<string, string>) {
  const made: (ReturnType<typeof fakeAnimation> & { iterations: number; pause: () => void; play: () => void })[] = [];
  const el = {
    style: {} as CSSStyleDeclaration,
    getAnimations: () => made,
    animate: vi.fn((_frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      const a = Object.assign(fakeAnimation(String(opts.id)), {
        iterations: Number(opts.iterations ?? 1),
        effect: { getTiming: () => ({ iterations: opts.iterations ?? 1 }) },
        pause() {
          a.playState = 'paused';
        },
        play() {
          a.playState = 'running';
        },
      });
      made.push(a);
      return a as unknown as Animation;
    }),
  };
  vi.stubGlobal('getComputedStyle', () => ({ direction: 'ltr', getPropertyValue: (n: string) => vars[n] ?? '' }));
  return { el: el as unknown as HTMLElement, made, animate: el.animate };
}

describe('loops', () => {
  it('thinking stops before five seconds, counted from the live token', () => {
    const { el, animate } = loopEl({ '--ds-duration-shimmer': '1400ms' });
    catalog.thinking.animate(el, { reduced: false });
    const it1 = animate.mock.calls[0]![1].iterations as number;
    expect(Number.isFinite(it1)).toBe(true);
    expect(it1 * 1400).toBeLessThan(5000);
    catalog.thinking.animate(el, { reduced: false, index: 1 });
    vi.stubGlobal('getComputedStyle', () => ({ direction: 'ltr', getPropertyValue: (n: string) => (n === '--ds-duration-shimmer' ? '2s' : '') }));
    catalog.thinking.animate(el, { reduced: false });
    expect(animate.mock.calls[2]![1].iterations).toBe(2);
    vi.unstubAllGlobals();
  });

  it('the shimmer cap follows a style that slows the shimmer', () => {
    const { el, animate } = loopEl({ '--ds-duration-shimmer': '2s' });
    catalog['skeleton-shimmer'].animate(el, { reduced: false });
    expect(animate.mock.calls[0]![1].iterations).toBe(2);
    vi.unstubAllGlobals();
  });

  it('pauseLoops and resumeLoops pause and play every catalog loop under a root', () => {
    const { el, made } = loopEl({ '--ds-duration-spin': '800ms' });
    catalog.spinner.animate(el, { reduced: false });
    catalog.dialog.animate(el, { reduced: false });
    const root = { getAnimations: (o?: { subtree?: boolean }) => (o?.subtree ? made : []) } as unknown as Element;
    expect(core.pauseLoops(root)).toBe(1);
    expect(made.map((a) => a.playState)).toEqual(['paused', 'running']);
    expect(core.resumeLoops(root)).toBe(1);
    expect(made[0]!.playState).toBe('running');
    vi.unstubAllGlobals();
  });

  it('the spinner native block loops with -1, as Reanimated wants', () => {
    expect(catalog.spinner.native.iterations).toBe(-1);
    expect(catalog.spinner.native.easing).toEqual([0, 0, 1, 1]);
    expect(JSON.parse(JSON.stringify(catalog.thinking.native)).iterations).toBe(3);
  });
});

// ---------------------------------------------------------------- replacing a running animation


interface FakeRun {
  id: string;
  playState: AnimationPlayState;
  fill: FillMode;
  cancel: ReturnType<typeof vi.fn>;
  effect: { getTiming: () => { fill: FillMode; iterations: number } };
}

function runningEl(existing: Omit<FakeRun, 'cancel' | 'effect'>[], live: Record<string, string>) {
  const runs: FakeRun[] = existing.map((r) => {
    const run: FakeRun = {
      ...r,
      cancel: vi.fn(() => {
        run.playState = 'idle';
      }),
      effect: { getTiming: () => ({ fill: r.fill, iterations: 1 }) },
    };
    return run;
  });
  const animate = vi.fn((_frames: Keyframe[], _opts: KeyframeAnimationOptions) => fakeAnimation() as unknown as Animation);
  const el = { style: {} as CSSStyleDeclaration, getAnimations: () => runs, animate } as unknown as HTMLElement;
  // The live frame is what getComputedStyle reads while an animation runs.
  vi.stubGlobal('getComputedStyle', () => ({
    direction: 'ltr',
    getPropertyValue: (n: string) => live[n] ?? ({ '--ds-duration-base': '120ms' } as Record<string, string>)[n] ?? '',
  }));
  return { el, runs, animate };
}

describe('a new animation replaces a running one', () => {
  it('a quick reverse starts from the live frame, not from the first keyframe (N1)', () => {
    const { el, runs, animate } = runningEl([{ id: 'ds-motion:dialog', playState: 'running', fill: 'none' }], {
      opacity: '0.22',
      transform: 'matrix(0.985, 0, 0, 0.985, 0, 3)',
    });
    catalog.dialog.animate(el, { reduced: false, phase: 'exit' });
    expect(runs[0]!.cancel).toHaveBeenCalled();
    const frames = animate.mock.calls[0]![0] as unknown as Keyframe[];
    expect(frames[0]).toEqual({ transform: 'matrix(0.985, 0, 0, 0.985, 0, 3)', opacity: '0.22' });
    expect(frames.at(-1)).toEqual(catalog.dialog.keyframes({ phase: 'exit' }).at(-1));
    vi.unstubAllGlobals();
  });

  it('a release while the press still plays starts from the pressed scale it reached', () => {
    const { el, animate } = runningEl([{ id: 'ds-motion:press', playState: 'running', fill: 'forwards' }], { transform: 'matrix(0.99, 0, 0, 0.99, 0, 0)' });
    catalog.press.animate(el, { reduced: false, phase: 'exit' });
    expect((animate.mock.calls[0]![0] as unknown as Keyframe[])[0]).toEqual({ transform: 'matrix(0.99, 0, 0, 0.99, 0, 0)' });
    vi.unstubAllGlobals();
  });

  it('a held exit of another pattern does not hide a later enter (N2)', () => {
    const { el, runs, animate } = runningEl(
      [
        { id: 'ds-motion:fade-rise', playState: 'finished', fill: 'forwards' },
        { id: 'ds-motion:spinner', playState: 'running', fill: 'none' },
      ],
      {},
    );
    catalog.dialog.animate(el, { reduced: false });
    expect(runs[0]!.cancel).toHaveBeenCalled();
    expect(runs[1]!.cancel).not.toHaveBeenCalled();
    // The held exit was finished, so the enter starts from its own first frame.
    expect(animate.mock.calls[0]![0]).toEqual(catalog.dialog.keyframes());
    vi.unstubAllGlobals();
  });

  it('a window pattern replaces only window motion, and names its Animation (N17)', () => {
    const { el, runs, animate } = runningEl(
      [
        { id: 'ds-motion:window-grow', playState: 'finished', fill: 'none' },
        { id: 'ds-motion:spinner', playState: 'running', fill: 'none' },
      ],
      { '--ds-duration-window-close': '220ms' },
    );
    animateWindow(el, 'close', { reduced: false });
    expect(runs[0]!.cancel).toHaveBeenCalled();
    expect(runs[1]!.cancel).not.toHaveBeenCalled();
    expect(animate).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ id: 'ds-motion:window-close', duration: 220, fill: 'forwards' }));
    vi.unstubAllGlobals();
  });

  it('sets transform-box fill-box on an SVG element, so the origin is the element box (N8)', () => {
    class FakeSvg {}
    vi.stubGlobal('SVGElement', FakeSvg);
    const { el } = runningEl([], {});
    Object.setPrototypeOf(el, FakeSvg.prototype);
    catalog['chart-draw'].animate(el, { reduced: false });
    expect((el as unknown as HTMLElement).style.transformBox).toBe('fill-box');
    expect((el as unknown as HTMLElement).style.transformOrigin).toBe('0 50%');
    vi.unstubAllGlobals();
  });
});
