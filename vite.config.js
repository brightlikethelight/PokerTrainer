import path from 'path';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/PokerTrainer/',
  build: { outDir: 'build' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: { port: 3000 },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env': '{}',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-utils/setupTests.js'],
    include: ['src/**/__tests__/**/*.{js,jsx}', 'src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'build', 'src/tests/e2e/**'],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.jsx',
        'src/reportWebVitals.js',
        'src/**/*.stories.{js,jsx}',
        'src/**/__mocks__/**',
        'src/**/__fixtures__/**',
        'src/test-utils/**',
      ],
      thresholds: {
        branches: 62,
        functions: 60,
        lines: 60,
        statements: 60,
      },
      reporter: ['text', 'lcov', 'clover', 'html'],
    },
  },
}));
