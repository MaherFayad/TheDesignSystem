// Loading and checking pair files. The JSON Schema checks the shape; the
// checks below catch what a schema cannot: duplicate ids, an allowed
// difference that names no probe, a tolerance that loosens the profile.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';
import { resolveTolerance } from './tolerance';
import type { PairFile, ProbeSpec } from './types';

export const COMPARE_DIR = dirname(fileURLToPath(import.meta.url));
export const PAIRS_DIR = join(COMPARE_DIR, 'pairs');

const schema = JSON.parse(readFileSync(join(COMPARE_DIR, 'pair.schema.json'), 'utf8')) as object;
const ajv = new Ajv({ allErrors: true, strict: false });
const validateShape = ajv.compile(schema);

/** The long form of every probe of a region. */
export function probeSpecs(probes: (string | ProbeSpec)[]): ProbeSpec[] {
  return probes.map((p) => (typeof p === 'string' ? { id: p, property: p } : p));
}

/** Problems with a pair, empty when it is sound. */
export function checkPair(data: unknown, fileId?: string): string[] {
  if (!validateShape(data)) {
    return (validateShape.errors ?? []).map((e) => `${e.instancePath || '(root)'} ${e.message ?? 'is not valid'}`);
  }
  const pair = data as PairFile;
  const errors: string[] = [];
  if (fileId && pair.id !== fileId) errors.push(`id "${pair.id}" does not match the file name "${fileId}"`);
  if (!pair.id.startsWith(`${pair.source.repo}-`)) errors.push(`id "${pair.id}" must start with the source repo "${pair.source.repo}-"`);
  try {
    resolveTolerance(pair.tolerance);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }
  const regionIds = new Set<string>();
  for (const region of pair.regions) {
    if (regionIds.has(region.id)) errors.push(`region "${region.id}" appears twice`);
    regionIds.add(region.id);
    const probeIds = new Set<string>();
    for (const p of probeSpecs(region.probes)) {
      if (probeIds.has(p.id)) errors.push(`region "${region.id}": probe "${p.id}" appears twice`);
      probeIds.add(p.id);
      if (p.property === 'count' && (p.source === undefined || p.system === undefined)) {
        errors.push(`region "${region.id}": count probe "${p.id}" needs a selector or null on both sides`);
      }
    }
  }
  for (const a of pair.allowed) {
    const region = pair.regions.find((r) => r.id === a.region);
    if (!region) errors.push(`allowed difference names no region "${a.region}"`);
    else if (!probeSpecs(region.probes).some((p) => p.id === a.probe)) errors.push(`allowed difference names no probe "${a.probe}" in region "${a.region}"`);
  }
  return errors;
}

/** Every pair id in ./pairs. */
export function pairIds(): string[] {
  return readdirSync(PAIRS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -5))
    .sort();
}

/** Reads and checks one pair; throws with every problem listed. */
export function loadPair(id: string): PairFile {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Not a pair id: "${id}"`);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(join(PAIRS_DIR, `${id}.json`), 'utf8'));
  } catch (err) {
    throw new Error(`Cannot read pair "${id}" (known pairs: ${pairIds().join(', ')}): ${err instanceof Error ? err.message : String(err)}`);
  }
  const errors = checkPair(data, id);
  if (errors.length > 0) throw new Error(`Pair "${id}" is not valid:\n- ${errors.join('\n- ')}`);
  return data as PairFile;
}
