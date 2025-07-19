// Performance Monitoring Service
// Real-time metrics collection and Web Vitals tracking

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

import logger from '../../../services/logger';
// getINP may not be available in all versions of web-vitals
let getINP;
try {
  ({ getINP } = require('web-vitals'));
} catch (e) {
  // getINP not available in this version
}

class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      enabledInProduction: true,
      enabledInDevelopment: true,
      sampleRate: 1.0, // 100% sampling by default
      endpoint: '/api/metrics',
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      ...config,
    };

    this.metrics = [];
    this.isEnabled = this._shouldEnable();
    this.sessionId = this._generateSessionId();
    this.startTime = performance.now();

    if (this.isEnabled) {
      this._initializeWebVitals();
      this._initializeCustomMetrics();
      this._startPerformanceObserver();
      this._setupFlushInterval();
    }
  }

  _shouldEnable() {
    const isDev = process.env.NODE_ENV === 'development';
    const isProd = process.env.NODE_ENV === 'production';

    return (
      (isDev && this.config.enabledInDevelopment) || (isProd && this.config.enabledInProduction)
    );
  }

  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _initializeWebVitals() {
    // Track Core Web Vitals
    getCLS(this._handleMetric.bind(this, 'CLS'));
    getFID(this._handleMetric.bind(this, 'FID'));
    getFCP(this._handleMetric.bind(this, 'FCP'));
    getLCP(this._handleMetric.bind(this, 'LCP'));
    getTTFB(this._handleMetric.bind(this, 'TTFB'));

    // Track INP (Interaction to Next Paint) - new metric
    if (getINP) {
      getINP(this._handleMetric.bind(this, 'INP'));
    }
  }

  _initializeCustomMetrics() {
    // Track React component render times
    this._trackReactPerformance();

    // Track user interactions
    this._trackUserInteractions();

    // Track resource loading
    this._trackResourceLoading();

    // Track memory usage
    this._trackMemoryUsage();
  }

  _startPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    // Observe long tasks (> 50ms)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('LongTask', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      logger.warn('Long task observer not supported', { error: e });
    }

    // Observe layout shifts
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.recordMetric('LayoutShift', {
              value: entry.value,
              sources: entry.sources?.length || 0,
            });
          }
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      logger.warn('Layout shift observer not supported', { error: e });
    }
  }

  _trackReactPerformance() {
    // Track React component lifecycle performance
    /* eslint-disable no-console */
    const originalConsoleTime = console.time;
    const originalConsoleTimeEnd = console.timeEnd;

    console.time = (label) => {
      this._reactTimers = this._reactTimers || {};
      this._reactTimers[label] = performance.now();
      return originalConsoleTime.call(console, label);
    };

    console.timeEnd = (label) => {
      /* eslint-enable no-console */
      if (this._reactTimers && this._reactTimers[label]) {
        const duration = performance.now() - this._reactTimers[label];
        this.recordMetric('ReactRender', {
          component: label,
          duration,
        });
        delete this._reactTimers[label];
      }
      return originalConsoleTimeEnd.call(console, label);
    };
  }

  _trackUserInteractions() {
    // Track click responsiveness
    document.addEventListener('click', (event) => {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const duration = performance.now() - startTime;
        this.recordMetric('ClickResponsiveness', {
          duration,
          target: event.target.tagName,
          elementId: event.target.id,
        });
      });
    });

    // Track input lag
    ['input', 'change'].forEach((eventType) => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();

        requestAnimationFrame(() => {
          const duration = performance.now() - startTime;
          this.recordMetric('InputLag', {
            duration,
            type: eventType,
            inputType: event.target.type,
          });
        });
      });
    });
  }

  _trackResourceLoading() {
    // Track resource loading performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.recordMetric('ResourceLoad', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: entry.initiatorType,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  _trackMemoryUsage() {
    // Track memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('MemoryUsage', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }, 10000); // Every 10 seconds
    }
  }

  _handleMetric(name, metric) {
    this.recordMetric(`WebVital_${name}`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  recordMetric(name, data = {}) {
    if (!this.isEnabled) return;

    const metric = {
      name,
      value: data.value || data.duration || 0,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      ...data,
    };

    this.metrics.push(metric);

    // Flush immediately for critical metrics
    if (this._isCriticalMetric(name)) {
      this.flush();
    }

    // Auto-flush when batch is full
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  _isCriticalMetric(name) {
    return ['WebVital_CLS', 'WebVital_FID', 'WebVital_LCP', 'LongTask'].includes(name);
  }

  _setupFlushInterval() {
    setInterval(() => {
      if (this.metrics.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  flush(isUnloading = false) {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    const payload = {
      sessionId: this.sessionId,
      metrics: metricsToSend,
      sessionDuration: performance.now() - this.startTime,
      timestamp: Date.now(),
    };

    if (isUnloading) {
      // Use sendBeacon for reliable delivery during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.config.endpoint, JSON.stringify(payload));
      }
    } else {
      // Use fetch for normal operation
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch((error) => {
        logger.warn('Failed to send performance metrics', { error });
        // Re-add metrics for retry
        this.metrics.unshift(...metricsToSend);
      });
    }
  }

  // Public API for custom tracking
  startTiming(label) {
    this._customTimings = this._customTimings || {};
    this._customTimings[label] = performance.now();
  }

  endTiming(label, metadata = {}) {
    if (!this._customTimings || !this._customTimings[label]) return;

    const duration = performance.now() - this._customTimings[label];
    this.recordMetric('CustomTiming', {
      label,
      duration,
      ...metadata,
    });

    delete this._customTimings[label];
    return duration;
  }

  recordEvent(eventName, data = {}) {
    this.recordMetric('CustomEvent', {
      event: eventName,
      ...data,
    });
  }

  getSessionMetrics() {
    return {
      sessionId: this.sessionId,
      sessionDuration: performance.now() - this.startTime,
      metricsCount: this.metrics.length,
      isEnabled: this.isEnabled,
    };
  }

  // For debugging
  getMetrics() {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }
}

// Export singleton instance
export default new PerformanceMonitor({
  endpoint: process.env.REACT_APP_METRICS_ENDPOINT || '/api/metrics',
  enabledInDevelopment: process.env.NODE_ENV === 'development',
});
