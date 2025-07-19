/**
 * Centralized error handling service
 */

import React from 'react';
import PropTypes from 'prop-types';

import logger from './logger';

// Error types
export const ErrorTypes = {
  GAME_ERROR: 'GAME_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  STATE_ERROR: 'STATE_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  USER_ERROR: 'USER_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Custom error class for poker application
 */
export class PokerError extends Error {
  constructor(
    message,
    type = ErrorTypes.SYSTEM_ERROR,
    severity = ErrorSeverity.MEDIUM,
    details = {}
  ) {
    super(message);
    this.name = 'PokerError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.id = this.generateErrorId();
  }

  generateErrorId() {
    return `${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Error handler class
 */
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.errorCallbacks = new Map();
    this.maxLogSize = 100;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Handle an error
   * @param {Error} error - The error to handle
   * @param {Object} context - Additional context
   * @returns {PokerError} Processed error
   */
  handleError(error, context = {}) {
    let pokerError;

    if (error instanceof PokerError) {
      pokerError = error;
    } else {
      // Convert regular errors to PokerError
      pokerError = new PokerError(error.message, ErrorTypes.SYSTEM_ERROR, ErrorSeverity.MEDIUM, {
        originalError: error.name,
        context,
      });
    }

    // Log the error
    this.logError(pokerError);

    // Execute callbacks
    this.executeCallbacks(pokerError);

    // In development, log to console
    if (this.isDevelopment) {
      logger.error('[PokerError]', { error: pokerError });
    }

    return pokerError;
  }

  /**
   * Log error to internal log
   * @param {PokerError} error - Error to log
   */
  logError(error) {
    this.errorLog.push(error);

    // Maintain max log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * Register error callback
   * @param {string} type - Error type to listen for
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onError(type, callback) {
    if (!this.errorCallbacks.has(type)) {
      this.errorCallbacks.set(type, new Set());
    }

    this.errorCallbacks.get(type).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.errorCallbacks.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Execute registered callbacks
   * @param {PokerError} error - Error to process
   */
  executeCallbacks(error) {
    // Execute type-specific callbacks
    const typeCallbacks = this.errorCallbacks.get(error.type);
    if (typeCallbacks) {
      typeCallbacks.forEach((callback) => {
        try {
          callback(error);
        } catch (e) {
          logger.error('Error in error callback', { error: e });
        }
      });
    }

    // Execute global callbacks
    const globalCallbacks = this.errorCallbacks.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach((callback) => {
        try {
          callback(error);
        } catch (e) {
          logger.error('Error in global error callback', { error: e });
        }
      });
    }
  }

  /**
   * Get error log
   * @param {Object} filter - Filter options
   * @returns {Array} Filtered errors
   */
  getErrorLog(filter = {}) {
    let errors = [...this.errorLog];

    if (filter.type) {
      errors = errors.filter((e) => e.type === filter.type);
    }

    if (filter.severity) {
      errors = errors.filter((e) => e.severity === filter.severity);
    }

    if (filter.since) {
      const sinceDate = new Date(filter.since);
      errors = errors.filter((e) => new Date(e.timestamp) >= sinceDate);
    }

    return errors;
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recentErrors: this.errorLog.slice(-10),
    };

    this.errorLog.forEach((error) => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Error boundary helper for React components
export const withErrorBoundary = (Component, fallback) => {
  const ErrorBoundaryComponent = class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      errorHandler.handleError(error, { errorInfo, component: Component.name });
    }

    render() {
      if (this.state.hasError) {
        return (
          fallback || (
            <div className="error-boundary-fallback">
              <h2>Something went wrong</h2>
              <p>{this.state.error?.message}</p>
            </div>
          )
        );
      }

      return this.props.children;
    }
  };

  ErrorBoundaryComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  ErrorBoundaryComponent.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return ErrorBoundaryComponent;
};

// Validation error helpers
export const createValidationError = (field, message, value) =>
  new PokerError(
    `Validation failed for ${field}: ${message}`,
    ErrorTypes.VALIDATION_ERROR,
    ErrorSeverity.LOW,
    { field, value }
  );

export const createGameError = (message, details = {}) =>
  new PokerError(message, ErrorTypes.GAME_ERROR, ErrorSeverity.MEDIUM, details);

export const createStateError = (message, currentState, expectedState) =>
  new PokerError(message, ErrorTypes.STATE_ERROR, ErrorSeverity.HIGH, {
    currentState,
    expectedState,
  });

// Export singleton instance
export default errorHandler;
