import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@resume-hub/web-extension',
    environment: 'jsdom',
    include: ['entrypoints/**/*.{test,spec}.{ts,tsx}', 'lib/**/*.{test,spec}.{ts,tsx}'],
  },
});
