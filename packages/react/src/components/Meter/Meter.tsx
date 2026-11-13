'use client';
// Meter: a measured value in a known range, such as storage used or a score.
// Not a task: progress goes to ProgressBar.
//
// Source: GoBanana admin `RunSignals.tsx` (`.adm-meter`) was not reachable in
// this session; designed from ProgressBar, whose track and indicator it
// shares in look, and the HTML meter element, whose thresholds it copies.
// Behavior: hand built, role meter.
//
// The level (low, medium, high) comes from the low and high thresholds and
// sits in data-level, in the visible value text and in aria-valuetext, so it
// is never only a color. The tone follows the optimum.
//
// Motion (order 1.22, interaction meter-fill, proposed): the fill plays from
// the inline start to the value once, the first time the meter is seen: at
// once when it is on screen at mount, else when an IntersectionObserver sees
// it enter the viewport. Until then an inline scaleX(0) holds the fill empty
// (set before the first paint, so a meter in view never flashes full). A
// value change before that cancels it. Reduced and none: the value at once.
import { useId, useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { meterLevel, meterLevelLabelsFor, meterTone, type MeterLevel, type MeterTone, type Size } from '@the-system/shared';
import { landValue } from '@the-system/motion';
import { useTheme } from '../../theme';
import { useMotion } from '../../internal/motion';
import { formatPercent, validMax } from '../ProgressBar/format';

export type MeterSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type { MeterLevel, MeterTone };

export interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'role'> {
  /** The measured value. Clamped into [min, max]. */
  value: number;
  /** Default 0. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** The top of the low region, as in the HTML meter. Default: no low region. */
  low?: number;
  /** The bottom of the high region. Default: no high region. */
  high?: number;
  /** The best value. Sets the tone: success in its region, warning one region away, danger two away. */
  optimum?: number;
  /** Visible text that names the measure: Storage used. It labels the meter. Without it, pass aria-label. */
  label?: ReactNode;
  /**
   * Builds the value text from the clamped value, min and max: (v) => `${v} GB of 100 GB`.
   * Default: a whole percent of the range with Western digits.
   */
  valueText?: (value: number, min: number, max: number) => string;
  /** Words for each level, shown after the value and read in aria-valuetext: { high: 'Almost full' }. Default Low, Medium, High (Arabic under lang ar). */
  levelLabels?: Partial<Record<MeterLevel, string>>;
  /** Shows the level word after the value. Default true when low or high is set. aria-valuetext keeps the word whenever low or high is set. */
  showLevel?: boolean;
  /** Overrides the tone the thresholds give. Prefer thresholds. */
  tone?: MeterTone;
  /** Track thickness: sm 4, md 8, lg 12 px. Default md. */
  size?: MeterSize;
  ref?: Ref<HTMLDivElement>;
}

/** A bar that shows where a value sits in its range, with its level in words. */
export function Meter({
  value: valueProp,
  min = 0,
  max: maxProp,
  low,
  high,
  optimum,
  label,
  valueText,
  levelLabels,
  showLevel,
  tone: toneProp,
  size = 'md',
  ref,
  ...rest
}: MeterProps) {
  const { lang } = useTheme();
  const labelId = useId();
  const max = validMax(maxProp, min, min + 100);
  const value = Number.isFinite(valueProp) ? Math.min(max, Math.max(min, valueProp)) : min;
  const range = { min, max, low, high, optimum };
  const level = meterLevel(value, range);
  const tone = toneProp ?? meterTone(value, range);
  const fraction = (value - min) / (max - min);
  const amount = valueText ? valueText(value, min, max) : formatPercent(fraction, lang);
  const levelWord = { ...meterLevelLabelsFor(lang), ...levelLabels }[level];
  const withLevel = showLevel ?? (low !== undefined || high !== undefined);
  // The comma follows the script of the level word, not the page: an English value on an Arabic page keeps a Latin comma.
  const spoken = `${amount}${/[\u0600-\u06FF]/.test(levelWord) ? '، ' : ', '}${levelWord}`;
  // aria-valuetext always says the level when there are thresholds, so hiding the word never leaves it to color alone for a screen reader.
  const hasRegions = low !== undefined || high !== undefined;
  const text = withLevel ? spoken : amount;
  const ariaText = withLevel || hasRegions ? spoken : amount;
  const hasLabel = label !== undefined && label !== null && label !== false && label !== '';
  const indicator = useFillOnView(fraction);

  return (
    <div
      role="meter"
      aria-labelledby={hasLabel && rest['aria-label'] === undefined ? labelId : undefined}
      aria-valuetext={ariaText}
      {...rest}
      ref={ref}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      data-ds="meter"
      data-size={size}
      data-tone={tone}
      data-level={level}
    >
      {hasLabel && (
        <span data-part="label" id={labelId}>
          {label}
        </span>
      )}
      <span data-part="value">{text}</span>
      <span data-part="track">
        <span data-part="indicator" ref={indicator} style={{ '--_meter-fraction': fraction } as CSSProperties} />
      </span>
    </div>
  );
}

/**
 * meter-fill: fills the indicator once on first view. Returns its ref.
 *
 * The hold is the indicator's `data-held` attribute, set before the first
 * paint; Meter.css draws it empty with no transition, and print draws the
 * value (review N33: never an inline transform that outlives the view). On
 * view the attribute goes and `data-revealing` comes, so the fill plays on
 * --_meter-reveal-duration and --_meter-reveal-ease, a style's own timing.
 * `data-revealing` stays until the next value change, which drops it in a
 * layout effect before the browser styles the change, so that change uses
 * the CSS timing. No timer: a longer reveal is never cut, and a StrictMode
 * rerun leaves nothing behind (angular-sync-3 section 6 item 3). The value
 * text lands with the fill (`landValue`, helpers/meter-value.ts in
 * @the-system/motion, round 3 review N28).
 */
function useFillOnView(fraction: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const motion = useMotion();
  const mode = motion.mode('meter-fill');
  const seen = useRef(false);
  const release = useRef<() => void>(() => undefined);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || seen.current || mode !== 'full' || typeof IntersectionObserver === 'undefined') {
      seen.current = true;
      return;
    }
    el.setAttribute('data-held', '');
    const show = (animate: boolean) => {
      seen.current = true;
      observer.disconnect();
      // Flush the held frame, so the change below starts a transition from it.
      void getComputedStyle(el).transform;
      if (animate) el.setAttribute('data-revealing', '');
      el.removeAttribute('data-held');
      if (animate) landValue(el.closest('[data-ds="meter"]')?.querySelector(':scope > [data-part="value"]'), el);
    };
    release.current = () => show(false);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) show(true);
    });
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) show(true);
    else observer.observe(el);
    return () => {
      observer.disconnect();
      if (!seen.current) el.removeAttribute('data-held');
    };
  }, [mode]);
  // A new value: before the first view, show it (the fill is no longer news);
  // after it, the change takes the CSS timing, not the reveal's.
  const first = useRef(fraction);
  useLayoutEffect(() => {
    if (fraction === first.current) return;
    first.current = fraction;
    if (!seen.current) release.current();
    else ref.current?.removeAttribute('data-revealing');
  }, [fraction]);
  return ref;
}
