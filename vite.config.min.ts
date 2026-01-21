import { defineConfig } from 'vite';
import { resolve } from 'path';

// UMD footer that exposes the CD48 class directly as the global variable
// instead of an object containing named exports. This allows browser usage like:
//   CD48.isSupported() and new CD48()
// while preserving other exports (CD48Error, etc.) as properties on the class.
const umdFooter = `
if (typeof CD48 === 'object' && CD48.default) {
  var _CD48Exports = CD48;
  CD48 = CD48.default;
  Object.keys(_CD48Exports).forEach(function(k) {
    if (k !== 'default' && !(k in CD48)) CD48[k] = _CD48Exports[k];
  });
}`;

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CD48',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') {
          return 'cd48.esm.min.js';
        }
        if (format === 'umd') {
          return 'cd48.umd.min.js';
        }
        return `cd48.${format}.min.js`;
      },
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
        // Add footer only for UMD builds to expose CD48 class directly
        footer: (chunk) => {
          if (chunk.fileName && chunk.fileName.includes('umd')) {
            return umdFooter;
          }
          return '';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: false, // Don't empty since we're building multiple times
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
  },
});
