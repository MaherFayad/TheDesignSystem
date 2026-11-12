'use client';
// ProgressCircle: compact progress in a ring, for a file chip, a card corner
// or a table cell.
//
// No source: designed from the dials table (section 3.7 of PLAN.md) and
// ProgressBar, whose behavior, states, tones and formatting it shares.
// Behavior: Radix Progress.
//
// How the ring is drawn: the track is a round border on a span. The
// indicator holds an SVG circle whose stroke is cut to the value with
// stroke-dasharray and stroke-dashoffset (pathLength 100). The
// indeterminate form turns a quarter arc with transform: rotate. The ring
// fills clockwise in both directions, like a clock face, which does not
// mirror in RTL.
//
// Round 3 (order 1.23, proposed): the arc is an SVG circle inside the
// indicator (aria-hidden, part "arc"), drawn with stroke-dashoffset on a
// pathLength of 100, so a value change draws the arc forward or back from
// where it was on the soft spring (a CSS transition), the leading end
// moving and the start staying at 12 o'clock. The turn of round 2 is gone.
// Completion beats once: the ring pops and a halo grows from it and fades.
//
// Motion (order 1.22, proposed). progress-spring: the mask cannot animate,
// so the nearest transform form plays: the new arc starts turned back by the
// change and turns into place on the soft spring, so its leading end sweeps
// forward from the old value (a fall turns the other way), while the value
// inside rolls digit by digit (it is aria-hidden; aria-valuetext reads the
// value). progress-celebrate: reaching max after being below it pops the
// ring once (scale.anticipate, scale.pop, duration.celebrate).
import { type CSSProperties, type HTMLAttributes, type Ref } from 'react';
import { Progress } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
import { useTheme } from '../../theme';
import { clampValue, formatPercent, loadingLabelFor, validMax } from '../ProgressBar/format';
import { useCelebrate } from '../ProgressBar/ProgressBar';
import { useMotion } from '../../internal/motion';
import { useDigitRoll } from '../Stat/useDigitRoll';

export type ProgressCircleSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ProgressCircleTone = Extract<Tone, 'accent' | 'success' | 'warning' | 'danger'>;

export interface ProgressCircleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'role'> {
  /** Progress from 0 to max. null or undefined is the indeterminate form. Out of range values are clamped. */
  value?: number | null;
  /** The value that means done. Default 100. */
  max?: number;
  /** The accessible name: the ring has no room for visible text. "Uploading board-cover.png". Required. */
  label: string;
  /** Shows the value text inside the ring. Default true at md and lg, false at xs and sm (too small to read). */
  showValue?: boolean;
  /** Builds the value text and aria-valuetext from the clamped value and max. Default: a whole percent, Western digits. */
  valueText?: (value: number, max: number) => string;
  /** What aria-valuetext says while indeterminate. Default "Loading", Arabic "جار التحميل" under lang ar. */
  loadingLabel?: string;
  /** Ring diameter: xs 16, sm 24, md 44, lg 68 px at the default density. Default md. */
  size?: ProgressCircleSize;
  /** Indicator color. accent is the primary mark color of the style. Default accent. */
  tone?: ProgressCircleTone;
  ref?: Ref<HTMLDivElement>;
}

/** A ring that fills clockwise as a task advances. */
export function ProgressCircle({
  value: valueProp,
  max: maxProp,
  label,
  showValue,
  valueText,
  loadingLabel,
  size = 'md',
  tone = 'accent',
  ref,
  ...rest
}: ProgressCircleProps) {
  const { lang } = useTheme();
  const max = validMax(maxProp, 0, 100);
  const value = clampValue(valueProp, 0, max);
  const text =
    value === null
      ? (loadingLabel ?? loadingLabelFor(lang))
      : valueText
        ? valueText(value, max)
        : formatPercent(value / max, lang);
  const fraction = value === null ? 0 : value / max;
  const visibleValue = (showValue ?? (size === 'md' || size === 'lg')) && value !== null;
  const motion = useMotion();
  const mode = motion.mode('progress-spring');
  const root = useCelebrate<HTMLDivElement>(value !== null && value >= max, 'both', ':scope > [data-part="indicator"]');
  const valueRef = useDigitRoll<HTMLSpanElement>(visibleValue ? text : undefined, mode, undefined, value ?? undefined);

  return (
    <Progress.Root
      aria-label={label}
      aria-valuetext={text}
      {...rest}
      ref={(node: HTMLDivElement | null) => {
        root.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      }}
      value={value}
      max={max}
      data-ds="progress-circle"
      data-size={size}
      data-tone={tone}
    >
      <span data-part="track" />
      <Progress.Indicator asChild style={{ '--_progress-circle-fraction': fraction } as CSSProperties}>
        <span data-part="indicator">
          <svg data-part="arc" aria-hidden="true" focusable="false">
            <circle pathLength={100} />
          </svg>
        </span>
      </Progress.Indicator>
      {visibleValue && (
        <span data-part="value" aria-hidden="true" ref={valueRef}>
          {text}
        </span>
      )}
    </Progress.Root>
  );
}
