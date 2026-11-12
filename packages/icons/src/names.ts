// System icon names. They describe the meaning, never the drawing, and do not
// depend on an icon set. Each set in packages/icons/sets maps every name to a
// glyph file. Directional names say forward and back, never left and right.

export const iconNames = [
  'close',
  'check',
  'chevron-down',
  'chevron-up',
  'chevron-forward',
  'chevron-back',
  'arrow-forward',
  'arrow-back',
  'arrow-up',
  'arrow-down',
  'plus',
  'minus',
  'search',
  'menu',
  'more',
  'info',
  'warning',
  'danger',
  'success',
  'help',
  'copy',
  'external',
  'eye',
  'eye-off',
  'calendar',
  'clock',
  'user',
  'settings',
  'trash',
  'edit',
  'download',
  'upload',
  'sort',
  'filter',
  'loader',
  'minimize',
  'zoom',
  'home',
  'bell',
  'star',
  'heart',
  'link',
  'lock',
  'send',
  'attach',
  'mic',
  'play',
  'pause',
  'sun',
  'moon',
  'globe',
  'drag',
] as const;

export type IconName = (typeof iconNames)[number];

// Names that flip in right to left layouts. Only glyphs that point along the
// reading direction belong here. Brand marks, clocks and media controls never
// mirror.
export const mirrorIcons: readonly IconName[] = [
  'chevron-forward',
  'chevron-back',
  'arrow-forward',
  'arrow-back',
  'external',
  'send',
];

const mirrorSet = new Set<string>(mirrorIcons);
const nameSet = new Set<string>(iconNames);

export function isIconName(value: string): value is IconName {
  return nameSet.has(value);
}

export function isMirrored(name: IconName): boolean {
  return mirrorSet.has(name);
}
