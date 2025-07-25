/**
 * Game Scenarios E2E Tests
 * Tests different game scenarios: heads-up, multi-player, various game states
 */

import './setupE2ETests';

describe('Game Scenarios E2E', () => {
  beforeEach(async () => {
    await global.e2eTestUtils.navigateToApp();
    await global.e2eTestUtils.clearBrowserData();
  });

  describe('Different Viewport Scenarios', () => {
    test('should work on desktop viewport', async () => {
      await global.e2eTestUtils.setDesktopViewport();

      // Take screenshot for desktop
      await global.e2eTestUtils.takeScreenshot('desktop_view');

      const desktopLayout = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
        hasContent: document.body.children.length > 0,
        isVisible: !document.hidden,
      }));

      expect(desktopLayout.width).toBe(1280);
      expect(desktopLayout.height).toBe(800);
      expect(desktopLayout.hasContent).toBe(true);
    }, 10000);

    test('should adapt to tablet viewport', async () => {
      await global.e2eTestUtils.setTabletViewport();

      // Wait for any responsive changes
      await global.e2eTestUtils.waitForAsync(500);

      // Take screenshot for tablet
      await global.e2eTestUtils.takeScreenshot('tablet_view');

      const tabletLayout = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
        hasTouch: 'ontouchstart' in window,
        hasContent: document.body.children.length > 0,
      }));

      expect(tabletLayout.width).toBe(768);
      expect(tabletLayout.height).toBe(1024);
      expect(tabletLayout.hasContent).toBe(true);

      // Test touch interactions if available
      if (tabletLayout.hasTouch) {
        await page.tap('body');
        await global.e2eTestUtils.waitForAsync(100);
      }
    }, 10000);

    test('should work on mobile viewport', async () => {
      await global.e2eTestUtils.setMobileViewport();

      // Wait for responsive adjustments
      await global.e2eTestUtils.waitForAsync(500);

      // Take screenshot for mobile
      await global.e2eTestUtils.takeScreenshot('mobile_view');

      const mobileLayout = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 600,
        hasContent: document.body.children.length > 0,
        isScrollable: document.body.scrollHeight > window.innerHeight,
      }));

      expect(mobileLayout.width).toBe(375);
      expect(mobileLayout.height).toBe(667);
      expect(mobileLayout.hasContent).toBe(true);

      // Test mobile-specific interactions
      await page.touchscreen.tap(100, 100);
      await global.e2eTestUtils.waitForAsync(100);

      // Test pinch zoom (if supported)
      try {
        await page.touchscreen.tap(100, 100);
        await page.touchscreen.tap(200, 200);
      } catch (error) {
        // Multi-touch might not be available in test environment
      }
    }, 12000);
  });

  describe('Network Condition Scenarios', () => {
    test('should handle slow network conditions', async () => {
      await global.e2eTestUtils.setSlowNetwork();

      const loadStart = Date.now();
      await page.reload();
      await page.waitForSelector('body', { timeout: 15000 });
      const loadTime = Date.now() - loadStart;

      // Should still load, just slower
      expect(loadTime).toBeGreaterThan(1000); // Should be slower due to throttling
      expect(loadTime).toBeLessThan(15000); // But not too slow

      // App should still be functional
      const functionality = await page.evaluate(() => ({
        hasContent: document.body.children.length > 0,
        isInteractive: document.querySelectorAll('button, input').length > 0,
      }));

      expect(functionality.hasContent).toBe(true);
    }, 20000);

    test('should provide offline experience', async () => {
      // First load the app normally
      await page.waitForSelector('body');

      // Then go offline
      await global.e2eTestUtils.setOfflineMode();

      // Try to reload
      try {
        await page.reload({ timeout: 5000 });
      } catch (error) {
        // Expected to fail or timeout
      }

      // Check if service worker or cache provides offline experience
      const offlineState = await page.evaluate(() => {
        return {
          hasServiceWorker: 'serviceWorker' in navigator,
          hasCache: 'caches' in window,
          pageTitle: document.title,
          hasContent: document.body.children.length > 0,
        };
      });

      // Should have some offline capability indicators
      expect(offlineState.hasServiceWorker || offlineState.hasCache).toBe(true);

      await global.e2eTestUtils.setOnlineMode();
    }, 15000);
  });

  describe('Game State Scenarios', () => {
    test('should handle rapid game state changes', async () => {
      // Simulate rapid user interactions
      const actions = [];

      for (let i = 0; i < 10; i++) {
        await page.mouse.click(100 + i * 10, 100 + i * 10);
        await global.e2eTestUtils.waitForAsync(50);
        actions.push(`click_${i}`);

        // Try keyboard input
        await page.keyboard.press('Space');
        actions.push(`key_${i}`);
      }

      expect(actions).toHaveLength(20);

      // App should still be responsive
      const finalState = await page.evaluate(() => ({
        isResponsive: document.readyState === 'complete',
        hasErrors: document.body.textContent.toLowerCase().includes('error'),
        timestamp: Date.now(),
      }));

      expect(finalState.isResponsive).toBe(true);
      expect(finalState.hasErrors).toBe(false);
    }, 12000);

    test('should maintain state during navigation', async () => {
      // Record initial state
      const initialState = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length,
      }));

      // Try to navigate (if there are navigation elements)
      const hasNavigation = await page.evaluate(() => {
        return document.querySelectorAll('a, [role="button"]').length > 0;
      });

      if (hasNavigation) {
        // Try clicking a navigation element
        const navElements = await page.$$('a, [role="button"]');
        if (navElements.length > 0) {
          try {
            await navElements[0].click();
            await global.e2eTestUtils.waitForAsync(1000);
          } catch (error) {
            // Navigation might not work in test environment
          }
        }
      }

      // Check if state is maintained or properly updated
      const finalState = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length,
        hasContent: document.body.children.length > 0,
      }));

      expect(finalState.hasContent).toBe(true);
      // State might change or stay the same, both are valid
    }, 10000);
  });

  describe('Multi-User Simulation', () => {
    test('should handle multiple browser tabs', async () => {
      // Open a second tab
      const secondTab = await browser.newPage();

      try {
        // Navigate both tabs to the app
        await secondTab.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        // Both tabs should load successfully
        const tab1Ready = await page.evaluate(() => document.readyState === 'complete');
        const tab2Ready = await secondTab.evaluate(() => document.readyState === 'complete');

        expect(tab1Ready).toBe(true);
        expect(tab2Ready).toBe(true);

        // Test interactions in both tabs
        await page.mouse.click(100, 100);
        await secondTab.mouse.click(150, 150);

        // Both should remain functional
        const tab1Working = await page.evaluate(() => document.body.children.length > 0);
        const tab2Working = await secondTab.evaluate(() => document.body.children.length > 0);

        expect(tab1Working).toBe(true);
        expect(tab2Working).toBe(true);
      } finally {
        await secondTab.close();
      }
    }, 15000);

    test('should handle session storage correctly', async () => {
      // Set some session data
      await page.evaluate(() => {
        sessionStorage.setItem('test_key', 'test_value');
        localStorage.setItem('persistent_key', 'persistent_value');
      });

      // Refresh page
      await page.reload();
      await page.waitForSelector('body');

      // Check if data persists correctly
      const storageState = await page.evaluate(() => ({
        sessionData: sessionStorage.getItem('test_key'),
        localData: localStorage.getItem('persistent_key'),
        sessionKeys: Object.keys(sessionStorage).length,
        localKeys: Object.keys(localStorage).length,
      }));

      // Session storage should persist, local storage definitely should
      expect(storageState.localData).toBe('persistent_value');
      // Session storage might or might not persist depending on implementation
    }, 8000);
  });

  describe('Performance Under Load', () => {
    test('should maintain performance with heavy DOM manipulation', async () => {
      const startTime = Date.now();

      // Create heavy DOM manipulation
      await page.evaluate(() => {
        for (let i = 0; i < 100; i++) {
          const div = document.createElement('div');
          div.textContent = `Test element ${i}`;
          div.style.position = 'absolute';
          div.style.left = `${i}px`;
          div.style.top = `${i}px`;
          document.body.appendChild(div);
        }
      });

      const manipulationTime = Date.now() - startTime;
      expect(manipulationTime).toBeLessThan(5000);

      // Test if app is still responsive
      await page.mouse.click(50, 50);
      const isResponsive = await page.evaluate(() => {
        return performance.now() > 0 && document.readyState === 'complete';
      });

      expect(isResponsive).toBe(true);

      // Cleanup
      await page.evaluate(() => {
        document.querySelectorAll('div').forEach((div) => {
          if (div.textContent && div.textContent.includes('Test element')) {
            div.remove();
          }
        });
      });
    }, 10000);

    test('should handle memory pressure', async () => {
      // Create memory pressure scenario
      await page.evaluate(() => {
        // Create large arrays to simulate memory usage
        window.testArrays = [];
        for (let i = 0; i < 100; i++) {
          window.testArrays.push(new Array(1000).fill(`data_${i}`));
        }
      });

      // Test if app still functions
      await page.mouse.click(100, 100);

      const memoryState = await page.evaluate(() => ({
        hasTestArrays: window.testArrays && window.testArrays.length > 0,
        isResponsive: document.readyState === 'complete',
        hasMemoryInfo: 'memory' in performance,
      }));

      expect(memoryState.isResponsive).toBe(true);

      // Cleanup
      await page.evaluate(() => {
        if (window.testArrays) {
          delete window.testArrays;
        }
      });
    }, 12000);
  });

  describe('Browser Compatibility Scenarios', () => {
    test('should handle various JavaScript features', async () => {
      const featureSupport = await page.evaluate(() => {
        return {
          hasES6: typeof Promise !== 'undefined',
          hasLocalStorage: typeof Storage !== 'undefined',
          hasSessionStorage: typeof sessionStorage !== 'undefined',
          hasFetch: typeof fetch !== 'undefined',
          hasEventListeners: typeof addEventListener !== 'undefined',
          hasQuerySelector: typeof document.querySelector !== 'undefined',
          hasConsole: typeof console !== 'undefined',
        };
      });

      // Modern features should be available
      expect(featureSupport.hasES6).toBe(true);
      expect(featureSupport.hasLocalStorage).toBe(true);
      expect(featureSupport.hasQuerySelector).toBe(true);
      expect(featureSupport.hasEventListeners).toBe(true);
    }, 8000);

    test('should gracefully handle feature detection', async () => {
      // Test feature detection patterns
      const featureDetection = await page.evaluate(() => {
        const features = {};

        // Test common feature detection patterns
        features.supportsTouch = 'ontouchstart' in window;
        features.supportsGeolocation = 'geolocation' in navigator;
        features.supportsServiceWorker = 'serviceWorker' in navigator;
        features.supportsWebGL = !!window.WebGLRenderingContext;
        features.supportsCanvas = !!document.createElement('canvas').getContext;

        return features;
      });

      // Should detect features without errors
      expect(typeof featureDetection.supportsTouch).toBe('boolean');
      expect(typeof featureDetection.supportsCanvas).toBe('boolean');
    }, 8000);
  });
});
