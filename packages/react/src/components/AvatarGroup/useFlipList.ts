'use client';
// Add, remove and reorder with FLIP (order 1.22), shared by AvatarGroup and
// NotificationCenter.
//
// The list's items are measured in the render that changes them (before
// React commits, so the boxes are the ones on the screen, a move still in
// flight included). After the commit, before the paint:
// - items that stayed travel from their old box to the new one on a spring
//   (flipPlay), so the neighbours make room or close the gap;
// - new items pop in from scale.enter on the bouncy spring, one stagger step
//   apart (flipPlay's enter);
// - items that left come back as a ghost (./ghost in Alert) that shrinks and
//   fades on its own, faster than an entrance, while the gap closes under it.
// The DOM is final from the first frame: nothing waits and nothing holds the
// state. Mode none plays nothing; reduced fades the new items in.
import { useLayoutEffect, useRef } from 'react';
import { flipPlay, flipSnapshot, type FlipSnapshot, type MotionSpring, type PatternMode } from '@the-system/motion';
import { ghostOf, placeOf, shrinkAway, type LeavingPlace } from '../Alert/ghost';

interface Before {
  signature: string;
  snap: FlipSnapshot;
  places: LeavingPlace[];
}

export interface FlipListOptions {
  /** The spring of the move. Default snappy. */
  spring?: MotionSpring;
  /** How a new item enters. Default pop. */
  enter?: 'pop' | 'fade' | 'none';
}

/**
 * Returns the ref for the list's root. `items(root)` lists the elements that
 * move; `signature` changes whenever the items change (their keys, joined).
 */
export function useFlipList<T extends HTMLElement>(
  items: (root: T) => Element[],
  signature: string,
  mode: PatternMode,
  options: FlipListOptions = {},
) {
  const ref = useRef<T>(null);
  const committed = useRef(signature);
  const before = useRef<Before | null>(null);
  // Render phase: measure once per new signature, while the old items are still drawn.
  if (ref.current && signature !== committed.current && before.current?.signature !== signature) {
    const els = items(ref.current);
    before.current = { signature, snap: flipSnapshot(els), places: els.map(placeOf) };
  }
  useLayoutEffect(() => {
    if (committed.current === signature) return;
    committed.current = signature;
    const b = before.current;
    before.current = null;
    const root = ref.current;
    if (!b || !root || mode === 'none' || typeof root.animate !== 'function') return;
    for (const place of b.places) {
      if (place.el.isConnected) continue;
      const parent = place.parent && (place.parent as Node).isConnected ? place.parent : root;
      shrinkAway(ghostOf(place, parent), mode);
    }
    flipPlay(b.snap, { items: items(root), mode, spring: options.spring ?? 'snappy', enter: options.enter ?? 'pop' });
    // items is a selector the caller defines inline; the signature is what changes.
  }, [signature, mode]);
  return ref;
}
