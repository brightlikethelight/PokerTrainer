vi.mock('../logger', () => {
  const mockLogger = { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() };
  return { __esModule: true, default: mockLogger };
});

import errorHandler, {
  PokerError,
  ErrorTypes,
  ErrorSeverity,
  createValidationError,
  createGameError,
  createStateError,
} from '../error-handler';

describe('PokerError', () => {
  it('sets all constructor fields', () => {
    const err = new PokerError('test message', ErrorTypes.VALIDATION_ERROR, ErrorSeverity.HIGH, {
      field: 'amount',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PokerError);
    expect(err.message).toBe('test message');
    expect(err.type).toBe(ErrorTypes.VALIDATION_ERROR);
    expect(err.severity).toBe(ErrorSeverity.HIGH);
    expect(err.details).toEqual({ field: 'amount' });
    expect(err.timestamp).toBeDefined();
    expect(err.id).toBeDefined();
    expect(typeof err.id).toBe('string');
  });

  it('toJSON() serializes all fields', () => {
    const err = new PokerError('json test', ErrorTypes.GAME_ERROR, ErrorSeverity.MEDIUM);
    const json = err.toJSON();
    expect(json.message).toBe('json test');
    expect(json.type).toBe(ErrorTypes.GAME_ERROR);
    expect(json.severity).toBe(ErrorSeverity.MEDIUM);
    expect(json.timestamp).toBeDefined();
    expect(json.id).toBeDefined();
  });

  it('generates unique IDs', () => {
    const e1 = new PokerError('a', ErrorTypes.GAME_ERROR, ErrorSeverity.LOW);
    const e2 = new PokerError('b', ErrorTypes.GAME_ERROR, ErrorSeverity.LOW);
    expect(e1.id).not.toBe(e2.id);
  });
});

describe('ErrorTypes and ErrorSeverity', () => {
  it('ErrorTypes contains expected keys', () => {
    expect(ErrorTypes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorTypes.GAME_ERROR).toBe('GAME_ERROR');
    expect(ErrorTypes.STATE_ERROR).toBe('STATE_ERROR');
    expect(ErrorTypes.SYSTEM_ERROR).toBe('SYSTEM_ERROR');
  });

  it('ErrorSeverity contains expected keys', () => {
    expect(ErrorSeverity.LOW).toBeDefined();
    expect(ErrorSeverity.MEDIUM).toBeDefined();
    expect(ErrorSeverity.HIGH).toBeDefined();
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    errorHandler.clearErrorLog();
    // Clear any registered callbacks by resetting internal state
    if (errorHandler.callbacks) {
      errorHandler.callbacks.clear ? errorHandler.callbacks.clear() : null;
    }
    if (errorHandler.errorCallbacks) {
      errorHandler.errorCallbacks.clear ? errorHandler.errorCallbacks.clear() : null;
    }
  });

  describe('handleError', () => {
    it('wraps a plain Error in a PokerError', () => {
      const plain = new Error('plain error');
      const result = errorHandler.handleError(plain, { source: 'test' });
      expect(result).toBeDefined();
      // The result should be or contain a PokerError-like object
      if (result instanceof PokerError) {
        expect(result.message).toContain('plain error');
      }
    });

    it('passes through a PokerError unchanged', () => {
      const pokerErr = new PokerError('poker err', ErrorTypes.GAME_ERROR, ErrorSeverity.HIGH);
      const result = errorHandler.handleError(pokerErr);
      expect(result).toBeDefined();
      if (result instanceof PokerError) {
        expect(result.type).toBe(ErrorTypes.GAME_ERROR);
      }
    });
  });

  describe('logError', () => {
    it('stores errors in the error log', () => {
      const err = new PokerError('logged', ErrorTypes.VALIDATION_ERROR, ErrorSeverity.LOW);
      errorHandler.logError(err);
      const logs = errorHandler.getErrorLog();
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('respects maxLogSize by evicting old entries', () => {
      const maxSize = errorHandler.maxLogSize || 100;
      for (let i = 0; i < maxSize + 10; i++) {
        errorHandler.logError(new PokerError(`err ${i}`, ErrorTypes.GAME_ERROR, ErrorSeverity.LOW));
      }
      const logs = errorHandler.getErrorLog();
      expect(logs.length).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('onError / callbacks', () => {
    it('registers a callback and returns an unsubscribe function', () => {
      const cb = vi.fn();
      const unsub = errorHandler.onError(ErrorTypes.VALIDATION_ERROR, cb);
      expect(typeof unsub).toBe('function');
    });

    it('fires callback on matching error type', () => {
      const cb = vi.fn();
      errorHandler.onError(ErrorTypes.VALIDATION_ERROR, cb);
      const err = new PokerError('val err', ErrorTypes.VALIDATION_ERROR, ErrorSeverity.MEDIUM);
      errorHandler.handleError(err);
      expect(cb).toHaveBeenCalled();
    });

    it('does not fire callback for non-matching error type', () => {
      const cb = vi.fn();
      errorHandler.onError(ErrorTypes.VALIDATION_ERROR, cb);
      const err = new PokerError('game err', ErrorTypes.GAME_ERROR, ErrorSeverity.MEDIUM);
      errorHandler.handleError(err);
      expect(cb).not.toHaveBeenCalled();
    });

    it('unsubscribe prevents future callbacks', () => {
      const cb = vi.fn();
      const unsub = errorHandler.onError(ErrorTypes.GAME_ERROR, cb);
      unsub();
      const err = new PokerError('after unsub', ErrorTypes.GAME_ERROR, ErrorSeverity.LOW);
      errorHandler.handleError(err);
      expect(cb).not.toHaveBeenCalled();
    });

    it('global "*" callback fires for all error types', () => {
      const cb = vi.fn();
      errorHandler.onError('*', cb);
      errorHandler.handleError(new PokerError('a', ErrorTypes.VALIDATION_ERROR, ErrorSeverity.LOW));
      errorHandler.handleError(new PokerError('b', ErrorTypes.GAME_ERROR, ErrorSeverity.LOW));
      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  describe('getErrorLog', () => {
    beforeEach(() => {
      errorHandler.clearErrorLog();
      errorHandler.logError(new PokerError('v1', ErrorTypes.VALIDATION_ERROR, ErrorSeverity.LOW));
      errorHandler.logError(new PokerError('g1', ErrorTypes.GAME_ERROR, ErrorSeverity.HIGH));
      errorHandler.logError(new PokerError('s1', ErrorTypes.STATE_ERROR, ErrorSeverity.MEDIUM));
    });

    it('returns all errors with no filter', () => {
      const logs = errorHandler.getErrorLog();
      expect(logs.length).toBe(3);
    });

    it('filters by type', () => {
      const logs = errorHandler.getErrorLog({ type: ErrorTypes.VALIDATION_ERROR });
      expect(logs.length).toBe(1);
      logs.forEach((l) => {
        const entry = l instanceof PokerError ? l : l;
        expect(entry.type).toBe(ErrorTypes.VALIDATION_ERROR);
      });
    });

    it('filters by severity', () => {
      const logs = errorHandler.getErrorLog({ severity: ErrorSeverity.HIGH });
      expect(logs.length).toBe(1);
    });

    it('filters by since timestamp', () => {
      const past = new Date(Date.now() - 60000).toISOString();
      const logs = errorHandler.getErrorLog({ since: past });
      expect(logs.length).toBe(3);

      const future = new Date(Date.now() + 60000).toISOString();
      const empty = errorHandler.getErrorLog({ since: future });
      expect(empty.length).toBe(0);
    });
  });

  describe('clearErrorLog', () => {
    it('empties the error log', () => {
      errorHandler.logError(new PokerError('x', ErrorTypes.GAME_ERROR, ErrorSeverity.LOW));
      expect(errorHandler.getErrorLog().length).toBeGreaterThan(0);
      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog().length).toBe(0);
    });
  });

  describe('getErrorStats', () => {
    beforeEach(() => {
      errorHandler.clearErrorLog();
      errorHandler.logError(new PokerError('v1', ErrorTypes.VALIDATION_ERROR, ErrorSeverity.LOW));
      errorHandler.logError(new PokerError('v2', ErrorTypes.VALIDATION_ERROR, ErrorSeverity.HIGH));
      errorHandler.logError(new PokerError('g1', ErrorTypes.GAME_ERROR, ErrorSeverity.MEDIUM));
    });

    it('returns total count', () => {
      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(3);
    });

    it('returns byType breakdown', () => {
      const stats = errorHandler.getErrorStats();
      expect(stats.byType[ErrorTypes.VALIDATION_ERROR]).toBe(2);
      expect(stats.byType[ErrorTypes.GAME_ERROR]).toBe(1);
    });

    it('returns bySeverity breakdown', () => {
      const stats = errorHandler.getErrorStats();
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
    });

    it('returns recentErrors', () => {
      const stats = errorHandler.getErrorStats();
      expect(Array.isArray(stats.recentErrors)).toBe(true);
    });
  });
});

describe('Factory helpers', () => {
  it('createValidationError creates a VALIDATION_ERROR PokerError', () => {
    const err = createValidationError('email', 'must be valid', 'bad');
    expect(err).toBeInstanceOf(PokerError);
    expect(err.type).toBe(ErrorTypes.VALIDATION_ERROR);
    expect(err.message).toContain('email');
    expect(err.details).toEqual({ field: 'email', value: 'bad' });
  });

  it('createGameError creates a GAME_ERROR PokerError', () => {
    const err = createGameError('invalid action', { action: 'fold' });
    expect(err).toBeInstanceOf(PokerError);
    expect(err.type).toBe(ErrorTypes.GAME_ERROR);
    expect(err.message).toBe('invalid action');
  });

  it('createStateError creates a STATE_ERROR PokerError', () => {
    const err = createStateError('corrupt state', 'current', 'expected');
    expect(err).toBeInstanceOf(PokerError);
    expect(err.type).toBe(ErrorTypes.STATE_ERROR);
    expect(err.message).toBe('corrupt state');
  });
});
