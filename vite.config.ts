import { defineConfig } from 'vite';
import { resolve } from 'path';
import rawExamplesPlugin from './scripts/vite-plugin-raw-examples.js';

export default defineConfig({
  root: 'site',
  base: './',
  plugins: [rawExamplesPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'site/index.html'),
        showcase: resolve(__dirname, 'site/showcase.html'),
        documentation: resolve(__dirname, 'site/documentation.html'),
      },
    },
    outDir: '../dist/site',
    emptyOutDir: true,
  },
  server: {
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  resolve: {
    alias: {
      'gearbox2d': resolve(__dirname, 'typescript/src/gearbox.ts'),
    },
  },
});

