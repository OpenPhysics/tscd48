import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'examples/', '*.config.js', 'docs/'],
      // Enforce minimum coverage thresholds
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 88, // Current coverage is 88.33%
        statements: 95,
      },
    },
  },
});
