// Reads the manifests of the system and finds one by any spelling of its name.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CliError } from './output';

/** The system repo root. The CLI runs from source inside it during development. */
export const REPO = resolve(import.meta.dirname, '../../..');

export type Framework = 'react' | 'angular' | 'native';
export const FRAMEWORKS: readonly Framework[] = ['react', 'angular', 'native'];

export interface FrameworkBlock {
  status: 'ready' | 'planned' | 'not-applicable';
  behavior?: string;
  example?: string;
  note?: string;
}

export interface Manifest {
  name: string;
  kind: 'component' | 'pattern' | 'template';
  family: string;
  summary: string;
  useWhen: string[];
  avoidWhen: string[];
  insteadUse: Record<string, string>;
  anatomy?: string[];
  props?: Record<string, unknown>;
  states?: string[];
  a11y?: { role?: string; focus?: string; keys?: Record<string, string>; announce?: string; native?: unknown };
  content?: Record<string, unknown>;
  motion?: string;
  mistakes?: { wrong: string; right: string }[];
  frameworks: Record<Framework, FrameworkBlock>;
  since: string;
  [key: string]: unknown;
}

export interface Config {
  name: string;
  scope: string;
  cssPrefix: string;
  cliName: string;
  version: string;
}

export function loadConfig(): Config {
  return JSON.parse(readFileSync(join(REPO, 'ds.config.json'), 'utf8')) as Config;
}

let cache: Manifest[] | undefined;
export function loadManifests(): Manifest[] {
  cache ??= JSON.parse(readFileSync(join(REPO, 'packages/manifest/manifests.gen.json'), 'utf8')) as Manifest[];
  return cache;
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The gallery and registry slug: IconButton gives icon-button. */
export function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Edit distance, for "did you mean". */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length]!;
}

/** Finds a manifest by name in any case, with or without dashes. */
export function findManifest(name: string): Manifest {
  const all = loadManifests();
  const key = squash(name);
  const hit = all.find((m) => squash(m.name) === key);
  if (hit) return hit;
  const suggestions = all
    .map((m) => ({ name: m.name, d: distance(key, squash(m.name)) }))
    .filter((s) => s.d <= Math.max(2, Math.floor(key.length / 3)) || squash(s.name).includes(key))
    .sort((a, b) => a.d - b.d || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((s) => s.name);
  throw new CliError('DS_E_NOT_FOUND', `No component, pattern or template named "${name}".${suggestions.length ? ` Did you mean ${suggestions.join(', ')}?` : ' Try ds search.'}`, { suggestions });
}
