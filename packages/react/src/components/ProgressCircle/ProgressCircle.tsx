"use client";
// ProgressCircle: compact progress in a ring, for a file chip, a card corner
// or a table cell.
//
// No source: designed from the dials table (section 3.7 of PLAN.md) and
// ProgressBar, whose behavior, states, tones and formatting it shares.
// Behavior: Radix Progress.
//
// How the ring is drawn: both rings are a round border on a span. The
// indicator ring is cut to the value with a conic gradient mask (the order
// allows a conic mask or two rotated halves; this is the conic mask). No SVG
// stroke and no stroke-dashoffset. A value change swaps the mask at once,
// since only transform and opacity may animate; the indeterminate form turns
// a quarter arc with transform: rotate. The ring fills clockwise in both
// directions, like a clock face, which does not mirror in RTL.
import { type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { Progress } from "radix-ui";
import type { Size, Tone } from "@the-system/shared";
import { useTheme } from "../../theme";
import {
  clampValue,
  formatPercent,
  loadingLabelFor,
  validMax,
} from "../ProgressBar/format";

export type ProgressCircleSize = Extract<Size, "xs" | "sm" | "md" | "lg">;
export type ProgressCircleTone = Extract<
  Tone,
  "accent" | "success" | "warning" | "danger"
>;

export interface ProgressCircleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children" | "role"
> {
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
  size = "md",
  tone = "accent",
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
  const visibleValue =
    (showValue ?? (size === "md" || size === "lg")) && value !== null;

  return (
    <Progress.Root
      aria-label={label}
      aria-valuetext={text}
      {...rest}
      ref={ref}
      value={value}
      max={max}
      data-ds="progress-circle"
      data-size={size}
      data-tone={tone}
    >
      <span data-part="track" />
      <Progress.Indicator
        asChild
        style={{ "--_progress-circle-fraction": fraction } as CSSProperties}
      >
        <span data-part="indicator" />
      </Progress.Indicator>
      {visibleValue && (
        <span data-part="value" aria-hidden="true">
          {text}
        </span>
      )}
    </Progress.Root>
  );
}
