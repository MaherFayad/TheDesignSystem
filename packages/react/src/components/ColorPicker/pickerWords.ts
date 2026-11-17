// Built in words of ColorPicker (order M9.20, proposed). They belong in
// packages/shared/src/color.ts beside colorWords; this order does not own
// that file, so they live here until the lead moves them (requested in the
// order report). Arabic in standard Arabic, nouns, no diacritics.
import { colorLanguage, type ColorLanguage } from '@the-system/shared';

export interface ColorPickerWords {
  /** The default label: the title of the popover or sheet and the first word of the trigger's name. */
  title: string;
  /** The name of the list of views. */
  views: string;
  grid: string;
  spectrum: string;
  sliders: string;
  /** The name of the row of saved colours. */
  saved: string;
  /** The button that saves the colour now to the row. */
  save: string;
  /** The eyedropper button. */
  eyedropper: string;
  /** Read after the name of the preview swatch. */
  current: string;
}

const PICKER_WORDS: Record<ColorLanguage, ColorPickerWords> = {
  en: {
    title: 'Colour',
    views: 'Colour view',
    grid: 'Grid',
    spectrum: 'Spectrum',
    sliders: 'Sliders',
    saved: 'Saved colours',
    save: 'Save colour',
    eyedropper: 'Pick a colour from the screen',
    current: 'current colour',
  },
  ar: {
    title: 'اللون',
    views: 'طريقة عرض الألوان',
    grid: 'شبكة',
    spectrum: 'طيف',
    sliders: 'أشرطة التمرير',
    saved: 'الألوان المحفوظة',
    save: 'حفظ اللون',
    eyedropper: 'اختيار لون من الشاشة',
    current: 'اللون الحالي',
  },
};

/** The words of a colour picker for a locale or a language. */
export function colorPickerWords(locale: string | undefined): ColorPickerWords {
  return PICKER_WORDS[colorLanguage(locale)];
}
