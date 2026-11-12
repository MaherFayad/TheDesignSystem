// Axis types for Theme. The values come from the runtime axes table in
// docs/contracts/frameworks.md. Angular and React Native use the same names.
import type { StyleId } from '@the-system/styles/registry';

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

/** What a Theme or `themeAttributes` takes: any axis may be left out. */
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
  /** Component name (lowercase) to the optional parts this style turns on. */
  optionalParts: Readonly<Record<string, readonly string[]>>;
  fonts: { sans: string; arabic: string };
  dials: Readonly<Record<string, string>>;
}

/** What `useTheme()` returns: the resolved axes plus the active style.json data. */
export interface ThemeValue extends ThemeAxes {
  styleData: StyleData;
}

/** The attributes a Theme element carries. Spread them on any element, <html> included. */
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
