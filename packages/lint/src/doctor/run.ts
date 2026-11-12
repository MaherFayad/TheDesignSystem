// `ds doctor` as a library: file discovery, config, resources (manifests,
// token names, Angular title inputs), the run, and the report in the
// `{ apiVersion, type, data }` shape the CLI (order 1.14) prints.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { titleInputHosts } from '../angular-inputs';
import { declaredCustomProperties } from '../rules/token-vocabulary';
import { DOCTOR_RULES, checkFile, type DoctorContext, type DoctorFinding, type Severity } from './checks';
import { loadAngularCompiler } from './elements';
import { indexManifests, type Manifest } from './manifests';

export const API_VERSION = 1;

/** Stable error codes. Exit code 2. */
export type DoctorErrorCode = 'DS_E_USAGE' | 'DS_E_NOT_FOUND' | 'DS_E_CONFIG' | 'DS_E_MANIFEST';

export class DoctorError extends Error {
  constructor(
    readonly code: DoctorErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** The consumer config: `ds.doctor.json`, or the `doctor` key of `ds.config.json`, in the checked root. */
export interface DoctorConfig {
  /** Path prefixes (relative to the root) or folder names to skip, on top of the defaults. */
  exclude?: string[];
  /** Path prefixes of touch templates, where size xs is too small. `*` matches within one folder. */
  touch?: string[];
  /** Turn a rule off or change its severity. */
  rules?: Record<string, 'off' | Severity>;
  /** Modules that export the React system components. Default `@the-system/react`. */
  packages?: string[];
  /** Modules that export the React Native system components. Default `@the-system/native`. */
  nativePackages?: string[];
  /** The built tokens.css, relative to the root. Default: found in node_modules or this repo. */
  tokensCss?: string;
  /** manifests.gen.json, relative to the root. Default: found in node_modules or this repo. */
  manifests?: string;
  /** Angular sources to read title inputs from, relative to the root. Default: this repo's packages/angular/src. */
  angularSources?: string;
}

const CONFIG_KEYS = new Set(['exclude', 'touch', 'rules', 'packages', 'nativePackages', 'tokensCss', 'manifests', 'angularSources']);

/** Folders never read. */
export const DEFAULT_EXCLUDED = ['node_modules', 'dist', 'build', 'out', 'coverage', '.next', '.angular', '.expo', '.git', '.turbo', 'test-results', 'playwright-report'];

const EXTENSIONS = /\.(tsx|ts|jsx|js|mjs|cjs|html|css)$/;

export interface DoctorOptions {
  /** A folder or a file. */
  path: string;
  /** Overrides on top of the config file. */
  config?: DoctorConfig;
}

export interface DoctorSummary {
  files: number;
  errors: number;
  warnings: number;
  byRule: Record<string, number>;
  /** Rules that could not run, with the reason. */
  skipped: { ruleId: string; reason: string }[];
}

export interface DoctorReport {
  apiVersion: typeof API_VERSION;
  type: 'doctor.report';
  data: { findings: DoctorFinding[]; summary: DoctorSummary };
}

export interface DoctorErrorReport {
  apiVersion: typeof API_VERSION;
  type: 'error';
  data: { code: DoctorErrorCode; message: string };
}

const here = dirname(fileURLToPath(import.meta.url));
/** This repo's root, for the defaults when the doctor runs inside the system repo. */
const REPO = resolve(here, '..', '..', '..', '..');

function readJson(path: string, code: DoctorErrorCode): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (e) {
    throw new DoctorError(code, `${path} is not readable JSON: ${(e as Error).message}`);
  }
}

export function loadConfig(root: string): DoctorConfig {
  let raw: unknown;
  let from = '';
  if (existsSync(join(root, 'ds.doctor.json'))) {
    from = 'ds.doctor.json';
    raw = readJson(join(root, from), 'DS_E_CONFIG');
  } else if (existsSync(join(root, 'ds.config.json'))) {
    from = 'ds.config.json doctor';
    raw = (readJson(join(root, 'ds.config.json'), 'DS_E_CONFIG') as { doctor?: unknown }).doctor ?? {};
  } else return {};
  return validateConfig(raw, from);
}

export function validateConfig(raw: unknown, from = 'config'): DoctorConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new DoctorError('DS_E_CONFIG', `${from} must be an object.`);
  for (const key of Object.keys(raw)) if (!CONFIG_KEYS.has(key)) throw new DoctorError('DS_E_CONFIG', `${from}: unknown key "${key}". Known keys: ${[...CONFIG_KEYS].join(', ')}.`);
  const c = raw as DoctorConfig;
  for (const key of ['exclude', 'touch', 'packages', 'nativePackages'] as const) {
    const v = c[key];
    if (v !== undefined && (!Array.isArray(v) || v.some((x) => typeof x !== 'string'))) throw new DoctorError('DS_E_CONFIG', `${from}: ${key} must be a list of strings.`);
  }
  for (const [id, level] of Object.entries(c.rules ?? {})) {
    if (!DOCTOR_RULES.some((r) => r.id === id)) throw new DoctorError('DS_E_CONFIG', `${from}: unknown rule "${id}".`);
    if (!['off', 'error', 'warning'].includes(level)) throw new DoctorError('DS_E_CONFIG', `${from}: rule ${id} must be off, warning or error.`);
  }
  return c;
}

