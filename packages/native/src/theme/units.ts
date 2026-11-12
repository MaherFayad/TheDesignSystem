// Unit conversions the theme objects leave to the consumer. See the header of
// packages/tokens/dist/native/types.ts.
import { emBase, type Theme } from '@the-system/tokens/native';

/**
 * An em token from the theme object (converted at the build's `emBase`), at a
 * font size: CSS resolves `1em` on the element's own font size.
 */
export function emAt(converted: number, fontSize: number): number {
  return (converted / emBase) * fontSize;
}

/** The line height for a font size and a leading multiplier from `theme.font.leading`. */
export function lineHeightOf(fontSize: number, leading: number): number {
  return fontSize * leading;
}

/** The touch target of a platform: 44 on iOS, 48 on Android, the 24px minimum on the web. */
export function touchTargetOf(theme: Theme, platform: 'web' | 'ios' | 'android'): number {
  if (platform === 'ios') return theme.size.touch.ios;
  if (platform === 'android') return theme.size.touch.android;
  return theme.size['target-min'];
}
