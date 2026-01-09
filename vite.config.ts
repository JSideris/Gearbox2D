import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'examples',
  base: './',
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
      'gb2d': resolve(__dirname, 'typescript/src/gb2d.ts'),
    },
  },
});

