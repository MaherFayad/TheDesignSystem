// The icon config of each style, for the native IconSetContext. The same
// table as packages/react/src/theme/icons.ts: a style pack's icons.ts when it
// is listed here, else `{ set: iconSet }` from its style.json.
import type { IconStyle } from '@the-system/icons';
import deskIcons from '@the-system/styles/desk/icons';
import studioIcons from '@the-system/styles/studio/icons';
import type { StyleData } from './types';

const packs: Readonly<Record<string, IconStyle>> = {
  studio: studioIcons,
  desk: deskIcons,
};

const bySet = new Map<string, IconStyle>();

/** The icon config for a style. Stable per style id and icon set. */
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
