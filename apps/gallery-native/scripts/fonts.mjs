// Copies the woff2 files the web export needs from the fontsource packages
// (dependencies of @the-system/styles) into public/fonts, which Expo copies
// into the export. Native builds do not use them: iOS and Android cannot
// register woff2, so the gallery uses the platform font there.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../../packages/styles/package.json'));
const out = join(here, '../public/fonts');
mkdirSync(out, { recursive: true });

const files = {
  '@fontsource-variable/inter': ['inter-latin-wght-normal.woff2'],
  '@fontsource/instrument-sans': ['instrument-sans-latin-400-normal.woff2', 'instrument-sans-latin-700-normal.woff2'],
  '@fontsource/ibm-plex-sans-arabic': ['ibm-plex-sans-arabic-arabic-400-normal.woff2', 'ibm-plex-sans-arabic-arabic-700-normal.woff2'],
};

for (const [pkg, names] of Object.entries(files)) {
  const dir = join(dirname(require.resolve(`${pkg}/package.json`)), 'files');
  for (const name of names) copyFileSync(join(dir, name), join(out, name));
}
console.log(`fonts: copied to ${out}`);
