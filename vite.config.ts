import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Konsole',
      fileName: 'konsole',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      // Keep Node.js built-ins as proper external imports instead of browser stubs.
      // FileTransport and StreamTransport guard with isNode() at runtime so this
      // is safe — the imports are only triggered in Node.js environments.
      external: (id) => id.startsWith('node:'),
      output: {
        globals: {},
        exports: 'named',
      },
    },
  },
});

