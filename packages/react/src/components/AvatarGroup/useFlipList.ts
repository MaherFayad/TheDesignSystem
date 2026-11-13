'use client';
// Add, remove and reorder with FLIP (order 1.22), shared by AvatarGroup and
// NotificationCenter. The measure and the play are the FlipList helper of
// @the-system/motion (helpers/flip-list.ts), one copy for both frameworks;
// this hook only times them for React.
//
// The list's items are measured in the render that changes them (before
// React commits, so the boxes are the ones on the screen, a move still in
// flight included). After the commit, before the paint, FlipList plays: the
// items that stayed travel, new ones pop in, and the ones that left come
// back as a ghost that shrinks away. The DOM is final from the first frame:
// nothing waits and nothing holds the state. Mode none plays nothing;
// reduced fades the new items in.
import { useLayoutEffect, useRef } from 'react';
import { FlipList, type FlipListOptions, type PatternMode } from '@the-system/motion';

export type { FlipListOptions };

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
  const list = useRef<FlipList | null>(null);
  list.current ??= new FlipList();
  const measured = useRef<string | null>(null);
  // Render phase: measure once per new signature, while the old items are still drawn.
  if (ref.current && signature !== committed.current && measured.current !== signature) {
    list.current.measure(items(ref.current));
    measured.current = signature;
  }
  useLayoutEffect(() => {
    if (committed.current === signature) return;
    committed.current = signature;
    measured.current = null;
    list.current?.play(ref.current, items as (root: HTMLElement) => Element[], mode, options);
    // items is a selector the caller defines inline; the signature is what changes.
  }, [signature, mode]);
  return ref;
}
