// Value text for a slider thumb: the twin of
// packages/react/src/components/Slider/format.ts, on formatNumber from
// packages/shared (Western digits in every language). The unit goes after
// the number: symbols and px join it, words get a space.
import { formatNumber } from '@the-system/shared';

export interface SliderFormatOptions {
  /** A unit after the number: %, px, SAR, km. */
  unit?: string;
  /** Intl.NumberFormat options, such as maximumFractionDigits. */
  options?: Intl.NumberFormatOptions;
}

const SYMBOLS = new Set(['%', '°', '‰', 'px', 'pt', 'x']);

export function formatSliderValue(value: number, locale: string, { unit, options }: SliderFormatOptions = {}): string {
  let text: string;
  try {
    // Digits stay Western, as in React: a numbering system in the options is ignored.
    const { numberingSystem: _ignored, ...rest } = options ?? {};
    text = formatNumber(value, locale, { maximumFractionDigits: 2, ...rest });
  } catch {
    text = String(value);
  }
  if (!unit) return text;
  return SYMBOLS.has(unit) ? `${text}${unit}` : `${text} ${unit}`;
}
