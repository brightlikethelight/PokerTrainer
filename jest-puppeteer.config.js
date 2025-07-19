/**
 * Jest Puppeteer Configuration
 * End-to-end testing setup for PokerTrainer
 */

module.exports = {
  launch: {
    headless: 'new', // Use new headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ],
    defaultViewport: {
      width: 1280,
      height: 800,
    },
  },
  server: {
    command: 'npm start',
    port: 3000,
    launchTimeout: 60000,
    debug: true,
  },
  browserContext: 'default',
};
