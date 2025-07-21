import { useState, useEffect, useCallback, useMemo } from 'react';

import { GAME_PHASES, PLAYER_STATUS } from '../constants/game-constants';
import AIPlayer from '../game/engine/AIPlayer';
import GameEngine from '../game/engine/GameEngine';
import Player from '../game/entities/Player';

import { useHandHistory } from './useHandHistory';

/**
 * Custom hook for managing poker game state and logic
 * @param {string} humanPlayerId - ID of the human player
 * @param {Object} options - Configuration options
 * @returns {Object} Game state and control functions
 */
const usePokerGame = (humanPlayerId, options = {}) => {
  const {
    initialChips = 10000,
    smallBlind = 50,
    bigBlind = 100,
    aiPlayers = [
      { name: 'Alex (TAG)', type: 'tight-aggressive' },
      { name: 'Sarah (LAG)', type: 'loose-aggressive' },
      { name: 'Mike (TP)', type: 'tight-passive' },
      { name: 'Lisa (LP)', type: 'loose-passive' },
      { name: 'John (TAG)', type: 'tight-aggressive' },
    ],
    onStateChange,
    onShowdown,
    onPhaseChange,
    onPlayerAction,
  } = options;

  const [gameEngine] = useState(() => new GameEngine());
  const [gameState, setGameState] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [validActions, setValidActions] = useState([]);
  const [showdown, setShowdown] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [error, setError] = useState(null);
  const [isGameActive, setIsGameActive] = useState(false);

  // Initialize hand history tracking
  const handHistory = useHandHistory(gameState, isGameActive);

  // Initialize game with players
  const initializeGame = useCallback(() => {
    try {
      // Prevent multiple initializations
      if (gameEngine._isInitialized) {
        return;
      }

      gameEngine._isInitialized = true;

      // Add human player
      const humanPlayer = new Player(humanPlayerId, 'You', initialChips, 0, false);
      gameEngine.addPlayer(humanPlayer);

      // Add AI players
      aiPlayers.forEach((aiConfig, _index) => {
        const aiPlayer = new Player(
          `ai-${_index + 1}`,
          aiConfig.name,
          initialChips,
          _index + 1,
          true,
          aiConfig.type
        );
        gameEngine.addPlayer(aiPlayer);
      });

      gameEngine.setBlinds(smallBlind, bigBlind);

      // Start first hand after a delay
      setTimeout(() => {
        try {
          setIsGameActive(true);
          gameEngine.startNewHand();
        } catch (err) {
          setError(`Failed to start new hand: ${err.message}`);
          gameEngine._isInitialized = false; // Reset on error
          setIsGameActive(false);
        }
      }, 1000);
    } catch (err) {
      setError(`Failed to initialize game: ${err.message}`);
      gameEngine._isInitialized = false; // Reset on error
    }
  }, [gameEngine, humanPlayerId, initialChips, smallBlind, bigBlind, aiPlayers]);

  // Initialize game callbacks
  useEffect(() => {
    // Prevent duplicate callback setup
    if (gameEngine._callbacksInitialized) {
      return;
    }
    gameEngine._callbacksInitialized = true;

    gameEngine.setCallback('onStateChange', (newState) => {
      setGameState(newState);
      setError(null);

      // Use getCurrentPlayer() from engine for most up-to-date info
      const currentPlayer = gameEngine.getCurrentPlayer();
      if (currentPlayer && currentPlayer.id === humanPlayerId) {
        const actions = gameEngine.getValidActions(humanPlayerId);
        setValidActions(actions);
        setShowControls(true);
      } else {
        setShowControls(false);
        setValidActions([]);
      }

      if (onStateChange) {
        onStateChange(newState);
      }
    });

    gameEngine.setCallback('onShowdown', (winners) => {
      setShowdown(true);
      setTimeout(() => setShowdown(false), 5000);

      if (onShowdown) {
        onShowdown(winners);
      }
    });

    gameEngine.setCallback('onPhaseChange', (phase) => {
      if (phase !== GAME_PHASES.SHOWDOWN) {
        setShowdown(false);
      }

      if (onPhaseChange) {
        onPhaseChange(phase);
      }
    });

    gameEngine.setCallback('onPlayerAction', (player, _action, amount) => {
      // Capture action in hand history
      if (isGameActive && handHistory.isSessionActive) {
        handHistory.captureAction(player.id, _action, amount);
      }

      if (onPlayerAction) {
        onPlayerAction(player, _action, amount);
      }
    });

    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameEngine, humanPlayerId, initializeGame]);

  // Process AI turns
  const processAITurns = useCallback(async () => {
    if (isProcessingAI) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    if (!currentPlayer || !currentPlayer.isAI) return;

    // Skip if player is ALL_IN - they cannot act
    if (currentPlayer.status === PLAYER_STATUS.ALL_IN) {
      return;
    }

    setIsProcessingAI(true);

    try {
      // Add delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use current game state from engine, not React state (which might be stale)
      const currentGameState = gameEngine.getGameState();
      const validActions = gameEngine.getValidActions(currentPlayer.id);

      const aiAction = AIPlayer.getAction(
        currentPlayer,
        currentGameState,
        validActions,
        gameEngine
      );

      gameEngine.executePlayerAction(currentPlayer.id, aiAction._action, aiAction.amount);

      // Continue processing if next player is also AI (with recursion limit)
      const nextPlayer = gameEngine.getCurrentPlayer();
      if (nextPlayer && nextPlayer.isAI && nextPlayer.status !== PLAYER_STATUS.ALL_IN) {
        // Use setTimeout to prevent stack overflow
        setTimeout(() => processAITurns(), 500);
      }
    } catch (err) {
      setError(`AI _action failed: ${err.message}`);
    } finally {
      setIsProcessingAI(false);
    }
  }, [gameEngine, isProcessingAI]);

  // Handle human player action
  const executeAction = useCallback(
    async (_action, amount) => {
      try {
        setError(null);
        gameEngine.executePlayerAction(humanPlayerId, _action, amount);

        // Process AI turns after human _action
        await processAITurns();
      } catch (err) {
        setError(`Action failed: ${err.message}`);
      }
    },
    [gameEngine, humanPlayerId, processAITurns]
  );

  // Get current player info (memoized for performance)
  const getCurrentPlayerInfo = useMemo(() => {
    if (!gameState || !gameState.players || gameState.players.length === 0) {
      return { humanPlayer: null, currentPlayer: null, isHumanTurn: false };
    }

    const humanPlayer = gameState.players.find((p) => p && p.id === humanPlayerId);

    // Safe player access with bounds checking
    const currentPlayer =
      gameState.currentPlayerIndex >= 0 && gameState.currentPlayerIndex < gameState.players.length
        ? gameState.players[gameState.currentPlayerIndex]
        : null;

    const isHumanTurn = currentPlayer && humanPlayer && currentPlayer.id === humanPlayer.id;

    return {
      humanPlayer,
      currentPlayer,
      isHumanTurn,
    };
  }, [gameState, humanPlayerId]);

  // Auto-process AI turns when it's their turn
  useEffect(() => {
    if (!gameState) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    if (currentPlayer && currentPlayer.isAI && !isProcessingAI) {
      processAITurns();
    }
  }, [gameState, gameEngine, processAITurns, isProcessingAI]);

  return {
    // State
    gameState,
    showControls,
    validActions,
    showdown,
    isProcessingAI,
    error,
    isGameActive,

    // Functions
    executeAction,
    getCurrentPlayerInfo,

    // Engine reference (for advanced features)
    gameEngine,

    // Human player ID
    humanPlayerId,

    // Hand history
    handHistory,
  };
};

export default usePokerGame;
