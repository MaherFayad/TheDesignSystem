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
import { useId, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { Progress } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
import { useTheme } from '../../theme';
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

  return (
    <Progress.Root
      aria-labelledby={label !== undefined && rest['aria-label'] === undefined ? labelId : undefined}
      aria-valuetext={text}
      {...rest}
      ref={ref}
      value={value}
      max={max}
      data-ds="progress-bar"
      data-size={size}
      data-tone={tone}
    >
      {label !== undefined && (
        <span data-part="label" id={labelId}>
          {label}
        </span>
      )}
      {showValue && <span data-part="value">{text}</span>}
      <span data-part="track">
        <Progress.Indicator asChild style={{ '--_progress-bar-fraction': fraction } as CSSProperties}>
          <span data-part="indicator" />
        </Progress.Indicator>
      </span>
    </Progress.Root>
  );
}
