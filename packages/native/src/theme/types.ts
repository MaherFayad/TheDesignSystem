// Types for the React Native ThemeProvider. The axis types come from
// packages/shared/src/theme.ts, the same ones the web Theme uses.
import type { StyleData, ThemeAxes } from '@the-system/shared';
import type { Theme } from '@the-system/tokens/native';

export type {
  Contrast,
  Density,
  Dir,
  Glass,
  Lang,
  Platform,
  Scheme,
  StyleData,
  ThemeAxes,
  ThemeAxesInput,
  ThemeStyle,
} from '@the-system/shared';

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
