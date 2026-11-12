// Web export: registers the style fonts from public/fonts (copied there by
// scripts/fonts.mjs) under the family names the theme objects use, with the
// same weights the web packages load through fontsource.
import type { FontSource } from '@the-system/native';

export const fontSource: FontSource = 'theme';

const faces: { family: string; file: string; weight: string; range?: string }[] = [
  { family: 'Inter Variable', file: 'inter-latin-wght-normal.woff2', weight: '100 900' },
  { family: 'Instrument Sans', file: 'instrument-sans-latin-400-normal.woff2', weight: '400' },
  { family: 'Instrument Sans', file: 'instrument-sans-latin-700-normal.woff2', weight: '700' },
  { family: 'IBM Plex Sans Arabic', file: 'ibm-plex-sans-arabic-arabic-400-normal.woff2', weight: '400' },
  { family: 'IBM Plex Sans Arabic', file: 'ibm-plex-sans-arabic-arabic-700-normal.woff2', weight: '700' },
  // The theme object keeps only the first family of a stack. The web stack for
  // Arabic falls through to the Latin sans for Latin letters; these two faces
  // do the same under the Arabic family name. A device uses the system font.
  { family: 'IBM Plex Sans Arabic', file: 'instrument-sans-latin-400-normal.woff2', weight: '400', range: 'U+0000-00FF' },
  { family: 'IBM Plex Sans Arabic', file: 'instrument-sans-latin-700-normal.woff2', weight: '700', range: 'U+0000-00FF' },
];

let loaded = false;

export function loadFonts(): void {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const style = document.createElement('style');
  style.setAttribute('data-gallery', 'fonts');
  style.textContent = faces
    .map((f) => `@font-face { font-family: '${f.family}'; src: url('/fonts/${f.file}') format('woff2'); font-weight: ${f.weight};${f.range ? ` unicode-range: ${f.range};` : ''} font-display: block; }`)
    .join('\n');
  document.head.appendChild(style);
}
