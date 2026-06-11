import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@niche-ui/tree',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/__tests__/**'],
    },
  },
});
