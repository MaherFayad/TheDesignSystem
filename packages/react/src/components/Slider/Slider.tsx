'use client';
// Motion. slider-pull (pattern press, Slider.css): the thumb lifts a little
// while it is grabbed and settles on release, a CSS transition on the
// thumb's transform. slider-nudge (pattern shake, one swing toward the end):
// when a key pushes a thumb past the minimum or the maximum, the thumb
// nudges toward that end and back once, played through useMotion().play and
// added on top of the lift (composite add). A held key nudges once, not on
// every repeat.
//
// Order 1.23 (proposed):
// - slider-fill: the fill is drawn by the track's ::before with a clip-path
//   from --_slider-from to --_slider-to, set here on the root. While a
//   pointer drags, the fill and the thumb follow the pointer at once. Any
//   other change (a key, a press on the track, a new controlled value) glides:
//   the fill's clip-path and the thumb's wrapper (a FLIP, composite add on
//   Radix's own transform) play from the old place to the new one on the
//   snappy spring.
// - slider-rubber-band: a drag past the minimum or the maximum pulls the
//   outer thumb, and the fill with it, past the end of the track with a
//   resistance that grows with the distance (--_slider-pull-start and
//   --_slider-pull-end, 0 to 1, times --_slider-pull-max). On release both
//   spring back on the bouncy spring.
// Nothing waits: the value changes, and the drag follows the pointer, at
// once. A vertical slider does not nudge or pull: both move on the inline
// axis only.
import { Fragment, useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type PointerEvent, type ReactNode, type Ref } from 'react';
import { Slider as RadixSlider } from 'radix-ui';
import { renderDigits, rollDigits, type PatternMode } from '@the-system/motion';
import type { Size, Tone } from '@the-system/shared';
import { ANIMATION_ID_PREFIX, readDuration, readEasing } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';
import { formatSliderValue } from './format';

export type SliderSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type SliderTone = Extract<Tone, 'accent'>;
export type SliderOrientation = 'horizontal' | 'vertical';

/** A tick under the track at a value, with optional text. */
export interface SliderMark {
  value: number;
  label?: ReactNode;
}

type RadixRootProps = ComponentProps<typeof RadixSlider.Root>;

