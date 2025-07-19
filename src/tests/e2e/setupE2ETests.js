/**
 * E2E Test Setup
 * Global configuration and utilities for end-to-end testing
 */

// Extend Jest timeout for E2E tests
jest.setTimeout(60000);

// Global utilities for E2E tests
global.e2eTestUtils = {
  /**
   * Navigate to app and wait for load
   */
  async navigateToApp() {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
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
  // Clear any previous data
  await global.e2eTestUtils.clearBrowserData();

  // Set default desktop viewport
  await global.e2eTestUtils.setDesktopViewport();

  // Navigate to app
  await global.e2eTestUtils.navigateToApp();
});

// Cleanup after each test
afterEach(async () => {
  // Take screenshot on test failure
  if (expect.getState().currentTestName && expect.getState().isExpectingAssertions) {
    await global.e2eTestUtils.takeScreenshot('test_failure');
  }
});
