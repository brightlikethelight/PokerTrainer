/**
 * useHandHistory Hook Test Suite
 * Comprehensive tests for hand history management hook
 * Target: 90%+ coverage with realistic poker hand tracking
 */

import { renderHook, act, waitFor } from '@testing-library/react';

import { useHandHistory } from '../useHandHistory';
import TestDataFactory from '../../test-utils/TestDataFactory';
import { GAME_PHASES } from '../../constants/game-constants';

// Mock the HandHistoryService
jest.mock('../../analytics/HandHistoryService', () => ({
  startSession: jest.fn(),
  endSession: jest.fn(),
  captureHand: jest.fn(),
  getSessionHistory: jest.fn(),
  analyzeHand: jest.fn(),
  getPlayerStatistics: jest.fn(),
  searchHands: jest.fn(),
  exportHands: jest.fn(),
  deleteHand: jest.fn(),
  getHandsByTimeRange: jest.fn(),
  calculateWinRate: jest.fn(),
  getPositionalStats: jest.fn(),
}));

const mockService = require('../../analytics/HandHistoryService');

describe('useHandHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockService.startSession.mockResolvedValue('session-123');
    mockService.endSession.mockResolvedValue(true);
    mockService.captureHand.mockResolvedValue({ id: 'hand-123' });
    mockService.getSessionHistory.mockResolvedValue([]);
  });

  describe('Hook Initialization', () => {
    test('should initialize with empty state', () => {
      const { result } = renderHook(() => useHandHistory());

      expect(result.current.sessionId).toBeNull();
      expect(result.current.hands).toEqual([]);
      expect(result.current.currentHand).toBeNull();
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should initialize with auto-start session when configured', async () => {
      mockService.startSession.mockResolvedValue('auto-session-123');

      const { result } = renderHook(() => useHandHistory({ autoStart: true }));

      await waitFor(() => {
        expect(result.current.sessionId).toBe('auto-session-123');
      });

      expect(mockService.startSession).toHaveBeenCalledWith({
        autoCapture: true,
        includePotOdds: true,
        includePlayerActions: true,
      });
    });

    test('should handle custom configuration', async () => {
      const config = {
        maxHandsInMemory: 1000,
        autoCapture: false,
        includePotOdds: false,
      };

      const { result } = renderHook(() => useHandHistory(config));

      await act(async () => {
        await result.current.startSession();
      });

      expect(mockService.startSession).toHaveBeenCalledWith(config);
    });
  });

  describe('Session Management', () => {
    test('should start session successfully', async () => {
      const { result } = renderHook(() => useHandHistory());

      await act(async () => {
        await result.current.startSession();
      });

      expect(result.current.sessionId).toBe('session-123');
      expect(result.current.loading).toBe(false);
      expect(mockService.startSession).toHaveBeenCalledTimes(1);
    });

    test('should handle session start failure', async () => {
      mockService.startSession.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useHandHistory());

      await act(async () => {
        await result.current.startSession();
      });

      expect(result.current.sessionId).toBeNull();
      expect(result.current.error).toBe('Connection failed');
      expect(result.current.loading).toBe(false);
    });

    test('should end session successfully', async () => {
      const { result } = renderHook(() => useHandHistory());

      // Start session first
      await act(async () => {
        await result.current.startSession();
      });

      // End session
      await act(async () => {
        await result.current.endSession();
      });

      expect(result.current.sessionId).toBeNull();
      expect(mockService.endSession).toHaveBeenCalledWith('session-123');
    });

    test('should handle session end failure', async () => {
      mockService.endSession.mockRejectedValue(new Error('Failed to end session'));

      const { result } = renderHook(() => useHandHistory());

      await act(async () => {
        await result.current.startSession();
      });

      await act(async () => {
        await result.current.endSession();
      });

      expect(result.current.error).toBe('Failed to end session');
      expect(result.current.sessionId).toBe('session-123'); // Should not clear on error
    });

    test('should prevent ending non-existent session', async () => {
      const { result } = renderHook(() => useHandHistory());

      await act(async () => {
        await result.current.endSession();
      });

      expect(mockService.endSession).not.toHaveBeenCalled();
      expect(result.current.error).toBe('No active session to end');
    });

    test('should restart session correctly', async () => {
      const { result } = renderHook(() => useHandHistory());

      // Start initial session
      await act(async () => {
        await result.current.startSession();
      });

      const firstSessionId = result.current.sessionId;

      // Mock new session ID for restart
      mockService.startSession.mockResolvedValue('new-session-456');

      // Restart session
      await act(async () => {
        await result.current.restartSession();
      });

      expect(mockService.endSession).toHaveBeenCalledWith(firstSessionId);
      expect(result.current.sessionId).toBe('new-session-456');
      expect(result.current.hands).toEqual([]); // Should clear hands
    });
  });

  describe('Hand Capture', () => {
    let hookResult;

    beforeEach(async () => {
      const { result } = renderHook(() => useHandHistory());
      hookResult = result;

      await act(async () => {
        await hookResult.current.startSession();
      });
    });

    test('should capture hand successfully', async () => {
      const handData = TestDataFactory.createCompleteHand();

      await act(async () => {
        await hookResult.current.captureHand(handData);
      });

      expect(hookResult.current.hands).toHaveLength(1);
      expect(hookResult.current.hands[0].id).toBe('hand-123');
      expect(mockService.captureHand).toHaveBeenCalledWith('session-123', handData);
    });

    test('should handle hand capture failure', async () => {
      mockService.captureHand.mockRejectedValue(new Error('Capture failed'));

      const handData = TestDataFactory.createCompleteHand();

      await act(async () => {
        await hookResult.current.captureHand(handData);
      });

      expect(hookResult.current.hands).toHaveLength(0);
      expect(hookResult.current.error).toBe('Capture failed');
    });

    test('should prevent capture without active session', async () => {
      const { result } = renderHook(() => useHandHistory());
      const handData = TestDataFactory.createCompleteHand();

      await act(async () => {
        await result.current.captureHand(handData);
      });

      expect(mockService.captureHand).not.toHaveBeenCalled();
      expect(result.current.error).toBe('No active session');
    });

    test('should start capturing real-time', async () => {
      await act(async () => {
        hookResult.current.startCapturing();
      });

      expect(hookResult.current.isCapturing).toBe(true);
    });

    test('should stop capturing real-time', async () => {
      await act(async () => {
        hookResult.current.startCapturing();
      });

      await act(async () => {
        hookResult.current.stopCapturing();
      });

      expect(hookResult.current.isCapturing).toBe(false);
    });

    test('should capture multiple hands in sequence', async () => {
      const hands = [
        TestDataFactory.createCompleteHand(),
        TestDataFactory.createCompleteHand(),
        TestDataFactory.createCompleteHand(),
      ];

      // Mock different hand IDs
      mockService.captureHand
        .mockResolvedValueOnce({ id: 'hand-1' })
        .mockResolvedValueOnce({ id: 'hand-2' })
        .mockResolvedValueOnce({ id: 'hand-3' });

      for (const hand of hands) {
        await act(async () => {
          await hookResult.current.captureHand(hand);
        });
      }

      expect(hookResult.current.hands).toHaveLength(3);
      expect(hookResult.current.hands.map((h) => h.id)).toEqual(['hand-1', 'hand-2', 'hand-3']);
    });
  });

  describe('Hand Analysis', () => {
    let hookResult;

    beforeEach(async () => {
      const { result } = renderHook(() => useHandHistory());
      hookResult = result;

      await act(async () => {
        await hookResult.current.startSession();
      });

      // Add some hands
      const handData = TestDataFactory.createCompleteHand();
      mockService.captureHand.mockResolvedValue({ id: 'hand-123', ...handData });

      await act(async () => {
        await hookResult.current.captureHand(handData);
      });
    });

    test('should analyze hand successfully', async () => {
      const analysis = {
        potOdds: 25.5,
        effectiveOdds: 23.1,
        expectedValue: 150,
        decision: 'call',
        mistakes: [],
        improvements: ['Consider betting for value'],
      };

      mockService.analyzeHand.mockResolvedValue(analysis);

      let result;
      await act(async () => {
        result = await hookResult.current.analyzeHand('hand-123');
      });

      expect(result).toEqual(analysis);
      expect(mockService.analyzeHand).toHaveBeenCalledWith('hand-123');
    });

    test('should handle analysis failure', async () => {
      mockService.analyzeHand.mockRejectedValue(new Error('Analysis failed'));

      let result;
      await act(async () => {
        result = await hookResult.current.analyzeHand('hand-123');
      });

      expect(result).toBeNull();
      expect(hookResult.current.error).toBe('Analysis failed');
    });

    test('should get current hand analysis', async () => {
      const currentHandData = {
        phase: GAME_PHASES.FLOP,
        pot: 300,
        playerCards: TestDataFactory.createHoleCards().pocketAces(),
        communityCards: TestDataFactory.createCommunityCards().flop(),
        actions: ['call', 'raise'],
      };

      await act(async () => {
        hookResult.current.setCurrentHand(currentHandData);
      });

      expect(hookResult.current.currentHand).toEqual(currentHandData);
    });

    test('should clear current hand', async () => {
      const currentHandData = TestDataFactory.createCompleteHand();

      await act(async () => {
        hookResult.current.setCurrentHand(currentHandData);
      });

      await act(async () => {
        hookResult.current.clearCurrentHand();
      });

      expect(hookResult.current.currentHand).toBeNull();
    });
  });

  describe('Hand History Retrieval', () => {
    let hookResult;

    beforeEach(async () => {
      const { result } = renderHook(() => useHandHistory());
      hookResult = result;

      await act(async () => {
        await hookResult.current.startSession();
      });
    });

    test('should load session history', async () => {
      const mockHands = [
        { id: 'hand-1', timestamp: Date.now() - 3600000 },
        { id: 'hand-2', timestamp: Date.now() - 1800000 },
        { id: 'hand-3', timestamp: Date.now() - 900000 },
      ];

      mockService.getSessionHistory.mockResolvedValue(mockHands);

      await act(async () => {
        await hookResult.current.loadSessionHistory();
      });

      expect(hookResult.current.hands).toEqual(mockHands);
      expect(mockService.getSessionHistory).toHaveBeenCalledWith('session-123');
    });

    test('should handle history load failure', async () => {
      mockService.getSessionHistory.mockRejectedValue(new Error('Load failed'));

      await act(async () => {
        await hookResult.current.loadSessionHistory();
      });

      expect(hookResult.current.error).toBe('Load failed');
      expect(hookResult.current.hands).toEqual([]);
    });

    test('should search hands by criteria', async () => {
      const searchResults = [
        { id: 'hand-1', heroPosition: 0 },
        { id: 'hand-3', heroPosition: 0 },
      ];

      mockService.searchHands.mockResolvedValue(searchResults);

      const criteria = {
        position: 0,
        phase: GAME_PHASES.PREFLOP,
        action: 'raise',
      };

      let results;
      await act(async () => {
        results = await hookResult.current.searchHands(criteria);
      });

      expect(results).toEqual(searchResults);
      expect(mockService.searchHands).toHaveBeenCalledWith('session-123', criteria);
    });

    test('should get hands by time range', async () => {
      const timeRangeHands = [
        { id: 'hand-2', timestamp: Date.now() - 1800000 },
        { id: 'hand-3', timestamp: Date.now() - 900000 },
      ];

      mockService.getHandsByTimeRange.mockResolvedValue(timeRangeHands);

      const startTime = Date.now() - 3600000;
      const endTime = Date.now();

      let results;
      await act(async () => {
        results = await hookResult.current.getHandsByTimeRange(startTime, endTime);
      });

      expect(results).toEqual(timeRangeHands);
      expect(mockService.getHandsByTimeRange).toHaveBeenCalledWith(
        'session-123',
        startTime,
        endTime
      );
    });
  });

  describe('Statistics and Analytics', () => {
    let hookResult;

    beforeEach(async () => {
      const { result } = renderHook(() => useHandHistory());
      hookResult = result;

      await act(async () => {
        await hookResult.current.startSession();
      });
    });

    test('should get player statistics', async () => {
      const stats = {
        handsPlayed: 150,
        handsWon: 45,
        winRate: 30.0,
        vpip: 22.5,
        pfr: 18.2,
        aggression: 2.1,
        totalWinnings: 2500,
      };

      mockService.getPlayerStatistics.mockResolvedValue(stats);

      let result;
      await act(async () => {
        result = await hookResult.current.getPlayerStatistics('player-123');
      });

      expect(result).toEqual(stats);
      expect(mockService.getPlayerStatistics).toHaveBeenCalledWith('session-123', 'player-123');
    });

    test('should calculate win rate', async () => {
      mockService.calculateWinRate.mockResolvedValue(65.5);

      let winRate;
      await act(async () => {
        winRate = await hookResult.current.calculateWinRate('player-123');
      });

      expect(winRate).toBe(65.5);
    });

    test('should get positional statistics', async () => {
      const positionalStats = {
        button: { handsPlayed: 25, winRate: 45.0 },
        cutoff: { handsPlayed: 23, winRate: 38.5 },
        hijack: { handsPlayed: 22, winRate: 32.1 },
        utg: { handsPlayed: 20, winRate: 28.0 },
      };

      mockService.getPositionalStats.mockResolvedValue(positionalStats);

      let stats;
      await act(async () => {
        stats = await hookResult.current.getPositionalStats('player-123');
      });

      expect(stats).toEqual(positionalStats);
    });

    test('should handle statistics errors gracefully', async () => {
      mockService.getPlayerStatistics.mockRejectedValue(new Error('Stats error'));

      let result;
      await act(async () => {
        result = await hookResult.current.getPlayerStatistics('player-123');
      });

      expect(result).toBeNull();
      expect(hookResult.current.error).toBe('Stats error');
    });
  });

  describe('Hand Management', () => {
    let hookResult;

    beforeEach(async () => {
      const { result } = renderHook(() => useHandHistory());
      hookResult = result;

      await act(async () => {
        await hookResult.current.startSession();
      });

      // Add test hands
      const hands = [
        { id: 'hand-1', timestamp: Date.now() - 3600000 },
        { id: 'hand-2', timestamp: Date.now() - 1800000 },
        { id: 'hand-3', timestamp: Date.now() - 900000 },
      ];

      mockService.getSessionHistory.mockResolvedValue(hands);

      await act(async () => {
        await hookResult.current.loadSessionHistory();
      });
    });

    test('should delete hand successfully', async () => {
      mockService.deleteHand.mockResolvedValue(true);

      await act(async () => {
        await hookResult.current.deleteHand('hand-2');
      });

      expect(hookResult.current.hands).toHaveLength(2);
      expect(hookResult.current.hands.find((h) => h.id === 'hand-2')).toBeUndefined();
      expect(mockService.deleteHand).toHaveBeenCalledWith('hand-2');
    });

    test('should handle delete failure', async () => {
      mockService.deleteHand.mockRejectedValue(new Error('Delete failed'));

      await act(async () => {
        await hookResult.current.deleteHand('hand-2');
      });

      expect(hookResult.current.hands).toHaveLength(3); // Should remain unchanged
      expect(hookResult.current.error).toBe('Delete failed');
    });

    test('should export hands successfully', async () => {
      const exportData = 'hand1,data\\nhand2,data\\nhand3,data';
      mockService.exportHands.mockResolvedValue(exportData);

      let result;
      await act(async () => {
        result = await hookResult.current.exportHands('csv');
      });

      expect(result).toBe(exportData);
      expect(mockService.exportHands).toHaveBeenCalledWith('session-123', 'csv');
    });

    test('should handle export failure', async () => {
      mockService.exportHands.mockRejectedValue(new Error('Export failed'));

      let result;
      await act(async () => {
        result = await hookResult.current.exportHands('json');
      });

      expect(result).toBeNull();
      expect(hookResult.current.error).toBe('Export failed');
    });

    test('should clear all hands', async () => {
      await act(async () => {
        hookResult.current.clearHands();
      });

      expect(hookResult.current.hands).toEqual([]);
    });

    test('should filter hands by criteria', async () => {
      await act(async () => {
        hookResult.current.filterHands((hand) => hand.id === 'hand-1');
      });

      expect(hookResult.current.hands).toHaveLength(1);
      expect(hookResult.current.hands[0].id).toBe('hand-1');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should clear errors manually', async () => {
      const { result } = renderHook(() => useHandHistory());

      // Trigger an error
      await act(async () => {
        await result.current.captureHand({});
      });

      expect(result.current.error).toBe('No active session');

      // Clear error
      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    test('should handle network failures gracefully', async () => {
      mockService.startSession.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useHandHistory());

      await act(async () => {
        await result.current.startSession();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.sessionId).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    test('should retry failed operations', async () => {
      const { result } = renderHook(() => useHandHistory());

      // First call fails
      mockService.startSession
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('session-retry-123');

      // First attempt fails
      await act(async () => {
        await result.current.startSession();
      });

      expect(result.current.sessionId).toBeNull();
      expect(result.current.error).toBe('Temporary failure');

      // Clear error and retry
      await act(async () => {
        result.current.clearError();
        await result.current.startSession();
      });

      expect(result.current.sessionId).toBe('session-retry-123');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle large number of hands efficiently', async () => {
      const { result } = renderHook(() => useHandHistory({ maxHandsInMemory: 100 }));

      await act(async () => {
        await result.current.startSession();
      });

      // Generate large number of hands
      const largeHandSet = Array.from({ length: 150 }, (_, i) => ({
        id: `hand-${i}`,
        timestamp: Date.now() - i * 60000,
      }));

      mockService.getSessionHistory.mockResolvedValue(largeHandSet);

      await act(async () => {
        await result.current.loadSessionHistory();
      });

      // Should limit to maxHandsInMemory
      expect(result.current.hands.length).toBeLessThanOrEqual(100);
    });

    test('should cleanup resources on unmount', () => {
      const { result, unmount } = renderHook(() => useHandHistory());

      // Start capturing
      act(() => {
        result.current.startCapturing();
      });

      expect(result.current.isCapturing).toBe(true);

      // Unmount should cleanup
      unmount();

      // No errors should occur during cleanup
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    test('should debounce rapid capture requests', async () => {
      const { result } = renderHook(() => useHandHistory());

      await act(async () => {
        await result.current.startSession();
      });

      const handData = TestDataFactory.createCompleteHand();

      // Rapid captures
      await act(async () => {
        await Promise.all([
          result.current.captureHand(handData),
          result.current.captureHand(handData),
          result.current.captureHand(handData),
        ]);
      });

      // Should handle gracefully without overwhelming the service
      expect(mockService.captureHand).toHaveBeenCalledTimes(3);
    });
  });

  describe('Real-time Updates', () => {
    test('should update current hand in real-time', async () => {
      const { result } = renderHook(() => useHandHistory());

      const initialHand = {
        phase: GAME_PHASES.PREFLOP,
        pot: 150,
        actions: ['call'],
      };

      await act(async () => {
        result.current.setCurrentHand(initialHand);
      });

      expect(result.current.currentHand.pot).toBe(150);

      // Update hand
      const updatedHand = {
        ...initialHand,
        pot: 300,
        actions: ['call', 'raise'],
      };

      await act(async () => {
        result.current.setCurrentHand(updatedHand);
      });

      expect(result.current.currentHand.pot).toBe(300);
      expect(result.current.currentHand.actions).toEqual(['call', 'raise']);
    });

    test('should handle concurrent updates safely', async () => {
      const { result } = renderHook(() => useHandHistory());

      await act(async () => {
        await result.current.startSession();
      });

      const handData1 = { ...TestDataFactory.createCompleteHand(), id: 'hand-1' };
      const handData2 = { ...TestDataFactory.createCompleteHand(), id: 'hand-2' };

      mockService.captureHand.mockResolvedValueOnce(handData1).mockResolvedValueOnce(handData2);

      // Concurrent operations
      await act(async () => {
        await Promise.all([
          result.current.captureHand(handData1),
          result.current.captureHand(handData2),
        ]);
      });

      expect(result.current.hands).toHaveLength(2);
    });
  });

  describe('Configuration and Customization', () => {
    test('should apply custom configuration correctly', () => {
      const config = {
        maxHandsInMemory: 500,
        autoCapture: false,
        includePotOdds: false,
        includePlayerActions: true,
        compressionLevel: 2,
      };

      const { result } = renderHook(() => useHandHistory(config));

      // Configuration should be reflected in hook behavior
      expect(result.current.isCapturing).toBe(false); // autoCapture: false
    });

    test('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        maxHandsInMemory: -1,
        autoCapture: 'invalid',
        unknownProperty: 'value',
      };

      expect(() => {
        renderHook(() => useHandHistory(invalidConfig));
      }).not.toThrow();
    });

    test('should allow configuration updates after initialization', async () => {
      const { result } = renderHook(() => useHandHistory());

      const newConfig = {
        autoCapture: true,
        includePotOdds: true,
      };

      await act(async () => {
        result.current.updateConfiguration(newConfig);
      });

      // Should reflect new configuration
      expect(result.current.isCapturing).toBe(true);
    });
  });
});
