// The axis query keys from docs/contracts/anatomy.md, the same as the React
// gallery (apps/gallery-react/src/axes.ts):
// /c/<slug>?style=&scheme=&density=&platform=&dir=&lang=&contrast=&glass=
// Extra keys: case=<id> shows one case, chrome=0 hides the shell.
import { styleIds, type ThemeAxesInput } from '@the-system/angular';

export interface AxisControl {
  key: keyof ThemeAxesInput;
  label: string;
  values: readonly string[];
}

export const axisControls: readonly AxisControl[] = [
  { key: 'style', label: 'Style', values: styleIds },
  { key: 'scheme', label: 'Scheme', values: ['dark', 'light'] },
  { key: 'density', label: 'Density', values: ['compact', 'default', 'comfortable'] },
  { key: 'platform', label: 'Platform', values: ['web', 'ios', 'android'] },
  { key: 'dir', label: 'Direction', values: ['ltr', 'rtl'] },
  { key: 'lang', label: 'Language', values: ['en', 'ar'] },
  { key: 'contrast', label: 'Contrast', values: ['default', 'more'] },
  { key: 'glass', label: 'Glass', values: ['clear', 'regular', 'tinted'] },
];

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
export function nameOf(slug: string): string {
  return slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
}
