// Pure helpers that turn icon data into nodes or markup. Every framework
// component uses them, so no component needs innerHTML.
import type { IconName } from './names';
import { iconSets, type IconSetId } from './generated/sets.gen';
import type { IconData, IconSetData, IconStyle } from './types';

export type IconNode = readonly [tag: string, attrs: Readonly<Record<string, string>>];

const elementPattern = /<([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"]*")*)\s*\/>/g;
const attrPattern = /([a-zA-Z:-]+)="([^"]*)"/g;
const cache = new Map<string, readonly IconNode[]>();

/** Splits a minified body into flat element nodes. The build only emits self closing elements. */
export function parseBody(body: string): readonly IconNode[] {
  const hit = cache.get(body);
  if (hit) return hit;
  const nodes: IconNode[] = [];
  for (const el of body.matchAll(elementPattern)) {
    const attrs: Record<string, string> = {};
    for (const a of (el[2] ?? '').matchAll(attrPattern)) attrs[a[1] as string] = a[2] as string;
    nodes.push([el[1] as string, attrs]);
  }
  cache.set(body, nodes);
  return nodes;
}

/** stroke-width becomes strokeWidth, for React and react-native-svg props. */
export function camelAttrs(attrs: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) out[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  return out;
}

export const defaultIconStyle: IconStyle<IconSetId> = { set: 'pixel' };

export function isIconSetId(value: string): value is IconSetId {
  return Object.prototype.hasOwnProperty.call(iconSets, value);
}

/** Finds the set and the glyph for a name, applying the style map. Unknown sets fall back to pixel. */
export function resolveIcon(name: IconName, style: IconStyle = defaultIconStyle): { set: IconSetData; data: IconData } {
  const set: IconSetData = isIconSetId(style.set) ? iconSets[style.set] : iconSets.pixel;
  const glyph = style.map?.[name];
  const data = (glyph !== undefined ? set.glyphs[glyph] : undefined) ?? set.icons[name];
  return { set, data };
}

/** A complete SVG string, for places with no framework (docs, Figma, the CLI). */
export function iconToSvg(name: IconName, style: IconStyle = defaultIconStyle, size = 24): string {
  const { set, data } = resolveIcon(name, style);
  const attrs = Object.entries(set.attrs)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${data.viewBox}"${attrs}>${data.body}</svg>`;
}
