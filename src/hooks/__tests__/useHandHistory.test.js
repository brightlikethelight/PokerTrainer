/**
 * useHandHistory Hook Test Suite
 *
 * Uses service injection (options.historyService) to avoid module mocking entirely.
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';

import useHandHistory from '../useHandHistory';

const sampleHands = [
  { id: 'h1', result: 'won', pot: 200, heroPosition: 'BTN', winnings: 50 },
  { id: 'h2', result: 'lost', pot: 150, heroPosition: 'SB', winnings: -25 },
  { id: 'h3', result: 'won', pot: 300, heroPosition: 'CO', winnings: 100 },
];

function createMockService(overrides = {}) {
  return {
    getRecentHands: vi.fn().mockResolvedValue(sampleHands),
    startSession: vi.fn().mockResolvedValue('session-abc'),
    endSession: vi.fn().mockResolvedValue({ handsPlayed: 10 }),
    saveHand: vi.fn().mockResolvedValue('hand-xyz'),
    ...overrides,
  };
}

async function renderHookAsync(mockService) {
  let result;
  await act(async () => {
    result = renderHook(() => useHandHistory({ historyService: mockService }));
  });
  return result;
}

describe('useHandHistory', () => {
  // ── Initialization ────────────────────────────────────────────────

  test('initializes with empty/default state', async () => {
    const mockService = createMockService({ getRecentHands: vi.fn().mockResolvedValue([]) });
    const { result } = await renderHookAsync(mockService);

    expect(result.current.sessionId).toBeNull();
    expect(result.current.hands).toEqual([]);
    expect(result.current.currentHand).toBeNull();
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── loadHands ─────────────────────────────────────────────────────

  test('calls service.getRecentHands on mount', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    expect(mockService.getRecentHands).toHaveBeenCalledWith(100);
    expect(result.current.hands).toEqual(sampleHands);
    expect(result.current.loading).toBe(false);
  });

  test('sets error when loadHands rejects', async () => {
    const mockService = createMockService({
      getRecentHands: vi.fn().mockRejectedValue(new Error('DB unavailable')),
    });
    const { result } = await renderHookAsync(mockService);

    expect(result.current.error).toBe('DB unavailable');
    expect(result.current.hands).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  // ── startSession ──────────────────────────────────────────────────

  test('startSession sets sessionId and isCapturing on success', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let returnedId;
    await act(async () => {
      returnedId = await result.current.startSession({ blinds: '1/2' });
    });

    expect(mockService.startSession).toHaveBeenCalledWith({ blinds: '1/2' });
    expect(returnedId).toBe('session-abc');
    expect(result.current.sessionId).toBe('session-abc');
    expect(result.current.isCapturing).toBe(true);
  });

  test('startSession sets error and re-throws on failure', async () => {
    const mockService = createMockService({
      startSession: vi.fn().mockRejectedValue(new Error('session failed')),
    });
    const { result } = await renderHookAsync(mockService);

    await act(async () => {
      await expect(result.current.startSession({})).rejects.toThrow('session failed');
    });

    expect(result.current.error).toBe('session failed');
    expect(result.current.isCapturing).toBe(false);
  });

  // ── endSession ────────────────────────────────────────────────────

  test('endSession resets sessionId and isCapturing on success', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    // Start a session first
    await act(async () => {
      await result.current.startSession({});
    });
    expect(result.current.isCapturing).toBe(true);

    let stats;
    await act(async () => {
      stats = await result.current.endSession();
    });

    expect(stats).toEqual({ handsPlayed: 10 });
    expect(result.current.sessionId).toBeNull();
    expect(result.current.isCapturing).toBe(false);
  });

  test('endSession sets error and re-throws on failure', async () => {
    const mockService = createMockService({
      endSession: vi.fn().mockRejectedValue(new Error('end failed')),
    });
    const { result } = await renderHookAsync(mockService);

    await act(async () => {
      await expect(result.current.endSession()).rejects.toThrow('end failed');
    });

    expect(result.current.error).toBe('end failed');
  });

  // ── captureHand ───────────────────────────────────────────────────

  test('captureHand calls saveHand and reloads hands', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    const handData = { cards: ['Ah', 'Kd'], pot: 500 };
    let captured;
    await act(async () => {
      captured = await result.current.captureHand(handData);
    });

    expect(mockService.saveHand).toHaveBeenCalledWith(handData);
    expect(captured).toEqual({ id: 'hand-xyz' });
    // getRecentHands called once on mount, once on reload after capture
    expect(mockService.getRecentHands).toHaveBeenCalledTimes(2);
  });

  test('captureHand sets error and re-throws on failure', async () => {
    const mockService = createMockService({
      saveHand: vi.fn().mockRejectedValue(new Error('save failed')),
    });
    const { result } = await renderHookAsync(mockService);

    await act(async () => {
      await expect(result.current.captureHand({})).rejects.toThrow('save failed');
    });

    expect(result.current.error).toBe('save failed');
  });

  // ── searchHands ───────────────────────────────────────────────────

  test('searchHands filters by text criteria', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let filtered;
    await act(async () => {
      filtered = await result.current.searchHands({ text: 'BTN' });
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('h1');
  });

  test('searchHands with no criteria returns all hands', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let filtered;
    await act(async () => {
      filtered = await result.current.searchHands({});
    });

    expect(filtered).toEqual(sampleHands);
  });

  // ── exportHands ───────────────────────────────────────────────────

  test('exportHands returns JSON by default', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let exported;
    await act(async () => {
      exported = await result.current.exportHands('json');
    });

    const parsed = JSON.parse(exported);
    expect(parsed).toEqual(sampleHands);
  });

  test('exportHands returns CSV when requested', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let exported;
    await act(async () => {
      exported = await result.current.exportHands('csv');
    });

    const lines = exported.split('\n');
    expect(lines[0]).toBe('Hand ID,Result,Pot,Position');
    expect(lines).toHaveLength(sampleHands.length + 1); // header + data rows
    expect(lines[1]).toBe('h1,won,200,BTN');
  });

  // ── deleteHand ────────────────────────────────────────────────────

  test('deleteHand removes the hand from state', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    expect(result.current.hands).toHaveLength(3);

    await act(async () => {
      await result.current.deleteHand('h2');
    });

    expect(result.current.hands).toHaveLength(2);
    expect(result.current.hands.find((h) => h.id === 'h2')).toBeUndefined();
  });

  // ── getPlayerStatistics ───────────────────────────────────────────

  test('getPlayerStatistics computes stats from current hands', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let stats;
    act(() => {
      stats = result.current.getPlayerStatistics();
    });

    expect(stats.handsPlayed).toBe(3);
    expect(stats.handsWon).toBe(2);
    expect(stats.winRate).toBeCloseTo(66.67, 1);
    expect(stats.totalWinnings).toBe(125); // 50 + (-25) + 100
  });

  test('getPlayerStatistics computes VPIP/PFR/aggression from actions', async () => {
    const handsWithActions = [
      {
        id: 'h1',
        result: 'won',
        winnings: 50,
        actions: [
          { phase: 'preflop', isHero: true, action: 'raise' },
          { phase: 'flop', isHero: true, action: 'bet' },
        ],
      },
      {
        id: 'h2',
        result: 'lost',
        winnings: -20,
        actions: [
          { phase: 'preflop', isHero: true, action: 'call' },
          { phase: 'flop', isHero: true, action: 'call' },
        ],
      },
      {
        id: 'h3',
        result: 'lost',
        winnings: 0,
        actions: [{ phase: 'preflop', isHero: true, action: 'fold' }],
      },
    ];
    const mockService = createMockService({
      getRecentHands: vi.fn().mockResolvedValue(handsWithActions),
    });
    const { result } = await renderHookAsync(mockService);

    let stats;
    act(() => {
      stats = result.current.getPlayerStatistics();
    });

    // VPIP: h1 (raise) + h2 (call) = 2/3 = 66.7%
    expect(stats.vpip).toBeCloseTo(66.67, 0);
    // PFR: h1 (raise) = 1/3 = 33.3%
    expect(stats.pfr).toBeCloseTo(33.33, 0);
    // Aggression: bets=2 (raise+bet) / calls=2 (call+call) = 1.0
    expect(stats.aggression).toBeCloseTo(1.0, 1);
  });

  // ── clearError ────────────────────────────────────────────────────

  test('clearError resets error to null', async () => {
    const mockService = createMockService({
      getRecentHands: vi.fn().mockRejectedValue(new Error('load error')),
    });
    const { result } = await renderHookAsync(mockService);

    expect(result.current.error).toBe('load error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  // ── analyzeHand ───────────────────────────────────────────────────

  test('analyzeHand returns an analysis object', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let analysis;
    await act(async () => {
      analysis = await result.current.analyzeHand('h1');
    });

    expect(analysis).toEqual(
      expect.objectContaining({
        potOdds: expect.any(Number),
        expectedValue: expect.any(Number),
        decision: expect.any(String),
        mistakes: expect.any(Array),
        improvements: expect.any(Array),
        handStrength: expect.any(String),
      })
    );
  });

  test('analyzeHand returns error for unknown hand', async () => {
    const mockService = createMockService();
    const { result } = await renderHookAsync(mockService);

    let analysis;
    await act(async () => {
      analysis = await result.current.analyzeHand('nonexistent');
    });

    expect(analysis.error).toBe('Hand not found');
  });
});
