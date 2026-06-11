// prettier.config.js — root workspace Prettier config
// Prettier auto-discovers this from the repo root.
// No package needed — just this file.

/** @type {import('prettier').Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  // Keep JSX consistent with single quotes
  jsxSingleQuote: false,
  // Bracket spacing: { foo } not {foo}
  bracketSpacing: true,
  // Arrow parens: (x) => x, not x => x
  arrowParens: 'always',
  endOfLine: 'lf',
};
