// The axis query keys from docs/contracts/anatomy.md, the same as the React
// gallery (apps/gallery-react/src/axes.ts):
// /c/<slug>?style=&scheme=&density=&platform=&dir=&lang=&contrast=&glass=
// Extra keys: case=<id> shows one case, chrome=0 hides the shell.
//
// Platform follows the resolution order of docs/contracts/frameworks.md,
// "Platform axis": the URL key, then the choice stored by the switcher in
// the bar, then `auto`, which the root dsTheme resolves from the device.
import {
  PLATFORM_QUERY_KEY,
  PLATFORM_STORAGE_KEY,
  platformChoice,
  platformInputOf,
  platforms,
  styleIds,
  type Platform,
  type PlatformInput,
  type ThemeAxesInput,
} from '@the-system/angular';

export interface AxisControl {
  key: keyof ThemeAxesInput;
  label: string;
  values: readonly string[];
}

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
 * (studio); only the gallery opens on Neutral. The same in the React gallery.
 */
export const GALLERY_STYLE = 'neutral';

/** Reads the axes from the query. Unknown values are dropped. */
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

/** button -> Button, icon-button -> IconButton: the React component name. */
/** Slug words that the component name writes in capitals, as the React gallery reads them from the manifest. */
const ACRONYMS: Record<string, string> = { otp: 'OTP' };

export function nameOf(slug: string): string {
  return slug.replace(/(^|-)([a-z0-9]+)/g, (_, __, word: string) => ACRONYMS[word] ?? word.charAt(0).toUpperCase() + word.slice(1));
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
 * choice, else `auto`. The root dsTheme runs step 4 (the device).
 */
export function readPlatform(params: URLSearchParams, stored: Platform | undefined): { input: PlatformInput; source: PlatformSource } {
  const query = params.get(PLATFORM_QUERY_KEY);
  const input = platformInputOf({ query, stored });
  const source: PlatformSource = platformChoice(query) ? 'url' : input !== 'auto' ? 'stored' : 'device';
  return { input, source };
}

/** The line in the bar: what the device is, and what the page shows when that differs. */
export function platformNote(device: Platform, source: PlatformSource, shown: Platform): string {
  if (source === 'device') return `Detected ${device}`;
  const from = source === 'url' ? 'from the address' : 'from your choice';
  return `Detected ${device}, showing ${shown} ${from}`;
}
