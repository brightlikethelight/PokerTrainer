/**
 * Logging service for the poker application
 */

// Log levels
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

// Log categories
export const LogCategory = {
  GAME: 'GAME',
  GTO: 'GTO',
  STUDY: 'STUDY',
  UI: 'UI',
  NETWORK: 'NETWORK',
  PERFORMANCE: 'PERFORMANCE',
  SYSTEM: 'SYSTEM',
};

/**
 * Logger class
 */
class Logger {
  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    this.logs = [];
    this.maxLogs = 1000;
    this.enableConsole = process.env.NODE_ENV !== 'production';
    this.enableRemote = false;
    this.remoteEndpoint = null;
    this.subscribers = new Map();
  }

  /**
   * Set log level
   * @param {number} level - Log level
   */
  setLogLevel(level) {
    this.logLevel = level;
  }

  /**
   * Enable/disable console logging
   * @param {boolean} enable - Enable flag
   */
  setConsoleLogging(enable) {
    this.enableConsole = enable;
  }

  /**
   * Configure remote logging
   * @param {string} endpoint - Remote logging endpoint
   * @param {boolean} enable - Enable flag
   */
  configureRemoteLogging(endpoint, enable = true) {
    this.remoteEndpoint = endpoint;
    this.enableRemote = enable;
  }

  /**
   * Core logging method
   * @param {number} level - Log level
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, category, message, data = {}) {
    if (level < this.logLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: this.getLevelName(level),
      category,
      message,
      data,
      id: this.generateLogId(),
    };

    // Store log
    this.storeLog(logEntry);

    // Console output
    if (this.enableConsole) {
      this.consoleLog(logEntry);
    }

    // Remote logging
    if (this.enableRemote && this.remoteEndpoint) {
      this.sendToRemote(logEntry);
    }

    // Notify subscribers
    this.notifySubscribers(logEntry);

    return logEntry;
  }

  /**
   * Debug log
   */
  debug(category, message, data) {
    return this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Info log
   */
  info(category, message, data) {
    return this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Warning log
   */
  warn(category, message, data) {
    return this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Error log
   */
  error(category, message, data) {
    return this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Log game action
   */
  logGameAction(_action, playerId, details = {}) {
    return this.info(LogCategory.GAME, `Player ${playerId} performed ${_action}`, {
      _action,
      playerId,
      ...details,
    });
  }

  /**
   * Log GTO analysis
   */
  logGTOAnalysis(analysisType, result, details = {}) {
    return this.debug(LogCategory.GTO, `GTO Analysis: ${analysisType}`, {
      analysisType,
      result,
      ...details,
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(operation, duration, details = {}) {
    return this.info(LogCategory.PERFORMANCE, `${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...details,
    });
  }

  /**
   * Store log entry
   */
  storeLog(logEntry) {
    this.logs.push(logEntry);

    // Maintain max size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Console output
   */
  consoleLog(logEntry) {
    const { level, category, message, data } = logEntry;
    const prefix = `[${level}] [${category}]`;

    /* eslint-disable no-console */
    switch (level) {
      case 'DEBUG':
        console.debug(prefix, message, data);
        break;
      case 'INFO':
        console.info(prefix, message, data);
        break;
      case 'WARN':
        console.warn(prefix, message, data);
        break;
      case 'ERROR':
        console.error(prefix, message, data);
        break;
    }
    /* eslint-enable no-console */
  }

  /**
   * Send log to remote endpoint
   */
  sendToRemote(_logEntry) {
    try {
      // In production, this would send to a real logging service
      // For now, we'll just simulate it
      if (this.remoteEndpoint) {
        // fetch(this.remoteEndpoint, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntry)
        // });
      }
    } catch (error) {
      // Failed to send log to remote
    }
  }

  /**
   * Subscribe to log events
   */
  subscribe(callback, filter = {}) {
    const id = Date.now() + Math.random();
    this.subscribers.set(id, { callback, filter });

    return () => this.subscribers.delete(id);
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(logEntry) {
    this.subscribers.forEach(({ callback, filter }) => {
      if (this.matchesFilter(logEntry, filter)) {
        try {
          callback(logEntry);
        } catch (error) {
          // Error in log subscriber
        }
      }
    });
  }

  /**
   * Check if log matches filter
   */
  matchesFilter(logEntry, filter) {
    if (filter.level && logEntry.level !== filter.level) return false;
    if (filter.category && logEntry.category !== filter.category) return false;
    if (filter.minLevel && this.getLevelValue(logEntry.level) < filter.minLevel) return false;
    return true;
  }

  /**
   * Get logs
   */
  getLogs(filter = {}) {
    let logs = [...this.logs];

    if (filter.category) {
      logs = logs.filter((log) => log.category === filter.category);
    }

    if (filter.level) {
      logs = logs.filter((log) => log.level === filter.level);
    }

    if (filter.since) {
      const sinceDate = new Date(filter.since);
      logs = logs.filter((log) => new Date(log.timestamp) >= sinceDate);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    return logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs
   */
  exportLogs(format = 'json') {
    const logs = this.getLogs();

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      case 'csv': {
        const headers = ['timestamp', 'level', 'category', 'message', 'data'];
        const rows = logs.map((log) => [
          log.timestamp,
          log.level,
          log.category,
          log.message,
          JSON.stringify(log.data),
        ]);
        return [headers, ...rows].map((row) => row.join(',')).join('\n');
      }
      default:
        return logs;
    }
  }

  /**
   * Get level name
   */
  getLevelName(level) {
    const names = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return names[level] || 'UNKNOWN';
  }

  /**
   * Get level value
   */
  getLevelValue(levelName) {
    const values = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return values[levelName] || 0;
  }

  /**
   * Generate log ID
   */
  generateLogId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Create performance timer
   */
  startTimer(operation) {
    const startTime = performance.now();

    return {
      end: (details = {}) => {
        const duration = performance.now() - startTime;
        this.logPerformance(operation, duration, details);
        return duration;
      },
    };
  }
}

// Create singleton instance
const logger = new Logger();

// Convenience exports
export const debug = (...args) => logger.debug(...args);
export const info = (...args) => logger.info(...args);
export const warn = (...args) => logger.warn(...args);
export const error = (...args) => logger.error(...args);
export const logGameAction = (...args) => logger.logGameAction(...args);
export const logGTOAnalysis = (...args) => logger.logGTOAnalysis(...args);
export const logPerformance = (...args) => logger.logPerformance(...args);
export const startTimer = (...args) => logger.startTimer(...args);

export default logger;
