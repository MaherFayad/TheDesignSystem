// Builds tokens first, then generated indexes, then every workspace that has a
// build script. Used by `npm run build`.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

function run(cmd: string, args: string[]): void {
  const res = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

if (existsSync(join(root, 'packages/tokens/build.ts'))) run('npx', ['tsx', 'packages/tokens/build.ts']);
run('npx', ['tsx', 'scripts/gen-index.ts']);
run('npm', ['run', 'build', '--workspaces', '--if-present']);
