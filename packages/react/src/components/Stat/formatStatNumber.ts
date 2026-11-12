// Number formatting for Stat. A private stand in for `formatNumber` from
// `packages/shared/src/number.ts`, which order 1.2.5 (NumberField) owns and
// which is not on this branch yet. Same idea: Intl only, Western digits by
// default. Swap the import for `formatNumber` once number.ts lands.

/**
 * The locale to format with: the language plus the Latin numbering system,
 * so Arabic shows 48,200 and not ٤٨٬٢٠٠. A locale that already names a
 * numbering system (`-u-nu-`) is kept.
 */
export function statLocale(lang: string): string {
  return /-u-.*nu-/.test(lang) ? lang : `${lang}-u-nu-latn`;
}

/** Formats a number with Intl in the given language, Western digits by default. */
export function formatStatNumber(value: number, lang: string, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(statLocale(lang), options).format(value);
  } catch {
    return new Intl.NumberFormat('en', options).format(value);
  }
}

/**
 * Intl joins a currency or a unit to the number with a no-break space, which
 * makes the whole value one word: a narrow tile then breaks it between
 * digits. For the large value, let it wrap at that space instead.
 */
export function breakableValue(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, ' ');
}
