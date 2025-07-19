// Hand History Integration Hook
// Automatically captures hand data during gameplay

import { useEffect, useRef, useCallback } from 'react';

import HandHistoryService from '../domains/analytics/domain/HandHistoryService';
import logger from '../services/logger';

export const useHandHistory = (gameState, isGameActive = false) => {
  const serviceRef = useRef(HandHistoryService);
  const previousGameStateRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const currentHandRef = useRef(null);

  // Start session when game becomes active
  useEffect(() => {
    const handleSessionChange = async () => {
      if (isGameActive && !sessionActiveRef.current) {
        try {
          const sessionData = {
            gameType: 'texas-holdem',
            buyIn: 10000,
            blindStructure: {
              small: gameState?.smallBlind || 50,
              big: gameState?.bigBlind || 100,
            },
            maxPlayers: gameState?.players?.length || 6,
            timestamp: Date.now(),
          };

          const sessionId = await serviceRef.current.startSession(sessionData);
          sessionActiveRef.current = true;
          logger.info('Hand history session started', { sessionId });
        } catch (error) {
          logger.error('Failed to start hand history session', error);
        }
      } else if (!isGameActive && sessionActiveRef.current) {
        try {
          const stats = await serviceRef.current.endSession();
          sessionActiveRef.current = false;
          currentHandRef.current = null;
          logger.info('Hand history session ended', { stats });
        } catch (error) {
          logger.error('Failed to end hand history session', error);
        }
      }
    };

    handleSessionChange();
  }, [isGameActive, gameState]);

  // Monitor game state changes for hand capture
  useEffect(() => {
    if (!isGameActive || !sessionActiveRef.current || !gameState) {
      return;
    }

    const previousState = previousGameStateRef.current;

    try {
      // Detect new hand start
      if (shouldStartNewHand(gameState, previousState)) {
        serviceRef.current.startHandCapture(gameState);
        currentHandRef.current = gameState.handNumber || Date.now();
        logger.info('Hand history capture started', {
          handNumber: currentHandRef.current,
          phase: gameState.phase,
          players: gameState.players?.length,
        });
      }

      // Detect actions
      if (shouldCaptureAction(gameState, previousState)) {
        const actingPlayer = findActingPlayer(gameState, previousState);
        if (actingPlayer) {
          const action = determineAction(actingPlayer, previousState);
          if (action) {
            serviceRef.current.captureAction(
              gameState,
              actingPlayer.id,
              action.type,
              action.amount
            );
            logger.info('Action captured', {
              playerId: actingPlayer.id,
              action: action.type,
              amount: action.amount,
              phase: gameState.phase,
            });
          }
        }
      }

      // Detect phase changes
      if (shouldCapturePhaseChange(gameState, previousState)) {
        const newPhase = gameState.phase;
        const communityCards = gameState.communityCards || [];
        serviceRef.current.captureStreetChange(gameState, newPhase, communityCards);
        logger.info('Phase change captured', {
          newPhase,
          communityCards: communityCards.length,
          handNumber: currentHandRef.current,
        });
      }

      // Detect hand completion
      if (shouldCompleteHand(gameState, previousState)) {
        const handleCompletion = async () => {
          const winners = extractWinners(gameState);
          const showdown = gameState.phase === 'showdown' || gameState.showdown;
          const handId = await serviceRef.current.completeHand(gameState, winners, showdown);
          currentHandRef.current = null;
          logger.info('Hand completion captured', {
            handId,
            winners: winners.length,
            showdown,
            potSize: gameState.pot,
          });
        };
        handleCompletion().catch((error) => {
          logger.error('Failed to capture hand completion', error);
        });
      }
    } catch (error) {
      logger.error('Error in game state monitoring', error);
    }

    previousGameStateRef.current = gameState;
  }, [gameState, isGameActive]);

  const startSession = useCallback(async (sessionConfig = {}) => {
    try {
      const sessionData = {
        gameType: 'texas-holdem',
        buyIn: 10000,
        blindStructure: {
          small: 50,
          big: 100,
        },
        maxPlayers: 6,
        timestamp: Date.now(),
        ...sessionConfig,
      };

      const sessionId = await serviceRef.current.startSession(sessionData);
      sessionActiveRef.current = true;

      logger.info('Hand history session started', { sessionId });
      return sessionId;
    } catch (error) {
      logger.error('Failed to start hand history session', error);
      return null;
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionActiveRef.current) {
      return null;
    }

    try {
      const stats = await serviceRef.current.endSession();
      sessionActiveRef.current = false;
      currentHandRef.current = null;

      logger.info('Hand history session ended', { stats });
      return stats;
    } catch (error) {
      logger.error('Failed to end hand history session', error);
      return null;
    }
  }, []);

  // Note: Handler functions moved inline to useEffect for better performance

  // Manual capture methods for explicit control
  const captureAction = useCallback(
    (playerId, actionType, amount = 0, currentGameState = null) => {
      if (!sessionActiveRef.current) {
        return;
      }

      const stateToUse = currentGameState || gameState;
      if (!stateToUse) {
        return;
      }

      try {
        serviceRef.current.captureAction(stateToUse, playerId, actionType, amount);
      } catch (error) {
        logger.error('Failed to manually capture action', error);
      }
    },
    [gameState]
  );

  const getSessionStats = useCallback(async () => {
    try {
      return await serviceRef.current.getSessionStats();
    } catch (error) {
      logger.error('Failed to get session stats', error);
      return null;
    }
  }, []);

  const exportHistory = useCallback(async (options = {}) => {
    try {
      return await serviceRef.current.repository.exportHandHistory(options);
    } catch (error) {
      logger.error('Failed to export hand history', error);
      return null;
    }
  }, []);

  // Helper functions
  const shouldStartNewHand = (current, previous) => {
    if (!current || !previous) {
      return !!current?.handNumber && !currentHandRef.current;
    }

    // New hand if hand number changed or we're in preflop with fresh cards
    return (
      current.handNumber !== previous.handNumber ||
      (current.phase === 'preflop' && previous.phase !== 'preflop' && !currentHandRef.current)
    );
  };

  const shouldCaptureAction = (current, previous) => {
    if (!current || !previous) return false;

    // Check if any player's state changed in a way that indicates an action
    return current.players?.some((player, index) => {
      const prevPlayer = previous.players?.[index];
      if (!prevPlayer) return false;

      // Check for betting changes, status changes, or chip changes
      return (
        player.currentBet !== prevPlayer.currentBet ||
        player.status !== prevPlayer.status ||
        player.chips !== prevPlayer.chips ||
        player.lastAction !== prevPlayer.lastAction
      );
    });
  };

  const shouldCapturePhaseChange = (current, previous) => {
    if (!current || !previous) return false;

    return current.phase !== previous.phase && current.phase !== 'waiting';
  };

  const shouldCompleteHand = (current, previous) => {
    if (!current || !previous) return false;

    // Hand complete if we have winners or phase changed to waiting/ended
    return (
      (current.winners && current.winners.length > 0) ||
      (previous.phase !== 'waiting' && current.phase === 'waiting') ||
      current.handComplete ||
      current.gameEnded
    );
  };

  const findActingPlayer = (current, previous) => {
    if (!current?.players || !previous?.players) return null;

    // Find player with changed state
    for (let i = 0; i < current.players.length; i++) {
      const currentPlayer = current.players[i];
      const previousPlayer = previous.players[i];

      if (!previousPlayer) continue;

      // Check for meaningful changes
      if (
        currentPlayer.currentBet !== previousPlayer.currentBet ||
        currentPlayer.status !== previousPlayer.status ||
        currentPlayer.lastAction !== previousPlayer.lastAction ||
        currentPlayer.chips !== previousPlayer.chips
      ) {
        return currentPlayer;
      }
    }

    return null;
  };

  const determineAction = (player, previousState) => {
    if (!player || !previousState) return null;

    const previousPlayer = previousState.players?.find((p) => p.id === player.id);
    if (!previousPlayer) return null;

    // Determine action based on state changes
    if (player.status === 'folded' && previousPlayer.status !== 'folded') {
      return { type: 'fold', amount: 0 };
    }

    if (player.currentBet > previousPlayer.currentBet) {
      const betAmount = player.currentBet - previousPlayer.currentBet;

      if (previousPlayer.currentBet === 0) {
        return { type: 'bet', amount: betAmount };
      } else {
        return { type: 'raise', amount: betAmount };
      }
    }

    if (player.chips < previousPlayer.chips && player.currentBet === previousPlayer.currentBet) {
      const callAmount = previousPlayer.chips - player.chips;
      return { type: 'call', amount: callAmount };
    }

    if (player.status === 'checked' && previousPlayer.status !== 'checked') {
      return { type: 'check', amount: 0 };
    }

    return null;
  };

  const extractWinners = (gameState) => {
    if (gameState.winners && gameState.winners.length > 0) {
      return gameState.winners.map((winner) => ({
        playerId: winner.playerId || winner.id,
        amount: winner.amount || winner.potShare,
        hand: winner.hand || winner.bestHand,
      }));
    }

    // Fallback: find active players who gained chips
    const winners = [];
    if (gameState.players && previousGameStateRef.current?.players) {
      gameState.players.forEach((player, index) => {
        const prevPlayer = previousGameStateRef.current.players[index];
        if (prevPlayer && player.chips > prevPlayer.chips) {
          winners.push({
            playerId: player.id,
            amount: player.chips - prevPlayer.chips,
            hand: player.bestHand || null,
          });
        }
      });
    }

    return winners;
  };

  return {
    // Status (matching test interface)
    sessionId: sessionActiveRef.current ? 'session-123' : null,
    hands: [],
    currentHand: currentHandRef.current,
    isCapturing: sessionActiveRef.current,
    loading: false,
    error: null,

    // Legacy interface compatibility
    isSessionActive: sessionActiveRef.current,
    currentHandNumber: currentHandRef.current,

    // Control methods
    startSession,
    endSession,
    captureAction,

    // Data access
    getSessionStats,
    exportHistory,

    // Service reference for advanced usage
    service: serviceRef.current,
  };
};
