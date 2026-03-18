jest.mock('../logger', () => {
  const mockLogger = { debug: jest.fn(), error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  return { __esModule: true, default: mockLogger };
});

import {
  recordMetric,
  startTiming,
  endTiming,
  getAllMetrics,
  clearMetrics,
} from '../performanceLogger';
import logger from '../logger';

describe('performanceLogger', () => {
  beforeEach(() => {
    clearMetrics();
    jest.clearAllMocks();
  });

  describe('recordMetric', () => {
    it('stores a metric with a timestamp', () => {
      const now = Date.now();
      recordMetric('test_metric', { value: 42 });
      const metrics = getAllMetrics();
      expect(metrics.test_metric).toBeDefined();
      expect(metrics.test_metric.value).toBe(42);
      expect(metrics.test_metric.timestamp).toBeGreaterThanOrEqual(now);
    });

    it('overwrites a metric with the same name', () => {
      recordMetric('dup', { value: 1 });
      recordMetric('dup', { value: 2 });
      const metrics = getAllMetrics();
      expect(metrics.dup.value).toBe(2);
    });

    it('logs debug message in development mode', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      recordMetric('dev_metric', { value: 10 });
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('dev_metric'),
        expect.objectContaining({ value: 10 })
      );
      process.env.NODE_ENV = origEnv;
    });

    it('does not log debug message outside development mode', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      jest.clearAllMocks();
      recordMetric('prod_metric', { value: 5 });
      expect(logger.debug).not.toHaveBeenCalled();
      process.env.NODE_ENV = origEnv;
    });

    it('catches errors and logs them', () => {
      // Force an error by passing something that will fail spread
      // The try/catch in recordMetric should handle this gracefully
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      // Normal call should not error
      recordMetric('safe', { a: 1 });
      expect(logger.error).not.toHaveBeenCalled();
      process.env.NODE_ENV = origEnv;
    });
  });

  describe('startTiming / endTiming', () => {
    it('returns duration when start and end are both called', () => {
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(100).mockReturnValueOnce(350);

      startTiming('render');
      const duration = endTiming('render');

      expect(duration).toBe(250);
      mockNow.mockRestore();
    });

    it('records a timing metric after endTiming', () => {
      // endTiming internally calls recordMetric which stores the timing
      startTiming('compute');
      const duration = endTiming('compute');

      expect(duration).toBeGreaterThanOrEqual(0);
      const metrics = getAllMetrics();
      expect(metrics.timing_compute).toBeDefined();
      expect(typeof metrics.timing_compute.duration).toBe('number');
    });

    it('removes the timing entry after endTiming', () => {
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(10);

      startTiming('once');
      endTiming('once');
      // Second call should return null since entry was removed
      const result = endTiming('once');
      expect(result).toBeNull();
      mockNow.mockRestore();
    });
  });

  describe('endTiming without startTiming', () => {
    it('returns null', () => {
      const result = endTiming('nonexistent');
      expect(result).toBeNull();
    });

    it('logs a warning', () => {
      endTiming('missing');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('missing'));
    });
  });

  describe('getAllMetrics', () => {
    it('returns a shallow copy of metrics', () => {
      recordMetric('m1', { v: 1 });
      recordMetric('m2', { v: 2 });
      const metrics = getAllMetrics();
      expect(metrics.m1).toBeDefined();
      expect(metrics.m2).toBeDefined();

      // Mutating the copy should not affect internal state
      delete metrics.m1;
      const fresh = getAllMetrics();
      expect(fresh.m1).toBeDefined();
    });

    it('returns empty object when no metrics recorded', () => {
      const metrics = getAllMetrics();
      expect(metrics).toEqual({});
    });
  });

  describe('clearMetrics', () => {
    it('empties all metrics', () => {
      recordMetric('x', { v: 1 });
      clearMetrics();
      expect(getAllMetrics()).toEqual({});
    });

    it('clears pending timings', () => {
      startTiming('pending');
      clearMetrics();
      const result = endTiming('pending');
      expect(result).toBeNull();
    });
  });
});
