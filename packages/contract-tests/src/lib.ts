// Pure helpers for the contract suite. Nothing here touches a browser, so the
// unit tests in lib.test.ts cover all of it. The suite reads only manifests,
// style.json files and the gallery URL contract, never framework details.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type Framework = 'react' | 'angular' | 'native';

/** What a contract.keys entry asks the suite to check after one key press. */
export type KeyExpect = 'focus-moves' | 'value-changes' | 'state-changes' | 'click' | 'closes';

export interface KeyHint {
  /** A selector inside the demo to focus first. Default: the first enabled root, or its first tab stop. */
  focus?: string;
  /** A demo case id to look in. Default: the whole demo. */
  case?: string;
  expect: KeyExpect;
}

export interface ContractHints {
  trigger?: string;
  optionalParts?: string[];
  skipAxeRules?: string[];
  keys?: Record<string, KeyHint>;
}

export interface Manifest {
  name: string;
  kind: string;
  anatomy?: string[];
  props?: Record<string, unknown>;
  states?: string[];
  a11y?: { role?: string; focus?: string; keys?: Record<string, string> };
  frameworks: Record<string, { status: string }>;
  contract?: ContractHints;
}

export interface StyleInfo {
  id: string;
  schemes: string[];
  defaultScheme: string;
  /** Parts per component kebab that only this style shows. */
  optionalParts: Record<string, string[]>;
}

/** The shared words of docs/contracts/anatomy.md. Overlays may add xl and 2xl. */
export const SHARED_AXES: Record<string, readonly string[]> = {
  size: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
  tone: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'],
  emphasis: ['solid', 'soft', 'outline', 'ghost', 'link'],
  shape: ['default', 'pill', 'square'],
};

/** Boolean state attributes from the anatomy contract. */
export const BOOLEAN_STATES = ['data-disabled', 'data-loading', 'data-invalid', 'data-readonly', 'data-selected', 'data-dragging'];

/** Attributes in manifest `states` that carry a value, not a boolean. */
const VALUED_STATES = new Set(['data-state', 'data-orientation']);

/** Demo case ids in contract order. */
export const DEMO_CASES = ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly'];

/** IconButton to icon-button, OTPField to otp-field. */
export function kebabCase(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/** The list of values a prop takes, when it is an enum. `["sm","md"]` or `{ type: ["sm","md"] }`. */
export function propValues(prop: unknown): string[] | undefined {
  if (Array.isArray(prop)) return prop.filter((v): v is string => typeof v === 'string');
  if (prop && typeof prop === 'object' && 'type' in prop) {
    const t = (prop as { type: unknown }).type;
    if (Array.isArray(t)) return t.filter((v): v is string => typeof v === 'string');
  }
  return undefined;
}

/** The shared axes the manifest declares, with their values. */
export function manifestAxes(m: Manifest): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const axis of Object.keys(SHARED_AXES)) {
    const values = propValues(m.props?.[axis]);
    if (values) out[axis] = values;
  }
  return out;
}

/** Manifest values on a shared axis that are not shared words. */
export function nonSharedWords(m: Manifest): string[] {
  const out: string[] = [];
  for (const [axis, values] of Object.entries(manifestAxes(m))) {
    for (const v of values) if (!SHARED_AXES[axis]?.includes(v)) out.push(`props.${axis} has "${v}", not a shared word (${SHARED_AXES[axis]?.join(', ')})`);
  }
  return out;
}

/** Boolean state attributes to check: the contract list plus data-* booleans the manifest names. */
export function booleanStates(m: Manifest): string[] {
  const extra = (m.states ?? []).filter((s) => s.startsWith('data-') && !VALUED_STATES.has(s));
  return [...new Set([...BOOLEAN_STATES, ...extra])];
}

/** Values of data-state the manifest allows: the states that are not attribute names. */
export function dataStateValues(m: Manifest): string[] {
  return (m.states ?? []).filter((s) => !s.startsWith('data-') && /^[a-z][a-z0-9-]*$/.test(s));
}

/** True when the manifest says the component opens and closes. */
export function opensAndCloses(m: Manifest): boolean {
  const s = dataStateValues(m);
  return s.includes('open') && s.includes('closed');
}

/**
 * Splits a keyboard map entry into key names Playwright can press.
 * "Home, End" gives Home and End. "Enter or Space" gives Enter and Space.
 * "Shift+Tab" stays one chord.
 */
