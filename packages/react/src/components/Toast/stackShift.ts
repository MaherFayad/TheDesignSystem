// The stack shift of interaction "toast-stack" (order 1.21). When a toast
// joins or leaves the toaster, the toasts that stay jump to their new place
// in the layout at once; this moves them there with a transform played from
// where they were (a FLIP), so nothing animates layout and nothing waits.
//
// A MutationObserver on the viewport sees every toast that is added or
// removed, Radix's own unmount after an exit included. Its callback runs
// before the next paint, so the jump is never drawn. A ResizeObserver keeps
// the positions fresh when a toast grows or shrinks in place (an update),
// without playing anything. The new toast plays its own CSS enter
// (Toast.css), so it is skipped here.
import type { MotionRect } from '@the-system/motion';

/** Plays the shift of one toast from `from` to `to` (its new box). Returns the Animation, or null. */
export type ShiftPlayer = (el: HTMLElement, from: MotionRect, to: MotionRect) => Animation | null;

const TOASTS = ':scope > [data-ds="toast"]';

/** The block offset a running transform gives an element now, in px. 0 when there is none. */
export function liveOffsetY(el: Element): number {
  if (typeof getComputedStyle !== 'function') return 0;
  const t = getComputedStyle(el).transform;
  const m = /^matrix(3d)?\(([^)]+)\)$/.exec(t ?? '');
  if (!m) return 0;
  const values = (m[2] ?? '').split(',').map((v) => Number.parseFloat(v));
  const y = m[1] ? values[13] : values[5];
  return Number.isFinite(y) ? (y as number) : 0;
}

/** Where each toast of the viewport sits on the block axis, in viewport px, transforms left out. */
function measure(viewport: HTMLElement): Map<HTMLElement, number> {
  const top = viewport.getBoundingClientRect().top;
  const out = new Map<HTMLElement, number>();
  for (const el of viewport.querySelectorAll<HTMLElement>(TOASTS)) out.set(el, top + el.offsetTop);
  return out;
}

/**
 * Watches a toaster viewport and plays `play` on each toast that the
 * arrival or the departure of another toast moved. A shift that is still
 * running when the stack changes again starts from where the toast is drawn.
 * Returns the function that stops watching.
 */
export function watchStackShift(viewport: HTMLElement, play: ShiftPlayer): () => void {
  if (typeof MutationObserver === 'undefined') return () => undefined;
  let last = measure(viewport);
  const running = new WeakMap<HTMLElement, Animation>();

  const mutations = new MutationObserver(() => {
    const now = measure(viewport);
    for (const [el, y] of now) {
      const before = last.get(el);
      if (before === undefined || before === y) continue;
      let carry = 0;
      const prev = running.get(el);
      if (prev && (prev.playState === 'running' || prev.playState === 'paused')) {
        carry = liveOffsetY(el);
        prev.cancel();
      }
      const box = { width: el.offsetWidth, height: el.offsetHeight };
      const animation = play(el, { x: 0, y: before + carry - y, ...box }, { x: 0, y: 0, ...box });
      if (animation) running.set(el, animation);
      else running.delete(el);
    }
    last = now;
  });
  mutations.observe(viewport, { childList: true });

  const resizes =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          last = measure(viewport);
        });
  resizes?.observe(viewport);

  return () => {
    mutations.disconnect();
    resizes?.disconnect();
  };
}
