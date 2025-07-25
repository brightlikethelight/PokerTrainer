/**
 * E2E Test Setup
 * Global configuration and utilities for end-to-end testing
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

import { configure } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 10000,
});

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Extend Jest timeout for E2E tests
jest.setTimeout(30000); // 30 seconds max per test

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Trigger callback immediately with mock entry
    this.callback([{ target: document.body }], this);
  }
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Global utilities for E2E tests
global.e2eTestUtils = {
  /**
   * Navigate to app and wait for load
   */
  async navigateToApp() {
    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'domcontentloaded', // Faster than networkidle0
        timeout: 10000, // 10 second timeout
      });
    } catch (error) {
      // console.error('Failed to navigate to app:', error.message);
      throw new Error('Application server not running. Run "npm start" before E2E tests.');
    }
  },

  /**
   * Wait for element with retry logic
   */
  async waitForElement(selector, timeout = 10000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      // Element not found within timeout
      return false;
    }
  },

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name) {
    const timestamp = Date.now();
    await page.screenshot({
      path: `src/tests/e2e/screenshots/${name}_${timestamp}.png`,
      fullPage: true,
    });
  },

  /**
   * Clear browser data
   */
  async clearBrowserData() {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },

  /**
   * Simulate mobile viewport
   */
  async setMobileViewport() {
    await page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true,
    });
  },

  /**
   * Simulate tablet viewport
   */
  async setTabletViewport() {
    await page.setViewport({
      width: 768,
      height: 1024,
      isMobile: true,
      hasTouch: true,
    });
  },

  /**
   * Set desktop viewport
   */
  async setDesktopViewport() {
    await page.setViewport({
      width: 1280,
      height: 800,
      isMobile: false,
      hasTouch: false,
    });
  },

  /**
   * Monitor console errors
   */
  setupConsoleMonitoring() {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    return consoleErrors;
  },

  /**
   * Simulate slow network
   */
  async setSlowNetwork() {
    const client = await page.target().createCDPSession();
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
      uploadThroughput: (750 * 1024) / 8, // 750 Kbps
      latency: 40, // 40ms latency
    });
  },

  /**
   * Disable network (offline mode)
   */
  async setOfflineMode() {
    await page.setOfflineMode(true);
  },

  /**
   * Enable network
   */
  async setOnlineMode() {
    await page.setOfflineMode(false);
  },
};

// Create screenshots directory
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Global setup for each test
beforeEach(async () => {
  // Skip E2E tests if page is not available
  if (!global.page) {
    // console.warn('Puppeteer page not available, skipping E2E test');
    return;
  }

  try {
    // Clear any previous data
    await global.e2eTestUtils.clearBrowserData();

    // Set default desktop viewport
    await global.e2eTestUtils.setDesktopViewport();
  } catch (error) {
    // console.error('E2E setup error:', error.message);
  }
});

// Cleanup after each test
afterEach(async () => {
  // Take screenshot on test failure
  if (expect.getState().currentTestName && expect.getState().isExpectingAssertions) {
    await global.e2eTestUtils.takeScreenshot('test_failure');
  }
});