export function splitKeys(entry: string): string[] {
  return entry
    .split(/\s*,\s*|\s+or\s+|\s*\/\s*/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export type KeyCheck = 'tab' | 'shift-tab' | 'activate' | 'escape' | 'hint' | 'none';

/** Which generic check fits a key, before looking at the page. */
export function keyCheckFor(key: string, m: Manifest): KeyCheck {
  if (m.contract?.keys?.[key]) return 'hint';
  if (key === 'Tab') return 'tab';
  if (key === 'Shift+Tab') return 'shift-tab';
  if (key === 'Enter' || key === 'Space') return 'activate';
  if (key === 'Escape') return opensAndCloses(m) ? 'escape' : 'none';
  return 'none';
}

/**
 * Parts that may be missing under one style: contract.optionalParts, plus the
 * parts some style pack shows only in its own style (style.json
 * optionalParts[<kebab>]) when the style under test is not one of them. The
 * style that lists a part shows it, so there the part is required unless the
 * manifest marks it optional.
 */
export function optionalParts(m: Manifest, styles: StyleInfo[], styleId?: string): string[] {
  const kebab = kebabCase(m.name);
  const own = styles.find((s) => s.id === styleId)?.optionalParts[kebab] ?? [];
  const fromStyles = styles.flatMap((s) => s.optionalParts[kebab] ?? []).filter((p) => !own.includes(p));
  return [...new Set([...(m.contract?.optionalParts ?? []), ...fromStyles])];
}

/** The selector that opens the component: contract.trigger, else [data-demo-trigger]. */
export function triggerSelector(m: Manifest): string {
  return m.contract?.trigger ?? '[data-demo-trigger]';
}

/**
 * True when the manifest says focus stays inside while it is open: the role
 * or the Tab entry names a modal or a trap, and does not say "not modal".
 * Only the component's own role and Tab entry count, so a sentence about
 * another component (a toast above a modal dialog) does not.
 */
export function trapsFocus(m: Manifest): boolean {
  const text = [m.a11y?.role ?? '', m.a11y?.keys?.Tab ?? ''].join(' ');
  if (/\bnot modal\b|\bnon[- ]modal\b/i.test(text)) return false;
  return /\bmodal\b|focus (is )?trapped|traps focus|keeps focus inside|stays inside|wraps from the last/i.test(text);
}

/**
 * Where a run writes its JSON. A full run writes the main report in
 * docs/reports. A run narrowed with --component writes a partial report under
 * packages/contract-tests/.out/<pid>/, so it never clobbers the full one.
 */
export function reportFile(repo: string, framework: string, partial: boolean, pid: number): string {
  return partial ? join(repo, 'packages/contract-tests/.out', String(pid), `contract-${framework}.partial.json`) : join(repo, 'docs/reports', `contract-${framework}.json`);
}

/** Class names that look like a state written as a class. */
export function stateClasses(className: string): string[] {
  const words = new Set(['active', 'disabled', 'selected', 'loading', 'invalid', 'readonly', 'checked', 'open', 'closed', 'expanded', 'pressed', 'focused', 'hover']);
  return className
    .split(/\s+/)
    .filter((c) => c.length > 0)
    .filter((c) => /^is-/.test(c) || /--(?:[a-z]+-)?(active|disabled|selected|loading|invalid|readonly|checked|open|closed|expanded|pressed)$/.test(c) || words.has(c));
}

/** One data-part as the page scan reports it. */
export interface PartHit {
  root: number;
  part: string;
  where: string;
}

export interface AnatomyScan {
  roots: number;
  /** Roots that also carry data-part="root". */
  rootPart: string[];
  parts: PartHit[];
}

/** Compares a page scan with the manifest anatomy. Returns failures. */
export function anatomyFindings(anatomy: string[], optional: string[], scan: AnatomyScan): string[] {
  const out: string[] = [];
  if (scan.roots === 0) return ['no root element found'];
  const allowed = new Set(anatomy);
  const seen = new Set(scan.parts.map((p) => p.part));
  for (const part of anatomy) {
    if (part === 'root' || optional.includes(part)) continue;
    if (!seen.has(part)) out.push(`part "${part}" is in the anatomy but no root on the page renders [data-part="${part}"]`);
  }
  const unknown = new Map<string, string>();
  for (const p of scan.parts) if (!allowed.has(p.part) && !unknown.has(p.part)) unknown.set(p.part, p.where);
  for (const [part, where] of unknown) out.push(`data-part="${part}" is not in the anatomy (${where})`);
  for (const where of scan.rootPart) out.push(`a root carries data-part="root"; the root is the element with data-ds and has no data-part (${where})`);
  return out;
}

export interface VariantRoot {
  attrs: Record<string, string>;
  inVariants: boolean;
  where: string;
}

/** Compares root variant attributes with the manifest props. Returns failures. */
export function variantFindings(m: Manifest, roots: VariantRoot[], hasVariantsCase: boolean): string[] {
  const out = [...nonSharedWords(m)];
  const axes = manifestAxes(m);
  for (const r of roots) {
    for (const [axis, value] of Object.entries(r.attrs)) {
      const shared = SHARED_AXES[axis] ?? [];
      if (!shared.includes(value)) out.push(`data-${axis}="${value}" is not a shared word (${shared.join(', ')}) (${r.where})`);
      else if (!axes[axis]) out.push(`data-${axis}="${value}" on a root, but the manifest has no ${axis} prop (${r.where})`);
      else if (!axes[axis].includes(value)) out.push(`data-${axis}="${value}" is not in props.${axis} (${axes[axis].join(', ')}) (${r.where})`);
    }
  }
  const axisNames = Object.keys(axes);
  if (axisNames.length > 0) {
    if (!hasVariantsCase) {
      out.push(`the manifest declares ${axisNames.join(', ')} but the demo has no variants case`);
    } else {
      for (const axis of axisNames) {
        const shown = new Set(roots.filter((r) => r.inVariants).map((r) => r.attrs[axis]).filter((v) => v !== undefined));
        const missing = (axes[axis] ?? []).filter((v) => !shown.has(v));
        if (missing.length > 0) out.push(`variants case never shows data-${axis}: ${missing.join(', ')}`);
      }
    }
  }
  return out;
}

export interface StateHit {
  where: string;
  /** Boolean state attributes present, with their value. */
  booleans: Record<string, string>;
  dataState: string | null;
  className: string;
}

/** Checks state attributes and state classes on roots and parts. Returns failures. */
export function stateFindings(m: Manifest, hits: StateHit[]): string[] {
  const out: string[] = [];
  const allowedStates = dataStateValues(m);
  for (const h of hits) {
    for (const [attr, value] of Object.entries(h.booleans)) {
      if (value !== '') out.push(`${attr}="${value}": a boolean state is present with an empty value, never a word (${h.where})`);
    }
    if (h.dataState !== null && !allowedStates.includes(h.dataState)) {
      out.push(`data-state="${h.dataState}" is not in the manifest states (${allowedStates.join(', ') || 'none listed'}) (${h.where})`);
    }
    const bad = stateClasses(h.className);
    if (bad.length > 0) out.push(`state written as a class: ${bad.join(', ')} (${h.where})`);
  }
  return out;
}

/** Reads every manifest from manifests.gen.json. */
export function loadManifests(root: string): Manifest[] {
  const file = join(root, 'packages/manifest/manifests.gen.json');
  const data = JSON.parse(readFileSync(file, 'utf8')) as Manifest[] | { manifests: Manifest[] };
  return Array.isArray(data) ? data : data.manifests;
}

/** Components ready for a framework, optionally narrowed to some names. */
export function readyComponents(all: Manifest[], framework: string, only: string[] = []): Manifest[] {
  const wanted = only.map((n) => n.toLowerCase());
  return all
    .filter((m) => m.kind === 'component' && m.frameworks[framework]?.status === 'ready')
    .filter((m) => wanted.length === 0 || wanted.includes(m.name.toLowerCase()) || wanted.includes(kebabCase(m.name)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Reads packages/styles/<id>/style.json for every style that has one. */
export function discoverStyles(root: string): StyleInfo[] {
  const dir = join(root, 'packages/styles');
  if (!existsSync(dir)) return [];
  const out: StyleInfo[] = [];
  for (const id of readdirSync(dir).sort()) {
    const file = join(dir, id, 'style.json');
    if (!existsSync(file)) continue;
    const s = JSON.parse(readFileSync(file, 'utf8')) as Partial<StyleInfo> & { id?: string };
    const schemes = Array.isArray(s.schemes) && s.schemes.length > 0 ? s.schemes : ['dark'];
    out.push({
      id: s.id ?? id,
      schemes,
      defaultScheme: s.defaultScheme ?? schemes[0] ?? 'dark',
      optionalParts: s.optionalParts ?? {},
    });
  }
  return out;
}

/** The default style: the default of the Theme manifest's style prop, else the first style found. */
export function defaultStyle(all: Manifest[], styles: StyleInfo[]): StyleInfo | undefined {
  const theme = all.find((m) => m.name === 'Theme');
  const prop = theme?.props?.style;
  const id = prop && typeof prop === 'object' && 'default' in prop ? String((prop as { default: unknown }).default) : undefined;
  return styles.find((s) => s.id === id) ?? styles[0];
}

export interface Axes {
  style?: string;
  scheme?: string;
  /** compact, default or comfortable. Left out of the URL when not set. */
  density?: string;
  dir: 'ltr' | 'rtl';
  lang: 'en' | 'ar';
  case?: string;
}

/** The gallery URL for a component, from the URL contract. Always chrome=0. */
export function demoPath(kebab: string, axes: Axes): string {
  const q = new URLSearchParams();
  if (axes.style) q.set('style', axes.style);
  if (axes.scheme) q.set('scheme', axes.scheme);
  if (axes.density) q.set('density', axes.density);
  q.set('dir', axes.dir);
  q.set('lang', axes.lang);
  if (axes.case) q.set('case', axes.case);
  q.set('chrome', '0');
  return `/c/${kebab}?${q.toString()}`;
}

/** The densities of the runtime axes in PLAN.md section 3.2. */
export const DENSITIES = ['compact', 'default', 'comfortable'] as const;

/**
 * A control, for the density shots and the target size pass: the manifest has
 * a size prop on the control scale (no overlay sizes xl or 2xl), the
 * component is focusable (a11y.focus does not say "never focusable") and it
 * does not open and close. Read from manifest data, not from a name list.
 */
export function isControl(m: Manifest): boolean {
  const sizes = propValues(m.props?.size);
  if (!sizes || sizes.length === 0) return false;
  if (sizes.some((s) => s === 'xl' || s === '2xl')) return false;
  if (/never focusable|not focusable/i.test(m.a11y?.focus ?? '')) return false;
  return !opensAndCloses(m);
}

/** The axe matrix: every style and scheme, in en ltr and ar rtl. */
export function axeMatrix(styles: StyleInfo[]): Axes[] {
  const out: Axes[] = [];
  for (const s of styles) {
    for (const scheme of s.schemes) {
      out.push({ style: s.id, scheme, dir: 'ltr', lang: 'en' });
      out.push({ style: s.id, scheme, dir: 'rtl', lang: 'ar' });
    }
  }
  return out;
}

/** Minimal shapes of an axe result, so this file does not import axe. */
export interface AxeCheck {
  id: string;
  data?: unknown;
  message?: string;
}
export interface AxeNode {
  target: unknown[];
  html: string;
  any: AxeCheck[];
  all: AxeCheck[];
  none: AxeCheck[];
  failureSummary?: string;
}
export interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  nodes: AxeNode[];
}

/** One line per failing node. Color contrast lines carry both colors and the ratio. */
export function formatAxe(violations: AxeViolation[], owners: Record<string, string> = {}): string[] {
  const out: string[] = [];
  for (const v of violations) {
    for (const n of v.nodes) {
      const target = n.target.map(String).join(' ');
      const owner = owners[target] ? ` in ${owners[target]}` : '';
      const html = n.html.replace(/\s+/g, ' ').slice(0, 120);
      if (v.id === 'color-contrast' || v.id === 'color-contrast-enhanced') {
        const check = [...n.any, ...n.all, ...n.none].find((c) => c.id === v.id);
        const d = (check?.data ?? {}) as { fgColor?: string; bgColor?: string; contrastRatio?: number; expectedContrastRatio?: string; fontSize?: string; fontWeight?: string };
        const ratio = d.contrastRatio !== undefined ? `${d.contrastRatio}:1` : 'unknown ratio';
        const colors = d.fgColor && d.bgColor ? `text ${d.fgColor} on ${d.bgColor}` : `colors unknown (${check?.message ?? 'no data'})`;
        out.push(`${v.id}: ${target}${owner}: ${colors}, ${ratio}, needs ${d.expectedContrastRatio ?? '4.5:1'} (${d.fontSize ?? '?'} ${d.fontWeight ?? ''}) ${html}`.trim());
      } else {
        out.push(`${v.id} (${v.impact ?? 'n/a'}): ${v.help}: ${target}${owner}: ${html}`);
      }
    }
  }
  return out;
}
