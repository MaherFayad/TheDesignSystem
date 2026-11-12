// The icon config of each style, for IconSetContext. A style pack's icons.ts
// is used when it is listed here; any other style gets `{ set: iconSet }` from
// its style.json. Add a line when a style pack ships an icons.ts with a map.
import type { IconStyle } from '@the-system/icons';
import deskIcons from '@the-system/styles/desk/icons';
import studioIcons from '@the-system/styles/studio/icons';
import type { StyleData } from './types';

const packs: Readonly<Record<string, IconStyle>> = {
  studio: studioIcons,
  desk: deskIcons,
};

const fromStyleJson = new Map<string, IconStyle>();

/** The icon config for a style. Stable per style id, so context consumers do not re-render. */
export function iconStyleFor(style: StyleData): IconStyle {
  const pack = packs[style.id];
  if (pack) return pack;
  let value = fromStyleJson.get(style.id);
  if (!value) {
    value = { set: style.iconSet };
    fromStyleJson.set(style.id, value);
  }
  return value;
}
