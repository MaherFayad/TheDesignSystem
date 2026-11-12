import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.astro/**',
      '**/.expo/**',
      '**/.angular/**',
      '**/*.gen.ts',
      'packages/lint/fixtures/**',
      'docs/reports/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Angular resolves constructor injection from value imports, so a type
    // only import can break dependency injection at run time.
    files: ['packages/{angular,charts-angular,ai-angular}/**/*.ts', 'apps/gallery-angular/**/*.ts', 'packages/icons/src/angular/**/*.ts'],
    rules: { '@typescript-eslint/consistent-type-imports': 'off' },
  },
);
