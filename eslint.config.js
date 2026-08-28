// Most-aggressive lint config: typescript-eslint strict + stylistic (type-checked),
// unicorn, sonarjs, and vitest rules. Math.random and direct time reads are banned
// so randomness/timing flow through injectable sources (keeps every branch
// test-reachable, and keeps rhythm-timing logic deterministic under test).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import sonarjs from 'eslint-plugin-sonarjs';
import vitest from '@vitest/eslint-plugin';
import react from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  unicorn.configs['flat/recommended'],
  sonarjs.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `unicorn/name-replacements` and `@eslint-react`'s ref-name rule are
      // mutually unsatisfiable for any `useRef` variable: the first rejects
      // `ref`/`Ref` as an abbreviation, the second requires that exact suffix.
      // Refs get their conventional React name; every other abbreviation stays banned.
      'unicorn/name-replacements': ['error', { replacements: { ref: false } }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'This game has no randomness yet; if you need it, add an injectable Rng.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Use the injected Clock (src/engine/clock.ts) so timing is deterministic and testable.',
        },
        {
          object: 'performance',
          property: 'now',
          message: 'Use the injected Clock (src/engine/clock.ts) so timing is deterministic and testable.',
        },
      ],
      // Keep the stricter no-non-null-assertion rule; allow narrowing `as T`
      // casts on provably-safe access instead of forcing `!` everywhere.
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  {
    // React 19 UI layer: hooks correctness + modern JSX (no React-in-scope needed).
    files: ['src/ui/**/*.tsx', 'src/main.tsx'],
    // eslint-plugin-react has been unmaintained since 2025-04 and declares
    // `eslint: <=^9.7`; it hard-crashes on ESLint 10. @eslint-react is its
    // maintained successor and is what konbini-67 already runs.
    extends: [react.configs['recommended-type-checked']],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['src/engine/clock.ts'],
    rules: {
      // The one file allowed to touch the real clock.
      'no-restricted-properties': 'off',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    ...vitest.configs.recommended,
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'error',
      'sonarjs/no-duplicate-string': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'no-restricted-properties': 'off',
    },
  },
  {
    // The flat config itself is plain JS; disable type-aware rules for it.
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
