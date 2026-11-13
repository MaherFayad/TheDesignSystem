'use client';
// The React hooks of the shared sliding indicator of the navigation family
// (order 1.22, interaction round 2, proposed): Tabs, SegmentedControl,
// ToggleGroup, Navbar, Sidebar, Rail, Pagination, Stepper and the hover pill
// of Breadcrumbs.
//
// The slide, the boxes, the track and the small answers (labels that dip
// and pop, an icon that pops, an arrow that winds up, a label that rolls)
// are the indicator helper of @the-system/motion (helpers/indicator.ts), one
// copy for both frameworks. This file keeps the hooks that hold a track for
// the life of a component, run an effect when a flag turns on, and start the
// hover pill on a root.
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { activated, createTrack, hoverFollow, type HoverFollowOptions, type IndicatorTrack } from '@the-system/motion';

/** A track kept for the life of a component. */
export function useIndicatorTrack(): IndicatorTrack {
  const ref = useRef<IndicatorTrack | null>(null);
  if (!ref.current) ref.current = createTrack();
  return ref.current;
}

/** Runs `effect` after a commit where `active` turned from false to true (never on the first paint). */
export function useActivated(active: boolean, effect: () => void): void {
  const run = useRef(effect);
  run.current = effect;
  const runner = useRef<((active: boolean) => void) | null>(null);
  runner.current ??= activated(() => run.current());
  useLayoutEffect(() => {
    runner.current?.(active);
  }, [active]);
}

/**
 * A hover pill that follows the pointer from item to item (`hoverFollow`):
 * when the pointer enters an item within a short beat (duration.slow) of
 * leaving another, the new item's pill slides from the old one, stretching
 * along the way. CSS fades each pill in and out; this only moves it. Touch
 * does nothing. The options are read at each pointer move.
 */
export function useHoverFollow(rootRef: RefObject<Element | null>, opts: HoverFollowOptions): void {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return hoverFollow(root, () => optsRef.current);
  }, [rootRef]);
}
