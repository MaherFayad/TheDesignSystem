// switch-drag (order 1.23): the thumb follows a pointer drag on the Switch
// control and snaps by velocity and position on release. The Angular wiring
// only: the run (the slop, the rubber band, the progress property, the
// release speed and the snap) is the framework free core in
// @the-system/motion (helpers/switch-drag.ts), one copy for both frameworks
// (order 1.29). This class keeps the pointer events and the `dragging` flag.
//
// While a drag runs, the root carries `data-dragging` (the `dragging` signal)
// and the inline property `--_switch-drag-progress`. A tap is not a drag:
// under the slop the pointer events do nothing and the click toggles as
// before. A drag decides the state on release, so the click that follows it
// is consumed (`consumeClick`). Space and Enter never pass through here.
import { signal, type Signal } from '@angular/core';
import {
  SWALLOW_CLICK_MS,
  beginSwitchDrag,
  clearDragProgress,
  dragOnSide,
  followPointer,
  markReleased,
  pastSlop,
  releaseChecked,
  type SwitchDragRun,
} from '@the-system/motion';

export interface SwitchDragOptions {
  /** The state now. */
  checked: () => boolean;
  /** Disabled or read only: no drag. */
  disabled: () => boolean;
  /** Called once on a release that changes the state. */
  onToggle: (next: boolean) => void;
}

/** The drag of one Switch. Wire its handlers to the control's pointer events. */
export class SwitchDrag {
  private readonly flag = signal(false);
  /** True while the thumb follows the pointer. */
  readonly dragging: Signal<boolean> = this.flag.asReadonly();
  private readonly side = signal(false);
  /**
   * While dragging, true when the thumb is at or past the middle (order 1.29,
   * B4): Switch shows this side as the root's data-state, as React.
   */
  readonly onSide: Signal<boolean> = this.side.asReadonly();
  private run: SwitchDragRun | null = null;
  private swallowUntil = 0;

  constructor(private readonly options: SwitchDragOptions) {}

  pointerDown(e: PointerEvent): void {
    // A new press: the press timing carries the growth and the stretch again (order 1.29, N1).
    if (e.currentTarget instanceof Element) markReleased(e.currentTarget, false);
    this.swallowUntil = 0;
    if (this.options.disabled() || e.defaultPrevented || e.button !== 0 || !e.isPrimary) return;
    const control = e.currentTarget as HTMLElement | null;
    if (!control) return;
    this.run = beginSwitchDrag(control, this.options.checked(), e.pointerId, e.clientX, e.timeStamp);
  }

  pointerMove(e: PointerEvent): void {
    const r = this.run;
    if (!r || e.pointerId !== r.pointerId) return;
    if (!r.moved) {
      if (!pastSlop(r, e.clientX)) return;
      r.moved = true;
      (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
      this.flag.set(true);
    }
    followPointer(r, e.clientX, e.timeStamp);
    // A change only when the thumb crosses the middle.
    this.side.set(dragOnSide(r));
  }

  pointerUp(e: PointerEvent): void {
    // On touch `:active` outlasts the tap: from here the travel keeps the state's spring (N1).
    if (e.currentTarget instanceof Element) markReleased(e.currentTarget, true);
    if (this.run && e.pointerId === this.run.pointerId) this.finish(true, e.timeStamp);
  }

  pointerCancel(e: PointerEvent): void {
    if (e.currentTarget instanceof Element) markReleased(e.currentTarget, true);
    if (this.run && e.pointerId === this.run.pointerId) this.finish(false, e.timeStamp);
  }

  lostPointerCapture(e: PointerEvent): void {
    // Capture is lost after the release too; by then the run is over.
    if (this.run && e.pointerId === this.run.pointerId && this.run.moved) this.finish(false, e.timeStamp);
  }

  /** Space presses the control too: the press timing applies again (N1). */
  keyDown(e: KeyboardEvent): void {
    if (e.currentTarget instanceof Element) markReleased(e.currentTarget, false);
  }

  /** True once for the click that ends a drag: prevent it. */
  consumeClick(): boolean {
    if (this.swallowUntil === 0) return false;
    const hit = performance.now() <= this.swallowUntil;
    this.swallowUntil = 0;
    return hit;
  }

  private finish(commit: boolean, timeStamp: number): void {
    const r = this.run;
    this.run = null;
    if (!r || !r.moved) return;
    clearDragProgress(r);
    this.flag.set(false);
    // The click that ends this drag comes right after the release.
    this.swallowUntil = performance.now() + SWALLOW_CLICK_MS;
    if (!commit) return;
    const next = releaseChecked(r, timeStamp);
    if (next !== this.options.checked()) this.options.onToggle(next);
  }
}
