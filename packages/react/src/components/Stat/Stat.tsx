'use client';
// Stat: one number with its label, its change and a short hint (a KPI).
//
// Source: GoBanana admin `ui.tsx` (`StatTile`). The source repo was not
// reachable in this session, so the layout follows the order's anatomy and
// the dials table: label on top, the value large, the change and the hint on
// one line under it, an optional icon at the end of the label line. No
// surface of its own: put a Stat in a Card or a Tile for a framed tile.
//
// The change is never color alone (WCAG 1.4.1): an arrow icon draws the
// trend and a visually hidden word says it, so a screen reader hears
// "Up 12%".
import { isValidElement, useEffect, useRef, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { useTheme } from '../../theme/hooks';
import { breakableValue, formatStatNumber } from './formatStatNumber';

export type StatSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type StatTone = Extract<Tone, 'success' | 'danger' | 'neutral'>;
export type StatTrend = 'up' | 'down' | 'flat';

/** The trend words a screen reader hears before the change, per language. */
export const statTrendLabels: Record<'en' | 'ar', Record<StatTrend, string>> = {
  en: { up: 'Up', down: 'Down', flat: 'No change' },
  ar: { up: 'ارتفاع', down: 'انخفاض', flat: 'بدون تغيير' },
};

const loadingLabels: Record<'en' | 'ar', string> = { en: 'Loading', ar: 'جار التحميل' };

/** What the value says when there is no number to show: missing, null, NaN or Infinity. */
export const statEmptyLabels: Record<'en' | 'ar', string> = { en: 'No data', ar: 'لا توجد بيانات' };

const trendIcons: Record<StatTrend, IconName> = { up: 'trend-up', down: 'trend-down', flat: 'minus' };

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** What the number counts, in sentence case: Active users, Revenue this month. */
  label: ReactNode;
  /**
   * The number. A number is formatted with Intl in the Theme language, with
   * Western digits and the `format` options. A node is drawn as is.
   */
  value?: number | ReactNode;
  /** Intl.NumberFormat options for a numeric value: currency, unit, compact notation. */
  format?: Intl.NumberFormatOptions;
  /**
   * The change since the last period. A number sets the trend from its
   * sign and is formatted with `deltaFormat` (a percent by default: 0.12 is
   * 12%). A node is drawn as is and needs `trend`.
   */
  delta?: number | ReactNode;
  /** Intl.NumberFormat options for a numeric delta. Default a percent with up to one decimal. */
  deltaFormat?: Intl.NumberFormatOptions;
  /** up, down or flat. Default from the sign of a numeric delta. Sets `data-trend`. */
  trend?: StatTrend;
  /**
   * The color of the change. Default success when up, danger when down,
   * neutral when flat. Pass it when down is good (costs, errors, churn).
   */
  tone?: StatTone;
  /** A short line under the value: Since last month, Target 50,000. */
  hint?: ReactNode;
  /** A glyph for the metric at the end of the label line: a system icon name or a node. Decorative. */
  icon?: IconName | ReactElement;
  /** sm, md or lg: the size of the value. Default md. */
  size?: StatSize;
  /** The value is on its way: draws a placeholder, sets aria-busy and data-loading, hides the change. */
  loading?: boolean;
  /** What screen readers hear while loading. Default Loading, or جار التحميل in Arabic. */
  loadingLabel?: string;
  /**
   * What the value says when there is none to show: undefined, null, NaN or
   * an infinite number. Default No data, or لا توجد بيانات in Arabic. Sets
   * `data-empty`.
   */
  emptyLabel?: string;
  /** Overrides the trend words. Default from `statTrendLabels` in the Theme language. */
  trendLabels?: Partial<Record<StatTrend, string>>;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The trend of a numeric delta as it is shown: a change that rounds to zero
 * in the display format (0.0004 as a percent) is flat, not up 0%.
 */
function trendOf(delta: unknown, trend: StatTrend | undefined, shownZero: (n: number) => boolean): StatTrend | undefined {
  if (trend) return trend;
  if (typeof delta !== 'number' || !Number.isFinite(delta)) return undefined;
  if (delta === 0 || shownZero(delta)) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

const toneOf: Record<StatTrend, StatTone> = { up: 'success', down: 'danger', flat: 'neutral' };

const defaultDeltaFormat: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

/**
 * A KPI: label, value, change, hint. A number rolls in when it changes
 * (stat-roll on the number-roll pattern, a fade under reduced motion). It does not announce changes: a page of KPIs that
 * refresh would talk over everything.
 */
export function Stat({
  label,
  value,
  format,
  delta,
  deltaFormat = defaultDeltaFormat,
  trend: trendProp,
  tone: toneProp,
  hint,
  icon,
  size = 'md',
  loading = false,
  loadingLabel,
  emptyLabel,
  trendLabels,
  ...rest
}: StatProps) {
  const { lang } = useTheme();
  const langKey: 'en' | 'ar' = lang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const trend = trendOf(delta, trendProp, (n) => formatStatNumber(Math.abs(n), lang, deltaFormat) === formatStatNumber(0, lang, deltaFormat));
  const tone = toneProp ?? (trend ? toneOf[trend] : 'neutral');
  // A number that is not finite would draw NaN or the infinity sign: treat it as missing.
  const empty = !loading && (value === undefined || value === null || (typeof value === 'number' && !Number.isFinite(value)));
  const shownValue = empty ? (
    <span data-empty-label="">{emptyLabel ?? statEmptyLabels[langKey]}</span>
  ) : typeof value === 'number' ? (
    breakableValue(formatStatNumber(value, lang, format))
  ) : (
    value
  );
  const shownDelta = typeof delta === 'number' ? formatStatNumber(Math.abs(delta), lang, deltaFormat) : delta;
  const words = { ...statTrendLabels[langKey], ...trendLabels };
  const hasDelta = !loading && delta !== undefined && delta !== null && !(typeof delta === 'number' && !Number.isFinite(delta));

  const numeric = typeof value === 'number' && !empty && !loading;
  const valueRef = useRollOnChange(numeric ? (value as number) : undefined, numeric ? (shownValue as string) : undefined);

  // Development only: a node change with no trend is neither colored nor named.
  const nodeDeltaWithoutTrend = hasDelta && typeof delta !== 'number' && trendProp === undefined;
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !nodeDeltaWithoutTrend) return;
    console.warn('Stat: delta is a node with no trend. Pass trend up, down or flat so the change has an icon and a spoken word.');
  }, [nodeDeltaWithoutTrend]);

  return (
    <div
      {...rest}
      data-ds="stat"
      data-size={size}
      data-tone={hasDelta ? tone : undefined}
      data-trend={hasDelta ? trend : undefined}
      data-loading={loading ? '' : undefined}
      data-empty={empty ? '' : undefined}
      aria-busy={loading || undefined}
    >
      <span data-part="label">{label}</span>
      {icon !== undefined && (
        <span data-part="icon" aria-hidden="true">
          {isValidElement(icon) ? icon : <Icon name={icon as IconName} size="md" />}
        </span>
      )}
      <span data-part="value">
        {loading ? (
          <span data-loading-label="">{loadingLabel ?? loadingLabels[langKey]}</span>
        ) : numeric ? (
          // The layer that rolls (stat-roll); the value part clips it.
          <span ref={valueRef}>{shownValue}</span>
        ) : (
          shownValue
        )}
      </span>
      {hasDelta && (
        <span data-part="delta">
          {trend && <Icon name={trendIcons[trend]} size="sm" />}
          {trend && <span data-trend-label="">{words[trend]} </span>}
          <span>{shownDelta}</span>
        </span>
      )}
      {hint !== undefined && hint !== null && <span data-part="hint">{hint}</span>}
    </div>
  );
}

