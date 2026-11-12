// Private helpers shared by ProgressBar, ProgressCircle and Meter: the twin
// of packages/react/src/components/ProgressBar/format.ts, which is a private
// React file, not shared logic. The number formatting itself comes from
// `@the-system/shared` (number.ts formatNumber: Western digits in every
// language). Not exported from the package barrel: the siblings import this
// file with a relative path.
import { formatNumber } from '@the-system/shared';

/** True for any Arabic language tag: ar, ar-SA. */
export function isArabic(lang: string | undefined): boolean {
  return lang !== undefined && /^ar(-|$)/i.test(lang);
}

/** The default busy words, by language. */
export const progressLabels = {
  en: { loading: 'Loading' },
  ar: { loading: 'جار التحميل' },
} as const;

/** The default busy words for a language tag. */
export function loadingLabelFor(lang: string | undefined): string {
  return isArabic(lang) ? progressLabels.ar.loading : progressLabels.en.loading;
}

/**
 * A fraction from 0 to 1 as a whole percent in the language, rounded down so
 * an unfinished task never says 100%: 0.456 gives "45%", 0.996 gives "99%".
 */
export function formatPercent(fraction: number, lang: string | undefined): string {
  return formatNumber(Math.floor(fraction * 100 + 1e-9) / 100, lang, { style: 'percent', maximumFractionDigits: 0 });
}

/** A finite max above min, else the fallback. */
export function validMax(max: number | undefined, min: number, fallback: number): number {
  return typeof max === 'number' && Number.isFinite(max) && max > min ? max : fallback;
}

/**
 * The value clamped into [min, max], or null when there is no usable value
 * (undefined, null, NaN): the indeterminate form.
 */
export function clampValue(value: number | null | undefined, min: number, max: number): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

/** The Radix Progress state: indeterminate with no value, complete at max, else loading. */
export function progressState(value: number | null, max: number): 'indeterminate' | 'complete' | 'loading' {
  return value === null ? 'indeterminate' : value === max ? 'complete' : 'loading';
}
