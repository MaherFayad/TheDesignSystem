'use client';
// Disabled items of a ToggleGroup or a SegmentedControl stay focusable
// (anatomy rule 5: actions use aria-disabled and keep focus, so a Tooltip
// can say why). Radix is told nothing about them, so its roving focus keeps
// every item in the arrow order. ButtonRoot drops the key handlers of an
// inert item, Radix's included, so this handler on the group root moves
// focus on from a disabled item. Not exported from the package barrel.
import { createContext, use, type KeyboardEvent } from 'react';

/** True when the whole group is disabled. Items read it and turn inert. */
export const GroupDisabledContext = createContext(false);

export function useGroupDisabled(): boolean {
  return use(GroupDisabledContext);
}

const ITEM = ":scope > [data-part='item']";

/** Arrow, Home, End and Shift+Tab from a disabled item: the same moves Radix makes from an enabled one. */
export function moveFromInertItem(
  event: KeyboardEvent<HTMLElement>,
  opts: { orientation: 'horizontal' | 'vertical'; dir: 'ltr' | 'rtl'; loop: boolean },
): void {
  const root = event.currentTarget;
  const target = event.target as HTMLElement;
  if (target.parentElement !== root || target.getAttribute('data-part') !== 'item' || target.getAttribute('aria-disabled') !== 'true') return;
  if (event.key === 'Tab' && event.shiftKey) {
    // Radix's own Shift+Tab handler did not run: take the root out of the tab
    // order for this one move, so focus leaves the group backward.
    const was = root.getAttribute('tabindex');
    root.setAttribute('tabindex', '-1');
    setTimeout(() => {
      if (was === null) root.removeAttribute('tabindex');
      else root.setAttribute('tabindex', was);
    }, 0);
    return;
  }
  const items = Array.from(root.querySelectorAll<HTMLElement>(ITEM));
  const at = items.indexOf(target);
  const forward = opts.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const back = opts.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  let next: number;
  if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = items.length - 1;
  else if ((opts.orientation === 'horizontal' && event.key === forward) || (opts.orientation === 'vertical' && event.key === 'ArrowDown')) next = at + 1;
  else if ((opts.orientation === 'horizontal' && event.key === back) || (opts.orientation === 'vertical' && event.key === 'ArrowUp')) next = at - 1;
  else return;
  if (opts.loop) next = (next + items.length) % items.length;
  const el = items[next];
  if (!el) return;
  event.preventDefault();
  el.focus();
}
