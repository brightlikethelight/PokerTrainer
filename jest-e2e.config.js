/**
 * Jest E2E Configuration
 * Configuration for end-to-end testing with Puppeteer
 */

module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/e2e/**/*.e2e.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/e2e/setupE2ETests.js'],
  testTimeout: 30000, // 30 seconds instead of 60
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/tests/**',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  // Add global teardown to ensure Puppeteer closes properly
  globalTeardown: '<rootDir>/src/tests/e2e/teardown.js',
  // Bail on first test failure to avoid hanging
  bail: 1,
};
