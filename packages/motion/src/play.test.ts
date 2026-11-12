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
