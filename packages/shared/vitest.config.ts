import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@resume-hub/shared',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
