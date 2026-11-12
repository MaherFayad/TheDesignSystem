import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Angular and React Native packages run their own test commands from
// scripts/check.ts. This config covers the pure TypeScript and React packages.
const frameworkOnly = [
  'packages/{angular,native,charts-angular,charts-native,ai-angular,ai-native}/**',
  '**/node_modules/**',
  '**/dist/**',
];

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/*/{src,tests}/**/*.test.ts', 'packages/*/*.test.ts', 'scripts/**/*.test.ts'],
          exclude: frameworkOnly,
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'react',
          environment: 'jsdom',
          include: ['packages/{react,charts-react,ai-react}/src/**/*.test.tsx'],
          exclude: frameworkOnly,
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
