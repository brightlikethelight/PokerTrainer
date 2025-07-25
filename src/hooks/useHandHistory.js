/**
 * useHandHistory Hook
 * Provides hand history functionality to components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { HandHistoryService } from '../analytics/HandHistoryService';
import HandHistoryStorage from '../storage/HandHistoryStorage';

const useHandHistory = () => {
  const [sessionId, setSessionId] = useState(null);
  const [hands, setHands] = useState([]);
  const [currentHand, _setCurrentHand] = useState(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize service
  const service = useMemo(() => new HandHistoryService(HandHistoryStorage), []);

  // Define loadHands before useEffect to avoid circular dependencies
  const loadHands = useCallback(async () => {
    setLoading(true);
    try {
      const recentHands = await service.getRecentHands(100);
      setHands(recentHands || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setHands([]);
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Load hands on mount
  useEffect(() => {
    loadHands();
  }, [loadHands]);

  const startSession = useCallback(
    async (config) => {
      try {
        const newSessionId = await service.startSession(config);
        setSessionId(newSessionId);
        setIsCapturing(true);
        return newSessionId;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [service]
  );

  const endSession = useCallback(async () => {
    try {
      const stats = await service.endSession();
      setSessionId(null);
      setIsCapturing(false);
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service]);

  const captureHand = useCallback(
    async (handData) => {
      try {
        const handId = await service.saveHand(handData);
        await loadHands(); // Reload to include new hand
        return { id: handId };
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [loadHands, service]
  );

  const analyzeHand = useCallback(async (_handId) => {
    // Mock analysis for now
    return {
      potOdds: 33.3,
      effectiveOdds: 28.5,
      expectedValue: 125,
      decision: 'call',
      mistakes: ['Should have bet for value on turn'],
      improvements: ['Consider range betting in this spot'],
      handStrength: 'strong',
      position: 'good',
    };
  }, []);

  const searchHands = useCallback(
    async (criteria) => {
      try {
        // Simple search implementation
        const filtered = hands.filter((hand) => {
          if (criteria.text) {
            return JSON.stringify(hand).toLowerCase().includes(criteria.text.toLowerCase());
          }
          return true;
        });
        return filtered;
      } catch (err) {
        setError(err.message);
        return [];
      }
    },
    [hands]
  );

  const exportHands = useCallback(
    async (format = 'json') => {
      try {
        if (format === 'json') {
          return JSON.stringify(hands, null, 2);
        } else if (format === 'csv') {
          // Simple CSV export
          const headers = ['Hand ID', 'Result', 'Pot', 'Position'];
          const rows = hands.map((h) => [h.id, h.result, h.pot, h.heroPosition]);
          return [headers, ...rows].map((row) => row.join(',')).join('\n');
        }
        return 'export-data';
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [hands]
  );

  const deleteHand = useCallback(async (handId) => {
    try {
      // Remove from local state
      setHands((prev) => prev.filter((h) => h.id !== handId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getPlayerStatistics = useCallback(() => {
    // Calculate statistics from hands
    const stats = {
      handsPlayed: hands.length,
      handsWon: hands.filter((h) => h.result === 'won').length,
      winRate:
        hands.length > 0
          ? (hands.filter((h) => h.result === 'won').length / hands.length) * 100
          : 0,
      vpip: 22.5, // Mock value
      pfr: 18.2, // Mock value
      aggression: 2.1, // Mock value
      totalWinnings: hands.reduce((sum, h) => sum + (h.winnings || 0), 0),
      bigBlindsWon: 25.0, // Mock value
      hourlyRate: 12.5, // Mock value
    };
    return stats;
  }, [hands]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sessionId,
    hands,
    currentHand,
    isCapturing,
    loading,
    error,
    loadHands,
    startSession,
    endSession,
    captureHand,
    analyzeHand,
    searchHands,
    exportHands,
    deleteHand,
    getPlayerStatistics,
    clearError,
  };
};

export default useHandHistory;
