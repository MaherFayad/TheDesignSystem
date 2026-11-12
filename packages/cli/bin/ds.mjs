#!/usr/bin/env node
// The `ds` binary. The packages export TypeScript source during development,
// so the CLI runs through tsx.
import { register } from 'tsx/esm/api';

register();
const { run } = await import('../src/main.ts');
process.exitCode = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  out: (s) => process.stdout.write(s),
  err: (s) => process.stderr.write(s),
});
