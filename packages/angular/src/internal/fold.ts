// The fold of this window, as a signal (order DU5, the Angular form of
// useFold in packages/react/src/components/Popover/FloatingLayer.tsx).
// Read after the first render in the browser and kept current on resize,
// on the viewport segment media queries and on a device posture change.
// Null on the server, without the viewport segments API and with one
// segment, so nothing changes on any other device.
import { DOCUMENT } from '@angular/common';
import { DestroyRef, afterNextRender, inject, signal, type Signal } from '@angular/core';
import { foldPadding, paddingOf, readFold, sameFold, type Fold, type PhysicalPadding } from '@the-system/shared';

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

/**
 * The collision padding of a floating overlay with the side column and the
 * fold (order A5, the Angular form of useFoldCollision in React's
 * FloatingLayer.tsx): the safe area at the inline sides, measured with a
 * hidden probe in the layer's theme, and, when the fold is known, the band
 * and the other segment, so the overlay stays in the segment of its anchor.
 * With no fold and no inline inset it returns the caller's padding untouched.
 */
export function foldCollision(node: HTMLElement, anchor: Element | null, base: number | PhysicalPadding): number | PhysicalPadding {
  const view = node.ownerDocument.defaultView;
  if (!view) return base;
  const fold = readFold(view);
  const edges = inlineInsets(node);
  if (!fold && edges.left === 0 && edges.right === 0) return base;
  const r = (anchor ?? node).getBoundingClientRect();
  return foldPadding(fold, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, { width: view.innerWidth, height: view.innerHeight }, paddingOf(base), edges);
}

/** The safe area at the inline sides, in px per physical side. */
function inlineInsets(node: HTMLElement): { left: number; right: number } {
  const host = node.closest<HTMLElement>("[data-ds='theme']") ?? node;
  const probe = node.ownerDocument.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;inline-size:var(--ds-inset-safe-start,0px);block-size:var(--ds-inset-safe-end,0px)';
  host.append(probe);
  const box = probe.getBoundingClientRect();
  probe.remove();
  const rtl = node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl';
  const start = Math.max(0, box.width || 0);
  const end = Math.max(0, box.height || 0);
  return rtl ? { left: end, right: start } : { left: start, right: end };
}
