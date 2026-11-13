// Motion helpers of the feedback family (orders 1.21 and 1.22) that React
// keeps in component files. Framework free: copied so both frameworks call
// the same @the-system/motion functions with the same arguments. Lead
// changes would move each one into packages/motion:
//
// - the exit ghost: packages/react/src/components/Alert/ghost.ts
// - the stack shift: packages/react/src/components/Toast/stackShift.ts
// - the digit roll and the pop: packages/react/src/components/Stat/useDigitRoll.ts
//   (the hook state is a small class here, `DigitRoller`)
// - the completion beat: useCelebrate and haloBurst of
//   packages/react/src/components/ProgressBar/ProgressBar.tsx (`Celebrate`)
// - the FLIP list: packages/react/src/components/AvatarGroup/useFlipList.ts
//   (the measure and the play are split, `FlipList`, since Angular measures
//   in an effect before the template refresh and plays after the render)
//
// Nothing here waits on transitionend or animationend: a ghost is removed
// when `settled()` of its exit resolves.
import {
  flipExit,
  flipPlay,
  flipSnapshot,
  play,
  rectOf,
  renderDigits,
  rollDigits,
  rollDirection,
  settled,
  type FlipSnapshot,
  type MotionRect,
  type MotionSpring,
  type PatternMode,
} from '@the-system/motion';

// ------------------------------------------------------------------ exit ghost (Alert/ghost.ts)

/** Where an element was before it left: its box, its parent and its next sibling. */
export interface LeavingPlace {
  el: Element;
  rect: MotionRect;
  parent: Node | null;
  next: Node | null;
}

/**
 * Records where an element is drawn now. The next sibling is the next
 * element: Angular puts a comment anchor after a block's element, which
 * leaves with it, so the ghost lands before the same element as in React.
 */
