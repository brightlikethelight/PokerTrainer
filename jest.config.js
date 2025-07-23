// Modern Jest configuration for React TypeScript project

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform configuration for TypeScript support
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setupTests.js'],

  // Module name mapping for path resolution
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.module\\.(css|scss|sass)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/test-utils/__mocks__/fileMock.js',
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domains/(.*)$': '<rootDir>/src/domains/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],

  // Transform ignore patterns
  transformIgnorePatterns: ['node_modules/(?!(web-vitals|@testing-library|react-hook-form)/)'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__mocks__/**',
    '!src/**/__fixtures__/**',
    '!src/test-utils/**',
  ],

  // Coverage thresholds - Realistic targets while fixing tests
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 20,
      statements: 20,
    },
  },

  // Test timeout to prevent hanging
  testTimeout: 30000, // 30 seconds max per test

  // Stop after first test failure to speed up CI
  bail: 1,

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'clover', 'html'],

  // Global setup
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },

  // Watch plugins
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  // Clear mocks automatically
  clearMocks: true,

  // Restore mocks automatically
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Error on deprecated warnings
  errorOnDeprecated: true,
};
