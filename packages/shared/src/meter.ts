// The level and tone of a Meter, from the same thresholds as the HTML meter
// element: low, high and optimum split the range into three regions.
//
// Pure logic with no React, shared by React and Angular so both use the same
// rule.
import type { Tone } from './axes';

function isArabic(lang: string | undefined): boolean {
  return lang !== undefined && /^ar(-|$)/i.test(lang);
}

export type MeterLevel = 'low' | 'medium' | 'high';
export type MeterTone = Extract<Tone, 'accent' | 'success' | 'warning' | 'danger'>;

export interface MeterRange {
  min: number;
  max: number;
  /** The top of the low region. Clamped into [min, max]. Default min (no low region). */
  low?: number;
  /** The bottom of the high region. Clamped into [low, max]. Default max (no high region). */
  high?: number;
  /** The best value. Its region is good; the regions next to it are fair; the far region is poor. */
  optimum?: number;
}

/** The resolved thresholds: low and high clamped as the HTML meter clamps them. */
export function resolveRange({ min, max, low, high, optimum }: MeterRange) {
  const lo = Math.min(max, Math.max(min, low ?? min));
  const hi = Math.min(max, Math.max(lo, high ?? max));
  const opt = optimum === undefined ? undefined : Math.min(max, Math.max(min, optimum));
  return { min, max, low: lo, high: hi, optimum: opt };
}

/** Which region the value is in. With no thresholds every value is medium. */
export function meterLevel(value: number, range: MeterRange): MeterLevel {
  const r = resolveRange(range);
  if (value < r.low) return 'low';
  if (value > r.high) return 'high';
  return 'medium';
}

/**
 * The tone of a value: success in the optimum's region, warning one region
 * away, danger two regions away. accent when there are no thresholds or no
 * optimum, since then no region is better than another.
 */
export function meterTone(value: number, range: MeterRange): MeterTone {
  const r = resolveRange(range);
  const hasRegions = r.low > r.min || r.high < r.max;
  if (!hasRegions || r.optimum === undefined) return 'accent';
  const order: MeterLevel[] = ['low', 'medium', 'high'];
  const distance = Math.abs(order.indexOf(meterLevel(value, range)) - order.indexOf(meterLevel(r.optimum, range)));
  return distance === 0 ? 'success' : distance === 1 ? 'warning' : 'danger';
}

/** The default level words, by language. Arabic: noun forms, no diacritics. */
export const meterLevelLabels = {
  en: { low: 'Low', medium: 'Medium', high: 'High' },
  ar: { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' },
} as const satisfies Record<'en' | 'ar', Record<MeterLevel, string>>;

export function meterLevelLabelsFor(lang: string | undefined): Record<MeterLevel, string> {
  return isArabic(lang) ? meterLevelLabels.ar : meterLevelLabels.en;
}
