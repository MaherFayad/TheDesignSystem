// The tone icons and tone words that Alert, Callout and Banner share. The
// icon of a tone carries its word as an accessible name, so the tone is
// never told by color alone. Not exported from the package barrel.
import type { IconName } from '@the-system/icons';
import type { Tone } from '@the-system/shared';

/** The icon of each tone. */
export const messageIcons: Readonly<Record<Tone, IconName>> = {
  neutral: 'bell',
  accent: 'star',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/** True for any `ar` language tag. */
export function isArabic(lang: string | undefined): boolean {
  return lang !== undefined && /^ar(-|$)/i.test(lang);
}

/** Picks the Arabic or the English words for a language tag. */
export function wordsFor<E, A>(words: { en: E; ar: A }, lang: string | undefined): E | A {
  return isArabic(lang) ? words.ar : words.en;
}
