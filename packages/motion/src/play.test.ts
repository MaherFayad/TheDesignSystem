// The web helper against a fake Animation that behaves like the browser on
// the points that matter: cancel rejects the current `finished` promise and
// puts a new pending one in its place, and the play state turns idle.
import { describe, expect, it } from 'vitest';
import { settled } from './core';

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

import { vi } from 'vitest';
import { catalog } from './catalog';
import * as core from './core';

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
