// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';

// Mock console methods during tests to keep output clean
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLCanvasElement.getContext for any canvas-based visualizations
HTMLCanvasElement.prototype.getContext = vi.fn();

// Global test utilities
global.testUtils = {
  // Create a mock player object
  createMockPlayer: (overrides = {}) => ({
    id: 'player1',
    name: 'Test Player',
    chips: 1000,
    position: 0,
    isActive: true,
    isFolded: false,
    isAllIn: false,
    cards: [],
    currentBet: 0,
    ...overrides,
  }),

  // Create a mock game state
  createMockGameState: (overrides = {}) => ({
    players: [],
    pot: 0,
    currentBet: 0,
    dealerPosition: 0,
    activePlayerIndex: 0,
    phase: 'preflop',
    communityCards: [],
    ...overrides,
  }),
};
