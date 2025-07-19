# Deployment & Production Guide

## Production Build

### Build Process

```bash
# Install dependencies (production only)
npm ci --production

# Run tests
npm run test:coverage

# Build for production
npm run build

# The build folder is ready to be deployed
```

### Build Optimization

The production build includes:

- Minified JavaScript
- Optimized CSS
- Code splitting
- Tree shaking
- Service worker for caching

## Deployment Options

### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**vercel.json:**

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": { "cache-control": "s-maxage=31536000,immutable" }
    },
    {
      "src": "/favicon.ico",
      "headers": { "cache-control": "s-maxage=31536000,immutable" }
    },
    {
      "src": "/(.*)",
      "headers": { "cache-control": "s-maxage=0" }
    }
  ]
}
```

### 2. Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

**netlify.toml:**

```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 3. GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

### 4. AWS S3 + CloudFront

```bash
# Build the app
npm run build

# Sync to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Environment Configuration

### Environment Variables

```bash
# .env.production
REACT_APP_VERSION=$npm_package_version
REACT_APP_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REACT_APP_ENVIRONMENT=production
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_GA_TRACKING_ID=your-ga-id
```

### Build-time Configuration

```javascript
// config/production.js
export default {
  api: {
    timeout: 30000,
    retries: 3,
  },
  features: {
    analytics: true,
    errorTracking: true,
    performanceMonitoring: true,
  },
  cache: {
    maxAge: 3600000, // 1 hour
    maxSize: 50, // MB
  },
};
```

## Performance Optimization

### 1. Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev webpack-bundle-analyzer

# Add to package.json
"analyze": "source-map-explorer 'build/static/js/*.js'"

# Run analysis
npm run build
npm run analyze
```

### 2. Code Splitting

```javascript
// Route-based splitting
const Play = lazy(() => import('./views/Play'));
const Study = lazy(() => import('./views/Study'));

// Component-based splitting
const HeavyComponent = lazy(() => import(/* webpackChunkName: "heavy" */ './HeavyComponent'));
```

### 3. Asset Optimization

```javascript
// Image optimization
import { OptimizedImage } from './components/common/OptimizedImage';

<OptimizedImage
  src="poker-table.jpg"
  alt="Poker table"
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
/>;
```

### 4. Caching Strategy

```javascript
// Service Worker configuration
const cacheConfig = {
  runtime: {
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'poker-trainer-runtime',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
};
```

## Monitoring & Analytics

### 1. Error Tracking (Sentry)

```javascript
// src/services/error-tracking.js
import * as Sentry from '@sentry/react';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter sensitive information
      return event;
    },
  });
}
```

### 2. Performance Monitoring

```javascript
// src/services/performance.js
export const measurePerformance = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

      // Send to analytics
      analytics.track('Performance', {
        pageLoadTime,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      });
    });
  }
};
```

### 3. User Analytics

```javascript
// src/services/analytics.js
import ReactGA from 'react-ga4';

export const initAnalytics = () => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
  }
};

export const trackEvent = (category, action, label, value) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};
```

## Security Checklist

### 1. Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check outdated packages
npm outdated
```

### 2. Headers Configuration

```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';" always;
```

### 3. Environment Variables

- Never commit `.env` files
- Use secrets management in CI/CD
- Rotate API keys regularly
- Use different keys for each environment

## Performance Budget

### Target Metrics

```javascript
// performance-budget.json
{
  "timings": {
    "firstContentfulPaint": 1500,
    "timeToInteractive": 3000,
    "firstMeaningfulPaint": 1500,
    "maxPotentialFID": 100
  },
  "sizes": {
    "totalBundleSize": 500000,
    "maxJavaScriptSize": 350000,
    "maxCssSize": 60000,
    "maxImageSize": 200000
  }
}
```

### Monitoring Script

```javascript
// scripts/check-performance-budget.js
const budget = require('./performance-budget.json');
const buildStats = require('./build-stats.json');

Object.entries(budget.sizes).forEach(([metric, limit]) => {
  if (buildStats[metric] > limit) {
    console.error(`❌ ${metric} exceeds budget: ${buildStats[metric]} > ${limit}`);
    process.exit(1);
  }
});
```

## Pre-deployment Checklist

### Code Quality

- [ ] All tests pass (`npm test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] No console.log statements
- [ ] No commented-out code

### Performance

- [ ] Bundle size within budget
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Service worker configured
- [ ] Caching headers set

### Security

- [ ] No hardcoded secrets
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] CSP policy defined
- [ ] Input validation complete

### Functionality

- [ ] All features working
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Offline functionality works
- [ ] Cross-browser tested

### Monitoring

- [ ] Error tracking configured
- [ ] Analytics implemented
- [ ] Performance monitoring set up
- [ ] Health check endpoint available
- [ ] Logging configured

## Post-deployment

### Verification Steps

1. **Smoke Tests**

   ```bash
   # Run automated smoke tests
   npm run test:e2e:production
   ```

2. **Manual Testing**
   - Start new game
   - Play a complete hand
   - Use GTO analysis
   - Complete a study session
   - Check error handling

3. **Performance Verification**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Verify caching works
   - Test on slow network

### Rollback Plan

```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# AWS S3
aws s3 sync s3://your-bucket-name-backup s3://your-bucket-name --delete
```

### Monitoring Dashboard

Set up monitoring for:

- Error rate
- Page load times
- API response times
- User engagement metrics
- Resource usage

## Maintenance

### Regular Tasks

- **Weekly**: Check error logs
- **Monthly**: Review analytics
- **Quarterly**: Update dependencies
- **Yearly**: Major version upgrades

### Backup Strategy

```bash
# Backup user data (if storing any)
npm run backup:user-data

# Backup application state
npm run backup:app-state

# Backup to S3
aws s3 sync ./backups s3://backup-bucket/$(date +%Y%m%d)
```
