/**
 * Simple Performance Logger
 * Replaces the complex PerformanceMonitor with basic logging functionality
 */

import logger from './logger';

const performanceData = {
  metrics: {},
  timings: new Map(),
};

/**
 * Record a performance metric
 * @param {string} name - Metric name
 * @param {Object} data - Metric data
 */
export function recordMetric(name, data) {
  try {
    performanceData.metrics[name] = {
      ...data,
      timestamp: Date.now(),
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Performance metric: ${name}`, data);
    }
  } catch (error) {
    // Silently fail - performance monitoring should not break the app
    logger.error('Failed to record metric:', error);
  }
}

/**
 * Start timing an operation
 * @param {string} name - Operation name
 */
export function startTiming(name) {
  performanceData.timings.set(name, performance.now());
}

/**
 * End timing an operation and record the duration
 * @param {string} name - Operation name
 * @returns {number|null} Duration in milliseconds
 */
export function endTiming(name) {
  const startTime = performanceData.timings.get(name);
  if (!startTime) {
    logger.warn(`No start time found for timing: ${name}`);
    return null;
  }

  const duration = performance.now() - startTime;
  performanceData.timings.delete(name);

  recordMetric(`timing_${name}`, { duration });

  return duration;
}

/**
 * Get all recorded metrics
 * @returns {Object} All metrics
 */
export function getAllMetrics() {
  return { ...performanceData.metrics };
}

/**
 * Clear all metrics
 */
export function clearMetrics() {
  performanceData.metrics = {};
  performanceData.timings.clear();
}

// Export simple API matching PerformanceMonitor interface
export default {
  recordMetric,
  startTiming,
  endTiming,
  getAllMetrics,
  clearMetrics,
};
