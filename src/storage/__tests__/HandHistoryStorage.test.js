vi.mock('../../services/logger', () => ({
  __esModule: true,
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

let store = {};
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

import storage from '../HandHistoryStorage';

beforeEach(() => {
  store = {};
  localStorageMock.getItem.mockImplementation((key) => store[key] || null);
  localStorageMock.setItem.mockImplementation((key, value) => {
    store[key] = value;
  });
  localStorageMock.removeItem.mockImplementation((key) => {
    delete store[key];
  });
  localStorageMock.clear.mockImplementation(() => {
    store = {};
  });
  storage.cache = null;
  vi.clearAllMocks();
  // Re-apply after clearAllMocks
  localStorageMock.getItem.mockImplementation((key) => store[key] || null);
  localStorageMock.setItem.mockImplementation((key, value) => {
    store[key] = value;
  });
  localStorageMock.removeItem.mockImplementation((key) => {
    delete store[key];
  });
  localStorageMock.clear.mockImplementation(() => {
    store = {};
  });
});

describe('HandHistoryStorage', () => {
  test('initialize creates empty cache when no localStorage data', async () => {
    await storage.initialize();
    expect(storage.cache).toEqual({ hands: [], sessions: [] });
  });

  test('initialize loads existing data from localStorage', async () => {
    const data = { hands: [{ id: 'h1' }], sessions: [{ id: 's1' }] };
    store['poker_trainer_hand_history'] = JSON.stringify(data);
    await storage.initialize();
    expect(storage.cache).toEqual(data);
  });

  test('saveHand adds hand with id and timestamp, returns id', async () => {
    await storage.initialize();
    const id = await storage.saveHand({ pot: 100 });
    expect(id).toMatch(/^hand_/);
    expect(storage.cache.hands[0]).toMatchObject({ pot: 100 });
    expect(storage.cache.hands[0].timestamp).toBeDefined();
  });

  test('saveHand trims to 1000 hands max', async () => {
    storage.cache = {
      hands: Array.from({ length: 1000 }, (_, i) => ({ id: `h${i}` })),
      sessions: [],
    };
    await storage.saveHand({ pot: 50 });
    expect(storage.cache.hands).toHaveLength(1000);
    expect(storage.cache.hands[0].pot).toBe(50);
  });

  test('getAllHands returns all saved hands', async () => {
    await storage.initialize();
    await storage.saveHand({ pot: 10 });
    await storage.saveHand({ pot: 20 });
    const hands = await storage.getAllHands();
    expect(hands).toHaveLength(2);
    expect(hands).not.toBe(storage.cache.hands);
  });

  test('getHandsByPlayer finds hands where playersStartState contains player', async () => {
    await storage.initialize();
    await storage.saveHand({ playersStartState: [{ id: 'p1' }, { id: 'p2' }] });
    await storage.saveHand({ playersStartState: [{ id: 'p2' }, { id: 'p3' }] });
    const hands = await storage.getHandsByPlayer('p1');
    expect(hands).toHaveLength(1);
  });

  test('getHandsByPlayer returns empty for unknown player', async () => {
    await storage.initialize();
    await storage.saveHand({ playersStartState: [{ id: 'p1' }] });
    const hands = await storage.getHandsByPlayer('unknown');
    expect(hands).toHaveLength(0);
  });

  test('getStatistics calculates correct stats with fixed field names', async () => {
    await storage.initialize();
    await storage.saveHand({ handResult: 'won', heroWinAmount: 200, amountLost: 50 });
    await storage.saveHand({ handResult: 'lost', heroWinAmount: 0, amountLost: 100 });
    const stats = await storage.getStatistics();
    expect(stats.totalHands).toBe(2);
    expect(stats.handsWon).toBe(1);
    expect(stats.totalWinnings).toBe(50); // (200-50) + (0-100)
    expect(stats.averageProfit).toBe(25);
  });

  test('getStatistics returns zero stats for empty hands', async () => {
    await storage.initialize();
    const stats = await storage.getStatistics();
    expect(stats.totalHands).toBe(0);
    expect(stats.handsWon).toBe(0);
    expect(stats.totalWinnings).toBe(0);
    expect(stats.averageProfit).toBe(0);
    expect(stats.lastPlayed).toBeNull();
  });

  test('saveSession saves and returns session id', async () => {
    await storage.initialize();
    const id = await storage.saveSession({ buyIn: 500 });
    expect(id).toMatch(/^session_/);
    const sessions = await storage.getAllSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ buyIn: 500 });
  });

  test('clear removes all data', async () => {
    await storage.initialize();
    await storage.saveHand({ pot: 10 });
    await storage.clear();
    expect(storage.cache).toEqual({ hands: [], sessions: [] });
  });

  test('_persist handles QuotaExceededError gracefully', async () => {
    await storage.initialize();
    await storage.saveHand({ pot: 10 });
    const quotaError = new DOMException('quota exceeded', 'QuotaExceededError');
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw quotaError;
    });
    expect(() => storage._persist()).not.toThrow();
  });
});
