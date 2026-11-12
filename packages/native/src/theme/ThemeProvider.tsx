// ThemeProvider: the React Native side of the runtime axes. It takes the same
// axis props as the web Theme (style, scheme, density, contrast, platform,
// glass, dir, lang), resolves the rest from the nearest parent and then the
// root defaults, and passes the theme object of the generated token build
// (`@the-system/tokens/native`) through context.
//
// It renders no view of its own: a provider has no box on native. The app
// sets the layout direction (I18nManager, or a `direction` style on the web
// export) and components read `axes.dir` for their own box.
import { use, useMemo, type ReactNode } from 'react';
import { I18nManager, Platform as RNPlatform, useColorScheme } from 'react-native';
import { IconSetContext } from '@the-system/icons/native';
import { ThemeContext } from './context';
import { iconStyleFor } from './icons';
import { getStyleData, resolveAxes, themeFor, type DeviceDefaults } from './resolve';
import { useDeviceSettings } from './system';
import type { FontSource, Platform, ThemeAxesInput, ThemeValue } from './types';

export interface ThemeProviderProps extends ThemeAxesInput {
  /**
   * At the root, take the scheme from the device (useColorScheme) when the
   * scheme prop is not passed. Default false: the style's default scheme, the
   * same as the web.
   */
  followSystem?: boolean;
  /**
   * Where text takes its font family. Default: the parent's, and `theme` at
   * the root. Pass `system` when the app has not loaded the style's fonts.
   */
  fonts?: FontSource;
  children?: ReactNode;
}

function devicePlatform(): Platform {
  return RNPlatform.OS === 'ios' || RNPlatform.OS === 'android' ? RNPlatform.OS : 'web';
}

/**
 * Provides the resolved axes and the theme object to `useTheme`. Nest one to
 * change any axis for a subtree. At the root it also reads the device:
 * Platform.OS for the platform, I18nManager.isRTL for the direction,
 * AccessibilityInfo for reduce motion, reduce transparency and more contrast,
 * and useColorScheme for the scheme when `followSystem` is set. Font scale is
 * respected by the components: they never turn allowFontScaling off.
 */
export function ThemeProvider({
  style,
  scheme,
  density,
  contrast,
  platform,
  glass,
  dir,
  lang,
  followSystem = false,
  fonts,
  children,
}: ThemeProviderProps) {
  const parent = use(ThemeContext);
  const colorScheme = useColorScheme();
  const device = useDeviceSettings(parent === null);
  const reduceMotion = parent ? parent.reduceMotion : device.reduceMotion;
  const reduceTransparency = parent ? parent.reduceTransparency : device.reduceTransparency;
  const fontSource: FontSource = fonts ?? parent?.fonts ?? 'theme';
  const scheme0 = colorScheme === 'dark' || colorScheme === 'light' ? colorScheme : null;

  const value = useMemo<ThemeValue>(() => {
    const defaults: DeviceDefaults = {
      platform: devicePlatform(),
      isRTL: I18nManager.isRTL,
      colorScheme: scheme0,
      moreContrast: device.moreContrast,
    };
    const axes = resolveAxes({ style, scheme, density, contrast, platform, glass, dir, lang }, parent?.axes, defaults, followSystem && !parent);
    const theme = themeFor(axes, { solidMaterials: axes.contrast === 'more' || reduceTransparency, fonts: fontSource });
    return { axes, theme, styleData: getStyleData(axes.style), reduceMotion, reduceTransparency, fonts: fontSource };
  }, [style, scheme, density, contrast, platform, glass, dir, lang, parent, scheme0, device.moreContrast, followSystem, reduceMotion, reduceTransparency, fontSource]);

  return (
    <ThemeContext value={value}>
      <IconSetContext value={iconStyleFor(value.styleData)}>{children}</IconSetContext>
    </ThemeContext>
  );
}