function prefixOf(root: string): string {
  const p = join(root, 'ds.config.json');
  if (!existsSync(p)) return 'ds';
  const c = readJson(p, 'DS_E_CONFIG') as { cssPrefix?: unknown };
  return typeof c.cssPrefix === 'string' ? c.cssPrefix : 'ds';
}

function matches(path: string, pattern: string): boolean {
  if (!pattern.includes('*')) return path === pattern || path.startsWith(pattern.endsWith('/') ? pattern : `${pattern}/`);
  const re = new RegExp(`^${pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')}(/|$)`);
  return re.test(path);
}

/** Every file the doctor reads under `root`, relative, sorted. */
export function discover(root: string, exclude: readonly string[] = []): string[] {
  const out: string[] = [];
  const skipNames = new Set([...DEFAULT_EXCLUDED, ...exclude.filter((e) => !e.includes('/'))]);
  const skipPaths = exclude.filter((e) => e.includes('/'));
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (skipNames.has(entry.name)) continue;
      const abs = join(dir, entry.name);
      const rel = relative(root, abs).split(sep).join('/');
      if (skipPaths.some((p) => matches(rel, p))) continue;
      if (entry.isDirectory()) visit(abs);
      else if (entry.isFile() && EXTENSIONS.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(rel);
    }
  };
  visit(root);
  return out;
}

/** The first candidate path that exists. */
function firstExisting(candidates: (string | undefined)[]): string | undefined {
  return candidates.find((p): p is string => Boolean(p && existsSync(p)));
}

function walkTs(dir: string): { path: string; content: string }[] {
  const out: { path: string; content: string }[] = [];
  const visit = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const abs = join(d, e.name);
      if (e.isDirectory() && e.name !== 'node_modules') visit(abs);
      else if (e.isFile() && e.name.endsWith('.ts')) out.push({ path: abs, content: readFileSync(abs, 'utf8') });
    }
  };
  visit(dir);
  return out;
}

