'use client';
import { use } from 'react';
import { ThemeContext } from './context';
import { resolveTheme } from './resolve';
import type { ThemeValue } from './types';

const rootDefaults = resolveTheme({}, null);

/**
 * The resolved axes of the nearest Theme plus its style.json data
 * (`styleData`). Outside any Theme it returns the root defaults.
 */
export function useTheme(): ThemeValue {
  return use(ThemeContext) ?? rootDefaults;
}

/**
 * True when the active style turns on an optional part, that is when its
 * style.json lists `part` under `optionalParts[component]`. Component names
 * are the kebab case `data-ds` value: `useOptionalPart('window', 'controls')`.
 */
export function useOptionalPart(component: string, part: string): boolean {
  const { styleData } = useTheme();
  return styleData.optionalParts[component]?.includes(part) ?? false;
}
