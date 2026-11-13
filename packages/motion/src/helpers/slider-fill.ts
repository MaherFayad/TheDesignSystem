// Slider motion of order 1.23 (slider-fill, slider-rubber-band,
// slider-nudge), one copy for both frameworks (order 1.29): React's
// SliderBase (packages/react/src/components/Slider/Slider.tsx) and Angular's
// (packages/angular/src/components/slider/slider-base.ts) keep the state and
// the timers and call these. The same arithmetic, the same animation ids, the
// same Web Animations calls in both.
//
// - slider-fill: the fill is drawn by the track's ::before with a clip-path
//   from --_slider-from to --_slider-to. While a pointer drags, the fill and
//   the thumb follow the pointer at once. Any other change glides: the fill's
//   clip-path and the thumb's wrapper (a FLIP, composite add on the thumb
//   wrapper's own transform) play from the old place to the new one on the
//   snappy spring.
// - slider-rubber-band: a drag past the minimum or the maximum pulls the
//   outer thumb, and the fill with it, past the end of the track with a
//   resistance that grows with the distance. On release both spring back on
//   the bouncy spring.
// - slider-nudge: a key that pushes a thumb past its end pulls it KEY_BUMP of
//   the way, then lets go.
import { ANIMATION_ID_PREFIX, readDuration, readEasing, type PatternMode } from '../core';

/** slider-nudge: how far a key at the end pulls the thumb, as a share of --_slider-pull-max. */
export const KEY_BUMP = 0.5;

/** The id of the glide of order 1.23 in the registry. */
export const SLIDER_FILL = 'slider-fill';

/** How far a drag (or a key at the end) pulls past each end, 0 to 1. */
export interface SliderPull {
  start: number;
  end: number;
}

export const NO_PULL: SliderPull = { start: 0, end: 0 };

/** The rubber band pull for a pointer `distance` px past the end, 0 to 1: it resists more the further it goes. */
export function sliderRubberBand(distance: number, scale: number): number {
  if (!(distance > 0) || !(scale > 0)) return 0;
  return Math.round((1 - 1 / (1 + distance / scale)) * 1000) / 1000;
}

/** Reads the clip-path of the fill (the track's ::before). Empty where the browser cannot. */
export function fillClip(track: Element | null | undefined): string {
  if (!track || typeof getComputedStyle !== 'function') return '';
  try {
    return getComputedStyle(track, '::before').getPropertyValue('clip-path').trim();
  } catch {
    return '';
  }
}

/** What the glide saw at the last render: the fill clip, the place of each thumb (0 to 1) and whether a pull was on. */
export interface SliderGlideState {
  clip: string;
  places: number[];
  pulled: boolean;
}

/**
 * slider-fill: after each render, when the fill or a thumb moved and the
 * pointer is not dragging, plays the move from where it was drawn. A
 * release from a pull springs back on the bouncy spring, anything else
 * glides on the snappy spring. Reduced motion lands at once. `control` is
 * the control part (the Radix root). Returns the state to pass next time.
 */
export function sliderGlide(
  control: HTMLElement,
  following: boolean,
  places: number[],
  pulled: boolean,
  before: SliderGlideState | null,
  mode: (id: string) => PatternMode,
): SliderGlideState {
  const track = control.querySelector<HTMLElement>(':scope > [data-part="track"]');
  const wrappers = Array.from(control.querySelectorAll<HTMLElement>('[data-part="thumb"]')).map((t) => t.parentElement);
  const id = `${ANIMATION_ID_PREFIX}${SLIDER_FILL}`;
  const glides = (el: Element | null | undefined) => (el?.getAnimations?.({ subtree: true }) ?? []).filter((a) => a.id === id);
  // A glide in flight: the next one starts where the fill is drawn now, then the old one stops.
  const flying = glides(track);
  const live = flying.some((a) => a.playState === 'running') ? fillClip(track) : '';
  for (const a of flying) a.cancel();
  const now: SliderGlideState = { clip: fillClip(track), places, pulled };
  if (following) {
    // A drag took over: a glide still in flight would hold a thumb behind the pointer.
    for (const w of wrappers) for (const a of glides(w)) a.cancel();
    return now;
  }
  if (!before) return now;
  if (mode(SLIDER_FILL) !== 'full') return now;
  // A style turns the glide off with --_slider-glide: 0.
  if (typeof getComputedStyle === 'function' && getComputedStyle(control).getPropertyValue('--_slider-glide').trim() === '0') return now;
  const spring = before.pulled && !pulled ? 'bouncy' : 'snappy';
  const duration = readDuration(control, `duration.spring-${spring}`);
  const easing = readEasing(control, `ease.spring-${spring}`);
  if (!(duration > 0)) return now;
  const fromClip = live || before.clip;
  if (track && fromClip && now.clip && fromClip !== now.clip && typeof track.animate === 'function') {
    try {
      track.animate({ clipPath: [fromClip, now.clip] }, { id, duration, easing, pseudoElement: '::before' });
    } catch {
      /* no pseudo element animation: the fill lands at once */
    }
  }
  wrappers.forEach((w, i) => {
    const from = before.places[i];
    const to = now.places[i];
    if (!w || from === undefined || to === undefined || from === to || typeof w.animate !== 'function') return;
    const vertical = control.getAttribute('data-orientation') === 'vertical';
    // The distance in the track's own px, from the change of the value: a vertical slider grows upward, RTL leftward.
    const length = track ? (vertical ? track.offsetHeight : track.offsetWidth) : 0;
    const sign = vertical || getComputedStyle(control).direction === 'rtl' ? -1 : 1;
    const delta = `${Math.round((from - to) * length * sign * 10) / 10}px`;
    for (const a of glides(w)) a.cancel();
    w.animate(
      { transform: [vertical ? `translateY(${delta})` : `translateX(${delta})`, vertical ? 'translateY(0)' : 'translateX(0)'] },
      { id, duration, easing, composite: 'add' },
    );
  });
  return now;
}

/** The end of a slider: the minimum or the maximum. */
export type SliderEnd = 'start' | 'end';

/** The end a key moves a thumb toward, as Radix reads the keys (horizontal only). */
export function sliderKeyEnd(key: string, dir: 'ltr' | 'rtl'): SliderEnd | null {
  if (key === 'Home' || key === 'PageDown' || key === 'ArrowDown') return 'start';
  if (key === 'End' || key === 'PageUp' || key === 'ArrowUp') return 'end';
  if (key === 'ArrowLeft') return dir === 'rtl' ? 'end' : 'start';
  if (key === 'ArrowRight') return dir === 'rtl' ? 'start' : 'end';
  return null;
}

/** slider-bubble: the least time between two rolls of the bubble, in ms (a behavior gap, not a motion timing). */
export const SLIDER_ROLL_GAP = 120;