/** Runs the doctor. Throws `DoctorError` for a usage, path, config or manifest problem. */
export async function runDoctor(options: DoctorOptions): Promise<DoctorReport> {
  const target = resolve(options.path);
  if (!existsSync(target)) throw new DoctorError('DS_E_NOT_FOUND', `${options.path} does not exist.`);
  const isFile = statSync(target).isFile();
  const root = isFile ? dirname(target) : target;
  const config: DoctorConfig = { ...loadConfig(root), ...(options.config ? validateConfig(options.config, 'options') : {}) };
  const at = (p: string | undefined) => (p ? resolve(root, p) : undefined);
  const skipped: DoctorSummary['skipped'] = [];

  const manifestPath = firstExisting([
    at(config.manifests),
    join(root, 'node_modules/@the-system/manifest/manifests.gen.json'),
    join(REPO, 'packages/manifest/manifests.gen.json'),
  ]);
  if (!manifestPath) throw new DoctorError('DS_E_MANIFEST', 'manifests.gen.json not found. Install @the-system/manifest or set "manifests" in ds.doctor.json.');
  const manifests = readJson(manifestPath, 'DS_E_MANIFEST');
  if (!Array.isArray(manifests)) throw new DoctorError('DS_E_MANIFEST', `${manifestPath} must hold a list of manifests.`);

  const tokensPath = firstExisting([
    at(config.tokensCss),
    join(root, 'node_modules/@the-system/tokens/dist/css/tokens.css'),
    join(REPO, 'packages/tokens/dist/css/tokens.css'),
  ]);
  let tokenNames: Set<string> | undefined;
  if (tokensPath) tokenNames = declaredCustomProperties(readFileSync(tokensPath, 'utf8'));
  else skipped.push({ ruleId: 'ds/token-vocabulary', reason: 'tokens.css not found: build @the-system/tokens or set "tokensCss".' });

  const angularDir = firstExisting([at(config.angularSources), join(REPO, 'packages/angular/src')]);
  const titleHosts = angularDir ? titleInputHosts(walkTs(angularDir)) : undefined;
  if (!angularDir) skipped.push({ ruleId: 'ds/no-native-title', reason: 'Angular sources not found: any ds* directive is taken to have a title input.' });

  const angular = await loadAngularCompiler();

  const ctx: DoctorContext = {
    index: indexManifests(manifests as Manifest[]),
    ...(tokenNames ? { tokenNames } : {}),
    ...(titleHosts ? { titleHosts } : {}),
    angular,
    prefix: prefixOf(root),
    packages: config.packages ?? ['@the-system/react'],
    nativePackages: config.nativePackages ?? ['@the-system/native'],
  };

  const files = isFile ? [basename(target)] : discover(root, config.exclude);
  let angularSeen = false;
  const findings: DoctorFinding[] = [];
  for (const path of files) {
    const content = readFileSync(join(root, path), 'utf8');
    if (path.endsWith('.html') || (path.endsWith('.ts') && /@Component\s*\(/.test(content))) angularSeen = true;
    const touch = (config.touch ?? []).some((p) => matches(path, p));
    findings.push(...checkFile({ path, content, touch }, ctx));
  }
  if (angularSeen && !angular) skipped.push({ ruleId: 'ds/slot-limits', reason: '@angular/compiler is not installed: Angular templates get only the title and dash rules.' });

  const levels = config.rules ?? {};
  const kept = findings
    .filter((f) => levels[f.ruleId] !== 'off')
    .map((f) => {
      const level = levels[f.ruleId];
      return level && level !== 'off' ? { ...f, severity: level } : f;
    })
    .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line || a.column - b.column || (a.ruleId < b.ruleId ? -1 : 1)));

  const byRule: Record<string, number> = {};
  for (const f of kept) byRule[f.ruleId] = (byRule[f.ruleId] ?? 0) + 1;
  return {
    apiVersion: API_VERSION,
    type: 'doctor.report',
    data: {
      findings: kept,
      summary: {
        files: files.length,
        errors: kept.filter((f) => f.severity === 'error').length,
        warnings: kept.filter((f) => f.severity === 'warning').length,
        byRule: Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => (a < b ? -1 : 1))),
        skipped,
      },
    },
  };
}

export function errorReport(e: DoctorError): DoctorErrorReport {
  return { apiVersion: API_VERSION, type: 'error', data: { code: e.code, message: e.message } };
}

/** The text form: one line per finding, then the summary. */
export function formatText(report: DoctorReport): string {
  const lines = report.data.findings.map((f) => `${f.file}:${f.line}:${f.column} ${f.severity} ${f.ruleId} ${f.message}${f.fix ? ` (fix: ${f.fix})` : ''}`);
  const s = report.data.summary;
  lines.push(`${s.files} files, ${s.errors} errors, ${s.warnings} warnings.`);
  for (const k of s.skipped) lines.push(`skipped ${k.ruleId}: ${k.reason}`);
  return `${lines.join('\n')}\n`;
}

/** Exit code: 0 clean or warnings only, 1 on an error finding. Tool errors exit 2. */
export function exitCode(report: DoctorReport): number {
  return report.data.summary.errors > 0 ? 1 : 0;
}
