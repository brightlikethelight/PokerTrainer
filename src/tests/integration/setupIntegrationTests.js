/**
 * Integration Test Setup
 * Shared configuration and utilities for integration testing
 */

import '@testing-library/jest-dom';

// Enhanced test timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.integrationTestUtils = {
  /**
   * Wait for async operations to complete
   */
  waitForAsync: (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Create a complete game setup for testing
   */
  createGameSetup: () => ({
    players: [
      { id: 'human', name: 'Human Player', chips: 1000, position: 0, isAI: false },
      { id: 'ai1', name: 'AI Player 1', chips: 1000, position: 1, isAI: true, aiType: 'TAG' },
      { id: 'ai2', name: 'AI Player 2', chips: 1000, position: 2, isAI: true, aiType: 'LAG' },
    ],
    gameConfig: {
      blinds: { small: 10, big: 20 },
      maxPlayers: 6,
      gameType: 'no-limit-holdem',
    },
  }),

  /**
   * Mock localStorage for testing
   */
  mockLocalStorage: () => {
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = localStorageMock;
    return localStorageMock;
  },

  /**
   * Reset all mocks
   */
  resetMocks: () => {
    jest.clearAllMocks();
  },
};

// Console error suppression for known issues
// eslint-disable-next-line no-console
const originalError = console.error;
// eslint-disable-next-line no-console
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: unstable_') ||
      args[0].includes('punycode'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Clean up after each test
afterEach(() => {
  global.integrationTestUtils.resetMocks();
});
