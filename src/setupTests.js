// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock console methods during tests to keep output clean
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTMLCanvasElement.getContext for any canvas-based visualizations
HTMLCanvasElement.prototype.getContext = jest.fn();

// Global test utilities
global.testUtils = {
  // Create a mock player object
  createMockPlayer: (overrides = {}) => ({
    id: 'player1',
    name: 'Test Player',
    chips: 1000,
    _position: 0,
    isActive: true,
    isFolded: false,
    isAllIn: false,
    cards: [],
    _currentBet: 0,
    ...overrides,
  }),

  // Create a mock game state
  createMockGameState: (overrides = {}) => ({
    players: [],
    _pot: 0,
    _currentBet: 0,
    dealerPosition: 0,
    activePlayerIndex: 0,
    phase: 'preflop',
    communityCards: [],
    ...overrides,
  }),
};
