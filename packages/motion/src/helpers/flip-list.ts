// Add, remove and reorder with FLIP (order 1.22), shared by AvatarGroup and
// NotificationCenter. One copy for both frameworks (order 1.29): React's
// useFlipList (packages/react/src/components/AvatarGroup/useFlipList.ts)
// measures in the render that changes the items and plays after the commit;
// Angular measures in an effect before the template refresh and plays after
// the render. Both call the two halves here.
//
// - items that stayed travel from their old box to the new one on a spring
//   (flipPlay), so the neighbours make room or close the gap;
// - new items pop in from scale.enter on the bouncy spring, one stagger step
//   apart (flipPlay's enter);
// - items that left come back as a ghost (./exit-ghost) that shrinks and
//   fades on its own, faster than an entrance, while the gap closes under it.
// The DOM is final from the first frame: nothing waits and nothing holds the
// state. Mode none plays nothing; reduced fades the new items in.
import type { PatternMode } from '../core';
import { flipPlay, flipSnapshot, type FlipSnapshot } from '../primitives/flip';
import type { MotionSpring } from '../primitives/shared';
import { ghostOf, placeOf, shrinkAway, type LeavingPlace } from './exit-ghost';

export interface FlipListOptions {
  /** The spring of the move. Default snappy. */
  spring?: MotionSpring;
  /** How a new item enters. Default pop. */
  enter?: 'pop' | 'fade' | 'none';
}

/**
 * Add, remove and reorder with FLIP. `measure` records the items while the
 * old ones are still drawn (before the DOM changes); `play` runs after the
 * DOM changed, before the paint: the items that stayed travel from their old
 * box, new ones pop in, and the ones that left come back as a ghost that
 * shrinks away. Mode none plays nothing; reduced fades the new items in.
 */
export class FlipList {
  private before: { snap: FlipSnapshot; places: LeavingPlace[] } | null = null;

  measure(items: Element[]): void {
    this.before = { snap: flipSnapshot(items), places: items.map(placeOf) };
  }

  play(root: HTMLElement | null | undefined, items: (root: HTMLElement) => Element[], mode: PatternMode, options: FlipListOptions = {}): Animation[] {
    const b = this.before;
    this.before = null;
    if (!b || !root || mode === 'none' || typeof root.animate !== 'function') return [];
    for (const place of b.places) {
      if (place.el.isConnected) continue;
      const parent = place.parent && (place.parent as Node).isConnected ? place.parent : root;
      shrinkAway(ghostOf(place, parent), mode);
    }
    return flipPlay(b.snap, { items: items(root), mode, spring: options.spring ?? 'snappy', enter: options.enter ?? 'pop' });
  }
}
