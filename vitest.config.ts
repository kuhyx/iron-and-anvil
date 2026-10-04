import { defineConfig } from 'vitest/config';

// 100% coverage is enforced across all of src/**, including the Canvas/RAF UI
// layer — no exclusions for rendering code (only for genuine type-only files
// that compile to nothing).
const config = defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // src/test/** is the harness itself, not code under test. vitest 4's v8
      // provider counts the never-called arrow bodies inside `vi.fn(() => ...)`,
      // which put canvas-mock.ts at 50% and failed a gate about production code.
      exclude: [
        'src/**/*.d.ts',
        'src/engine/types.ts',
        'src/test/**',
      ],
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

export default config;
