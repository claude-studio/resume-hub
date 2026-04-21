import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@resume-hub/web-service',
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
