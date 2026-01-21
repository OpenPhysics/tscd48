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
          return 'cd48.esm.js';
        }
        if (format === 'umd') {
          return 'cd48.umd.js';
        }
        return `cd48.${format}.js`;
      },
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        globals: {},
        exports: 'named',
        // Add footer only for UMD builds to expose CD48 class directly
        footer: (chunk) => {
          // Check if this is a UMD build by looking at the chunk filename
          if (chunk.fileName && chunk.fileName.includes('umd')) {
            return umdFooter;
          }
          return '';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false, // We'll create separate minified versions
  },
});