export function placeOf(el: Element): LeavingPlace {
  return { el, rect: rectOf(el), parent: el.parentNode, next: el.nextElementSibling };
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
  // Round 3 (review B1), as React: reduced motion drops the ghost at once.
  if (mode !== 'full') {
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
 * Dismiss with an exit: call instead of the consumer's close callback, with
 * the element. Records the element and its neighbours, runs `close` at
 * once, and just before the next paint, if the element is gone, plays the
 * ghost's shrink and moves the neighbours into the gap. If the consumer kept
 * the element, nothing plays. Angular's zoneless scheduler renders the
 * removal before this frame callback runs (its own frame callback is
 * registered first, or its timer fires first).
 */
export function dismissWithExit(el: Element | null, mode: PatternMode, close: () => void): void {
  // Round 3 (review B1), as React: reduced motion is checked here, not left to tokens: no ghost, no slide.
  if (!el || mode !== 'full' || !canAnimate(el) || typeof requestAnimationFrame !== 'function') {
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

// ------------------------------------------------------------------ toast stack shift (Toast/stackShift.ts)

/** Plays the shift of one toast from `from` to `to` (its new box). Returns the Animation, or null. */
export type ShiftPlayer = (el: HTMLElement, from: MotionRect, to: MotionRect) => Animation | null;

const TOASTS = ':scope > [data-ds="toast"]';

/** The block offset a running transform gives an element now, in px. 0 when there is none. */
export function liveOffsetY(el: Element): number {
  if (typeof getComputedStyle !== 'function') return 0;
  const t = getComputedStyle(el).transform;
  const m = /^matrix(3d)?\(([^)]+)\)$/.exec(t ?? '');
  if (!m) return 0;
  const values = (m[2] ?? '').split(',').map((v) => Number.parseFloat(v));
  const y = m[1] ? values[13] : values[5];
  return Number.isFinite(y) ? (y as number) : 0;
}

/** Where each toast of the viewport sits on the block axis, in viewport px, transforms left out. */
function measure(viewport: HTMLElement): Map<HTMLElement, number> {
  const top = viewport.getBoundingClientRect().top;
  const out = new Map<HTMLElement, number>();
  for (const el of viewport.querySelectorAll<HTMLElement>(TOASTS)) out.set(el, top + el.offsetTop);
  return out;
}

/**
 * Watches a toaster viewport and plays `play` on each toast that the
 * arrival or the departure of another toast moved. A shift that is still
 * running when the stack changes again starts from where the toast is drawn.
 * Returns the function that stops watching.
 */
export function watchStackShift(viewport: HTMLElement, play: ShiftPlayer): () => void {
  if (typeof MutationObserver === 'undefined') return () => undefined;
  let last = measure(viewport);
  const running = new WeakMap<HTMLElement, Animation>();

  const mutations = new MutationObserver(() => {
    const now = measure(viewport);
    for (const [el, y] of now) {
      const before = last.get(el);
      if (before === undefined || before === y) continue;
      let carry = 0;
      const prev = running.get(el);
      if (prev && (prev.playState === 'running' || prev.playState === 'paused')) {
        carry = liveOffsetY(el);
        prev.cancel();
      }
      const box = { width: el.offsetWidth, height: el.offsetHeight };
      const animation = play(el, { x: 0, y: before + carry - y, ...box }, { x: 0, y: 0, ...box });
      if (animation) running.set(el, animation);
      else running.delete(el);
    }
    last = now;
  });
  mutations.observe(viewport, { childList: true });

  const resizes =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          last = measure(viewport);
        });
  resizes?.observe(viewport);

  return () => {
    mutations.disconnect();
    resizes?.disconnect();
  };
}

/** The Toaster's player: the flip primitive on the snappy spring, as React's Toaster plays it. */
export function shiftToast(el: HTMLElement, from: MotionRect, to: MotionRect, mode: PatternMode): Animation | null {
  const now = rectOf(el);
  const snap = { rects: new Map([[el as Element, { ...now, y: now.y + from.y - to.y }]]) };
  const [animation] = flipPlay(snap, { items: [el], spring: 'snappy', enter: 'none', mode });
  // The shift does not scale, so its origin does not matter; the toast's own exit scales from its center.
  el.style.removeProperty('transform-origin');
  return animation ?? null;
}

// ------------------------------------------------------------------ digit roll and pop (Stat/useDigitRoll.ts)

/** The shortest time between two rolls of one number: three a second at most (WCAG 2.3.1). */
export const ROLL_WINDOW_MS = 333;

/**
 * The state of useDigitRoll for one host. Call `update` after each render
 * with the text the host shows (undefined when the host is not rendered).
 * The first call only records. A change less than ROLL_WINDOW_MS after the
 * last roll changes in place; mode none writes the text at once.
 */
export class DigitRoller {
  private previous: string | undefined;
  private previousValue: number | undefined;
  private busyUntil = 0;
  private started = false;

  update<T extends HTMLElement>(
    host: T | null | undefined,
    text: string | undefined,
    mode: PatternMode,
    value?: number,
    onRoll?: (direction: 'up' | 'down', host: T) => void,
  ): void {
    const before = this.started ? this.previous : undefined;
    const beforeValue = this.previousValue;
    this.started = true;
    this.previous = text;
    this.previousValue = value;
    if (!host || text === undefined || before === undefined || before === text) return;
    const now = typeof performance === 'undefined' ? Date.now() : performance.now();
    if (now < this.busyUntil || mode === 'none') {
      renderDigits(host, text);
      return;
    }
    const direction = value !== undefined && beforeValue !== undefined ? (value < beforeValue ? 'down' : 'up') : rollDirection(before, text);
    const animations = rollDigits(host, before, text, { mode, direction });
    const longest = Math.max(
      0,
      ...animations.map((a) => {
        const t = a.effect?.getTiming();
        return (Number(t?.delay) || 0) + (Number(t?.duration) || 0);
      }),
    );
    this.busyUntil = animations.length > 0 ? now + Math.max(ROLL_WINDOW_MS, longest) : 0;
    if (animations.length > 0) onRoll?.(direction, host);
  }
}

/**
 * A pop for a mark that changed (a count, a finished ring): it dips to
 * scale.anticipate, grows past rest to scale.pop and settles, over
 * duration.celebrate. Reduced and none: nothing. Returns the animation or null.
 */
export function popMark(el: Element | null | undefined, mode: PatternMode, axis: 'both' | 'block' = 'both'): Animation | null {
  if (!el || mode !== 'full') return null;
  const s = (name: string) => (axis === 'both' ? `scale(var(--ds-scale-${name}))` : `scale(1, var(--ds-scale-${name}))`);
  return play(
    el,
    {
      keyframes: [
        { transform: 'none' },
        { transform: s('anticipate'), offset: 0.2 },
        { transform: s('pop'), offset: 0.55 },
        { transform: 'none' },
      ],
      duration: 'duration.celebrate',
      easing: 'ease.out',
      fill: 'none',
      origin: '50% 50%',
    },
    'pop-mark',
  );
}

/**
 * progress-celebrate: the state of useCelebrate for one element. `update`
 * pops the element once each time `done` turns true after the first call,
 * and (round 3) sends out one halo from the element, or from its descendant
 * that `halo` selects (ProgressCircle: its indicator).
 */
export class Celebrate {
  private was: boolean | undefined;

  update(el: Element | null | undefined, done: boolean, mode: PatternMode, axis: 'both' | 'block' = 'block', halo?: string): Animation | null {
    const before = this.was ?? done;
    this.was = done;
    if (!done || before) return null;
    const pop = popMark(el, mode, axis);
    const ring = halo ? el?.querySelector(halo) : el;
    haloBurst(ring, mode);
    return pop;
  }
}

/**
 * Round 3 (ProgressBar.tsx haloBurst): the completion beat's halo. A
 * box-shadow ring in the fill color grows from the element by
 * distance.shift and fades, once, over duration.celebrate on ease.out. Full
 * mode only.
 */
export function haloBurst(el: Element | null | undefined, mode: PatternMode): Animation | null {
  if (!el || mode !== 'full') return null;
  return play(
    el,
    {
      keyframes: [
        { boxShadow: '0 0 0 0 var(--_progress-bar-fill, var(--_progress-circle-fill))' },
        { boxShadow: '0 0 0 var(--ds-distance-shift) transparent' },
      ],
      duration: 'duration.celebrate',
      easing: 'ease.out',
      fill: 'none',
      origin: '50% 50%',
    },
    'progress-halo',
  );
}

// ------------------------------------------------------------------ FLIP list (AvatarGroup/useFlipList.ts)

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
