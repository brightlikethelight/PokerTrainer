module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run build && npx serve -s build -p 3000',
      startServerReadyPattern: 'Accepting connections',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        interactive: ['error', { maxNumericValue: 3800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.95 }],

        // Best Practices
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'no-vulnerable-libraries': 'error',
        'js-libraries': 'error',

        // SEO
        'categories:seo': ['error', { minScore: 0.9 }],

        // PWA (optional, adjust based on your needs)
        'categories:pwa': ['warn', { minScore: 0.8 }],

        // Budget assertions
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }], // 1MB
        'resource-summary:total:size': ['error', { maxNumericValue: 2000000 }], // 2MB
      },
    },
    upload: {
      target: 'temporary-public-storage',
      outputDir: './lighthouse-results',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
