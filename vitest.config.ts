import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    globals: true,
    environment: 'node',
  },
});