import { use } from 'react';
import { Platform } from 'react-native';
import { ThemeContext } from './context';
import { getStyleData, resolveAxes, themeFor } from './resolve';
import type { ThemeValue } from './types';

let rootDefaults: ThemeValue | undefined;

function defaults(): ThemeValue {
  if (!rootDefaults) {
    const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
    const axes = resolveAxes({}, null, { platform, isRTL: false });
    rootDefaults = {
      axes,
      theme: themeFor(axes, { solidMaterials: false, fonts: 'theme' }),
      styleData: getStyleData(axes.style),
      reduceMotion: false,
      reduceTransparency: false,
      fonts: 'theme',
    };
  }
  return rootDefaults;
}

/**
 * The nearest ThemeProvider's value: `{ axes, theme, styleData, reduceMotion,
 * reduceTransparency, fonts }`. Outside any provider it returns the root
 * defaults (studio, its default scheme), without device settings.
 */
export function useTheme(): ThemeValue {
  return use(ThemeContext) ?? defaults();
}

/**
 * True when the active style turns on an optional part: its style.json lists
 * `part` under `optionalParts[component]`. Component names are kebab case, the
 * same as the web `data-ds` value: `useOptionalPart('window', 'controls')`.
 */
export function useOptionalPart(component: string, part: string): boolean {
  const { styleData } = useTheme();
  return styleData.optionalParts[component]?.includes(part) ?? false;
}
