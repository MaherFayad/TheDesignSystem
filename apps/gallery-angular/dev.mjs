// `npm run dev`: ng serve on PORT (default 4200). An explicit --port wins,
// which is how packages/contract-tests/run.ts starts it.
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const port = process.env.PORT ?? '4200';
const withPort = args.some((a) => a === '--port' || a.startsWith('--port=')) ? args : ['--port', port, ...args];
const child = spawn('npx', ['ng', 'serve', ...withPort], {
  stdio: 'inherit',
  env: { ...process.env, NG_CLI_ANALYTICS: 'false' },
});
const stop = (signal) => child.kill(signal);
process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
child.on('exit', (code) => process.exit(code ?? 0));
