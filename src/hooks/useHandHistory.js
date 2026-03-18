/**
 * useHandHistory Hook
 * Provides hand history functionality to components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { HandHistoryService } from '../analytics/HandHistoryService';
import HandHistoryStorage from '../storage/HandHistoryStorage';

const useHandHistory = (options = {}) => {
  const [sessionId, setSessionId] = useState(null);
  const [hands, setHands] = useState([]);
  const [currentHand] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize service — accept injected service for testing
  const { historyService } = options;
  const service = useMemo(
    () => historyService || new HandHistoryService(HandHistoryStorage),
    [historyService]
  );

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

  const analyzeHand = useCallback(
    async (handId) => {
      const hand = hands.find((h) => h.id === handId);
      if (!hand) {
        return { error: 'Hand not found' };
      }

      const actions = hand.actions || [];
      const bets = actions.filter((a) => a.action === 'bet' || a.action === 'raise').length;
      const calls = actions.filter((a) => a.action === 'call').length;
      const potOdds =
        hand.pot > 0 && hand.toCall > 0 ? (hand.toCall / (hand.pot + hand.toCall)) * 100 : 0;

      return {
        potOdds,
        effectiveOdds: potOdds * 0.85,
        expectedValue: hand.winnings || 0,
        decision: hand.result === 'won' ? 'correct' : 'review',
        mistakes: [],
        improvements: [],
        handStrength: hand.handStrength || 'unknown',
        position: hand.heroPosition || 'unknown',
        aggression: calls > 0 ? bets / calls : bets,
      };
    },
    [hands]
  );

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
    const handsPlayed = hands.length;
    const handsWon = hands.filter((h) => h.result === 'won').length;
    const totalWinnings = hands.reduce((sum, h) => sum + (h.winnings || 0), 0);

    // VPIP: hands where hero voluntarily put chips in preflop (didn't fold preflop)
    const handsWithPreflopAction = hands.filter((h) => h.actions && h.actions.length > 0);
    const vpipHands = handsWithPreflopAction.filter((h) => {
      const preflopActions = (h.actions || []).filter((a) => a.phase === 'preflop' && a.isHero);
      return preflopActions.some((a) => a.action !== 'fold');
    });
    const vpip = handsPlayed > 0 ? (vpipHands.length / handsPlayed) * 100 : 0;

    // PFR: hands where hero raised preflop
    const pfrHands = handsWithPreflopAction.filter((h) => {
      const preflopActions = (h.actions || []).filter((a) => a.phase === 'preflop' && a.isHero);
      return preflopActions.some((a) => a.action === 'raise' || a.action === 'bet');
    });
    const pfr = handsPlayed > 0 ? (pfrHands.length / handsPlayed) * 100 : 0;

    // Aggression factor: (bets + raises) / calls
    let totalBets = 0;
    let totalCalls = 0;
    hands.forEach((h) => {
      (h.actions || [])
        .filter((a) => a.isHero)
        .forEach((a) => {
          if (a.action === 'bet' || a.action === 'raise') totalBets++;
          if (a.action === 'call') totalCalls++;
        });
    });
    const aggression = totalCalls > 0 ? totalBets / totalCalls : totalBets;

    // BB won and hourly rate
    const bigBlindSize = hands.length > 0 && hands[0].blinds ? hands[0].blinds.big : 20;
    const bigBlindsWon = bigBlindSize > 0 ? totalWinnings / bigBlindSize : 0;

    const timestamps = hands.map((h) => h.timestamp).filter(Boolean);
    let hourlyRate = 0;
    if (timestamps.length >= 2) {
      const elapsed = (Math.max(...timestamps) - Math.min(...timestamps)) / 3600000;
      hourlyRate = elapsed > 0 ? totalWinnings / elapsed : 0;
    }

    return {
      handsPlayed,
      handsWon,
      winRate: handsPlayed > 0 ? (handsWon / handsPlayed) * 100 : 0,
      vpip,
      pfr,
      aggression,
      totalWinnings,
      bigBlindsWon,
      hourlyRate,
    };
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
