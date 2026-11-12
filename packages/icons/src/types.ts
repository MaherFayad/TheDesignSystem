import type { IconName } from './names';

/** One glyph: the viewBox and the inner SVG markup, already minified. */
export interface IconData {
  viewBox: string;
  body: string;
}

/** The generated data of one icon set. */
export interface IconSetData {
  id: string;
  /** Attributes the root svg needs for this set, for example fill or stroke. */
  attrs: Readonly<Record<string, string>>;
  /** Every system name, drawn in this set. */
  icons: Readonly<Record<IconName, IconData>>;
  /** Extra glyphs that a style map points at, keyed by glyph file name. */
  glyphs: Readonly<Record<string, IconData>>;
}

/**
 * What a style says about icons: the set, and an optional map from a system
 * name to another glyph file of the same set.
 */
export interface IconStyle<Set extends string = string> {
  set: Set;
  map?: Partial<Record<IconName, string>>;
}

/** Icon sizes, from the tokens size.icon.sm, size.icon.md and size.icon.lg. */
export const iconSizes = { sm: 12, md: 16, lg: 24 } as const;

export type IconSizeName = keyof typeof iconSizes;
export type IconSize = IconSizeName | (typeof iconSizes)[IconSizeName];

export function resolveIconSize(size: IconSize | undefined): IconSizeName {
  if (size === undefined) return 'md';
  if (typeof size === 'string') return size;
  if (size === 12) return 'sm';
  if (size === 24) return 'lg';
  return 'md';
}
