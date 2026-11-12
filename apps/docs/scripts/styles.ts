// The style packs, read from disk: every packages/styles/<id>/style.json, so a
// new style appears on the site with no change here. Token values come from
// the built token CSS (packages/tokens/dist/css/tokens.css), with var()
// references resolved, for the palette, radius and type tables.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './manifests.ts';

export interface StylePack {
  id: string;
  name: string;
  status: string;
  schemes: string[];
  defaultScheme?: string;
  defaultDensity?: string;
  iconSet?: string;
  motionPreset?: string;
  usesGlass?: boolean;
  fonts?: Record<string, string>;
  dials: Record<string, string>;
}

const stylesDir = join(repoRoot, 'packages', 'styles');
export const tokenCssPath = join(repoRoot, 'packages', 'tokens', 'dist', 'css', 'tokens.css');

export function readStyles(): StylePack[] {
  if (!existsSync(stylesDir)) return [];
  const ids = readdirSync(stylesDir).filter((id) => existsSync(join(stylesDir, id, 'style.json')));
  const packs = ids.map((id) => {
    const raw = JSON.parse(readFileSync(join(stylesDir, id, 'style.json'), 'utf8')) as Partial<StylePack>;
    return {
      id,
      name: raw.name ?? id,
      status: raw.status ?? 'proposed',
      schemes: raw.schemes ?? ['light', 'dark'],
      defaultScheme: raw.defaultScheme,
      defaultDensity: raw.defaultDensity,
      iconSet: raw.iconSet,
      motionPreset: raw.motionPreset,
      usesGlass: raw.usesGlass,
      fonts: raw.fonts,
      dials: raw.dials ?? {},
    } satisfies StylePack;
  });
  // Neutral first: the docs and the gallery open on it.
  return packs.sort((a, b) => (a.id === 'neutral' ? -1 : b.id === 'neutral' ? 1 : a.name.localeCompare(b.name, 'en')));
}

type Block = Map<string, string>;
let cache: { base: Block; schemes: Map<string, Block> } | undefined;

function parseBlock(body: string): Block {
  const out: Block = new Map();
  for (const m of body.matchAll(/(--ds-[a-z0-9-]+)\s*:\s*([^;]+);/g)) out.set(m[1] ?? '', (m[2] ?? '').trim());
  return out;
}

function parse(): { base: Block; schemes: Map<string, Block> } {
  if (cache) return cache;
  const css = existsSync(tokenCssPath) ? readFileSync(tokenCssPath, 'utf8') : '';
  const base = parseBlock(/:root,\s*\[data-style\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '');
  const schemes = new Map<string, Block>();
  for (const m of css.matchAll(/\[data-style='([a-z0-9-]+)'\]\[data-scheme='([a-z]+)'\]\s*\{([^}]*)\}/g)) {
    schemes.set(`${m[1]}/${m[2]}`, parseBlock(m[3] ?? ''));
  }
  cache = { base, schemes };
  return cache;
}

/** The value of a token for a style and scheme, with var() references resolved. Undefined when unknown. */
export function tokenValue(style: string, scheme: string, name: string, depth = 0): string | undefined {
  const { base, schemes } = parse();
  const raw = schemes.get(`${style}/${scheme}`)?.get(name) ?? base.get(name);
  if (raw === undefined || depth > 12) return raw;
  return raw.replace(/var\((--ds-[a-z0-9-]+)(?:,\s*([^)]+))?\)/g, (_, ref: string, fallback?: string) => tokenValue(style, scheme, ref, depth + 1) ?? fallback ?? ref);
}

/** The palette shown on a style page: role, token, in reading order. */
export const paletteTokens: { role: { en: string; ar: string }; token: string }[] = [
  { role: { en: 'Page', ar: 'خلفية الصفحة' }, token: '--ds-color-bg-body' },
  { role: { en: 'Surface', ar: 'السطح' }, token: '--ds-color-bg-surface' },
  { role: { en: 'Raised surface', ar: 'السطح المرتفع' }, token: '--ds-color-bg-surface-3' },
  { role: { en: 'Border', ar: 'الحد' }, token: '--ds-color-border-default' },
  { role: { en: 'Text', ar: 'النص' }, token: '--ds-color-text-default' },
  { role: { en: 'Muted text', ar: 'النص الثانوي' }, token: '--ds-color-text-muted' },
  { role: { en: 'Primary', ar: 'اللون الأساسي' }, token: '--ds-color-primary-fill' },
  { role: { en: 'Focus ring', ar: 'حلقة التركيز' }, token: '--ds-color-focus-ring' },
  { role: { en: 'Danger', ar: 'الخطر' }, token: '--ds-color-state-danger-solid' },
  { role: { en: 'Success', ar: 'النجاح' }, token: '--ds-color-state-success-solid' },
  { role: { en: 'Warning', ar: 'التحذير' }, token: '--ds-color-state-warning-solid' },
  { role: { en: 'Info', ar: 'المعلومة' }, token: '--ds-color-state-info-solid' },
];

export const radiusTokens = ['--ds-radius-xs', '--ds-radius-sm', '--ds-radius-control', '--ds-radius-field', '--ds-radius-card', '--ds-radius-panel', '--ds-radius-window', '--ds-radius-pill'];

export const typeTokens = ['--ds-font-size-xs', '--ds-font-size-s', '--ds-font-size-m', '--ds-font-size-l', '--ds-font-size-xl', '--ds-font-size-2xl', '--ds-font-size-3xl'];

/** Every color token name of a style and scheme, for the tokens foundation page. */
export function colorTokenNames(style: string, scheme: string): string[] {
  const { schemes } = parse();
  return [...(schemes.get(`${style}/${scheme}`)?.keys() ?? [])].filter((n) => n.startsWith('--ds-color-')).sort();
}
