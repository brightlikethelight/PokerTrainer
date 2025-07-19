/**
 * Jest E2E Configuration
 * Configuration for end-to-end testing with Puppeteer
 */

module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/e2e/**/*.e2e.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/e2e/setupE2ETests.js'],
  testTimeout: 60000,
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
};
