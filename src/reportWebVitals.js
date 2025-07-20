// Enhanced Web Vitals reporting with performance monitoring integration
import { logPerformance } from './services/logger';
import performanceLogger from './services/performanceLogger';

const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((webVitals) => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;
      const getINP = webVitals.getINP; // May not be available in all versions
      // Enhanced callback that sends to both existing logger and new performance monitor
      const enhancedCallback = (metric) => {
        // Existing logger integration
        logPerformance(`WebVital:${metric.name}`, metric.value, {
          rating: metric.rating,
          id: metric.id,
        });

        // New performance monitor integration
        performanceLogger.recordMetric(`WebVital_${metric.name}`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        });

        // Call original handler
        onPerfEntry(metric);

        // Log critical metrics in development
        if (process.env.NODE_ENV === 'development') {
          const ratingColor =
            metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
          logPerformance(
            'webVitals',
            `${ratingColor} ${metric.name}: ${metric.value}ms (${metric.rating})`
          );
        }
      };

      // Collect all Core Web Vitals
      getCLS(enhancedCallback);
      getFID(enhancedCallback);
      getFCP(enhancedCallback);
      getLCP(enhancedCallback);
      getTTFB(enhancedCallback);

      // Include INP (Interaction to Next Paint) - new Core Web Vital for 2024
      if (getINP) {
        getINP(enhancedCallback);
      }
    });
  } else {
    // If no custom handler provided, still collect metrics
    import('web-vitals').then((webVitals) => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;
      const getINP = webVitals.getINP; // May not be available in all versions
      const defaultCallback = (metric) => {
        logPerformance(`WebVital:${metric.name}`, metric.value, {
          rating: metric.rating,
          id: metric.id,
        });

        performanceLogger.recordMetric(`WebVital_${metric.name}`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
        });
      };

      getCLS(defaultCallback);
      getFID(defaultCallback);
      getFCP(defaultCallback);
      getLCP(defaultCallback);
      getTTFB(defaultCallback);

      if (getINP) {
        getINP(defaultCallback);
      }
    });
  }
};

export default reportWebVitals;
