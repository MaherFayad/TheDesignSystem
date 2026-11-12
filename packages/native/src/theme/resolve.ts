// Pure theme resolution for React Native: no React, no native modules.
//
// The axis order is the web Theme's (packages/react/src/theme/resolve.ts):
// the prop, then the nearest parent, then the root default. The root defaults
// differ in two places only, because a device has settings a page does not:
// platform comes from the device, and dir from I18nManager. Both are passed
// in as `device` so this file stays pure and testable.
//
// The web resolver lives in packages/react. It is repeated here, not
// imported, because packages/react pulls in the DOM and Radix. Moving the
// shared part to packages/shared is noted in docs/reports/native-proof.md.
import { directionOf } from '@the-system/shared';
import { styles } from '@the-system/styles/registry';
import { densities, themes, type Theme } from '@the-system/tokens/native';
import type { Density, Dir, FontSource, Platform, Scheme, StyleData, ThemeAxes, ThemeAxesInput } from './types';

/** The style a root ThemeProvider uses when none is passed. The same as the web. */
export const DEFAULT_STYLE = 'studio';

const registry = styles as unknown as Readonly<Record<string, StyleData>>;

/** Ids of every style in the registry. */
export const styleIds: readonly string[] = Object.keys(registry);

/**
 * The style.json data for an id. A custom id that is not in the registry gets
 * the same plain defaults as on the web.
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

/** What the device says when a prop and the parent are silent. */
export interface DeviceDefaults {
  platform: Platform;
  /** I18nManager.isRTL. */
  isRTL: boolean;
  /** useColorScheme(), used only when the root follows the system. */
  colorScheme?: Scheme | null;
  /** The system asks for more contrast (iOS darker system colors, Android high text contrast). */
  moreContrast?: boolean;
}

export const webDevice: DeviceDefaults = { platform: 'web', isRTL: false };

/**
 * Resolves every axis. Order for each axis: the prop, then the parent, then
 * the root default. Root defaults: style `studio`, scheme from the system when
 * `followSystem` is set and else from style.json, density from style.json,
 * contrast `more` when the system asks for it and else `default`, platform
 * from the device, glass `regular`, lang `en`.
 *
 * - A scheme the style does not list falls back to the style's default scheme.
 * - `dir` follows `lang` when `lang` is passed and `dir` is not. Otherwise it
 *   comes from the parent, and at the root from I18nManager, then from lang.
 */
export function resolveAxes(
  input: ThemeAxesInput,
  parent: ThemeAxes | null | undefined,
  device: DeviceDefaults = webDevice,
  followSystem = false,
): ThemeAxes {
  const style = input.style ?? parent?.style ?? DEFAULT_STYLE;
  const styleData = getStyleData(style);
  const system = followSystem && device.colorScheme ? device.colorScheme : undefined;
  const wanted = input.scheme ?? system ?? parent?.scheme ?? styleData.defaultScheme;
  const scheme = styleData.schemes.includes(wanted) ? wanted : styleData.defaultScheme;
  const lang = input.lang ?? parent?.lang ?? 'en';
  let dir: Dir;
  if (input.dir !== undefined) dir = input.dir;
  else if (input.lang !== undefined) dir = directionOf(input.lang);
  else if (parent) dir = parent.dir;
  else dir = device.isRTL ? 'rtl' : directionOf(lang);
  return {
    style,
    scheme,
    density: input.density ?? parent?.density ?? styleData.defaultDensity,
    contrast: input.contrast ?? parent?.contrast ?? (device.moreContrast ? 'more' : 'default'),
    platform: input.platform ?? parent?.platform ?? device.platform,
    glass: input.glass ?? parent?.glass ?? 'regular',
    dir,
    lang,
  };
}

/**
 * The material keys that turn solid under more contrast and reduced
 * transparency. The same list as the `[data-contrast='more']` block of the
 * token CSS. The token build does not expose it as data yet.
 */
export const solidMaterialKeys = [
  'glass',
  'glass-strong',
  'glass-clear',
  'glass-tinted',
  'glass-flat',
  'titlebar',
  'menubar',
  'dock',
] as const;

type Plain = Record<string, unknown>;

function isPlain(value: unknown): value is Plain {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep merge of plain objects: `over` wins, arrays and leaves are replaced. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (!isPlain(base) || !isPlain(over)) return (over === undefined ? base : over) as T;
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = deepMerge(out[k], v);
  return out as T;
}

/** The style id whose theme objects the build ships for an id: the id itself, or the default style. */
export function themeStyleOf(style: string): keyof typeof themes {
  return style in themes ? (style as keyof typeof themes) : (DEFAULT_STYLE as keyof typeof themes);
}

export interface ThemeObjectOptions {
  /** Glass becomes solid: contrast more or the system's reduce transparency. */
  solidMaterials: boolean;
  fonts: FontSource;
}

const cache = new Map<string, Theme>();

/**
 * The theme object for resolved axes: `themes[style][scheme]`, then the
 * density overrides, then solid materials, then the font source. Cached per
 * combination, so the same axes always give the same object and the style
 * functions can memoize on it. The cache is bounded: the key holds the style
 * id of the theme object, never a custom id.
 */
export function themeFor(axes: ThemeAxes, options: ThemeObjectOptions): Theme {
  const style = themeStyleOf(axes.style);
  const bySchemes = themes[style];
  const styleData = getStyleData(style);
  const scheme: Scheme = bySchemes[axes.scheme] ? axes.scheme : styleData.defaultScheme;
  const density: Density = axes.density;
  const key = `${style}|${scheme}|${density}|${options.solidMaterials ? 'solid' : 'glass'}|${options.fonts}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const base = bySchemes[scheme] ?? bySchemes[styleData.defaultScheme];
  if (!base) throw new Error(`No theme object for ${style} ${scheme}. Run the token build.`);
  let theme: Theme = base;
  if (density !== 'default') theme = deepMerge(theme, densities[density]);
  if (options.solidMaterials) {
    const material: Plain = { ...theme.color.material };
    for (const k of solidMaterialKeys) material[k] = theme.color.material['glass-solid'];
    theme = deepMerge(theme, { color: { material } });
  }
  if (options.fonts === 'system') {
    const family: Plain = {};
    for (const k of Object.keys(theme.font.family)) family[k] = undefined;
    theme = { ...theme, font: { ...theme.font, family: family as Theme['font']['family'] } };
  }
  cache.set(key, theme);
  return theme;
}
