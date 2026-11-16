// The axis query keys from docs/contracts/anatomy.md:
// /c/<slug>?style=&scheme=&density=&platform=&dir=&lang=&contrast=&glass=
// Extra keys: case=<id> shows one case, chrome=0 hides the shell.
//
// Platform follows the resolution order of docs/contracts/frameworks.md,
// "Platform axis": the URL key, then the choice stored by the switcher in
// the bar, then `auto`, which the root Theme resolves from the device.
import { PLATFORM_QUERY_KEY, PLATFORM_STORAGE_KEY, platformChoice, platformInputOf, platforms, styleIds, type Platform, type PlatformInput, type ThemeAxesInput } from '@the-system/react';

export interface AxisControl {
  key: keyof ThemeAxesInput;
  label: string;
  values: readonly string[];
}

/** The axes the shell offers, in the order of the query string. */
export const axisControls: readonly AxisControl[] = [
  { key: 'style', label: 'Style', values: styleIds },
  { key: 'scheme', label: 'Scheme', values: ['dark', 'light'] },
  { key: 'density', label: 'Density', values: ['compact', 'default', 'comfortable'] },
  { key: 'platform', label: 'Platform', values: platforms },
  { key: 'dir', label: 'Direction', values: ['ltr', 'rtl'] },
  { key: 'lang', label: 'Language', values: ['en', 'ar'] },
  { key: 'contrast', label: 'Contrast', values: ['default', 'more'] },
  { key: 'glass', label: 'Glass', values: ['clear', 'regular', 'tinted'] },
];

/**
 * The style the gallery shows when the query asks for none, or for one that
 * is not in the registry. The Theme's own fallback stays DEFAULT_STYLE
 * (studio); only the gallery opens on Neutral.
 */
export const GALLERY_STYLE = 'neutral';

/** Gallery keys that are not axes. */
export const extraKeys = ['case', 'chrome'] as const;

/**
 * Reads the axes from the query. Unknown values are dropped, so the Theme
 * falls back to its defaults. Style and lang accept any id or tag, the
 * contract allows custom styles and languages.
 */
export function readAxes(params: URLSearchParams): ThemeAxesInput {
  const out: Record<string, string> = {};
  for (const control of axisControls) {
    const value = params.get(control.key);
    if (!value) continue;
    const open = control.key === 'style' || control.key === 'lang';
    if (open ? /^[a-z][a-z0-9-]*$/i.test(value) : control.values.includes(value)) out[control.key] = value;
  }
  return out as ThemeAxesInput;
}

/** The axis part of a query, for links that keep the current axes. */
export function axisQuery(params: URLSearchParams): string {
  const keep = new URLSearchParams();
  for (const control of axisControls) {
    const value = params.get(control.key);
    if (value) keep.set(control.key, value);
  }
  const s = keep.toString();
  return s ? `?${s}` : '';
}

/** Case ids are kebab case words. Anything else is ignored. */
export function readCase(params: URLSearchParams): string | undefined {
  const value = params.get('case');
  return value && /^[a-z0-9-]+$/.test(value) ? value : undefined;
}

/**
 * The platform choice stored by the switcher, or `undefined`. Storage can be
 * missing or throw (a private window, blocked site data); then there is none.
 */
export function readStoredPlatform(): Platform | undefined {
  try {
    return platformChoice(window.localStorage.getItem(PLATFORM_STORAGE_KEY));
  } catch {
    return undefined;
  }
}

/** Stores a choice made in the switcher. `auto` clears it, as the contract says. */
export function storePlatform(choice: PlatformInput): void {
  try {
    if (choice === 'auto') window.localStorage.removeItem(PLATFORM_STORAGE_KEY);
    else window.localStorage.setItem(PLATFORM_STORAGE_KEY, choice);
  } catch {
    // Nothing stored: the URL key still carries the choice for this visit.
  }
}

/** Where the gallery's platform input came from, shown in the bar. */
export type PlatformSource = 'url' | 'stored' | 'device';

/**
 * Steps 2 and 3 of the resolution order: the URL key, then the stored
 * choice, else `auto`. The root Theme runs step 4 (the device) after mount.
 */
export function readPlatform(params: URLSearchParams, stored: Platform | undefined): { input: PlatformInput; source: PlatformSource } {
  const query = params.get(PLATFORM_QUERY_KEY);
  const input = platformInputOf({ query, stored });
  const source: PlatformSource = platformChoice(query) ? 'url' : input !== 'auto' ? 'stored' : 'device';
  return { input, source };
}
