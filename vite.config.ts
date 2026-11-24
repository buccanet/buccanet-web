import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The relay on 8758 is proxied under /api so the page and the relay share one origin, as in production.
 * Assets are never inlined as data URLs: the relay's Content-Security-Policy allows fonts from 'self' only.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: { assetsInlineLimit: 0 },
  server: {
    host: '127.0.0.1',
    proxy: { '/api': 'http://127.0.0.1:8758' },
  },
});
