'use client';
import { use, useSyncExternalStore } from 'react';
import { detectPlatform, deviceOf } from '@the-system/shared';
import { ThemeContext } from './context';
import { resolveTheme } from './resolve';
import type { Platform, ThemeValue } from './types';

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

const noopSubscribe = () => () => {};
const clientPlatform = (): Platform => detectPlatform(deviceOf(typeof navigator === 'undefined' ? undefined : navigator));
const serverPlatform = (): Platform => 'web';

/**
 * The platform `auto` resolves to on this device: `ios`, `android` or `web`,
 * never `macos`. The server render and the hydrating render use `web`, so the
 * markup matches; React then renders once more with the detected value, with
 * no hydration warning. A client only render reads it on its first render.
 * `navigator` is read only from React, never at module scope.
 */
export function useDevicePlatform(): Platform {
  return useSyncExternalStore(noopSubscribe, clientPlatform, serverPlatform);
}
