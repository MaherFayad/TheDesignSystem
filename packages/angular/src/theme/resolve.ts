// Pure theme resolution: no Angular, no window. The same rules as the React
// Theme (packages/react/src/theme/resolve.ts). Both copies could move to
// packages/shared; see docs/reports/angular-proof.md.
import { directionOf } from '@the-system/shared';
import { styles } from '@the-system/styles/registry';
import type { IconStyle } from '@the-system/icons';
import deskIcons from '@the-system/styles/desk/icons';
import studioIcons from '@the-system/styles/studio/icons';
import type { StyleData, ThemeAttributes, ThemeAxes, ThemeAxesInput, ThemeValue } from './types';

/** The style a root theme uses when none is passed. */
export const DEFAULT_STYLE = 'studio';

const registry = styles as unknown as Readonly<Record<string, StyleData>>;

/** Ids of every style in the registry. */
export const styleIds: readonly string[] = Object.keys(registry);

/**
 * The style.json data for an id. A custom id that is not in the registry
 * gets plain defaults: dark first, default density, pixel icons, no optional
 * parts.
 */
export function getStyleData(id: string): StyleData {
  const known = registry[id];
  if (known) return known;
  return {
    id,
    name: id,
    schemes: ['dark', 'light'],
    defaultScheme: 'dark',
    defaultDensity: 'default',
    iconSet: 'pixel',
    motionPreset: 'flat',
    usesGlass: false,
    optionalParts: {},
    fonts: { sans: 'Inter Variable', arabic: 'IBM Plex Sans Arabic' },
    dials: {},
  };
}

/**
 * Resolves every axis. Order for each axis: the input, then the parent
 * theme, then the root default. Root defaults: style `studio`, scheme and
 * density from the style's style.json, contrast `default`, platform `web`,
 * glass `regular`, lang `en`. `dir` follows `lang` when `lang` is passed and
 * `dir` is not.
 */
export function resolveTheme(input: ThemeAxesInput, parent?: ThemeAxes | null): ThemeValue {
  const style = input.style ?? parent?.style ?? DEFAULT_STYLE;
  const styleData = getStyleData(style);
  const wanted = input.scheme ?? parent?.scheme ?? styleData.defaultScheme;
  const scheme = styleData.schemes.includes(wanted) ? wanted : styleData.defaultScheme;
  const lang = input.lang ?? parent?.lang ?? 'en';
  const dir = input.dir ?? (input.lang !== undefined ? directionOf(input.lang) : (parent?.dir ?? directionOf(lang)));
  return {
    style,
    scheme,
    density: input.density ?? parent?.density ?? styleData.defaultDensity,
    contrast: input.contrast ?? parent?.contrast ?? 'default',
    platform: input.platform ?? parent?.platform ?? 'web',
    glass: input.glass ?? parent?.glass ?? 'regular',
    dir,
    lang,
    styleData,
  };
}

/** The attributes of a theme element for resolved axes. */
export function attributesOf(axes: ThemeAxes): ThemeAttributes {
  return {
    'data-ds': 'theme',
    'data-style': axes.style,
    'data-scheme': axes.scheme,
    'data-density': axes.density,
    'data-contrast': axes.contrast,
    'data-platform': axes.platform,
    'data-glass': axes.glass,
    dir: axes.dir,
    lang: axes.lang,
  };
}

/** Resolves the axes as a root theme would and returns the attributes for any element. */
export function themeAttributes(axes: ThemeAxesInput = {}): ThemeAttributes {
  return attributesOf(resolveTheme(axes, null));
}

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
