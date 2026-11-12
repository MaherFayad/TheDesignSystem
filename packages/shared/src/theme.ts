// Theme resolution, shared by React (`Theme`), Angular (`dsTheme`) and React
// Native (`ThemeProvider`). Pure: no framework, no window, no document. Safe
// on a server, for example to stamp <html> in a Next layout:
//
//   <html {...themeAttributes({ style: 'desk', lang: 'ar' })}>
//
// The axes and their values are the runtime axes table of
// docs/contracts/frameworks.md. Each framework keeps its own context and
// element; only the rules live here.
import { styles, type StyleId } from '@the-system/styles/registry';
import { directionOf } from './bidi';

/** A style id from the registry, or any custom id a consumer adds. */
export type ThemeStyle = StyleId | (string & {});
export type Scheme = 'dark' | 'light';
export type Density = 'compact' | 'default' | 'comfortable';
export type Contrast = 'default' | 'more';
export type Platform = 'web' | 'ios' | 'android';
/** Only styles with `usesGlass` read it. */
export type Glass = 'clear' | 'regular' | 'tinted';
export type Dir = 'ltr' | 'rtl';
/** A BCP 47 tag. The system ships `en` and `ar`. */
export type Lang = 'en' | 'ar' | (string & {});

/** Every axis, resolved. */
export interface ThemeAxes {
  style: ThemeStyle;
  scheme: Scheme;
  density: Density;
  contrast: Contrast;
  platform: Platform;
  glass: Glass;
  dir: Dir;
  lang: Lang;
}

/** What a theme takes: any axis may be left out. */
export type ThemeAxesInput = Partial<ThemeAxes>;

/** The data of one `packages/styles/<id>/style.json`. See section 3.7 of PLAN.md. */
export interface StyleData {
  id: string;
  name: string;
  extends?: string;
  /** `proposed` until the owner approves the look. */
  status?: 'stable' | 'proposed';
  schemes: readonly Scheme[];
  /** Schemes that ship but wait for the owner, for example Desk light. */
  proposedSchemes?: readonly Scheme[];
  defaultScheme: Scheme;
  defaultDensity: Density;
  iconSet: string;
  motionPreset: string;
  usesGlass: boolean;
  /** Component name (kebab case `data-ds` value) to the optional parts this style turns on. */
  optionalParts: Readonly<Record<string, readonly string[]>>;
  fonts: { sans: string; arabic: string };
  dials: Readonly<Record<string, string>>;
}

/** The resolved axes plus the active style.json data. */
export interface ThemeValue extends ThemeAxes {
  styleData: StyleData;
}

/** The attributes a web theme element carries. Spread them on any element, <html> included. */
export interface ThemeAttributes {
  'data-ds': 'theme';
  'data-style': string;
  'data-scheme': Scheme;
  'data-density': Density;
  'data-contrast': Contrast;
  'data-platform': Platform;
  'data-glass': Glass;
  dir: Dir;
  lang: string;
}

/**
 * Root defaults a platform knows better than the web: React Native passes the
 * device's platform, I18nManager's direction and the system contrast. They
 * apply only at the root (no parent) and only when the input is silent.
 */
export interface ThemeRootDefaults {
  platform?: Platform;
  contrast?: Contrast;
  dir?: Dir;
}

/** The style a root theme uses when none is passed. */
export const DEFAULT_STYLE = 'studio';

const registry = styles as unknown as Readonly<Record<string, StyleData>>;

/** Ids of every style in the registry. */
export const styleIds: readonly string[] = Object.keys(registry);

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

/**
 * Resolves every axis. Order for each axis: the input, then the parent
 * theme, then the root default. Root defaults: style `studio`, scheme and
 * density from the style's style.json, contrast `default`, platform `web`,
 * glass `regular`, lang `en` (each of platform, contrast and dir may come
 * from `root` instead, see ThemeRootDefaults).
 *
 * - A scheme the style does not list falls back to the style's default scheme.
 * - `dir` follows `lang` when `lang` is passed and `dir` is not: `lang="ar"`
 *   alone gives `rtl`. Otherwise `dir` comes from the parent, then from
 *   `root.dir`, then from `lang`.
 */
export function resolveTheme(input: ThemeAxesInput, parent?: ThemeAxes | null, root: ThemeRootDefaults = {}): ThemeValue {
  const style = input.style ?? parent?.style ?? DEFAULT_STYLE;
  const styleData = getStyleData(style);
  const wanted = input.scheme ?? parent?.scheme ?? styleData.defaultScheme;
  const scheme = styleData.schemes.includes(wanted) ? wanted : styleData.defaultScheme;
  const lang = input.lang ?? parent?.lang ?? 'en';
  const dir = input.dir ?? (input.lang !== undefined ? directionOf(input.lang) : parent ? parent.dir : (root.dir ?? directionOf(lang)));
  return {
    style,
    scheme,
    density: input.density ?? parent?.density ?? styleData.defaultDensity,
    contrast: input.contrast ?? (parent ? parent.contrast : (root.contrast ?? 'default')),
    platform: input.platform ?? (parent ? parent.platform : (root.platform ?? 'web')),
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

/**
 * Resolves the axes as a root theme would and returns the attributes to
 * spread on any element. Use it to stamp <html> or <body> so the whole
 * viewport is themed.
 */
export function themeAttributes(axes: ThemeAxesInput = {}): ThemeAttributes {
  return attributesOf(resolveTheme(axes, null));
}