/** Props Slider and RangeSlider share. */
export interface SliderBaseProps
  extends Omit<
    RadixRootProps,
    'className' | 'style' | 'children' | 'title' | 'asChild' | 'ref' | 'value' | 'defaultValue' | 'onValueChange' | 'onValueCommit' | 'dir' | 'inverted'
  > {
  /** Track thickness and thumb size. The thumb is always at least a 24px target. Default md. */
  size?: SliderSize;
  /** The range fill and the thumb. Only accent. */
  tone?: SliderTone;
  /** Visible name above the track. Names the thumb through aria-labelledby. */
  label?: ReactNode;
  /** Shows the formatted value at the inline end of the label row. Default true when there is a label. */
  showValue?: boolean;
  /** A unit after the number, in the value text and aria-valuetext: %, px, SAR. */
  unit?: string;
  /** Intl.NumberFormat options for the value text. Digits are always Western. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Full control of the value text, aria-valuetext included. */
  formatValue?: (value: number) => string;
  /** Ticks under the track. Numbers, or objects with a label. Horizontal only: a vertical slider shows none. */
  marks?: readonly (number | SliderMark)[];
  /** Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

interface BaseInternals {
  kind: 'slider' | 'range-slider';
  value: number[] | undefined;
  defaultValue: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  /** The accessible name of each thumb when there is no visible label, or to tell thumbs apart. */
  thumbLabels: (string | undefined)[];
  /** data-thumb on each thumb, for RangeSlider. */
  thumbIds?: string[];
  thumbRef?: Ref<HTMLSpanElement>;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

type SliderEnd = 'start' | 'end';

/** The end a key moves a thumb toward, as Radix reads the keys (horizontal only). */
function keyEnd(key: string, dir: 'ltr' | 'rtl'): SliderEnd | null {
  if (key === 'Home' || key === 'PageDown' || key === 'ArrowDown') return 'start';
  if (key === 'End' || key === 'PageUp' || key === 'ArrowUp') return 'end';
  if (key === 'ArrowLeft') return dir === 'rtl' ? 'end' : 'start';
  if (key === 'ArrowRight') return dir === 'rtl' ? 'start' : 'end';
  return null;
}

/**
 * slider-nudge: plays the shake pattern, one swing toward `end`, on a thumb
 * that cannot go further. Returns a function to call with the thumb.
 */
function useEndNudge() {
  const motion = useMotion();
  const busyUntil = useRef(0);
  return (thumb: Element | null | undefined, end: SliderEnd) => {
    const now = typeof performance === 'undefined' ? Date.now() : performance.now();
    if (!thumb || now < busyUntil.current) return;
    const nudge = motion.play(thumb, 'shake', 'slider-nudge', { swings: 1, toward: end });
    if (!nudge) return;
    // Added to the lift of a grabbed thumb instead of replacing it.
    if (nudge.effect && 'composite' in nudge.effect) (nudge.effect as KeyframeEffect).composite = 'add';
    const duration = nudge.effect?.getTiming().duration;
    busyUntil.current = now + (typeof duration === 'number' ? duration : 0);
  };
}

/**
 * slider-bubble: keeps the decorative value bubble of each thumb in step
 * with the value. While a pointer holds the slider the digits roll (up when
 * the value grows); otherwise they are written still, since the bubble is
 * hidden. Returns the ref callback for the bubble of thumb `i`.
 */
/** The least time between two rolls of the bubble, in ms (a behavior gap, not a motion timing). */
const ROLL_GAP = 120;

function useValueBubbles(values: number[], texts: string[], dragging: boolean) {
  const motion = useMotion();
  const hosts = useRef<(HTMLSpanElement | null)[]>([]);
  const shown = useRef<{ value: number; text: string }[]>([]);
  const lastRoll = useRef(-Infinity);
  useLayoutEffect(() => {
    values.forEach((value, i) => {
      const host = hosts.current[i];
      const text = texts[i] ?? '';
      if (!host) return;
      const last = shown.current[i];
      shown.current[i] = { value, text };
      if (last && last.text === text && host.childElementCount > 0) return;
      // A fast drag changes the value every frame: a roll starts at most once per ROLL_GAP, the steps between are written still.
      const now = typeof performance === 'undefined' ? Date.now() : performance.now();
      if (!last || !dragging || now - lastRoll.current < ROLL_GAP) {
        renderDigits(host, text);
        return;
      }
      lastRoll.current = now;
      rollDigits(host, last.text, text, { direction: value < last.value ? 'down' : 'up', mode: motion.mode('slider-bubble') });
    });
  });
  return (i: number) => (el: HTMLSpanElement | null) => {
    hosts.current[i] = el;
  };
}

/** The id of the glide of order 1.23 in the registry. */
export const SLIDER_FILL = 'slider-fill';

/** The rubber band pull for a pointer `distance` px past the end, 0 to 1: it resists more the further it goes. */
export function rubberBand(distance: number, scale: number): number {
  if (!(distance > 0) || !(scale > 0)) return 0;
  return Math.round((1 - 1 / (1 + distance / scale)) * 1000) / 1000;
}

/** Reads the clip-path of the fill (the track's ::before). Empty where the browser cannot. */
function fillClip(track: Element | null | undefined): string {
  if (!track || typeof getComputedStyle !== 'function') return '';
  try {
    return getComputedStyle(track, '::before').getPropertyValue('clip-path').trim();
  } catch {
    return '';
  }
}

/**
 * slider-fill: after each render, when the fill or a thumb moved and the
 * pointer is not dragging, plays the move from where it was drawn. A
 * release from a pull springs back on the bouncy spring, anything else
 * glides on the snappy spring. Reduced motion lands at once.
 */
function useGlide(
  control: { current: HTMLSpanElement | null },
  following: { current: boolean },
  fractions: number[],
  pulled: boolean,
  mode: (id: string) => PatternMode,
) {
  const last = useRef<{ clip: string; places: number[]; pulled: boolean } | null>(null);
  useLayoutEffect(() => {
    const root = control.current;
    if (!root) return;
    const track = root.querySelector<HTMLElement>(':scope > [data-part="track"]');
    const wrappers = Array.from(root.querySelectorAll<HTMLElement>('[data-part="thumb"]')).map((t) => t.parentElement);
    const id = `${ANIMATION_ID_PREFIX}${SLIDER_FILL}`;
    const glides = (el: Element | null | undefined) => (el?.getAnimations?.({ subtree: true }) ?? []).filter((a) => a.id === id);
    // A glide in flight: the next one starts where the fill is drawn now, then the old one stops.
    const flying = glides(track);
    const live = flying.some((a) => a.playState === 'running') ? fillClip(track) : '';
    for (const a of flying) a.cancel();
    const now = { clip: fillClip(track), places: fractions, pulled };
    const before = last.current;
    last.current = now;
    if (following.current) {
      // A drag took over: a glide still in flight would hold a thumb behind the pointer.
      for (const w of wrappers) for (const a of glides(w)) a.cancel();
      return;
    }
    if (!before) return;
    const m = mode(SLIDER_FILL);
    if (m !== 'full') return;
    const spring = before.pulled && !pulled ? 'bouncy' : 'snappy';
    const duration = readDuration(root, `duration.spring-${spring}`);
    const easing = readEasing(root, `ease.spring-${spring}`);
    if (!(duration > 0)) return;
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
      const vertical = root.getAttribute('data-orientation') === 'vertical';
      // The distance in the track's own px, from the change of the value: a vertical slider grows upward, RTL leftward.
      const length = track ? (vertical ? track.offsetHeight : track.offsetWidth) : 0;
      const sign = vertical || getComputedStyle(root).direction === 'rtl' ? -1 : 1;
      const delta = `${Math.round((from - to) * length * sign * 10) / 10}px`;
      for (const a of glides(w)) a.cancel();
      w.animate({ transform: [vertical ? `translateY(${delta})` : `translateX(${delta})`, vertical ? 'translateY(0)' : 'translateX(0)'] }, { id, duration, easing, composite: 'add' });
    });
  });
}

