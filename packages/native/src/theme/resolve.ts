// Theme resolution for React Native: no React, no native modules.
//
// The axis rules live in packages/shared/src/theme.ts (`resolveTheme`), the
// same ones the web Theme and the Angular dsTheme use. This file adds what a
// device knows at the root (platform, I18nManager direction, more contrast,
// the system color scheme) and picks the theme object of the token build.
import { DEFAULT_STYLE, getStyleData, resolveTheme } from '@the-system/shared';
import { densities, solidMaterials, themes, type Theme } from '@the-system/tokens/native';
import type { Density, FontSource, Platform, Scheme, ThemeAxes, ThemeAxesInput } from './types';

export { DEFAULT_STYLE, getStyleData, styleIds } from '@the-system/shared';

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
 * Resolves every axis with the shared `resolveTheme`: the prop, then the
 * parent, then the root default. At the root the device gives the platform,
 * the direction (I18nManager, when neither dir nor lang is passed) and the
 * contrast (`more` when the system asks for it). With `followSystem` the
 * root takes the device color scheme when the scheme prop is silent.
 */
export function resolveAxes(
  input: ThemeAxesInput,
  parent: ThemeAxes | null | undefined,
  device: DeviceDefaults = webDevice,
  followSystem = false,
): ThemeAxes {
  const system = !parent && followSystem && device.colorScheme ? device.colorScheme : undefined;
  const { styleData: _styleData, ...axes } = resolveTheme({ ...input, scheme: input.scheme ?? system }, parent ?? null, {
    platform: device.platform,
    dir: device.isRTL ? 'rtl' : undefined,
    contrast: device.moreContrast ? 'more' : undefined,
  });
  return axes;
}

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

/** An override object that sets one dotted token path. */
function atPath(path: string, value: unknown): Plain {
  return path
    .split('.')
    .reverse()
    .reduce<unknown>((acc, key) => ({ [key]: acc }), value) as Plain;
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
 * density overrides, then solid materials (the token build's
 * `solidMaterials` paths take `color.material.glass-solid`), then the font
 * source. Cached per combination, so the same axes always give the same
 * object and the style functions can memoize on it. The cache is bounded:
 * the key holds the style id of the theme object, never a custom id.
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
    const solid = theme.color.material['glass-solid'];
    for (const path of solidMaterials) theme = deepMerge(theme, atPath(path, solid));
  }
  if (options.fonts === 'system') {
    const family: Plain = {};
    for (const k of Object.keys(theme.font.family)) family[k] = undefined;
    theme = { ...theme, font: { ...theme.font, family: family as Theme['font']['family'] } };
  }
  cache.set(key, theme);
  return theme;
}
