/**
 * PerformanceMonitor Test Suite
 * Comprehensive tests for performance monitoring and optimization
 * Target: 90%+ coverage with realistic performance scenarios
 */

import PerformanceMonitor from '../PerformanceMonitor';

// Mock performance APIs
global.performance = {
  now: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(),
  getEntriesByName: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  observer: null,
};

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((_callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => []),
}));

// Mock console methods
const mockConsole = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
};

Object.assign(console, mockConsole);

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PerformanceMonitor();

    // Reset performance.now mock
    performance.now.mockReturnValue(1000);
  });

  afterEach(() => {
    if (monitor) {
      monitor.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(monitor).toBeDefined();
      expect(monitor.isEnabled()).toBe(true);
      expect(monitor.getMetrics()).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const config = {
        enabled: false,
        maxEntries: 500,
        thresholds: {
          slow: 100,
          critical: 500,
        },
      };

      const customMonitor = new PerformanceMonitor(config);

      expect(customMonitor.isEnabled()).toBe(false);
      expect(customMonitor.getConfiguration().maxEntries).toBe(500);

      customMonitor.destroy();
    });

    test('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        enabled: 'invalid',
        maxEntries: -1,
        thresholds: null,
      };

      expect(() => {
        const invalidMonitor = new PerformanceMonitor(invalidConfig);
        invalidMonitor.destroy();
      }).not.toThrow();
    });

    test('should detect browser capabilities', () => {
      expect(monitor.getBrowserCapabilities()).toEqual(
        expect.objectContaining({
          performanceAPI: true,
          performanceObserver: true,
          navigationTiming: expect.any(Boolean),
          resourceTiming: expect.any(Boolean),
        })
      );
    });
  });

  describe('Performance Timing', () => {
    test('should start and end timing', () => {
      performance.now
        .mockReturnValueOnce(1000) // start
        .mockReturnValueOnce(1500); // end

      monitor.startTiming('test-operation');
      const duration = monitor.endTiming('test-operation');

      expect(duration).toBe(500);
      expect(performance.mark).toHaveBeenCalledWith('test-operation-start');
      expect(performance.mark).toHaveBeenCalledWith('test-operation-end');
    });

    test('should handle multiple concurrent timings', () => {
      performance.now
        .mockReturnValueOnce(1000) // operation1 start
        .mockReturnValueOnce(1100) // operation2 start
        .mockReturnValueOnce(1300) // operation1 end
        .mockReturnValueOnce(1400); // operation2 end

      monitor.startTiming('operation1');
      monitor.startTiming('operation2');

      const duration1 = monitor.endTiming('operation1');
      const duration2 = monitor.endTiming('operation2');

      expect(duration1).toBe(300);
      expect(duration2).toBe(300);
    });

    test('should handle ending non-existent timing', () => {
      const duration = monitor.endTiming('non-existent');

      expect(duration).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        "Attempted to end timing for 'non-existent' but no start time found"
      );
    });

    test('should measure function execution time', async () => {
      performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1250);

      const testFunction = jest.fn().mockResolvedValue('result');

      const result = await monitor.measureFunction('test-fn', testFunction);

      expect(result).toBe('result');
      expect(testFunction).toHaveBeenCalledTimes(1);

      const metrics = monitor.getMetrics();
      expect(metrics.functions['test-fn']).toEqual(
        expect.objectContaining({
          totalTime: 250,
          callCount: 1,
          averageTime: 250,
        })
      );
    });

    test('should handle function errors gracefully', async () => {
      const errorFunction = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(monitor.measureFunction('error-fn', errorFunction)).rejects.toThrow(
        'Test error'
      );

      const metrics = monitor.getMetrics();
      expect(metrics.functions['error-fn']).toEqual(
        expect.objectContaining({
          callCount: 1,
          errorCount: 1,
        })
      );
    });
  });

  describe('Memory Monitoring', () => {
    test('should track memory usage', () => {
      // Mock memory info
      global.performance.memory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 2000000000,
      };

      const memoryInfo = monitor.getMemoryInfo();

      expect(memoryInfo).toEqual(
        expect.objectContaining({
          used: 10000000,
          total: 20000000,
          limit: 2000000000,
          utilization: 0.5,
        })
      );
    });

    test('should handle missing memory API', () => {
      delete global.performance.memory;

      const memoryInfo = monitor.getMemoryInfo();

      expect(memoryInfo).toEqual({
        used: 0,
        total: 0,
        limit: 0,
        utilization: 0,
        available: false,
      });
    });

    test('should detect memory leaks', () => {
      global.performance.memory = {
        usedJSHeapSize: 100000000, // 100MB
        totalJSHeapSize: 200000000,
        jsHeapSizeLimit: 2000000000,
      };

      // First measurement
      monitor.checkMemoryUsage();

      // Simulate memory increase
      global.performance.memory.usedJSHeapSize = 150000000; // 150MB

      // Second measurement
      monitor.checkMemoryUsage();

      const leaks = monitor.getMemoryLeaks();
      expect(leaks.length).toBeGreaterThan(0);
      expect(leaks[0]).toEqual(
        expect.objectContaining({
          increase: 50000000,
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Network Performance', () => {
    test('should track network requests', () => {
      const requestData = {
        url: 'https://api.example.com/data',
        method: 'GET',
        duration: 250,
        size: 1024,
        status: 200,
      };

      monitor.trackNetworkRequest(requestData);

      const metrics = monitor.getNetworkMetrics();
      expect(metrics.requests).toHaveLength(1);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.averageResponseTime).toBe(250);
      expect(metrics.totalDataTransferred).toBe(1024);
    });

    test('should categorize network requests', () => {
      const requests = [
        { url: 'https://api.example.com/fast', duration: 100, status: 200 },
        { url: 'https://api.example.com/slow', duration: 2000, status: 200 },
        { url: 'https://api.example.com/error', duration: 500, status: 500 },
      ];

      requests.forEach((req) => monitor.trackNetworkRequest(req));

      const metrics = monitor.getNetworkMetrics();
      expect(metrics.fastRequests).toBe(1);
      expect(metrics.slowRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
    });

    test('should detect slow network requests', () => {
      const slowRequest = {
        url: 'https://api.example.com/slow',
        method: 'GET',
        duration: 3000,
        status: 200,
      };

      monitor.trackNetworkRequest(slowRequest);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow network request detected')
      );
    });
  });

  describe('Component Performance', () => {
    test('should track component render times', () => {
      performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050);

      monitor.startComponentRender('TestComponent');
      monitor.endComponentRender('TestComponent');

      const metrics = monitor.getComponentMetrics();
      expect(metrics['TestComponent']).toEqual(
        expect.objectContaining({
          renderCount: 1,
          totalRenderTime: 50,
          averageRenderTime: 50,
        })
      );
    });

    test('should detect slow component renders', () => {
      performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1200); // 200ms render

      monitor.startComponentRender('SlowComponent');
      monitor.endComponentRender('SlowComponent');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow component render detected')
      );
    });

    test('should track component mount/unmount', () => {
      monitor.trackComponentMount('TestComponent');
      monitor.trackComponentUnmount('TestComponent');

      const metrics = monitor.getComponentMetrics();
      expect(metrics['TestComponent']).toEqual(
        expect.objectContaining({
          mountCount: 1,
          unmountCount: 1,
          isCurrentlyMounted: false,
        })
      );
    });

    test('should detect component memory leaks', () => {
      // Mount multiple components without unmounting
      for (let i = 0; i < 10; i++) {
        monitor.trackComponentMount(`LeakyComponent${i}`);
      }

      const leaks = monitor.detectComponentLeaks();
      expect(leaks.length).toBeGreaterThan(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Potential component memory leak detected')
      );
    });
  });

  describe('User Interaction Tracking', () => {
    test('should track user interactions', () => {
      const interactionData = {
        type: 'click',
        target: 'button.primary',
        timestamp: Date.now(),
        duration: 50,
      };

      monitor.trackUserInteraction(interactionData);

      const metrics = monitor.getUserInteractionMetrics();
      expect(metrics.interactions).toHaveLength(1);
      expect(metrics.totalInteractions).toBe(1);
      expect(metrics.clickCount).toBe(1);
    });

    test('should measure input lag', () => {
      performance.now
        .mockReturnValueOnce(1000) // event start
        .mockReturnValueOnce(1100); // event processed

      monitor.startInteractionMeasurement('input');
      monitor.endInteractionMeasurement('input');

      const metrics = monitor.getUserInteractionMetrics();
      expect(metrics.averageInputLag).toBe(100);
    });

    test('should detect slow interactions', () => {
      const slowInteraction = {
        type: 'click',
        target: 'slow-button',
        duration: 500, // 500ms is slow
      };

      monitor.trackUserInteraction(slowInteraction);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow user interaction detected')
      );
    });
  });

  describe('Bundle Analysis', () => {
    test('should analyze bundle size', () => {
      // Mock resource timing entries
      const mockEntries = [
        {
          name: 'https://example.com/main.js',
          transferSize: 500000,
          encodedBodySize: 400000,
          decodedBodySize: 1000000,
        },
        {
          name: 'https://example.com/vendor.js',
          transferSize: 800000,
          encodedBodySize: 700000,
          decodedBodySize: 1500000,
        },
      ];

      performance.getEntriesByType.mockReturnValue(mockEntries);

      const bundleAnalysis = monitor.analyzeBundleSize();

      expect(bundleAnalysis).toEqual(
        expect.objectContaining({
          totalTransferSize: 1300000,
          totalDecodedSize: 2500000,
          compressionRatio: expect.any(Number),
          files: expect.arrayContaining([
            expect.objectContaining({
              name: expect.stringContaining('main.js'),
              size: 500000,
            }),
          ]),
        })
      );
    });

    test('should identify large bundles', () => {
      const largeBundleEntry = {
        name: 'https://example.com/large.js',
        transferSize: 2000000, // 2MB
        encodedBodySize: 1800000,
        decodedBodySize: 4000000,
      };

      performance.getEntriesByType.mockReturnValue([largeBundleEntry]);

      monitor.analyzeBundleSize();

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Large bundle detected'));
    });
  });

  describe('Performance Reporting', () => {
    test('should generate performance report', () => {
      // Add some test data
      monitor.startTiming('test-operation');
      monitor.endTiming('test-operation');

      global.performance.memory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 2000000000,
      };

      const report = monitor.generateReport();

      expect(report).toEqual(
        expect.objectContaining({
          timestamp: expect.any(Number),
          summary: expect.objectContaining({
            totalMeasurements: expect.any(Number),
            averageOperationTime: expect.any(Number),
            memoryUsage: expect.any(Object),
          }),
          details: expect.objectContaining({
            timings: expect.any(Object),
            functions: expect.any(Object),
            components: expect.any(Object),
            network: expect.any(Object),
          }),
          recommendations: expect.any(Array),
        })
      );
    });

    test('should export metrics as JSON', () => {
      monitor.startTiming('export-test');
      monitor.endTiming('export-test');

      const exportedData = monitor.exportMetrics('json');

      expect(() => JSON.parse(exportedData)).not.toThrow();

      const parsed = JSON.parse(exportedData);
      expect(parsed).toHaveProperty('timings');
      expect(parsed).toHaveProperty('functions');
      expect(parsed).toHaveProperty('components');
    });

    test('should export metrics as CSV', () => {
      monitor.startTiming('csv-test');
      monitor.endTiming('csv-test');

      const csvData = monitor.exportMetrics('csv');

      expect(csvData).toContain('Operation,Duration,Timestamp');
      expect(csvData).toContain('csv-test');
    });

    test('should send metrics to external service', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await monitor.sendMetrics('https://analytics.example.com/metrics');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://analytics.example.com/metrics',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );
    });
  });

  describe('Thresholds and Alerts', () => {
    test('should trigger alerts for slow operations', () => {
      const alertSpy = jest.fn();
      monitor.setAlertCallback(alertSpy);

      performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(2000); // 1000ms operation

      monitor.startTiming('slow-operation');
      monitor.endTiming('slow-operation');

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'slow-operation',
        operation: 'slow-operation',
        duration: 1000,
        threshold: expect.any(Number),
      });
    });

    test('should trigger memory alerts', () => {
      const alertSpy = jest.fn();
      monitor.setAlertCallback(alertSpy);

      global.performance.memory = {
        usedJSHeapSize: 1800000000, // 1.8GB - high usage
        totalJSHeapSize: 2000000000,
        jsHeapSizeLimit: 2000000000,
      };

      monitor.checkMemoryUsage();

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'high-memory-usage',
        usage: 1800000000,
        threshold: expect.any(Number),
        utilization: 0.9,
      });
    });

    test('should configure custom thresholds', () => {
      monitor.setThresholds({
        slowOperation: 100,
        criticalOperation: 500,
        highMemoryUsage: 0.8,
      });

      const thresholds = monitor.getThresholds();
      expect(thresholds.slowOperation).toBe(100);
      expect(thresholds.criticalOperation).toBe(500);
      expect(thresholds.highMemoryUsage).toBe(0.8);
    });
  });

  describe('Real-time Monitoring', () => {
    test('should start real-time monitoring', () => {
      monitor.startRealTimeMonitoring();

      expect(PerformanceObserver).toHaveBeenCalled();
      expect(monitor.isRealTimeMonitoringActive()).toBe(true);
    });

    test('should stop real-time monitoring', () => {
      monitor.startRealTimeMonitoring();
      monitor.stopRealTimeMonitoring();

      expect(monitor.isRealTimeMonitoringActive()).toBe(false);
    });

    test('should process real-time entries', () => {
      const mockEntries = [
        {
          name: 'test-mark',
          entryType: 'mark',
          startTime: 1000,
          duration: 0,
        },
        {
          name: 'test-measure',
          entryType: 'measure',
          startTime: 1000,
          duration: 500,
        },
      ];

      monitor.startRealTimeMonitoring();

      // Simulate observer callback
      const observerCallback = PerformanceObserver.mock.calls[0][0];
      observerCallback({ getEntries: () => mockEntries });

      const metrics = monitor.getMetrics();
      expect(metrics.realTimeEntries.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    test('should provide optimization suggestions', () => {
      // Create some performance issues
      monitor.trackNetworkRequest({
        url: 'https://example.com/slow',
        duration: 3000,
        status: 200,
      });

      global.performance.memory = {
        usedJSHeapSize: 1500000000, // High memory usage
        totalJSHeapSize: 2000000000,
        jsHeapSizeLimit: 2000000000,
      };

      const suggestions = monitor.getOptimizationSuggestions();

      expect(suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'network',
            priority: 'high',
            description: expect.stringContaining('slow network request'),
            solution: expect.any(String),
          }),
          expect.objectContaining({
            type: 'memory',
            priority: 'medium',
            description: expect.stringContaining('memory usage'),
            solution: expect.any(String),
          }),
        ])
      );
    });

    test('should track optimization implementations', () => {
      monitor.trackOptimization({
        type: 'lazy-loading',
        description: 'Implemented lazy loading for images',
        expectedImprovement: '30% faster page load',
      });

      const optimizations = monitor.getImplementedOptimizations();
      expect(optimizations).toHaveLength(1);
      expect(optimizations[0].type).toBe('lazy-loading');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing performance API gracefully', () => {
      delete global.performance;

      const fallbackMonitor = new PerformanceMonitor();

      expect(() => {
        fallbackMonitor.startTiming('test');
        fallbackMonitor.endTiming('test');
      }).not.toThrow();

      fallbackMonitor.destroy();
    });

    test('should handle invalid timing operations', () => {
      expect(() => {
        monitor.startTiming(''); // Empty name
        monitor.endTiming(null); // Null name
        monitor.startTiming(); // Undefined name
      }).not.toThrow();
    });

    test('should clean up resources on destroy', () => {
      monitor.startRealTimeMonitoring();

      monitor.destroy();

      expect(monitor.isRealTimeMonitoringActive()).toBe(false);
      expect(performance.clearMarks).toHaveBeenCalled();
      expect(performance.clearMeasures).toHaveBeenCalled();
    });

    test('should handle large datasets efficiently', () => {
      // Add many timing entries
      for (let i = 0; i < 10000; i++) {
        performance.now.mockReturnValue(1000 + i);
        monitor.startTiming(`operation-${i}`);
        performance.now.mockReturnValue(1000 + i + 10);
        monitor.endTiming(`operation-${i}`);
      }

      // Should not crash or become unresponsive
      const metrics = monitor.getMetrics();
      expect(Object.keys(metrics.timings).length).toBeLessThanOrEqual(1000);
    });

    test('should handle concurrent operations safely', async () => {
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          monitor.measureFunction(`concurrent-${i}`, async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return i;
          })
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      expect(results[50]).toBe(50);
    });
  });

  describe('Configuration and Customization', () => {
    test('should update configuration at runtime', () => {
      monitor.updateConfiguration({
        enabled: false,
        maxEntries: 2000,
      });

      expect(monitor.isEnabled()).toBe(false);
      expect(monitor.getConfiguration().maxEntries).toBe(2000);
    });

    test('should validate configuration changes', () => {
      expect(() => {
        monitor.updateConfiguration({
          maxEntries: -100, // Invalid
          thresholds: 'invalid', // Invalid type
        });
      }).not.toThrow(); // Should handle gracefully
    });

    test('should support custom metrics', () => {
      monitor.addCustomMetric('customValue', 42);
      monitor.addCustomMetric('customArray', [1, 2, 3]);

      const metrics = monitor.getCustomMetrics();
      expect(metrics.customValue).toBe(42);
      expect(metrics.customArray).toEqual([1, 2, 3]);
    });

    test('should support plugin architecture', () => {
      const mockPlugin = {
        name: 'TestPlugin',
        initialize: jest.fn(),
        process: jest.fn(),
        destroy: jest.fn(),
      };

      monitor.addPlugin(mockPlugin);

      expect(mockPlugin.initialize).toHaveBeenCalledWith(monitor);

      monitor.destroy();

      expect(mockPlugin.destroy).toHaveBeenCalled();
    });
  });
});
