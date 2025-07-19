/**
 * GameEngine Test Suite
 * Comprehensive tests for all poker game flow scenarios
 */

import GameEngine from '../services/GameEngine';
import TestDataFactory from '../../../../test-utils/TestDataFactory';
import { GAME_PHASES, PLAYER_STATUS } from '../../../../constants/game-constants';

describe('GameEngine', () => {
  let gameEngine;
  let players;

  beforeEach(() => {
    gameEngine = new GameEngine();
    players = [
      TestDataFactory.createPlayer({
        id: 'player1',
        name: 'Human Player',
        isAI: false,
        position: 0,
      }),
      TestDataFactory.createPlayer({
        id: 'player2',
        name: 'AI Player 1',
        isAI: true,
        position: 1,
      }),
      TestDataFactory.createPlayer({
        id: 'player3',
        name: 'AI Player 2',
        isAI: true,
        position: 2,
      }),
    ];

    // Add players to game
    players.forEach((player) => gameEngine.addPlayer(player));
    gameEngine.setBlinds(50, 100);
  });

  describe('Initialization', () => {
    test('should initialize with correct default state', () => {
      const newEngine = new GameEngine();

      expect(newEngine.gameState).toBeDefined();
      expect(newEngine.deck).toBeDefined();
      expect(newEngine.callbacks).toEqual({
        onStateChange: null,
        onHandComplete: null,
        onPlayerAction: null,
        onPhaseChange: null,
        onShowdown: null,
      });
    });

    test('should set callbacks correctly', () => {
      const mockCallback = jest.fn();
      gameEngine.setCallback('onStateChange', mockCallback);

      expect(gameEngine.callbacks.onStateChange).toBe(mockCallback);
    });

    test('should ignore invalid callback events', () => {
      const mockCallback = jest.fn();
      gameEngine.setCallback('invalidEvent', mockCallback);

      expect(gameEngine.callbacks.invalidEvent).toBeUndefined();
    });
  });

  describe('Player Management', () => {
    test('should add players correctly', () => {
      const newEngine = new GameEngine();
      const player = TestDataFactory.createPlayer({ id: 'test-player' });

      newEngine.addPlayer(player);

      expect(newEngine.gameState.players).toHaveLength(1);
      expect(newEngine.gameState.players[0].id).toBe('test-player');
    });

    test('should remove players correctly', () => {
      expect(gameEngine.gameState.players).toHaveLength(3);

      gameEngine.removePlayer('player2');

      expect(gameEngine.gameState.players).toHaveLength(2);
      expect(gameEngine.gameState.players.find((p) => p.id === 'player2')).toBeUndefined();
    });

    test('should notify state change after player operations', () => {
      const mockCallback = jest.fn();
      gameEngine.setCallback('onStateChange', mockCallback);

      const player = TestDataFactory.createPlayer({ id: 'new-player' });
      gameEngine.addPlayer(player);

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Hand Flow Management', () => {
    test('should start new hand successfully with sufficient players', () => {
      expect(() => {
        gameEngine.startNewHand();
      }).not.toThrow();

      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.PREFLOP);
      expect(gameEngine.gameState.handNumber).toBeGreaterThan(0);
    });

    test('should throw error when starting hand with insufficient players', () => {
      const newEngine = new GameEngine();
      const singlePlayer = TestDataFactory.createPlayer({ id: 'lonely-player' });
      newEngine.addPlayer(singlePlayer);

      expect(() => {
        newEngine.startNewHand();
      }).toThrow('Need at least 2 players to start a hand');
    });

    test('should prevent multiple simultaneous hand starts', () => {
      gameEngine._isRestarting = true;

      // Should not throw or change state
      gameEngine.startNewHand();
      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.WAITING);
    });

    test('should post blinds correctly', () => {
      gameEngine.startNewHand();

      // Check that blinds were posted
      const gameState = gameEngine.getGameState();
      expect(gameState._pot).toBeGreaterThan(0);

      // Find players who posted blinds
      const playerWithBlind = gameState.players.find((p) => p.currentBet > 0);
      expect(playerWithBlind).toBeDefined();
    });

    test('should deal hole cards to all active players', () => {
      gameEngine.startNewHand();

      const gameState = gameEngine.getGameState();
      gameState.players.forEach((player) => {
        if (player.status === PLAYER_STATUS.ACTIVE) {
          if (player.isAI) {
            // AI players have null holeCards in serialized state
            expect(player.holeCards).toBeNull();
            expect(player.hasCards).toBe(true);
          } else {
            expect(player.holeCards).toHaveLength(2);
          }
        }
      });
    });
  });

  describe('Game Phases', () => {
    beforeEach(() => {
      gameEngine.startNewHand();
    });

    test('should progress through all phases correctly', () => {
      const mockPhaseCallback = jest.fn();
      gameEngine.setCallback('onPhaseChange', mockPhaseCallback);

      // Start in preflop
      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.PREFLOP);

      // Manually complete the betting round by setting all players as having acted
      // and matching the current bet to avoid infinite loops
      gameEngine.gameState.players.forEach((player) => {
        if (player.status === PLAYER_STATUS.ACTIVE) {
          player.currentBet = gameEngine.gameState.currentBet;
          player.lastAction = 'call';
        }
      });

      // Now advance the game
      gameEngine.checkAndAdvanceGame();

      // Should have advanced phase
      expect(mockPhaseCallback).toHaveBeenCalled();
      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.FLOP);
    });

    test('should deal community cards for each phase', () => {
      // Mock advancing to flop
      gameEngine.gameState.phase = GAME_PHASES.FLOP;
      gameEngine.dealCommunityCards(3);

      expect(gameEngine.gameState.communityCards).toHaveLength(3);

      // Mock advancing to turn
      gameEngine.gameState.phase = GAME_PHASES.TURN;
      gameEngine.dealCommunityCards(1);

      expect(gameEngine.gameState.communityCards).toHaveLength(4);

      // Mock advancing to river
      gameEngine.gameState.phase = GAME_PHASES.RIVER;
      gameEngine.dealCommunityCards(1);

      expect(gameEngine.gameState.communityCards).toHaveLength(5);
    });

    test('should reset betting round when advancing phases', () => {
      gameEngine.gameState.currentBet = 200;
      gameEngine.gameState.minimumRaise = 100;

      gameEngine.resetBettingRound();

      expect(gameEngine.gameState.currentBet).toBe(0);
      expect(gameEngine.gameState.minimumRaise).toBe(gameEngine.gameState.blinds.big);
    });
  });

  describe('Player Actions', () => {
    beforeEach(() => {
      gameEngine.startNewHand();
    });

    test('should execute fold action correctly', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      const mockCallback = jest.fn();
      gameEngine.setCallback('onPlayerAction', mockCallback);

      gameEngine.executePlayerAction(currentPlayer.id, 'fold', 0);

      expect(currentPlayer.status).toBe(PLAYER_STATUS.FOLDED);
      expect(mockCallback).toHaveBeenCalledWith(currentPlayer, 'fold', 0);
    });

    test('should execute call action correctly', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      const initialGameState = gameEngine.getGameState();
      const callAmount = initialGameState.currentBet - currentPlayer.currentBet;
      const initialChips = currentPlayer.chips;

      gameEngine.executePlayerAction(currentPlayer.id, 'call', callAmount);

      // Get updated game state and find the player
      const updatedGameState = gameEngine.getGameState();
      const updatedPlayer = updatedGameState.players.find((p) => p.id === currentPlayer.id);

      expect(updatedPlayer.chips).toBe(initialChips - callAmount);
      expect(updatedPlayer.currentBet).toBe(initialGameState.currentBet);
    });

    test('should execute raise action correctly', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      const initialGameState = gameEngine.getGameState();
      const raiseAmount = initialGameState.currentBet + initialGameState.minimumRaise;
      const initialChips = currentPlayer.chips;
      const initialPot = initialGameState._pot;

      gameEngine.executePlayerAction(currentPlayer.id, 'raise', raiseAmount);

      // Get updated game state and find the player
      const updatedGameState = gameEngine.getGameState();
      const updatedPlayer = updatedGameState.players.find((p) => p.id === currentPlayer.id);

      expect(updatedPlayer.chips).toBe(initialChips - raiseAmount);
      expect(updatedGameState.currentBet).toBe(raiseAmount);
      expect(updatedGameState._pot).toBeGreaterThan(initialPot);
    });

    test('should execute bet action correctly', () => {
      // Set up scenario where betting is possible (no current bet)
      gameEngine.gameState.currentBet = 0;
      const currentPlayer = gameEngine.getCurrentPlayer();
      const betAmount = 100;
      const initialChips = currentPlayer.chips;

      gameEngine.executePlayerAction(currentPlayer.id, 'bet', betAmount);

      // Get updated game state and find the player
      const updatedGameState = gameEngine.getGameState();
      const updatedPlayer = updatedGameState.players.find((p) => p.id === currentPlayer.id);

      expect(updatedPlayer.chips).toBe(initialChips - betAmount);
      expect(updatedGameState.currentBet).toBe(betAmount);
    });

    test('should execute check action correctly', () => {
      // Set up scenario where checking is possible
      gameEngine.gameState.currentBet = 0;
      const currentPlayer = gameEngine.getCurrentPlayer();
      currentPlayer.currentBet = 0;

      const initialChips = currentPlayer.chips;

      gameEngine.executePlayerAction(currentPlayer.id, 'check', 0);

      expect(currentPlayer.chips).toBe(initialChips);
      expect(currentPlayer.currentBet).toBe(0);
    });

    test('should handle all-in action correctly', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      const allInAmount = currentPlayer.chips;

      gameEngine.executePlayerAction(currentPlayer.id, 'all-in', allInAmount);

      // Get updated game state and find the player
      const updatedGameState = gameEngine.getGameState();
      const updatedPlayer = updatedGameState.players.find((p) => p.id === currentPlayer.id);

      expect(updatedPlayer.chips).toBe(0);
      expect(updatedPlayer.status).toBe(PLAYER_STATUS.ALL_IN);
    });

    test('should throw error for invalid player action', () => {
      expect(() => {
        gameEngine.executePlayerAction('invalid-player', 'fold', 0);
      }).toThrow();
    });
  });

  describe('Valid Actions', () => {
    beforeEach(() => {
      gameEngine.startNewHand();
    });

    test('should return correct valid actions for current player', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      const validActions = gameEngine.getValidActions(currentPlayer.id);

      expect(Array.isArray(validActions)).toBe(true);
      expect(validActions.length).toBeGreaterThan(0);
      expect(validActions).toContain('fold');
    });

    test('should return empty array for non-current player', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      const otherPlayer = gameEngine.gameState.players.find((p) => p.id !== currentPlayer.id);

      const validActions = gameEngine.getValidActions(otherPlayer.id);

      expect(validActions).toEqual([]);
    });

    test('should return empty array for folded player', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      currentPlayer.status = PLAYER_STATUS.FOLDED;

      const validActions = gameEngine.getValidActions(currentPlayer.id);

      expect(validActions).toEqual([]);
    });
  });

  describe('Showdown Logic', () => {
    test('should handle showdown with multiple players correctly', () => {
      gameEngine.startNewHand();

      // Mock scenario where multiple players reach showdown
      gameEngine.gameState.phase = GAME_PHASES.SHOWDOWN;
      gameEngine.gameState.communityCards = TestDataFactory.createCommunityCards().royalFlush();

      // Set up players for showdown
      const activePlayers = gameEngine.gameState.getActivePlayers();
      activePlayers.forEach((player) => {
        player.holeCards = TestDataFactory.createHoleCards().pocketAces();
      });

      const mockShowdownCallback = jest.fn();
      gameEngine.setCallback('onShowdown', mockShowdownCallback);

      gameEngine.handleShowdown();

      expect(mockShowdownCallback).toHaveBeenCalled();
    });

    test('should handle single player win correctly', () => {
      gameEngine.startNewHand();

      // Fold all players except one
      const players = gameEngine.gameState.players;
      players[1].status = PLAYER_STATUS.FOLDED;
      players[2].status = PLAYER_STATUS.FOLDED;

      const mockCallback = jest.fn();
      gameEngine.setCallback('onHandComplete', mockCallback);

      gameEngine.handleSinglePlayerWin();

      // Phase should be waiting after hand completes
      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.WAITING);
      expect(mockCallback).toHaveBeenCalled();
      expect(gameEngine.gameState.winners).toHaveLength(1);
      expect(gameEngine.gameState.winners[0].handDescription).toBe(
        'Won by default (others folded)'
      );
    });
  });

  describe('Game State Management', () => {
    test('should return current game state', () => {
      const state = gameEngine.getGameState();

      // getGameState returns serialized data, not raw gameState object
      expect(state).not.toBe(gameEngine.gameState);
      expect(state.players).toBeDefined();
      expect(state.phase).toBeDefined();
      expect(typeof state).toBe('object');
    });

    test('should notify state changes correctly', () => {
      const mockCallback = jest.fn();
      gameEngine.setCallback('onStateChange', mockCallback);

      gameEngine.notifyStateChange();

      expect(mockCallback).toHaveBeenCalledWith(gameEngine.getGameState());
    });

    test('should notify phase changes correctly', () => {
      const mockCallback = jest.fn();
      gameEngine.setCallback('onPhaseChange', mockCallback);

      gameEngine.notifyPhaseChange();

      expect(mockCallback).toHaveBeenCalledWith(gameEngine.gameState.phase);
    });
  });

  describe('Card Management', () => {
    beforeEach(() => {
      gameEngine.startNewHand();
    });

    test('should get player cards correctly', () => {
      const player = gameEngine.gameState.players[0];
      const cards = gameEngine.getPlayerCards(player.id);

      expect(cards).toEqual(player.holeCards);
    });

    test('should return empty array for invalid player', () => {
      const cards = gameEngine.getPlayerCards('invalid-player');

      expect(cards).toEqual([]);
    });

    test('should get all player cards correctly', () => {
      const allCards = gameEngine.getAllPlayerCards();

      expect(typeof allCards).toBe('object');
      expect(Object.keys(allCards)).toHaveLength(gameEngine.gameState.players.length);
    });

    test('should get community cards correctly', () => {
      const communityCards = gameEngine.getCommunityCards();

      expect(communityCards).toEqual(gameEngine.gameState.communityCards);
    });
  });

  describe('Blinds Management', () => {
    test('should set blinds correctly', () => {
      gameEngine.setBlinds(25, 50);

      expect(gameEngine.gameState.blinds.small).toBe(25);
      expect(gameEngine.gameState.blinds.big).toBe(50);
    });

    test('should post blinds in correct order', () => {
      gameEngine.startNewHand();

      // Verify blinds were posted
      const gameState = gameEngine.getGameState();
      expect(gameState._pot).toBe(150); // 50 + 100 blinds
    });
  });

  describe('Current Player Management', () => {
    beforeEach(() => {
      gameEngine.startNewHand();
    });

    test('should get current player correctly', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();

      expect(currentPlayer).toBeDefined();
      expect(currentPlayer.status).toBe(PLAYER_STATUS.ACTIVE);
    });

    test('should move to next player correctly', () => {
      const initialPlayer = gameEngine.getCurrentPlayer();

      gameEngine.moveToNextPlayer();

      const newPlayer = gameEngine.getCurrentPlayer();
      expect(newPlayer.id).not.toBe(initialPlayer.id);
    });

    test('should skip folded players when moving to next', () => {
      const currentIndex = gameEngine.gameState.currentPlayerIndex;
      const nextIndex = (currentIndex + 1) % gameEngine.gameState.players.length;

      // Fold the next player
      gameEngine.gameState.players[nextIndex].status = PLAYER_STATUS.FOLDED;

      gameEngine.moveToNextPlayer();

      const currentPlayer = gameEngine.getCurrentPlayer();
      expect(currentPlayer.status).toBe(PLAYER_STATUS.ACTIVE);
    });
  });

  describe('Pot Odds Calculation', () => {
    beforeEach(() => {
      gameEngine.startNewHand();
    });

    test('should calculate pot odds correctly', () => {
      const player = gameEngine.gameState.players[0];
      gameEngine.gameState.pot = 300;
      gameEngine.gameState.currentBet = 100;
      player.currentBet = 0;

      const potOdds = gameEngine.getPotOdds(player.id);

      expect(potOdds).toBeCloseTo(25, 1); // 100/(300+100) = 0.25 = 25%
    });

    test('should return 0 for invalid player', () => {
      const potOdds = gameEngine.getPotOdds('invalid-player');

      expect(potOdds).toBe(0);
    });

    test('should handle edge case with no call amount', () => {
      const player = gameEngine.gameState.players[0];
      gameEngine.gameState.currentBet = 0;
      player.currentBet = 0;

      const potOdds = gameEngine.getPotOdds(player.id);

      expect(potOdds).toBe(100);
    });
  });

  describe('Game Advancement Logic', () => {
    beforeEach(() => {
      gameEngine.startNewHand();
    });

    test('should check and advance game correctly', () => {
      const mockPhaseCallback = jest.fn();
      gameEngine.setCallback('onPhaseChange', mockPhaseCallback);

      // Mock a scenario where betting round is complete
      // All players need to have acted and matched the current bet
      gameEngine.gameState.players.forEach((player) => {
        if (player.status === PLAYER_STATUS.ACTIVE) {
          player.currentBet = gameEngine.gameState.currentBet;
          player.lastAction = 'call'; // All players have acted
        }
      });

      gameEngine.checkAndAdvanceGame();

      // Should advance to next phase or complete hand
      expect(mockPhaseCallback).toHaveBeenCalled();
    });

    test('should complete hand when reaching final phase', () => {
      gameEngine.gameState.phase = GAME_PHASES.SHOWDOWN;

      const mockCompleteCallback = jest.fn();
      gameEngine.setCallback('onHandComplete', mockCompleteCallback);

      gameEngine.completeHand();

      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.WAITING);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid action gracefully', () => {
      gameEngine.startNewHand();
      const currentPlayer = gameEngine.getCurrentPlayer();

      expect(() => {
        gameEngine.executePlayerAction(currentPlayer.id, 'invalid-action', 0);
      }).toThrow();
    });

    test('should prevent actions from non-current player', () => {
      gameEngine.startNewHand();
      const currentPlayer = gameEngine.getCurrentPlayer();
      const otherPlayer = gameEngine.gameState.players.find((p) => p.id !== currentPlayer.id);

      expect(() => {
        gameEngine.executePlayerAction(otherPlayer.id, 'fold', 0);
      }).toThrow();
    });

    test('should handle insufficient chips gracefully', () => {
      gameEngine.startNewHand();
      const currentPlayer = gameEngine.getCurrentPlayer();
      currentPlayer.chips = 10; // Very low chips

      const raiseAmount = 1000; // More than player has

      expect(() => {
        gameEngine.executePlayerAction(currentPlayer.id, 'raise', raiseAmount);
      }).toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete hand flow from start to finish', async () => {
      const mockCallbacks = {
        onStateChange: jest.fn(),
        onPhaseChange: jest.fn(),
        onShowdown: jest.fn(),
        onHandComplete: jest.fn(),
      };

      Object.keys(mockCallbacks).forEach((event) => {
        gameEngine.setCallback(event, mockCallbacks[event]);
      });

      // Start hand
      gameEngine.startNewHand();
      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.PREFLOP);

      // All players fold except one
      const players = gameEngine.gameState.getActivePlayers();
      for (let i = 1; i < players.length; i++) {
        if (gameEngine.getCurrentPlayer()?.id === players[i].id) {
          gameEngine.executePlayerAction(players[i].id, 'fold', 0);
        }
      }

      // Verify callbacks were called
      expect(mockCallbacks.onStateChange).toHaveBeenCalled();
    });

    test('should handle all-in scenarios correctly', () => {
      gameEngine.startNewHand();

      const currentPlayer = gameEngine.getCurrentPlayer();
      const allInAmount = currentPlayer.chips;

      gameEngine.executePlayerAction(currentPlayer.id, 'all-in', allInAmount);

      expect(currentPlayer.status).toBe(PLAYER_STATUS.ALL_IN);
      expect(currentPlayer.chips).toBe(0);
    });

    test('should handle multiple all-ins creating side pots', () => {
      gameEngine.startNewHand();

      // Set different chip amounts
      gameEngine.gameState.players[0].chips = 100;
      gameEngine.gameState.players[1].chips = 200;
      gameEngine.gameState.players[2].chips = 300;

      // First player goes all-in
      const firstPlayer = gameEngine.getCurrentPlayer();
      gameEngine.executePlayerAction(firstPlayer.id, 'all-in', firstPlayer.chips);

      expect(firstPlayer.status).toBe(PLAYER_STATUS.ALL_IN);
    });
  });
});
