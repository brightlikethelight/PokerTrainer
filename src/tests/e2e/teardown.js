/**
 * E2E Test Teardown
 * Ensures Puppeteer properly closes after tests
 */

module.exports = async function globalTeardown() {
  // Close the browser
  if (global.__BROWSER__) {
    await global.__BROWSER__.close();
  }

  // Kill any remaining processes
  if (global.__SERVER_PROCESS__) {
    global.__SERVER_PROCESS__.kill();
  }
};
