// The axes the gallery controls, and how the web export reads them from the
// query string: ?style=desk&scheme=light&dir=rtl&lang=ar&screen=Button&case=variants&chrome=0
import { styleIds, type ThemeAxesInput } from '@the-system/native';

export interface AxisControl {
  key: 'style' | 'scheme' | 'density' | 'contrast' | 'dir' | 'lang';
  label: string;
  values: readonly string[];
}

export const axisControls: readonly AxisControl[] = [
  { key: 'style', label: 'Style', values: styleIds },
  { key: 'scheme', label: 'Scheme', values: ['dark', 'light'] },
  { key: 'density', label: 'Density', values: ['compact', 'default', 'comfortable'] },
  { key: 'contrast', label: 'Contrast', values: ['default', 'more'] },
  { key: 'dir', label: 'Direction', values: ['ltr', 'rtl'] },
  { key: 'lang', label: 'Language', values: ['en', 'ar'] },
];

export interface GalleryState {
  axes: ThemeAxesInput;
  screen?: string;
  caseId?: string;
  chrome: boolean;
}

/** Reads the gallery state from a query string. Unknown values are dropped. */
export function readQuery(search: string): GalleryState {
  const params = new URLSearchParams(search);
  const axes: Record<string, string> = {};
  for (const control of axisControls) {
    const value = params.get(control.key);
    if (value !== null && control.values.includes(value)) axes[control.key] = value;
  }
  const caseId = params.get('case') ?? undefined;
  return {
    axes: axes as ThemeAxesInput,
    screen: params.get('screen') ?? undefined,
    caseId: caseId && /^[a-z-]+$/.test(caseId) ? caseId : undefined,
    chrome: params.get('chrome') !== '0',
  };
}

/** The query string for a gallery state, for the address bar of the web export. */
export function writeQuery(state: GalleryState): string {
  const params = new URLSearchParams();
  for (const control of axisControls) {
    const value = state.axes[control.key];
    if (value !== undefined) params.set(control.key, value);
  }
  if (state.screen) params.set('screen', state.screen);
  if (state.caseId) params.set('case', state.caseId);
  if (!state.chrome) params.set('chrome', '0');
  const s = params.toString();
  return s ? `?${s}` : '';
}
