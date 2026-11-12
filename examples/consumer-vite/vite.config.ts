// A Vite and React app that consumes the system as packages. The packages
// export TypeScript and CSS source, which Vite compiles like app code: no
// extra config is needed beyond the React plugin.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Class names stay readable in development and short in the build.
      generateScopedName: process.env.NODE_ENV === 'production' ? '[hash:base64:6]' : '[name]_[local]_[hash:base64:4]',
    },
  },
});
