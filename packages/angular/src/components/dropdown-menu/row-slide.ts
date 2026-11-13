// Interaction "menu-row-slide" (order 1.22, proposed): the twin of
// slideHighlight and useRowSlide in
// packages/react/src/components/DropdownMenu/menuShared.tsx, with the same
// keyframes, timing and reduced motion. Not exported from the package
// barrel: the menu layer (dropdown-menu.ts) wires it to focus events, so
// every menu built on that layer (DropdownMenu, its submenus, SplitButton,
// FilterBar) gets it.
import { ANIMATION_ID_PREFIX, readDuration, readEasing, type PatternMode } from '@the-system/motion';

/** The id of the row highlight slide (interaction "menu-row-slide"). */
export const ROW_SLIDE_ID = 'menu-row-slide';

/** The rows a highlight slides between: menu items and the Menubar titles. */
const ROW_SELECTOR = `[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [data-part='trigger']`;

/** The row an event target is, or null. */
function rowOf(target: EventTarget | null): Element | null {
  return target instanceof Element && target.matches(ROW_SELECTOR) ? target : null;
}

/** The transform of an element's ::after as drawn now, a running slide included: x, y and the scale. */
function drawnAfter(el: Element): { x: number; y: number; sx: number; sy: number } {
  const id = { x: 0, y: 0, sx: 1, sy: 1 };
  if (typeof getComputedStyle !== 'function' || typeof DOMMatrixReadOnly === 'undefined') return id;
  const t = getComputedStyle(el, '::after').transform;
  if (!t || t === 'none') return id;
  try {
    const m = new DOMMatrixReadOnly(t);
    return { x: m.e, y: m.f, sx: m.a, sy: m.d };
  } catch {
    return id;
  }
}

/**
 * The lit fill of a row is its ::after (the hover veil, DropdownMenu.css).
 * When the highlight moves from one row to the next, the new row's fill
 * starts over the old one (where it is drawn, so a slide still in flight
 * hands over from where it is) and travels to its own row on the snappy
 * spring. The highlight state itself changes at once: only the decorative
 * fill moves. Reduced and none: no slide. Returns the Animation, or null.
 */
export function slideHighlight(from: Element | null | undefined, to: Element, mode: PatternMode): Animation | null {
  if (mode !== 'full' || !from || from === to || !from.isConnected || typeof to.animate !== 'function') return null;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (b.width < 1 || b.height < 1) return null;
  const drawn = drawnAfter(from);
  const dx = a.left + drawn.x - b.left;
  const dy = a.top + drawn.y - b.top;
  const sx = (a.width * drawn.sx) / b.width;
  const sy = (a.height * drawn.sy) / b.height;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return null;
  const duration = readDuration(to, 'duration.spring-snappy');
  if (duration <= 0) return null;
  const id = `${ANIMATION_ID_PREFIX}${ROW_SLIDE_ID}`;
  for (const anim of to.getAnimations?.({ subtree: true } as GetAnimationsOptions) ?? []) if (String(anim.id) === id) anim.cancel();
  const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  return to.animate([{ transform: `translate(${r(dx)}px, ${r(dy)}px) scale(${r(sx, 4)}, ${r(sy, 4)})` }, { transform: 'none' }], {
    id,
    duration,
    easing: readEasing(to, 'ease.spring-snappy'),
    pseudoElement: '::after',
  });
}

/**
 * Focus handlers for a layer that holds menus: when the highlight (focus
 * moves with it, for the pointer and the arrow keys) goes from one row to
 * another of the same menu, the fill slides. A short hop over a separator
 * or the menu padding, where focus rests on the menu for a moment, still
 * slides: the last row is kept for two settle times of the snappy spring.
 * Bind `focusin` and `focusout` of the layer to them.
 */
export function rowSlide(mode: () => PatternMode): { focusin: (event: FocusEvent) => void; focusout: (event: FocusEvent) => void } {
  let last: { row: Element; at: number } | null = null;
  const focusin = (event: FocusEvent) => {
    const to = rowOf(event.target);
    if (!to) return;
    const group = to.closest('[role="menu"], [role="menubar"]');
    let from = rowOf(event.relatedTarget);
    if (!from) {
      const recent = last && performance.now() - last.at < 2 * readDuration(to, 'duration.spring-snappy');
      from = recent && last ? last.row : null;
    }
    if (from && from.closest('[role="menu"], [role="menubar"]') === group) slideHighlight(from, to, mode());
    last = { row: to, at: performance.now() };
  };
  const focusout = (event: FocusEvent) => {
    const row = rowOf(event.target);
    if (row) last = { row, at: performance.now() };
  };
  return { focusin, focusout };
}
