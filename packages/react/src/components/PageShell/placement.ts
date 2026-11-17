'use client';
// Where the bars of a phone shell sit (order DU1, docs/plan/reset-duo.md
// section 4, option a). Shared by PageShell, TabBar and Navbar.
//
// - auto: CSS decides. On `ios`, a container query on the PageShell root
//   (container name ds-shell) puts the bars in a column at the inline end
//   when the shell is wide and short; otherwise they stay at the top and
//   the bottom. Nothing is measured in JavaScript, so the server render and
//   the first client render match. auto stamps no attribute.
// - bottom: the bars stay at the top and the bottom in every size.
//   Stamps data-placement="bottom".
// - side: the bars form the column at the inline end in every size.
//   Stamps data-placement="side".
//
// A TabBar or Navbar with no placement of its own takes the nearest
// PageShell's. Its own prop wins, `auto` included.
import { createContext, use } from 'react';

/** Where the bars sit: CSS decides (auto), always at the bottom, or always in a side column. */
export type BarPlacement = 'auto' | 'bottom' | 'side';

/** The placement of the nearest PageShell. Undefined outside a PageShell. */
export const PlacementContext = createContext<BarPlacement | undefined>(undefined);

/** The placement a bar uses: its own prop, else the nearest PageShell's, else auto. */
export function usePlacement(own: BarPlacement | undefined): BarPlacement {
  const inherited = use(PlacementContext);
  return own ?? inherited ?? 'auto';
}

/** The value of data-placement: absent for auto, so the server render carries nothing CSS must undo. */
export function placementAttr(placement: BarPlacement): 'bottom' | 'side' | undefined {
  return placement === 'auto' ? undefined : placement;
}
