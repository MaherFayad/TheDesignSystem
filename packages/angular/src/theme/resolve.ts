// Theme resolution comes from packages/shared (theme.ts), the same rules as
// the React Theme. This file adds only what is web and Angular specific: the
// document stamp and the icon style of a style pack.
import { themeAttributes, type StyleData, type ThemeAttributes, type ThemeAxesInput } from '@the-system/shared';
import type { IconStyle } from '@the-system/icons';
import deskIcons from '@the-system/styles/desk/icons';
import studioIcons from '@the-system/styles/studio/icons';

export { DEFAULT_STYLE, attributesOf, getStyleData, resolveTheme, styleIds, themeAttributes } from '@the-system/shared';

/**
 * Stamps the attributes of a root theme on an element, by default the
 * document element, so the whole viewport is themed and lang and dir are
 * right. Returns the attributes it set.
 */
export function applyDocumentTheme(axes: ThemeAxesInput = {}, element?: Element): ThemeAttributes {
  const attrs = themeAttributes(axes);
  const target = element ?? globalThis.document?.documentElement;
  if (target) for (const [name, value] of Object.entries(attrs)) target.setAttribute(name, value);
  return attrs;
}

const packs: Readonly<Record<string, IconStyle>> = { studio: studioIcons, desk: deskIcons };
const bySet = new Map<string, IconStyle>();

/** The icon config of a style. Stable per style id and icon set. */
export function iconStyleFor(style: StyleData): IconStyle {
  const pack = packs[style.id];
  if (pack) return pack;
  let value = bySet.get(style.iconSet);
  if (!value) {
    value = { set: style.iconSet };
    bySet.set(style.iconSet, value);
  }
  return value;
}
