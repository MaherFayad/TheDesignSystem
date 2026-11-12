// Runs every check in order and prints one summary. Used by `npm run check`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

interface Step {
  name: string;
  cmd: string;
  args: string[];
  when?: () => boolean;
}

function workspaceChecks(): Step[] {
  const steps: Step[] = [];
  for (const group of ['packages', 'apps', 'examples']) {
    const dir = join(root, group);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      const pkgPath = join(dir, name, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name: string; scripts?: Record<string, string> };
      if (pkg.scripts?.check) {
        steps.push({ name: `check ${pkg.name}`, cmd: 'npm', args: ['run', 'check', '-w', pkg.name] });
      }
    }
  }
  return steps;
}

const steps: Step[] = [
  { name: 'tokens build', cmd: 'npx', args: ['tsx', 'packages/tokens/build.ts'], when: () => existsSync(join(root, 'packages/tokens/build.ts')) },
  { name: 'gen', cmd: 'npx', args: ['tsx', 'scripts/gen-index.ts'] },
  { name: 'typecheck', cmd: 'npx', args: ['tsc', '--noEmit', '-p', 'tsconfig.json'] },
  { name: 'eslint', cmd: 'npx', args: ['eslint', '.'] },
  { name: 'manifests', cmd: 'npx', args: ['tsx', 'packages/manifest/validate.ts'] },
  { name: 'vitest', cmd: 'npx', args: ['vitest', 'run'] },
  ...workspaceChecks(),
];

const only = process.argv.slice(2);
const results: { name: string; ok: boolean; ms: number }[] = [];
for (const step of steps) {
  if (step.when && !step.when()) continue;
  if (only.length > 0 && !only.some((o) => step.name.includes(o))) continue;
  const start = Date.now();
  console.log(`\n== ${step.name} ==`);
  const res = spawnSync(step.cmd, step.args, { cwd: root, stdio: 'inherit' });
  results.push({ name: step.name, ok: res.status === 0, ms: Date.now() - start });
}

console.log('\n== summary ==');
for (const r of results) {
  console.log(`${r.ok ? 'pass' : 'FAIL'}  ${r.name}  ${(r.ms / 1000).toFixed(1)}s`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
