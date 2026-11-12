// The React gallery. Packages export source (DECISIONS.md, structure 2), so
// Vite compiles @the-system/* straight from packages/ through the workspace
// links in node_modules. The demos are imported by relative path from
// src/routes.gen.ts, which `npm run gen` writes.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
