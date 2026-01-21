import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { GAME_PHASES } from '../constants/game-constants';
import AIPlayer from '../game/engine/AIPlayer';
import GameEngine from '../game/engine/GameEngine';
import Player from '../game/entities/Player';

import useHandHistory from './useHandHistory';

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

  // Use ref to track processing state to avoid stale closure issues
  const isProcessingRef = useRef(false);
  const gameEngineRef = useRef(gameEngine);

  // Initialize hand history tracking
  const handHistory = useHandHistory();

  // Process a single AI turn and return whether to continue
  const processSingleAITurn = useCallback(() => {
    const engine = gameEngineRef.current;

    // Check game phase - don't process during waiting or showdown
    const currentGameState = engine.getGameState();
    if (currentGameState.phase === 'waiting' || currentGameState.phase === 'showdown') {
      return false;
    }

    const currentPlayer = engine.getCurrentPlayer();

    // Check if we should process this player
    if (!currentPlayer || !currentPlayer.isAI) {
      return false;
    }

    // Use canAct() method to check if player can act (not folded, not all-in, has chips)
    if (!currentPlayer.canAct()) {
      return false;
    }

    // Get valid actions for this AI
    const actions = engine.getValidActions(currentPlayer.id);

    // If no valid actions, player can't act
    if (!actions || actions.length === 0) {
      return false;
    }

    const aiAction = AIPlayer.getAction(currentPlayer, currentGameState, actions, engine);

    const result = engine.executePlayerAction(currentPlayer.id, aiAction.action, aiAction.amount);

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error('AI action failed:', result.error);
      return false;
    }

    // Check if game ended (e.g., everyone else folded)
    const updatedState = engine.getGameState();
    if (updatedState.phase === 'waiting' || updatedState.phase === 'showdown') {
      return false;
    }

    // Check if next player is also AI and can act
    const nextPlayer = engine.getCurrentPlayer();
    return nextPlayer && nextPlayer.isAI && nextPlayer.canAct();
  }, []);

  // Process all AI turns in sequence
  const processAITurns = useCallback(() => {
    // Strict guard - only one processing chain at a time
    if (isProcessingRef.current) {
      return;
    }

    const engine = gameEngineRef.current;

    // Check game phase - don't process during waiting or showdown
    const currentGameState = engine.getGameState();
    if (currentGameState.phase === 'waiting' || currentGameState.phase === 'showdown') {
      return;
    }

    const currentPlayer = engine.getCurrentPlayer();

    // Only start if it's actually an AI's turn and they can act
    if (!currentPlayer || !currentPlayer.isAI || !currentPlayer.canAct()) {
      return;
    }

    // Lock processing
    isProcessingRef.current = true;
    setIsProcessingAI(true);

    // Process AI turns with delays between each
    const processNext = () => {
      try {
        const shouldContinue = processSingleAITurn();

        if (shouldContinue) {
          // More AI to process - continue after delay
          setTimeout(processNext, 800);
        } else {
          // Done processing - unlock
          isProcessingRef.current = false;
          setIsProcessingAI(false);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('AI processing error:', err);
        setError(`AI action failed: ${err.message}`);
        isProcessingRef.current = false;
        setIsProcessingAI(false);
      }
    };

    // Start processing after initial delay
    setTimeout(processNext, 800);
  }, [processSingleAITurn]);

  // Initialize game with players
  const initializeGame = useCallback(() => {
    try {
      const engine = gameEngineRef.current;

      // Prevent multiple initializations
      if (engine._isInitialized) {
        return;
      }

      engine._isInitialized = true;

      // Add human player
      const humanPlayer = new Player(humanPlayerId, 'You', initialChips, 0, false);
      engine.addPlayer(humanPlayer);

      // Add AI players
      aiPlayers.forEach((aiConfig, idx) => {
        const aiPlayer = new Player(
          `ai-${idx + 1}`,
          aiConfig.name,
          initialChips,
          idx + 1,
          true,
          aiConfig.type
        );
        engine.addPlayer(aiPlayer);
      });

      engine.setBlinds(smallBlind, bigBlind);

      // Start first hand after a delay
      setTimeout(() => {
        try {
          setIsGameActive(true);
          engine.startNewHand();
        } catch (err) {
          setError(`Failed to start new hand: ${err.message}`);
          engine._isInitialized = false;
          setIsGameActive(false);
        }
      }, 1000);
    } catch (err) {
      setError(`Failed to initialize game: ${err.message}`);
      gameEngineRef.current._isInitialized = false;
    }
  }, [humanPlayerId, initialChips, smallBlind, bigBlind, aiPlayers]);

  // Initialize game callbacks
  useEffect(() => {
    const engine = gameEngineRef.current;

    // Prevent duplicate callback setup
    if (engine._callbacksInitialized) {
      return;
    }
    engine._callbacksInitialized = true;

    engine.setCallback('onStateChange', (newState) => {
      // Add timestamp to ensure React sees a new object reference
      const stateWithTimestamp = {
        ...newState,
        _updateTimestamp: Date.now(),
      };
      setGameState(stateWithTimestamp);
      setError(null);

      // Use getCurrentPlayer() from engine for most up-to-date info
      const currentPlayer = engine.getCurrentPlayer();
      if (currentPlayer && currentPlayer.id === humanPlayerId) {
        const actions = engine.getValidActions(humanPlayerId);
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

    engine.setCallback('onShowdown', (winners) => {
      setShowdown(true);
      setTimeout(() => setShowdown(false), 5000);

      if (onShowdown) {
        onShowdown(winners);
      }
    });

    engine.setCallback('onPhaseChange', (phase) => {
      if (phase !== GAME_PHASES.SHOWDOWN) {
        setShowdown(false);
      }

      if (onPhaseChange) {
        onPhaseChange(phase);
      }
    });

    engine.setCallback('onPlayerAction', (player, action, amount) => {
      // Capture action in hand history
      if (isGameActive && handHistory.isSessionActive) {
        handHistory.captureAction(player.id, action, amount);
      }

      if (onPlayerAction) {
        onPlayerAction(player, action, amount);
      }
    });

    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [humanPlayerId, initializeGame]);

  // Handle human player action
  const executeAction = useCallback(
    (action, amount) => {
      try {
        setError(null);
        const engine = gameEngineRef.current;
        const result = engine.executePlayerAction(humanPlayerId, action, amount);

        // Check if action succeeded
        if (!result.success) {
          setError(`Action failed: ${result.error}`);
          return;
        }

        // Reset processing flag to ensure fresh start for AI turns
        isProcessingRef.current = false;

        // Process AI turns after human action (with delay)
        // Using a longer delay to ensure state has propagated
        setTimeout(() => {
          // Double-check current player is AI before processing
          const currentPlayer = engine.getCurrentPlayer();
          if (currentPlayer && currentPlayer.isAI && currentPlayer.canAct()) {
            processAITurns();
          }
        }, 600);
      } catch (err) {
        setError(`Action failed: ${err.message}`);
      }
    },
    [humanPlayerId, processAITurns]
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

  // Auto-process AI turns when it's their turn (with debounce)
  useEffect(() => {
    if (!gameState) return;

    // Don't start if already processing
    if (isProcessingRef.current) {
      return;
    }

    // Skip if in waiting or showdown phase
    if (gameState.phase === 'waiting' || gameState.phase === 'showdown') {
      return;
    }

    const engine = gameEngineRef.current;
    const currentPlayer = engine.getCurrentPlayer();

    // If no current player, something is wrong - skip
    if (!currentPlayer) {
      return;
    }

    // Check if current player is AI and can act
    if (currentPlayer.isAI && currentPlayer.canAct()) {
      // Use timeout to debounce and prevent race conditions
      const timeoutId = setTimeout(() => {
        // Double-check conditions before processing
        if (!isProcessingRef.current) {
          const stillCurrentPlayer = engine.getCurrentPlayer();
          if (stillCurrentPlayer && stillCurrentPlayer.isAI && stillCurrentPlayer.canAct()) {
            processAITurns();
          }
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }

    // DEFENSIVE FIX: If current player can't act (all-in, folded, etc.),
    // trigger game advancement. This handles edge cases where the game engine
    // didn't properly advance past a non-acting player.
    // Check that canAct is a function (player might be serialized object in some cases)
    if (
      typeof currentPlayer.canAct === 'function' &&
      !currentPlayer.canAct() &&
      currentPlayer.isAI
    ) {
      const timeoutId = setTimeout(() => {
        // Force the game engine to advance to next player or phase
        const checkEngine = gameEngineRef.current;
        const checkPlayer = checkEngine.getCurrentPlayer();

        // Only trigger if still stuck on a non-acting player
        if (checkPlayer && !checkPlayer.canAct()) {
          // Call checkAndAdvanceGame to force game progression
          checkEngine.checkAndAdvanceGame();
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState, processAITurns]);

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
