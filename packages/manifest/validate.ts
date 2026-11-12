// Validates every manifest against schema.json and a few cross checks.
// Exit code 1 on any error. Used by `npm run check`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { Ajv } from 'ajv';

const here = import.meta.dirname;
const schema = JSON.parse(readFileSync(join(here, 'schema.json'), 'utf8')) as object;
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

export interface ManifestError {
  file: string;
  message: string;
}

export function validateAll(srcDir = join(here, 'src')): { count: number; errors: ManifestError[] } {
  const errors: ManifestError[] = [];
  let count = 0;
  const names = new Set<string>();
  const all: { file: string; data: Record<string, unknown> }[] = [];
  if (!existsSync(srcDir)) return { count, errors };
  for (const kind of readdirSync(srcDir).sort()) {
    const dir = join(srcDir, kind);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith('.manifest.json')) continue;
      count += 1;
      const file = join(kind, f);
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Record<string, unknown>;
      } catch (e) {
        errors.push({ file, message: `not valid JSON: ${(e as Error).message}` });
        continue;
      }
      if (!validate(data)) {
        for (const err of validate.errors ?? []) {
          errors.push({ file, message: `${err.instancePath || '/'} ${err.message ?? ''}` });
        }
      }
      if (data.name !== basename(f, '.manifest.json')) {
        errors.push({ file, message: `name "${String(data.name)}" does not match the file name` });
      }
      if (data.kind !== kind) errors.push({ file, message: `kind "${String(data.kind)}" does not match folder "${kind}"` });
      if (names.has(String(data.name))) errors.push({ file, message: `duplicate name ${String(data.name)}` });
      names.add(String(data.name));
      all.push({ file, data });
    }
  }
  // Slots must name a part of the anatomy.
  for (const { file, data } of all) {
    const anatomy = (data.anatomy as string[] | undefined) ?? [];
    for (const slot of Object.keys((data.slots as object | undefined) ?? {})) {
      if (!anatomy.includes(slot)) errors.push({ file, message: `slot "${slot}" is not in anatomy` });
    }
  }
  return { count, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { count, errors } = validateAll();
  for (const e of errors) console.error(`${e.file}: ${e.message}`);
  console.log(`${count} manifests, ${errors.length} errors`);
  process.exit(errors.length > 0 ? 1 : 0);
}
