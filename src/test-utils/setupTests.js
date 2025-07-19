// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Performance monitoring mock for tests
global.performance = global.performance || {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  getEntriesByType: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  now: jest.fn(() => Date.now()),
};

// Mock console methods during tests to keep output clean
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  // eslint-disable-next-line no-console
  info: console.info, // Keep info for debugging
  // eslint-disable-next-line no-console
  log: console.log, // Keep log for debugging
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

// Mock ResizeObserver for responsive components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for viewport tracking
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock HTMLCanvasElement.getContext for any canvas-based visualizations
HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock crypto API for random number generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr) => {
      // Fill with deterministic values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock Web Vitals for performance testing
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
  getINP: jest.fn(),
}));

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
    status: 'waiting',
    lastAction: null,
    ...overrides,
  }),

  // Create a mock game state
  createMockGameState: (overrides = {}) => ({
    players: [],
    _pot: 0,
    _currentBet: 0,
    dealerPosition: 0,
    currentPlayerIndex: 0,
    phase: 'preflop',
    communityCards: [],
    blinds: { small: 10, big: 20 },
    handNumber: 1,
    ...overrides,
  }),

  // Create mock cards for testing
  createMockCards: (count = 2) => {
    const suits = ['s', 'h', 'd', 'c'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push({
        rank: ranks[i % ranks.length],
        suit: suits[i % suits.length],
        value: i + 2,
        toString: () => `${ranks[i % ranks.length]}${suits[i % suits.length]}`,
      });
    }
    return cards;
  },

  // Wait for async operations in tests
  waitFor: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Mock localStorage
  mockLocalStorage: () => {
    let store = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  },
};

// Set up localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: global.testUtils.mockLocalStorage(),
});

// Set up sessionStorage mock
Object.defineProperty(window, 'sessionStorage', {
  value: global.testUtils.mockLocalStorage(),
});

// Suppress specific warnings in tests
// eslint-disable-next-line no-console
const originalError = console.error;
beforeAll(() => {
  // eslint-disable-next-line no-console
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render is deprecated')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  // eslint-disable-next-line no-console
  console.error = originalError;
});
