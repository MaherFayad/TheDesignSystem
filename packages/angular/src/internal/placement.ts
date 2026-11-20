// Where the bars of a phone shell sit (order DU1 for React, DU7 for
// Angular, docs/plan/reset-duo.md section 4, option a). The twin of
// packages/react/src/components/PageShell/placement.ts, shared by PageShell,
// TabBar and Navbar.
//
// - auto: CSS decides from a container query on the PageShell root
//   (container name ds-shell). Nothing is measured, so the server render and
//   the first client render match. auto stamps no attribute.
// - bottom: the bars stay at the top and the bottom in every size.
// - side: the bars form the column at the inline end in every size.
//
// A bar with no placement of its own takes the nearest PageShell's, which
// provides DS_BAR_PLACEMENT. Its own input wins, `auto` included.
import { InjectionToken, inject, type Signal } from '@angular/core';

/** Where the bars sit: CSS decides (auto), always at the bottom, or always in a side column. */
export type BarPlacement = 'auto' | 'bottom' | 'side';

/** The placement of the nearest PageShell, as a signal. Absent outside a PageShell. */
export const DS_BAR_PLACEMENT = new InjectionToken<Signal<BarPlacement>>('DS_BAR_PLACEMENT');

/** The inherited placement: the nearest PageShell's, or null outside one. Call in an injection context. */
export function injectInheritedPlacement(): Signal<BarPlacement> | null {
  return inject(DS_BAR_PLACEMENT, { optional: true });
}

/** The placement a bar uses: its own value, else the inherited one, else auto. */
export function resolvePlacement(own: BarPlacement | undefined, inherited: Signal<BarPlacement> | null): BarPlacement {
  return own ?? inherited?.() ?? 'auto';
}

/** The value of data-placement: absent for auto, so the server render carries nothing CSS must undo. */
export function placementAttr(placement: BarPlacement): 'bottom' | 'side' | null {
  return placement === 'auto' ? null : placement;
}
