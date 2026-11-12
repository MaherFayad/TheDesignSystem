// Pure theme resolution: no React, no window. Safe in a server component, for
// example to stamp <html> in a Next layout:
//
//   <html {...themeAttributes({ style: 'desk', lang: 'ar' })}>
import { directionOf } from '@the-system/shared';
import { styles } from '@the-system/styles/registry';
import type { StyleData, ThemeAttributes, ThemeAxes, ThemeAxesInput, ThemeValue } from './types';

/** The style a root Theme uses when none is passed. */
export const DEFAULT_STYLE = 'studio';

const registry = styles as unknown as Readonly<Record<string, StyleData>>;
/**
 * The style.json data for an id. A custom id that is not in the registry gets
 * plain defaults: dark first, default density, pixel icons, no optional parts.
 * Nothing is cached for custom ids, so arbitrary ids cannot grow memory.
 *
 * A custom id paints nothing unless the consumer ships token CSS for it
 * (`[data-style='<id>'][data-scheme='dark']` and so on). Check with
 * `styleIds` before passing an id that comes from user input.
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

/** Ids of every style in the registry. */
export const styleIds: readonly string[] = Object.keys(registry);

/**
 * Resolves every axis. Order for each axis: the prop, then the parent Theme,
 * then the root default. Root defaults: style `studio`, scheme and density
 * from the style's style.json, contrast `default`, platform `web`, glass
 * `regular`, lang `en`.
 *
 * - A scheme the style does not list falls back to the style's default scheme.
 * - `dir` follows `lang` when `lang` is passed and `dir` is not: `lang="ar"`
 *   alone gives `rtl`. Otherwise `dir` comes from the parent, then from `lang`.
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

/** The attributes of a Theme element for resolved axes. */
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

/**
 * Pure helper: resolves the axes as a root Theme would and returns the
 * attributes to spread on any element. Use it to stamp <html> or <body> so
 * the whole viewport is themed.
 */
export function themeAttributes(axes: ThemeAxesInput = {}): ThemeAttributes {
  return attributesOf(resolveTheme(axes, null));
}
