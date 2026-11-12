import { defineConfig } from '@playwright/test';

// The contract suite's own config. run.ts passes it with --config. Paths are
// relative to this file. Only *.spec.ts files are Playwright tests here; the
// *.test.ts files next to them are Vitest unit tests.
const json = process.env.DS_CONTRACT_JSON;
// run.ts gives every run its own folder (.out/<pid>), so parallel runs on one
// machine never share test-results.
const out = process.env.DS_CONTRACT_OUT ?? './.out/default';

export default defineConfig({
  testDir: './src',
  testMatch: /.*\.spec\.ts$/,
  outputDir: `${out}/test-results`,
  fullyParallel: true,
  workers: process.env.DS_CONTRACT_WORKERS ? Number(process.env.DS_CONTRACT_WORKERS) : 4,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: json ? [['list'], ['json', { outputFile: json }]] : [['list']],
  use: {
    baseURL: process.env.DS_GALLERY_URL ?? 'http://localhost:5173',
    browserName: 'chromium',
    viewport: { width: 1280, height: 800 },
    trace: 'off',
  },
});
