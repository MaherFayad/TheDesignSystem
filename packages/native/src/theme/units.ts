// Unit conversions the theme objects leave to the consumer. See the header of
// packages/tokens/dist/native/types.ts.
import type { Theme } from '@the-system/tokens/native';

/**
 * The font size the token build converts em tokens at (radius.control,
 * font.tracking.*). It is the build's constant, not a design value. The build
 * does not export it yet; docs/reports/native-proof.md asks for that.
 */
export const EM_BASE = 16;

/** An em token from the theme object, at a font size: CSS resolves `1em` on the element's own font size. */
export function emAt(converted: number, fontSize: number): number {
  return (converted / EM_BASE) * fontSize;
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
