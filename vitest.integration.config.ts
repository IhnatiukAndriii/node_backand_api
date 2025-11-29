import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['tests/integration/setup.ts', 'tests/integration/full-flow.test.ts', 'tests/integration/habits.routes.test.ts', 'tests/integration/prompt.routes.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
  },
});