/**
 * stat-roll: plays the catalog number-roll pattern through useMotion() on
 * the number's span when the shown number changes after the first paint:
 * up from below when it grew, down from above when it fell. A change that
 * comes less than one roll after the last roll started changes in place
 * (motion catalog note N11), so a live counter never flashes the same area
 * more than about three times a second. The reduced form is a fade, and
 * under reduced motion the duration tokens are 0ms. Never awaits
 * animationend.
 */
function useRollOnChange(n: number | undefined, text: string | undefined) {
  const ref = useRef<HTMLSpanElement>(null);
  const motion = useMotion();
  const previous = useRef({ n, text });
  const busyUntil = useRef(0);
  useEffect(() => {
    const before = previous.current;
    previous.current = { n, text };
    const el = ref.current;
    if (!el || text === undefined || before.text === undefined || before.text === text) return;
    const now = typeof performance === 'undefined' ? Date.now() : performance.now();
    if (now < busyUntil.current) return;
    const direction = n !== undefined && before.n !== undefined && n < before.n ? 'down' : 'up';
    const roll = motion.play(el, 'number-roll', 'stat-roll', { direction });
    const duration = roll?.effect?.getTiming().duration;
    busyUntil.current = roll ? now + (typeof duration === 'number' ? duration : 0) : 0;
  }, [n, text, motion]);
  return ref;
}
