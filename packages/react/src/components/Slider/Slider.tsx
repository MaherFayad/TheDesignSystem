'use client';
// Motion. slider-pull (pattern press, Slider.css): the thumb lifts a little
// while it is grabbed and settles on release, a CSS transition on the
// thumb's transform. slider-nudge (pattern shake, one swing toward the end):
// when a key or a drag pushes a thumb past the minimum or the maximum, the
// thumb nudges toward that end and back once, played through
// useMotion().play and added on top of the lift (composite add). Neither
// waits on anything: the value changes, and the drag follows the pointer,
// at once. A held key nudges once, not on every repeat. A vertical slider
// does not nudge: the shake pattern moves on the inline axis only.
import { Fragment, useId, useRef, useState, type ComponentProps, type CSSProperties, type PointerEvent, type ReactNode, type Ref } from 'react';
import { Slider as RadixSlider } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
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
  /** The end the pointer went past during this drag, so a drag nudges once per excursion. */
  const pastEnd = useRef<SliderEnd | null>(null);
  const horizontal = orientation === 'horizontal';

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

  const onChange = (next: number[]) => {
    if (valueProp === undefined) setOwn(next);
    onValueChange?.(next);
  };

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
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
          setDragging(false);
          pastEnd.current = null;
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
          if (!control.disabled) setDragging(true);
        }}
        onLostPointerCapture={(event) => {
          onLostPointerCapture?.(event);
          setDragging(false);
          pastEnd.current = null;
        }}
        onPointerMove={(event: PointerEvent<HTMLSpanElement>) => {
          onPointerMove?.(event);
          if (!dragging || !horizontal) return;
          // slider-nudge: the pointer went past the start or the end of the track.
          const track = event.currentTarget.querySelector('[data-part="track"]')?.getBoundingClientRect();
          if (!track) return;
          const beforeLeft = event.clientX < track.left;
          const pastRight = event.clientX > track.right;
          const end: SliderEnd | null = beforeLeft || pastRight ? (beforeLeft === (theme.dir === 'rtl') ? 'end' : 'start') : null;
          if (end === pastEnd.current) return;
          pastEnd.current = end;
          const found = end ? focusedThumb(event.currentTarget) : null;
          // Only the outer thumb of that end: the start thumb of a range stops at the end thumb, not at the maximum.
          if (end && found && found[1] === (end === 'start' ? 0 : values.length - 1)) nudge(found[0], end);
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
            />
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
