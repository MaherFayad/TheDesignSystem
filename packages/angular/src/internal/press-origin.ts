// Where a press landed, for a platform that draws a ripple from the touch
// point (packages/css/src/platform/android.css). The twin of
// packages/react/src/components/TabBar/pressOrigin.ts: on pointerdown the
// pressed element gets `--_<name>-press-x` and `--_<name>-press-y`, px from
// its inline start and block start, so the value is right in both
// directions of text. Native listener, no signal: a press costs no change
// detection.

/** Writes the press point of a pointerdown on `el`. */
export function writePressOrigin(el: HTMLElement, event: PointerEvent, name: string): void {
  if (typeof el.getBoundingClientRect !== 'function') return;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return;
  const rtl = typeof getComputedStyle === 'function' && getComputedStyle(el).direction === 'rtl';
  const x = rtl ? r.right - event.clientX : event.clientX - r.left;
  const y = event.clientY - r.top;
  el.style.setProperty(`--_${name}-press-x`, `${Math.round(x)}px`);
  el.style.setProperty(`--_${name}-press-y`, `${Math.round(y)}px`);
}

/** Listens for pointerdown on `el` and writes the press point. Returns the remover. */
export function trackPressOrigin(el: HTMLElement, name: string): () => void {
  const down = (event: PointerEvent) => writePressOrigin(el, event, name);
  el.addEventListener('pointerdown', down);
  return () => el.removeEventListener('pointerdown', down);
}
