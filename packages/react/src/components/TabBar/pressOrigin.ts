'use client';
// Round 3 (order 1.23): where a press landed, for a platform that draws a
// ripple from the touch point (packages/css/src/platform/android.css). On
// pointerdown the pressed element gets `--_<name>-press-x` and
// `--_<name>-press-y`: px from its inline start and block start, so the
// value is right in both directions of text. The component CSS declares
// both at 50% on the root. Shared by TabBar and Pagination.
import type { PointerEvent } from 'react';

/** Writes the press point of a pointerdown on the element that handles it. */
export function pressOrigin(event: PointerEvent<HTMLElement>, name: string): void {
  const el = event.currentTarget;
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return;
  const rtl = typeof getComputedStyle === 'function' && getComputedStyle(el).direction === 'rtl';
  const x = rtl ? r.right - event.clientX : event.clientX - r.left;
  const y = event.clientY - r.top;
  el.style.setProperty(`--_${name}-press-x`, `${Math.round(x)}px`);
  el.style.setProperty(`--_${name}-press-y`, `${Math.round(y)}px`);
}
