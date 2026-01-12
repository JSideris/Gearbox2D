import { defineConfig } from 'vite';
import { resolve } from 'path';
import rawExamplesPlugin from './scripts/vite-plugin-raw-examples.js';

export default defineConfig({
  root: 'examples',
  base: './',
  plugins: [rawExamplesPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'examples/index.html'),
        examples: resolve(__dirname, 'examples/examples.html'),
        docs: resolve(__dirname, 'examples/docs.html'),
      },
    },
    outDir: '../dist/site',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
  resolve: {
    alias: {
      'gearbox2d': resolve(__dirname, 'typescript/src/gearbox.ts'),
    },
  },
});

