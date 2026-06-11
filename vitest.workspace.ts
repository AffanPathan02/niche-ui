import { defineWorkspace } from 'vitest/config';

/**
 * Root vitest workspace — discovers test configs from every package.
 * Run all tests: pnpm test
 * Run one package: pnpm --filter @niche-ui/tree test
 */
export default defineWorkspace(['packages/*/vitest.config.ts']);
