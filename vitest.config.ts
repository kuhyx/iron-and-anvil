import { defineConfig } from 'vitest/config';

// 100% coverage is enforced across all of src/**, including the Canvas/RAF UI
// layer — no exclusions for rendering code (only for genuine type-only files
// that compile to nothing).
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/engine/types.ts', 'src/mechanics/types.ts'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
