// A Vite and React app that consumes the system as packages. The packages
// export TypeScript and CSS source, which Vite compiles like app code: no
// extra config is needed beyond the React plugin.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Keep `:dir(rtl)` as written: an older CSS target makes the minifier
  // rewrite it into a `:lang()` list, which breaks a `dir="ltr"` island.
  build: { cssTarget: ['chrome120', 'edge120', 'firefox115', 'safari16.4'] },
  css: {
    modules: {
      // Class names stay readable in development and short in the build.
      generateScopedName: process.env.NODE_ENV === 'production' ? '[hash:base64:6]' : '[name]_[local]_[hash:base64:4]',
    },
  },
});
