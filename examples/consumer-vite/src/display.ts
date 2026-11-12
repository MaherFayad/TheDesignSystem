// Style, scheme and language live in the URL (?style=desk&scheme=light&lang=ar),
// so a link or a reload opens the same screen. The <html> element is stamped
// with themeAttributes before React renders, so the first paint is themed.
import { themeAttributes } from '@the-system/react';
import { isLocale, isScheme, isStyle, type Locale, type SchemeChoice, type StyleChoice } from './copy';

export interface Display {
  style: StyleChoice;
  scheme: SchemeChoice;
  lang: Locale;
}

export function readDisplay(search: string): Display {
  const params = new URLSearchParams(search);
  const style = params.get('style') ?? undefined;
  const scheme = params.get('scheme') ?? undefined;
  const lang = params.get('lang') ?? undefined;
  return {
    style: isStyle(style) ? style : 'studio',
    scheme: isScheme(scheme) ? scheme : 'dark',
    lang: isLocale(lang) ? lang : 'en',
  };
}

/** Writes the choice to the URL without a new history entry. */
export function writeDisplay(display: Display): void {
  const url = new URL(window.location.href);
  url.searchParams.set('style', display.style);
  url.searchParams.set('scheme', display.scheme);
  url.searchParams.set('lang', display.lang);
  window.history.replaceState(null, '', url);
}

/** Puts every theme attribute on <html>: data-style, data-scheme, lang, dir and the rest. */
export function stampHtml(display: Display): void {
  const html = document.documentElement;
  for (const [name, value] of Object.entries(themeAttributes(display))) html.setAttribute(name, value);
}
