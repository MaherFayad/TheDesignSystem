import { defineConfig } from '@playwright/test';

// The gallery URL comes from DS_GALLERY_URL so one suite can run against the
// React gallery and the Angular gallery.
export default defineConfig({
  testDir: 'packages/contract-tests/src',
  outputDir: 'test-results',
  reporter: [['list']],
  use: {
    baseURL: process.env.DS_GALLERY_URL ?? 'http://localhost:5173',
    trace: 'off',
  },
});
