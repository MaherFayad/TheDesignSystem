// Private helpers shared by ProgressBar, ProgressCircle and Meter. Not
// exported from the package barrel: the siblings import this file with a
// relative path, as IconButton imports ButtonBase.
//
// The order asks for values formatted with `packages/shared/src/number.ts`.
// That file arrives with NumberField (order 1.2.x) and does not exist yet, so
// these helpers use Intl.NumberFormat directly with the same rule: Western
// digits in every language. Swap formatPercent for number.ts formatNumber
// once it lands (see docs/reports/lanes/lane-5b.md).

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

/** A number formatter in the language, with Western digits (latn) always. */
function formatter(lang: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(lang || 'en', {
      numberingSystem: 'latn',
      ...options,
    });
  } catch {
    return new Intl.NumberFormat('en', options);
  }
}

/**
 * A fraction from 0 to 1 as a whole percent in the language, rounded down so
 * an unfinished task never says 100%: 0.456 gives "45%", 0.996 gives "99%".
 */
export function formatPercent(fraction: number, lang: string | undefined): string {
  return formatter(lang, { style: 'percent', maximumFractionDigits: 0 }).format(
    Math.floor(fraction * 100 + 1e-9) / 100,
  );
}

/** A plain number in the language with Western digits: 1234.5 gives "1,234.5". */
export function formatNumber(value: number, lang: string | undefined, options: Intl.NumberFormatOptions = {}): string {
  return formatter(lang, { maximumFractionDigits: 2, ...options }).format(value);
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
