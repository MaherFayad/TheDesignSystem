// Axis types for the React Native ThemeProvider. Same names and values as the
// web Theme (packages/react/src/theme/types.ts) and the runtime axes table in
// docs/contracts/frameworks.md.
import type { Theme } from '@the-system/tokens/native';
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

/** What a ThemeProvider takes: any axis may be left out. */
export type ThemeAxesInput = Partial<ThemeAxes>;

/** The data of one `packages/styles/<id>/style.json`. See section 3.7 of PLAN.md. */
export interface StyleData {
  id: string;
  name: string;
  extends?: string;
  status?: 'stable' | 'proposed';
  schemes: readonly Scheme[];
  proposedSchemes?: readonly Scheme[];
  defaultScheme: Scheme;
  defaultDensity: Density;
  iconSet: string;
  motionPreset: string;
  usesGlass: boolean;
  /** Component name (kebab case) to the optional parts this style turns on. */
  optionalParts: Readonly<Record<string, readonly string[]>>;
  fonts: { sans: string; arabic: string };
  dials: Readonly<Record<string, string>>;
}

/**
 * Where text gets its font family. `theme` uses the family names of the theme
 * object, which the app must load. `system` uses the platform font, for an app
 * that has not loaded the style's fonts (Expo Go on a device: the style packs
 * ship woff2 files only, which iOS and Android cannot register).
 */
export type FontSource = 'theme' | 'system';

/** The system settings the ThemeProvider reads. */
export interface SystemSettings {
  reduceMotion: boolean;
  reduceTransparency: boolean;
}

/** What `useTheme()` returns. */
export interface ThemeValue extends SystemSettings {
  /** Every axis, resolved. */
  axes: ThemeAxes;
  /** The theme object for the axes: style and scheme, then density, then solid materials. */
  theme: Theme;
  /** The active style.json data. */
  styleData: StyleData;
  /** Where text takes its font family. */
  fonts: FontSource;
}
