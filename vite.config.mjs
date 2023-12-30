import { defineConfig } from 'vite';
import i18nextLoader from 'vite-plugin-i18next-loader';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { polyfillNode } from "esbuild-plugin-polyfill-node";

export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron({
      entry: 'public/electron.js',
      preload: {
        input: `public/preload.js`,
      },
      base: './',
    }),
    i18nextLoader({
      paths: ['./src/locales'],
      namespaceResolution: 'basename'
    })
  ],
  server: {
    port: 3001,
    open: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        polyfillNode({
          process: true,
          assert: true,
          buffer: true,
        }),
      ],
    },
  },
  resolve: {
    alias: {
      process: "process/browser",
      assert: "assert",
      stream: "stream-browserify",
      util: "util",
    },
    extensions: ['.js', '.jsx', '.mjs']
  },
});
