import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    // `.next` phải loại: `next build` (output standalone) copy cả file test sang
    // .next/standalone kèm một bản react rút gọn không có jsx-dev-runtime,
    // làm `npm run test` fail 2 suite trên mọi máy đã từng build.
    exclude: ['node_modules', 'dist', '.npm-cache', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
