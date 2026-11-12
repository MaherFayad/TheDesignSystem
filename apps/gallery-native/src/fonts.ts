// Native: the style packs ship woff2 files only, which iOS and Android cannot
// register, so the gallery draws text in the platform font (ThemeProvider
// fonts="system"). The web build loads the fonts in fonts.web.ts.
import type { FontSource } from '@the-system/native';

export const fontSource: FontSource = 'system';

export function loadFonts(): void {}
