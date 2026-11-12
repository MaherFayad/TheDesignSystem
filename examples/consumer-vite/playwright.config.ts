import { defineConfig, devices } from '@playwright/test';

// Run by scripts/smoke.mjs, which builds the app, serves the production
// build on a free port and passes its URL in SMOKE_URL.
export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.spec\.ts$/,
  outputDir: 'test-results',
  reporter: [['list']],
  workers: 1,
  timeout: 60_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.SMOKE_URL ?? 'http://localhost:4173',
    headless: true,
    trace: 'off',
  },
});
