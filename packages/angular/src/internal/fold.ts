// The fold of this window, as a signal (order DU5, the Angular form of
// useFold in packages/react/src/components/Popover/FloatingLayer.tsx).
// Read after the first render in the browser and kept current on resize,
// on the viewport segment media queries and on a device posture change.
// Null on the server, without the viewport segments API and with one
// segment, so nothing changes on any other device.
import { DOCUMENT } from '@angular/common';
import { DestroyRef, afterNextRender, inject, signal, type Signal } from '@angular/core';
import { readFold, sameFold, type Fold } from '@the-system/shared';

/** The fold of this window. Call in an injection context; it listens until that context is destroyed. */
export function injectFold(): Signal<Fold | null> {
  const fold = signal<Fold | null>(null);
  const view = inject(DOCUMENT).defaultView;
  let stop: (() => void) | null = null;
  let destroyed = false;
  afterNextRender(() => {
    if (destroyed || !view) return;
    const update = () => {
      const next = readFold(view);
      if (!sameFold(fold(), next)) fold.set(next);
    };
    update();
    view.addEventListener('resize', update);
    const queries =
      typeof view.matchMedia === 'function'
        ? ['(horizontal-viewport-segments: 2)', '(vertical-viewport-segments: 2)'].map((q) => view.matchMedia(q))
        : [];
    for (const q of queries) q.addEventListener?.('change', update);
    const posture = (view.navigator as Navigator & { devicePosture?: EventTarget }).devicePosture;
    posture?.addEventListener?.('change', update);
    stop = () => {
      view.removeEventListener('resize', update);
      for (const q of queries) q.removeEventListener?.('change', update);
      posture?.removeEventListener?.('change', update);
    };
  });
  inject(DestroyRef).onDestroy(() => {
    destroyed = true;
    stop?.();
  });
  return fold.asReadonly();
}
