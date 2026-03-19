import logger, { LogLevel, LogCategory } from '../logger';

function freshLogger() {
  return new logger.constructor();
}

describe('Logger', () => {
  let log;

  beforeEach(() => {
    log = freshLogger();
    vi.restoreAllMocks();
  });

  describe('constructor defaults', () => {
    it('sets logLevel to DEBUG in non-production', () => {
      const l = freshLogger();
      expect(l.logLevel).toBe(LogLevel.DEBUG);
    });

    it('sets logLevel to WARN in production', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const l = freshLogger();
      expect(l.logLevel).toBe(LogLevel.WARN);
      process.env.NODE_ENV = origEnv;
    });

    it('enables console logging in non-production', () => {
      const l = freshLogger();
      expect(l.enableConsole).toBe(true);
    });

    it('disables console logging in production', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const l = freshLogger();
      expect(l.enableConsole).toBe(false);
      process.env.NODE_ENV = origEnv;
    });

    it('initializes with empty logs array', () => {
      expect(log.logs).toEqual([]);
    });

    it('sets maxLogs to 1000', () => {
      expect(log.maxLogs).toBe(1000);
    });

    it('disables remote logging by default', () => {
      expect(log.enableRemote).toBe(false);
      expect(log.remoteEndpoint).toBeNull();
    });

    it('initializes empty subscribers map', () => {
      expect(log.subscribers).toBeInstanceOf(Map);
      expect(log.subscribers.size).toBe(0);
    });
  });

  describe('setLogLevel', () => {
    it('changes the log level', () => {
      log.setLogLevel(LogLevel.ERROR);
      expect(log.logLevel).toBe(LogLevel.ERROR);
    });
  });

  describe('setConsoleLogging', () => {
    it('enables/disables console logging', () => {
      log.setConsoleLogging(false);
      expect(log.enableConsole).toBe(false);
      log.setConsoleLogging(true);
      expect(log.enableConsole).toBe(true);
    });
  });

  describe('configureRemoteLogging', () => {
    it('sets endpoint and enables remote logging', () => {
      log.configureRemoteLogging('https://example.com/logs');
      expect(log.remoteEndpoint).toBe('https://example.com/logs');
      expect(log.enableRemote).toBe(true);
    });

    it('can disable remote logging', () => {
      log.configureRemoteLogging('https://example.com/logs', false);
      expect(log.enableRemote).toBe(false);
    });
  });

  describe('log()', () => {
    it('stores a log entry and returns it', () => {
      log.setConsoleLogging(false);
      const entry = log.log(LogLevel.INFO, LogCategory.GAME, 'test message', { foo: 1 });
      expect(entry).toBeDefined();
      expect(entry.level).toBe('INFO');
      expect(entry.category).toBe(LogCategory.GAME);
      expect(entry.message).toBe('test message');
      expect(entry.data).toEqual({ foo: 1 });
      expect(entry.timestamp).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(log.logs).toHaveLength(1);
    });

    it('returns undefined when log level is below threshold', () => {
      log.setLogLevel(LogLevel.ERROR);
      const entry = log.log(LogLevel.DEBUG, LogCategory.GAME, 'filtered out');
      expect(entry).toBeUndefined();
      expect(log.logs).toHaveLength(0);
    });

    it('defaults data to empty object', () => {
      log.setConsoleLogging(false);
      const entry = log.log(LogLevel.INFO, LogCategory.GAME, 'no data');
      expect(entry.data).toEqual({});
    });

    it('calls sendToRemote when remote logging is enabled', () => {
      log.setConsoleLogging(false);
      log.configureRemoteLogging('https://example.com/logs', true);
      const spy = vi.spyOn(log, 'sendToRemote');
      log.log(LogLevel.INFO, LogCategory.GAME, 'remote test');
      expect(spy).toHaveBeenCalled();
    });

    it('does not call sendToRemote when remote logging is disabled', () => {
      log.setConsoleLogging(false);
      const spy = vi.spyOn(log, 'sendToRemote');
      log.log(LogLevel.INFO, LogCategory.GAME, 'no remote');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      log.setConsoleLogging(false);
      log.setLogLevel(LogLevel.DEBUG);
    });

    it('debug() logs at DEBUG level', () => {
      const entry = log.debug(LogCategory.SYSTEM, 'debug msg', { x: 1 });
      expect(entry.level).toBe('DEBUG');
      expect(entry.category).toBe(LogCategory.SYSTEM);
    });

    it('info() logs at INFO level', () => {
      const entry = log.info(LogCategory.UI, 'info msg');
      expect(entry.level).toBe('INFO');
    });

    it('warn() logs at WARN level', () => {
      const entry = log.warn(LogCategory.NETWORK, 'warn msg');
      expect(entry.level).toBe('WARN');
    });

    it('error() logs at ERROR level', () => {
      const entry = log.error(LogCategory.SYSTEM, 'error msg');
      expect(entry.level).toBe('ERROR');
    });
  });

  describe('domain-specific helpers', () => {
    beforeEach(() => {
      log.setConsoleLogging(false);
      log.setLogLevel(LogLevel.DEBUG);
    });

    it('logGameAction logs player action', () => {
      const entry = log.logGameAction('raise', 'player1', { amount: 50 });
      expect(entry.category).toBe(LogCategory.GAME);
      expect(entry.message).toContain('player1');
      expect(entry.message).toContain('raise');
      expect(entry.data.amount).toBe(50);
      expect(entry.data.playerId).toBe('player1');
    });

    it('logGTOAnalysis logs analysis result', () => {
      const entry = log.logGTOAnalysis('equity', 0.65, { hand: 'AKs' });
      expect(entry.category).toBe(LogCategory.GTO);
      expect(entry.message).toContain('equity');
      expect(entry.data.result).toBe(0.65);
      expect(entry.data.hand).toBe('AKs');
    });

    it('logPerformance logs operation timing', () => {
      const entry = log.logPerformance('render', 42, { component: 'Board' });
      expect(entry.category).toBe(LogCategory.PERFORMANCE);
      expect(entry.message).toContain('42ms');
      expect(entry.data.duration).toBe(42);
      expect(entry.data.operation).toBe('render');
    });
  });

  describe('storeLog maxLogs limit', () => {
    it('evicts oldest entries when exceeding maxLogs', () => {
      log.maxLogs = 5;
      log.setConsoleLogging(false);
      for (let i = 0; i < 8; i++) {
        log.log(LogLevel.INFO, LogCategory.GAME, `msg ${i}`);
      }
      expect(log.logs).toHaveLength(5);
      expect(log.logs[0].message).toBe('msg 3');
      expect(log.logs[4].message).toBe('msg 7');
    });
  });

  describe('subscribe / unsubscribe', () => {
    beforeEach(() => {
      log.setConsoleLogging(false);
      log.setLogLevel(LogLevel.DEBUG);
    });

    it('notifies subscriber on new log entry', () => {
      const cb = vi.fn();
      log.subscribe(cb);
      log.log(LogLevel.INFO, LogCategory.GAME, 'sub test');
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ message: 'sub test' }));
    });

    it('unsubscribe stops notifications', () => {
      const cb = vi.fn();
      const unsub = log.subscribe(cb);
      unsub();
      log.log(LogLevel.INFO, LogCategory.GAME, 'after unsub');
      expect(cb).not.toHaveBeenCalled();
    });

    it('filters by category', () => {
      const cb = vi.fn();
      log.subscribe(cb, { category: LogCategory.GTO });
      log.log(LogLevel.INFO, LogCategory.GAME, 'game msg');
      log.log(LogLevel.INFO, LogCategory.GTO, 'gto msg');
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ category: LogCategory.GTO }));
    });

    it('filters by level', () => {
      const cb = vi.fn();
      log.subscribe(cb, { level: 'ERROR' });
      log.log(LogLevel.INFO, LogCategory.GAME, 'info');
      log.log(LogLevel.ERROR, LogCategory.GAME, 'error');
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('swallows errors thrown by callbacks', () => {
      const badCb = vi.fn(() => {
        throw new Error('boom');
      });
      const goodCb = vi.fn();
      log.subscribe(badCb);
      log.subscribe(goodCb);
      expect(() => log.log(LogLevel.INFO, LogCategory.GAME, 'test')).not.toThrow();
      expect(goodCb).toHaveBeenCalled();
    });
  });

  describe('matchesFilter', () => {
    it('matches when no filter is set', () => {
      expect(log.matchesFilter({ level: 'INFO', category: 'GAME' }, {})).toBe(true);
    });

    it('rejects on level mismatch', () => {
      expect(log.matchesFilter({ level: 'INFO', category: 'GAME' }, { level: 'ERROR' })).toBe(
        false
      );
    });

    it('rejects on category mismatch', () => {
      expect(log.matchesFilter({ level: 'INFO', category: 'GAME' }, { category: 'GTO' })).toBe(
        false
      );
    });

    it('rejects when below minLevel', () => {
      expect(
        log.matchesFilter({ level: 'DEBUG', category: 'GAME' }, { minLevel: LogLevel.WARN })
      ).toBe(false);
    });

    it('accepts when at or above minLevel', () => {
      expect(
        log.matchesFilter({ level: 'ERROR', category: 'GAME' }, { minLevel: LogLevel.WARN })
      ).toBe(true);
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      log.setConsoleLogging(false);
      log.setLogLevel(LogLevel.DEBUG);
      log.info(LogCategory.GAME, 'game info', { val: 1 });
      log.error(LogCategory.GTO, 'gto error', { val: 2 });
      log.debug(LogCategory.GAME, 'game debug', { val: 3 });
    });

    it('returns all logs with no filter', () => {
      expect(log.getLogs()).toHaveLength(3);
    });

    it('filters by category', () => {
      const result = log.getLogs({ category: LogCategory.GAME });
      expect(result).toHaveLength(2);
      result.forEach((l) => expect(l.category).toBe(LogCategory.GAME));
    });

    it('filters by level', () => {
      const result = log.getLogs({ level: 'ERROR' });
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('gto error');
    });

    it('filters by since date', () => {
      const past = new Date(Date.now() - 60000).toISOString();
      const result = log.getLogs({ since: past });
      expect(result).toHaveLength(3);

      const future = new Date(Date.now() + 60000).toISOString();
      const emptyResult = log.getLogs({ since: future });
      expect(emptyResult).toHaveLength(0);
    });

    it('filters by search term in message', () => {
      const result = log.getLogs({ search: 'gto error' });
      expect(result).toHaveLength(1);
    });

    it('filters by search term in data', () => {
      const result = log.getLogs({ search: '"val":2' });
      expect(result).toHaveLength(1);
    });
  });

  describe('clearLogs', () => {
    it('empties the logs array', () => {
      log.setConsoleLogging(false);
      log.info(LogCategory.GAME, 'a');
      log.info(LogCategory.GAME, 'b');
      expect(log.logs.length).toBeGreaterThan(0);
      log.clearLogs();
      expect(log.logs).toHaveLength(0);
    });
  });

  describe('exportLogs', () => {
    beforeEach(() => {
      log.setConsoleLogging(false);
      log.setLogLevel(LogLevel.DEBUG);
      log.info(LogCategory.GAME, 'export test', { key: 'val' });
    });

    it('exports as JSON by default', () => {
      const json = log.exportLogs('json');
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('export test');
    });

    it('exports as CSV', () => {
      const csv = log.exportLogs('csv');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('timestamp,level,category,message,data');
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('export test');
    });

    it('returns raw logs array for unknown format', () => {
      const result = log.exportLogs('xml');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getLevelName / getLevelValue', () => {
    it('maps numeric levels to names', () => {
      expect(log.getLevelName(0)).toBe('DEBUG');
      expect(log.getLevelName(1)).toBe('INFO');
      expect(log.getLevelName(2)).toBe('WARN');
      expect(log.getLevelName(3)).toBe('ERROR');
      expect(log.getLevelName(99)).toBe('UNKNOWN');
    });

    it('maps level names back to values', () => {
      expect(log.getLevelValue('DEBUG')).toBe(0);
      expect(log.getLevelValue('INFO')).toBe(1);
      expect(log.getLevelValue('WARN')).toBe(2);
      expect(log.getLevelValue('ERROR')).toBe(3);
      expect(log.getLevelValue('BOGUS')).toBe(0);
    });
  });

  describe('generateLogId', () => {
    it('returns a unique string', () => {
      const id1 = log.generateLogId();
      const id2 = log.generateLogId();
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });
  });

  describe('startTimer', () => {
    it('returns an object with end() that logs performance', () => {
      log.setConsoleLogging(false);
      log.setLogLevel(LogLevel.DEBUG);
      const timer = log.startTimer('test-op');
      expect(timer).toHaveProperty('end');
      expect(typeof timer.end).toBe('function');

      const duration = timer.end({ extra: 'info' });
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);

      const perfLogs = log.getLogs({ category: LogCategory.PERFORMANCE });
      expect(perfLogs).toHaveLength(1);
      expect(perfLogs[0].message).toContain('test-op');
      expect(perfLogs[0].data.extra).toBe('info');
    });
  });

  describe('consoleLog', () => {
    it('calls console.debug for DEBUG level', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      log.consoleLog({ level: 'DEBUG', category: 'GAME', message: 'dbg', data: {} });
      spy.mockRestore();
    });

    it('calls console.info for INFO level', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      log.consoleLog({ level: 'INFO', category: 'GAME', message: 'inf', data: {} });
      spy.mockRestore();
    });

    it('calls console.warn for WARN level', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      log.consoleLog({ level: 'WARN', category: 'GAME', message: 'wrn', data: {} });
      spy.mockRestore();
    });

    it('calls console.error for ERROR level', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      log.consoleLog({ level: 'ERROR', category: 'GAME', message: 'err', data: {} });
      spy.mockRestore();
    });
  });
});
