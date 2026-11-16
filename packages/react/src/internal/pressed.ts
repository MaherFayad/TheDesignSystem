'use client';
// Press from touch down (order M4). On touch `:active` shows only after the
// finger lifts in some browsers, so a press drawn on `:active` alone comes
// late on a phone. The pressed element carries `data-pressed` (the same
// flag as the switch, PRESSED_ATTR in @the-system/motion) from pointerdown
// to pointerup, pointercancel, lost capture or pointer leave, and the
// platform CSS reads `:is(:active, [data-pressed])`.
//
// Only the primary button of a primary pointer presses, and never a
// disabled control. A key press keeps `:active` alone. The caller's own
// handlers always run, first. A plain function, not a hook: the flag lives
// on the element, not in React state, so a press costs no render.
import type { PointerEvent, PointerEventHandler } from 'react';
import { PRESSED_ATTR } from '@the-system/motion';

export interface PressHandlers<T extends Element> {
  onPointerDown?: PointerEventHandler<T>;
  onPointerUp?: PointerEventHandler<T>;
  onPointerCancel?: PointerEventHandler<T>;
  onLostPointerCapture?: PointerEventHandler<T>;
  onPointerLeave?: PointerEventHandler<T>;
}

/** Sets or clears the press flag on an element. */
export function markPressedElement(el: Element | null | undefined, pressed: boolean): void {
  el?.toggleAttribute(PRESSED_ATTR, pressed);
}

/**
 * Wraps the caller's pointer handlers so the element that handles them
 * carries `data-pressed` while a primary pointer is down on it. With
 * `disabled` the flag is never set; a release still clears it, so a control
 * that turns disabled mid press (loading after the click) lets go.
 */
export function pressHandlers<T extends Element>(own: PressHandlers<T>, disabled: boolean): Required<PressHandlers<T>> {
  const clear = (handler: PointerEventHandler<T> | undefined) => (event: PointerEvent<T>) => {
    handler?.(event);
    markPressedElement(event.currentTarget, false);
  };
  return {
    onPointerDown: (event: PointerEvent<T>) => {
      own.onPointerDown?.(event);
      if (disabled || event.button !== 0 || !event.isPrimary) return;
      markPressedElement(event.currentTarget, true);
    },
    onPointerUp: clear(own.onPointerUp),
    onPointerCancel: clear(own.onPointerCancel),
    onLostPointerCapture: clear(own.onLostPointerCapture),
    onPointerLeave: clear(own.onPointerLeave),
  };
}