function toMark(mark: number | SliderMark): SliderMark {
  return typeof mark === 'number' ? { value: mark } : mark;
}

/**
 * The shared body of Slider and RangeSlider: a label row (label and value),
 * the Radix slider as the control (track, range, thumbs) and optional marks.
 */
export function SliderBase({
  kind,
  size = 'md',
  tone = 'accent',
  label,
  showValue,
  unit,
  formatOptions,
  formatValue,
  marks,
  invalid,
  disabled,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'horizontal',
  className,
  style,
  rootProps,
  id,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  thumbLabels,
  thumbIds,
  thumbRef,
  ariaLabel,
  ariaLabelledBy,
  'aria-describedby': describedBy,
  onPointerDown,
  onLostPointerCapture,
  onKeyDown,
  onPointerMove,
  minStepsBetweenThumbs = 0,
  ...rest
}: SliderBaseProps & BaseInternals) {
  const theme = useTheme();
  const field = useField();
  const labelId = useId();
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled });
  const [own, setOwn] = useState<number[]>(defaultValue);
  const [dragging, setDragging] = useState(false);
  const values = valueProp ?? own;
  const nudge = useEndNudge();
  const motion = useMotion();
  /** slider-rubber-band: how far a drag pulls past each end, 0 to 1. */
  const [pull, setPull] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  /** True while a pointer drag has moved since it went down: the fill and the thumb follow at once. */
  const following = useRef(false);
  const controlRef = useRef<HTMLSpanElement | null>(null);
  const horizontal = orientation === 'horizontal';
  useGlide(
    controlRef,
    following,
    values.map((v) => (v - min) / (max - min || 1)),
    pull.start > 0 || pull.end > 0,
    motion.mode,
  );
  const release = () => {
    setDragging(false);
    following.current = false;
    setPull((p) => (p.start === 0 && p.end === 0 ? p : { start: 0, end: 0 }));
  };

  /** The thumb that has focus in this slider, and its index. */
  const focusedThumb = (control: Element): [Element, number] | null => {
    const thumbs = Array.from(control.querySelectorAll('[data-part="thumb"]'));
    const i = thumbs.findIndex((t) => t === t.ownerDocument.activeElement);
    const thumb = thumbs[i];
    return thumb ? [thumb, i] : null;
  };

  const format = (v: number) => formatValue?.(v) ?? formatSliderValue(v, theme.lang, { unit, options: formatOptions });
  const hasLabel = label !== undefined && label !== null && label !== false;
  const valueShown = showValue ?? hasLabel;
  const span = max - min || 1;
  const fraction = (v: number) => Math.min(1, Math.max(0, (v - min) / span));
  const fillFrom = values.length > 1 ? fraction(values[0] ?? min) : 0;
  const fillTo = fraction(values[values.length - 1] ?? min);
  const bubble = useValueBubbles(values, values.map(format), dragging);

  const onChange = (next: number[]) => {
    if (valueProp === undefined) setOwn(next);
    onValueChange?.(next);
  };

  return (
    <div
      {...rootProps}
      className={className}
      style={
        {
          ...style,
          '--_slider-from': fillFrom,
          '--_slider-to': fillTo,
          '--_slider-pull-start': pull.start,
          '--_slider-pull-end': pull.end,
        } as CSSProperties
      }
      role={values.length > 1 && hasLabel ? 'group' : undefined}
      aria-labelledby={values.length > 1 && hasLabel ? labelId : undefined}
      data-ds={kind}
      data-size={size}
      data-tone={tone}
      data-orientation={orientation}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
    >
      {hasLabel && (
        <span id={labelId} data-part="label">
          {label}
        </span>
      )}
      {valueShown && (
        <output data-part="value" aria-hidden="true">
          {values.map((v, i) => (
            // Each value keeps its own direction: 200 SAR stays in order on an Arabic page.
            <Fragment key={i}>
              {i > 0 && ' - '}
              <bdi>{format(v)}</bdi>
            </Fragment>
          ))}
        </output>
      )}
      <RadixSlider.Root
        {...rest}
        ref={controlRef}
        data-part="control"
        dir={theme.dir}
        min={min}
        max={max}
        step={step}
        orientation={orientation}
        disabled={control.disabled}
        value={values}
        onValueChange={onChange}
        onValueCommit={(next) => {
          release();
          onValueCommit?.(next);
        }}
        minStepsBetweenThumbs={minStepsBetweenThumbs}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // slider-nudge: a key that pushes a thumb past the minimum or the maximum.
          const end = horizontal && !event.repeat && !control.disabled ? keyEnd(event.key, theme.dir) : null;
          const found = end ? focusedThumb(event.currentTarget) : null;
          if (end && found && values[found[1]] === (end === 'start' ? min : max)) nudge(found[0], end);
          // Radix sends Home to the start thumb and End to the end thumb, whichever has focus.
          // With two thumbs, move the focused one as far as the other allows instead.
          if (event.defaultPrevented || values.length < 2 || (event.key !== 'Home' && event.key !== 'End')) return;
          const index = (event.target as HTMLElement).getAttribute('data-thumb') === 'end' ? 1 : 0;
          const gap = minStepsBetweenThumbs * step;
          const next = [...values];
          if (index === 0) next[0] = event.key === 'Home' ? min : (values[1] ?? max) - gap;
          else next[1] = event.key === 'Home' ? (values[0] ?? min) + gap : max;
          event.preventDefault();
          if (next[index] === values[index]) return;
          onChange(next);
          onValueCommit?.(next);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          following.current = false;
          if (!control.disabled) setDragging(true);
        }}
        onLostPointerCapture={(event) => {
          onLostPointerCapture?.(event);
          release();
        }}
        onPointerMove={(event: PointerEvent<HTMLSpanElement>) => {
          onPointerMove?.(event);
          if (!dragging) return;
          // From the first move of a drag, the fill and the thumb follow the pointer with no glide.
          following.current = true;
          if (!horizontal) return;
          // slider-rubber-band: the pointer went past the start or the end of the track.
          const track = event.currentTarget.querySelector('[data-part="track"]')?.getBoundingClientRect();
          if (!track) return;
          const beforeLeft = Math.max(0, track.left - event.clientX);
          const pastRight = Math.max(0, event.clientX - track.right);
          const end: SliderEnd | null = beforeLeft > 0 || pastRight > 0 ? (beforeLeft > 0 === (theme.dir === 'rtl') ? 'end' : 'start') : null;
          const found = end ? focusedThumb(event.currentTarget) : null;
          // Only the outer thumb of that end: the start thumb of a range stops at the end thumb, not at the maximum.
          const outer = Boolean(end && found && found[1] === (end === 'start' ? 0 : values.length - 1));
          // The resistance scale is the thumb's own target, so a larger slider pulls further.
          const scale = found?.[0] instanceof HTMLElement ? found[0].offsetWidth : 0;
          const amount = outer ? rubberBand(Math.max(beforeLeft, pastRight), scale) : 0;
          const next = { start: end === 'start' ? amount : 0, end: end === 'end' ? amount : 0 };
          setPull((p) => (p.start === next.start && p.end === next.end ? p : next));
        }}
      >
        <RadixSlider.Track data-part="track">
          <RadixSlider.Range data-part="range" />
        </RadixSlider.Track>
        {values.map((v, i) => {
          const thumbLabel = thumbLabels[i];
          // Name order: the thumb's own label, aria-labelledby, the visible label, aria-label, then a Field label.
          const fieldLabel = !ariaLabel ? field?.labelId : undefined;
          const labelledBy = thumbLabel ? undefined : (ariaLabelledBy ?? (hasLabel ? labelId : fieldLabel));
          return (
            <RadixSlider.Thumb
              key={thumbIds?.[i] ?? i}
              ref={i === 0 ? thumbRef : undefined}
              id={i === 0 ? control.id : undefined}
              data-part="thumb"
              data-thumb={thumbIds?.[i]}
              aria-label={thumbLabel ?? (labelledBy ? undefined : ariaLabel)}
              aria-labelledby={labelledBy}
              aria-valuetext={format(v)}
              aria-describedby={control['aria-describedby']}
              aria-invalid={control['aria-invalid']}
            >
              {/* The value bubble (slider-bubble): decorative, the thumb carries the value. */}
              <span aria-hidden="true" ref={bubble(i)} />
            </RadixSlider.Thumb>
          );
        })}
      </RadixSlider.Root>
      {marks && marks.length > 0 && orientation === 'horizontal' && (
        <div data-part="marks" aria-hidden="true">
          {marks.map(toMark).map((mark) => (
            <span
              key={mark.value}
              data-mark=""
              style={{ '--_slider-mark-at': `${((mark.value - min) / span) * 100}%` } as CSSProperties}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export interface SliderProps extends SliderBaseProps {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled starting value. Default min. */
  defaultValue?: number;
  /** Called on every change, while dragging too. */
  onValueChange?: (value: number) => void;
  /** Called once when a drag ends or a key changes the value. Save here. */
  onValueCommit?: (value: number) => void;
  /** The accessible name when there is no visible label. */
  'aria-label'?: string;
  /** Goes to the thumb, the element with role slider. */
  ref?: Ref<HTMLSpanElement>;
}

/**
 * One value on a range. Behavior from Radix Slider: the thumb has role
 * slider; arrows move by one step (in the reading direction in right to
 * left text), PageUp and PageDown by ten steps, Home and End to the ends.
 * Every drag has this key path (WCAG 2.5.7).
 *
 * aria-valuetext carries the formatted value with its unit, so a screen
 * reader says "40%", not "40".
 */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ref,
  ...rest
}: SliderProps) {
  return (
    <SliderBase
      {...rest}
      kind="slider"
      min={min}
      value={value === undefined ? undefined : [value]}
      defaultValue={[defaultValue ?? min]}
      onValueChange={onValueChange ? (v) => onValueChange(v[0] ?? min) : undefined}
      onValueCommit={onValueCommit ? (v) => onValueCommit(v[0] ?? min) : undefined}
      thumbLabels={[undefined]}
      thumbRef={ref}
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
    />
  );
}
