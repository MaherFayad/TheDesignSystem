// Words and value text of ColorArea (order M9.20, proposed). They belong in
// packages/shared/src/color.ts beside colorWords; this order does not own
// that file, so they live here until the lead moves them (requested in the
// order report). Pure: no React, no window.
import { colorLanguage, colorName, colorWords, type ColorChannelName, type ColorLanguage } from '@the-system/shared';

/** The built in words of a colour area. Arabic in standard Arabic, nouns. */
export interface ColorAreaWords {
  /** The default name of the area: "Saturation and brightness", "التشبع والسطوع". */
  area: string;
  /** The role a screen reader reads for each hidden input: "2D slider", "منزلق ثنائي الاتجاه". */
  role: string;
}

const AREA_WORDS: Record<ColorLanguage, ColorAreaWords> = {
  en: { area: 'Saturation and brightness', role: '2D slider' },
  ar: { area: 'التشبع والسطوع', role: 'منزلق ثنائي الاتجاه' },
};

/** The words of a colour area for a locale or a language. */
export function colorAreaWords(locale: string | undefined): ColorAreaWords {
  return AREA_WORDS[colorLanguage(locale)];
}

/** The part of a React Aria Color the value text reads. */
export interface ColorAreaTextSource {
  formatChannelValue(channel: ColorChannelName, locale: string): string;
  toString(format: 'hex'): string;
}

/**
 * The value text of one hidden input: the channel it moves first, then the
 * other channel, then the colour's name, in the page's words and with
 * Western digits. "Saturation 76%, Brightness 85%, Blue" and
 * "التشبع 76%، السطوع 85%، أزرق". `locale` must carry -u-nu-latn
 * (colorLocale) so React Aria formats Western digits.
 */
export function colorAreaValueText(
  color: ColorAreaTextSource,
  first: ColorChannelName,
  second: ColorChannelName,
  locale: string,
): string {
  const words = colorWords(locale);
  const ar = colorLanguage(locale) === 'ar';
  const part = (channel: ColorChannelName) => `${words.channels[channel]} ${color.formatChannelValue(channel, locale)}`;
  return [part(first), part(second), colorName(color.toString('hex'), locale)].join(ar ? '، ' : ', ');
}
