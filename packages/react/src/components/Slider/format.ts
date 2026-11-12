// Value text for a slider thumb. Western digits in every language, the unit
// after the number. Replace with packages/shared/src/number.ts (formatNumber)
// once order 1.2.x (NumberField) lands it.

export interface SliderFormatOptions {
  /** A unit after the number: %, px, SAR, km. Symbols and px join the number; words get a space. */
  unit?: string;
  /** Intl.NumberFormat options, such as maximumFractionDigits. */
  options?: Intl.NumberFormatOptions;
}

const SYMBOLS = new Set(['%', '°', '‰', 'px', 'pt', 'x']);

export function formatSliderValue(value: number, locale: string, { unit, options }: SliderFormatOptions = {}): string {
  let text: string;
  try {
    text = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...options, numberingSystem: 'latn' }).format(value);
  } catch {
    text = String(value);
  }
  if (!unit) return text;
  return SYMBOLS.has(unit) ? `${text}${unit}` : `${text} ${unit}`;
}
