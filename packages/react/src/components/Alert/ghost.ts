// Exit ghosts (order 1.22): the way a component that the consumer removes at
// once still shows itself leaving, without delaying the removal.
//
// The consumer owns the removal (an Alert's onClose, a Skeleton swapped for
// its content, an avatar dropped from a group): the element leaves the DOM in
// the same commit, so nothing waits. Just before the next paint, a copy of
// the element (the ghost) is put back where it was drawn, positioned
// absolutely so it takes no space, and it plays its exit on top of the new
// layout: it shrinks and fades (flipExit), or it only fades (a cross fade).
// The elements that stayed move from their old place to the new one on a
// spring (flipPlay), so the neighbours close the gap.
//
// The ghost is decorative: aria-hidden, inert, no ids, no pointer, no CSS
// animation of its own (so it does not play its entrance again). It is
// removed when its exit ends or is cancelled. Nothing waits on animationend.
// Without the Web Animations API (tests, old engines) no ghost is made.
import { flipExit, flipPlay, flipSnapshot, play, rectOf, settled, type FlipSnapshot, type MotionRect, type PatternMode } from '@the-system/motion';

/** Where an element was before it left: its box, its parent and its next sibling. */
export interface LeavingPlace {
  el: Element;
  rect: MotionRect;
  parent: Node | null;
  next: Node | null;
}

/** Records where an element is drawn now. */
export function placeOf(el: Element): LeavingPlace {
  return { el, rect: rectOf(el), parent: el.parentNode, next: el.nextSibling };
}

const canAnimate = (el: Element | null | undefined): el is HTMLElement => Boolean(el && typeof (el as HTMLElement).animate === 'function');

/**
 * Puts a decorative copy of a removed element back where it was drawn, on
 * top of the new layout, into `host` (default its old parent). Null when
 * nothing can be drawn.
 */
export function ghostOf(place: LeavingPlace, host?: Node | null): HTMLElement | null {
  const parent = (host ?? place.parent) as HTMLElement | null;
  if (!parent || !parent.isConnected || !canAnimate(place.el) || place.rect.width <= 0 || place.rect.height <= 0) return null;
  const ghost = place.el.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('id');
  for (const n of ghost.querySelectorAll('[id]')) n.removeAttribute('id');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.setAttribute('inert', '');
  for (const n of [ghost, ...ghost.querySelectorAll<HTMLElement>('*')]) {
    if (n.style) n.style.animation = 'none';
  }
  const s = ghost.style;
  s.position = 'absolute';
  s.margin = '0';
  s.boxSizing = 'border-box';
  s.inlineSize = `${place.rect.width}px`;
  s.blockSize = `${place.rect.height}px`;
  s.pointerEvents = 'none';
  s.zIndex = '1';
  // Physical offsets: the ghost is placed in viewport pixels, in either direction of text.
  s.left = '0px';
  s.top = '0px';
  const next = place.next && place.next.parentNode === parent ? place.next : null;
  parent.insertBefore(ghost, next);
  const at = ghost.getBoundingClientRect();
  s.left = `${place.rect.x - at.x}px`;
  s.top = `${place.rect.y - at.y}px`;
  return ghost;
}

/** Removes the ghost once its exit ends or is cancelled. */
function dropWhenDone(ghost: HTMLElement, animation: Animation | null): void {
  if (!animation) {
    ghost.remove();
    return;
  }
  void settled(animation).then(() => ghost.remove());
}

/** The ghost shrinks to scale.enter and fades, faster than an entrance (flipExit). */
export function shrinkAway(ghost: HTMLElement | null, mode: PatternMode): void {
  if (!ghost) return;
  dropWhenDone(ghost, flipExit(ghost, { mode }));
}

/** The ghost fades out over duration.morph (a cross fade with what took its place). */
export function fadeAway(ghost: HTMLElement | null, mode: PatternMode): void {
  if (!ghost) return;
  if (mode === 'none') {
    ghost.remove();
    return;
  }
  const animation = play(
    ghost,
    { keyframes: [{ opacity: 1 }, { opacity: 0 }], duration: 'duration.morph', easing: 'ease.exit', fill: 'forwards', origin: '50% 50%' },
    'ghost-fade',
  );
  dropWhenDone(ghost, animation);
}

/** The other children of the element's parent, the neighbours that may move when it leaves. */
export function neighboursOf(el: Element): Element[] {
  const parent = el.parentElement;
  return parent ? [...parent.children].filter((c) => c !== el && !c.hasAttribute('inert')) : [];
}

/**
 * Dismiss with an exit: call before the consumer's close callback, with the
 * element. Records the element and its neighbours, runs `close` at once, and
 * just before the next paint, if the element is gone, plays the ghost's
 * shrink and moves the neighbours into the gap. If the consumer kept the
 * element, nothing plays.
 */
export function dismissWithExit(el: Element | null, mode: PatternMode, close: () => void): void {
  if (!el || mode === 'none' || !canAnimate(el) || typeof requestAnimationFrame !== 'function') {
    close();
    return;
  }
  const place = placeOf(el);
  const others = neighboursOf(el);
  const snap: FlipSnapshot = flipSnapshot(others);
  close();
  requestAnimationFrame(() => {
    if (el.isConnected) return;
    shrinkAway(ghostOf(place), mode);
    flipPlay(snap, { items: others.filter((o) => o.isConnected), spring: 'snappy', mode, enter: 'none' });
  });
}
