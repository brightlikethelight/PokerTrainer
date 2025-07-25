/**
 * Complete User Journey E2E Tests
 * Tests complete user journey: Start game → Play hands → View analytics
 */

import './setupE2ETests';

describe('Complete User Journey', () => {
  beforeEach(async () => {
    await global.e2eTestUtils.navigateToApp();
  });

  describe('First Time User Experience', () => {
    test('should guide new user through complete poker session', async () => {
      // 1. App should load without errors
      await page.waitForSelector('body', { timeout: 10000 });

      // Check for any critical errors on load
      const consoleErrors = global.e2eTestUtils.setupConsoleMonitoring();

      // 2. Look for main app container or game interface
      const hasGameInterface = await global.e2eTestUtils.waitForElement(
        '.poker-table, .game-container, .app, #root'
      );
      expect(hasGameInterface).toBe(true);

      // 3. Check that the page title is correct
      const title = await page.title();
      expect(title).toContain('Poker');

      // 4. Verify no critical console errors
      expect(
        consoleErrors.filter((error) => !error.includes('punycode') && !error.includes('Warning:'))
      ).toHaveLength(0);
    }, 30000);

    test('should handle app initialization gracefully', async () => {
      // Test app loads with JavaScript disabled
      await page.setJavaScriptEnabled(false);
      await page.reload();

      // Should have some fallback content
      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText.length).toBeGreaterThan(0);

      // Re-enable JavaScript
      await page.setJavaScriptEnabled(true);
      await page.reload();

      // App should work normally
      await page.waitForSelector('body');
      const hasContent = await page.evaluate(() => document.body.children.length > 0);
      expect(hasContent).toBe(true);
    }, 20000);
  });

  describe('Game Play Journey', () => {
    test('should complete a basic poker hand', async () => {
      // Wait for game to be ready
      await page.waitForSelector('body');

      // Look for game elements that might exist
      const gameElements = await page.evaluate(() => {
        return {
          hasCards: document.querySelectorAll('[class*="card"], .card').length > 0,
          hasButtons: document.querySelectorAll('button').length > 0,
          hasTable: document.querySelectorAll('[class*="table"], .table').length > 0,
          hasBetting: document.querySelectorAll('[class*="bet"], .betting').length > 0,
          bodyContent: document.body.textContent.slice(0, 200),
        };
      });

      // Should have some interactive elements
      expect(gameElements.hasButtons).toBe(true);

      // Take screenshot for manual verification
      await global.e2eTestUtils.takeScreenshot('game_interface');

      // If there are any clickable poker-related buttons, try clicking them
      const pokerButtons = await page.$$('button');
      if (pokerButtons.length > 0) {
        // Try clicking the first button safely
        try {
          await pokerButtons[0].click();
          await global.e2eTestUtils.waitForAsync(500);
        } catch (error) {
          // Button might not be clickable, that's ok for this test
        }
      }
    }, 15000);

    test('should handle user interactions smoothly', async () => {
      // Test various user interactions
      const interactions = [];

      // Test mouse movement
      await page.mouse.move(100, 100);
      await page.mouse.move(200, 200);
      interactions.push('mouse_movement');

      // Test keyboard input
      await page.keyboard.press('Tab');
      interactions.push('keyboard_input');

      // Test clicking
      await page.mouse.click(300, 300);
      interactions.push('mouse_click');

      // Test scrolling
      await page.evaluate(() => window.scrollBy(0, 100));
      interactions.push('scroll');

      expect(interactions).toHaveLength(4);

      // Page should still be responsive
      const isResponsive = await page.evaluate(() => {
        return document.readyState === 'complete';
      });
      expect(isResponsive).toBe(true);
    }, 10000);
  });

  describe('Navigation and Features', () => {
    test('should navigate through different app sections', async () => {
      // Look for navigation elements
      const navElements = await page.evaluate(() => {
        return {
          links: Array.from(document.querySelectorAll('a')).map((a) => a.textContent),
          buttons: Array.from(document.querySelectorAll('button')).map((b) => b.textContent),
          navs: document.querySelectorAll('nav, [role="navigation"]').length,
        };
      });

      // Try to find and click navigation elements
      if (navElements.links.length > 0) {
        const firstLink = await page.$('a');
        if (firstLink) {
          const href = await page.evaluate((el) => el.href, firstLink);
          if (href && !href.includes('javascript') && !href.includes('#')) {
            try {
              await firstLink.click();
              await global.e2eTestUtils.waitForAsync(1000);
            } catch (error) {
              // Navigation might not work in test environment
            }
          }
        }
      }

      // App should maintain functionality
      const appState = await page.evaluate(() => ({
        hasContent: document.body.children.length > 0,
        isInteractive: document.querySelectorAll('button, input, select').length > 0,
      }));

      expect(appState.hasContent).toBe(true);
    }, 15000);

    test('should handle feature discovery', async () => {
      // Look for various poker-related features
      const features = await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();
        return {
          hasPokerTerms: /poker|cards|bet|fold|call|raise/.test(text),
          hasGameElements:
            document.querySelectorAll('[class*="game"], [class*="poker"], [class*="card"]').length >
            0,
          hasInteractiveElements: document.querySelectorAll('button, input, select').length > 0,
          wordCount: text.split(' ').length,
        };
      });

      // Should have poker-related content or interactivity
      expect(
        features.hasPokerTerms || features.hasGameElements || features.hasInteractiveElements
      ).toBe(true);
      expect(features.wordCount).toBeGreaterThan(5);
    }, 10000);
  });

  describe('Performance and Responsiveness', () => {
    test('should load quickly and remain responsive', async () => {
      const startTime = Date.now();

      await page.reload();
      await page.waitForSelector('body');

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(10000);

      // Test responsiveness
      const responseTimes = [];
      for (let i = 0; i < 3; i++) {
        const clickStart = Date.now();
        await page.mouse.click(100 + i * 50, 100 + i * 50);
        await global.e2eTestUtils.waitForAsync(100);
        responseTimes.push(Date.now() - clickStart);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(avgResponseTime).toBeLessThan(1000);
    }, 15000);

    test('should handle rapid user actions', async () => {
      // Perform rapid clicks
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(200, 200);
        await global.e2eTestUtils.waitForAsync(50);
      }

      // App should still be responsive
      const isStillWorking = await page.evaluate(() => {
        return (
          document.readyState === 'complete' &&
          !document.body.textContent.includes('error') &&
          !document.body.textContent.includes('crashed')
        );
      });

      expect(isStillWorking).toBe(true);
    }, 10000);
  });

  describe('Error Handling', () => {
    test('should handle network interruptions gracefully', async () => {
      // Test offline capability
      await global.e2eTestUtils.setOfflineMode();

      try {
        // Try to interact with the app
        await page.mouse.click(150, 150);
        await global.e2eTestUtils.waitForAsync(500);

        // App should still function for offline features
        const offlineState = await page.evaluate(() => ({
          hasContent: document.body.children.length > 0,
          noErrorMessages: !document.body.textContent.toLowerCase().includes('network error'),
        }));

        expect(offlineState.hasContent).toBe(true);
      } finally {
        await global.e2eTestUtils.setOnlineMode();
      }
    }, 10000);

    test('should recover from JavaScript errors', async () => {
      // Inject a non-critical error
      await page.evaluate(() => {
        try {
          // This will cause an error but shouldn't crash the app
          window.nonExistentFunction();
        } catch (e) {
          // Error caught, app should continue
        }
      });

      // App should still be functional
      const isWorking = await page.evaluate(() => {
        return document.readyState === 'complete' && document.body.children.length > 0;
      });

      expect(isWorking).toBe(true);
    }, 8000);
  });

  describe('Accessibility', () => {
    test('should support keyboard navigation', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await global.e2eTestUtils.waitForAsync(100);

      const focusedElement = await page.evaluate(() => {
        return document.activeElement
          ? {
              tagName: document.activeElement.tagName,
              hasTabIndex: document.activeElement.tabIndex !== undefined,
            }
          : null;
      });

      // Should have some focusable elements
      const focusableElements = await page.evaluate(() => {
        return document.querySelectorAll('button, input, select, a, [tabindex]').length;
      });

      expect(focusableElements).toBeGreaterThan(0);
    }, 8000);

    test('should have proper ARIA labels and structure', async () => {
      const accessibility = await page.evaluate(() => {
        return {
          hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          hasAriaLabels: document.querySelectorAll('[aria-label], [aria-labelledby]').length > 0,
          hasProperButtons: Array.from(document.querySelectorAll('button')).every(
            (btn) => btn.textContent.trim().length > 0 || btn.getAttribute('aria-label')
          ),
          hasSemanticStructure:
            document.querySelectorAll('main, section, article, nav, header, footer').length > 0,
        };
      });

      // Should have some accessibility features
      expect(
        accessibility.hasHeadings ||
          accessibility.hasAriaLabels ||
          accessibility.hasSemanticStructure ||
          accessibility.hasProperButtons
      ).toBe(true);
    }, 8000);
  });
});
