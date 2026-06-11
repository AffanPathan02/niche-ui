// @niche-ui/eslint-config — flat config format (ESLint 9+)
// Each package's eslint.config.js does:
//   import config from '@niche-ui/eslint-config';
//   export default config;

import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // ── TypeScript files ──────────────────────────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // TypeScript
      ...tseslint.configs['recommended'].rules,
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // React hooks
      ...reactHooks.configs.recommended.rules,

      // Accessibility
      ...jsxA11y.configs.recommended.rules,

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Ignore build output and node_modules ─────────────────────────────────
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts'],
  },
];

export default config;
