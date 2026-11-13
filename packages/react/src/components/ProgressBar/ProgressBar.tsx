'use client';
// ProgressBar: how far a task has come, or that it runs with no known end.
//
// No source: designed from the dials table (section 3.7 of PLAN.md) and the
// nearest existing pieces (a pill track like Input, tone colors like Toast).
// Behavior: Radix Progress, which renders the progressbar role, the aria
// values and data-state (loading, complete, indeterminate).
//
// The indicator is the full width of the track and scales on the inline axis
// with transform: scaleX(fraction), so only transform animates. Its origin is
// the inline start: the left edge in LTR, the right edge in RTL.
//
// Motion (order 1.22, proposed): progress-spring eases each new value on the
// soft spring (ProgressBar.css); progress-celebrate plays once per
// completion, when the value reaches max after being below it (not on a
// first paint at max): the track dips and pops on the block axis.
import { useId, useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { Progress } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
import { useTheme } from '../../theme';
import { useMotion } from '../../internal/motion';
import { Celebrate } from '@the-system/motion';
import { clampValue, formatPercent, loadingLabelFor, validMax } from './format';

export type ProgressBarSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ProgressBarTone = Extract<Tone, 'accent' | 'success' | 'warning' | 'danger'>;

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'role'> {
  /** Progress from 0 to max. null or undefined is the indeterminate form. Out of range values are clamped. */
  value?: number | null;
  /** The value that means done. Default 100. */
  max?: number;
  /**
   * Visible text above the track that names the task: Uploading files. It
   * labels the progressbar. Without it, pass aria-label.
   */
  label?: ReactNode;
  /** Shows the value text at the end of the label row: 46%, or the loading words while indeterminate. Default true. */
  showValue?: boolean;
  /**
   * Builds the value text from the clamped value and max, for both the
   * visible value and aria-valuetext: (v, max) => `${v} of ${max} files`.
   * Default: a whole percent in the page language with Western digits.
   */
  valueText?: (value: number, max: number) => string;
  /** What the value and aria-valuetext say while indeterminate. Default "Loading", Arabic "جار التحميل" under lang ar. */
  loadingLabel?: string;
  /** Track thickness: sm 4, md 8, lg 12 px. Default md. */
  size?: ProgressBarSize;
  /** Indicator color. accent is the primary mark color of the style. Default accent. */
  tone?: ProgressBarTone;
  ref?: Ref<HTMLDivElement>;
}

/** A labelled bar that fills from the inline start as a task advances. */
export function ProgressBar({
  value: valueProp,
  max: maxProp,
  label,
  showValue = true,
  valueText,
  loadingLabel,
  size = 'md',
  tone = 'accent',
  ref,
  ...rest
}: ProgressBarProps) {
  const { lang } = useTheme();
  const labelId = useId();
  const max = validMax(maxProp, 0, 100);
  const value = clampValue(valueProp, 0, max);
  const busy = loadingLabel ?? loadingLabelFor(lang);
  const text = value === null ? busy : valueText ? valueText(value, max) : formatPercent(value / max, lang);
  const fraction = value === null ? 0 : value / max;
  const hasLabel = label !== undefined && label !== null && label !== false && label !== '';
  const track = useCelebrate<HTMLSpanElement>(value !== null && value >= max);
  if (
    process.env.NODE_ENV !== 'production' &&
    !hasLabel &&
    rest['aria-label'] === undefined &&
    rest['aria-labelledby'] === undefined
  ) {
    console.warn('ProgressBar: no accessible name. Pass label, or aria-label when the bar has no visible text.');
  }

  return (
    <Progress.Root
      aria-labelledby={hasLabel && rest['aria-label'] === undefined ? labelId : undefined}
      aria-valuetext={text}
      {...rest}
      ref={ref}
      value={value}
      max={max}
      data-ds="progress-bar"
      data-size={size}
      data-tone={tone}
    >
      {hasLabel && (
        <span data-part="label" id={labelId}>
          {label}
        </span>
      )}
      {showValue && <span data-part="value">{text}</span>}
      <span data-part="track" ref={track}>
        <Progress.Indicator asChild style={{ '--_progress-bar-fraction': fraction } as CSSProperties}>
          <span data-part="indicator" />
        </Progress.Indicator>
      </span>
    </Progress.Root>
  );
}

/**
 * progress-celebrate: pops the element once each time `done` turns true
 * after the first paint, and sends out one halo (the Celebrate helper of
 * @the-system/motion, helpers/celebrate.ts). Returns its ref. Shared with
 * ProgressCircle.
 */
export function useCelebrate<T extends HTMLElement>(done: boolean, axis: 'both' | 'block' = 'block', halo?: string) {
  const ref = useRef<T>(null);
  const motion = useMotion();
  const mode = motion.mode('progress-celebrate');
  const beat = useRef<Celebrate | null>(null);
  beat.current ??= new Celebrate();
  useLayoutEffect(() => {
    beat.current?.update(ref.current, done, mode, axis, halo);
  }, [done, mode, axis, halo]);
  return ref;
}
