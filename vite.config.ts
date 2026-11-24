import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** The relay on 8758 is proxied under /api so the page and the relay share one origin, as in production. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: {
    host: '127.0.0.1',
    proxy: { '/api': 'http://127.0.0.1:8758' },
  },
});
