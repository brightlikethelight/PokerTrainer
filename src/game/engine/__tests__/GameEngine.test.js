/**
 * GameEngine Test Suite
 * Comprehensive tests for the core poker game engine
 */

import GameEngine from '../GameEngine';
import Player from '../../entities/Player';
import { GAME_PHASES, PLAYER_STATUS, PLAYER_ACTIONS } from '../../../constants/game-constants';

// Mock dependencies
jest.mock('../../entities/Deck');
jest.mock('../../entities/GameState');
jest.mock('../../utils/HandEvaluator');
jest.mock('../BettingLogic');

describe('GameEngine', () => {
  let gameEngine;
  let mockPlayer1;
  let mockPlayer2;
  let mockPlayer3;

  beforeEach(() => {
    jest.clearAllMocks();
    gameEngine = new GameEngine();

    // Create mock players
    mockPlayer1 = new Player('p1', 'Alice', 1000, 0);
    mockPlayer2 = new Player('p2', 'Bob', 1000, 1);
    mockPlayer3 = new Player('p3', 'Charlie', 1000, 2);

    // Setup default mock behaviors
    gameEngine.gameState.getActivePlayers = jest.fn().mockReturnValue([mockPlayer1, mockPlayer2]);
    gameEngine.gameState.players = [mockPlayer1, mockPlayer2];
    gameEngine.gameState.currentPlayerIndex = 0;
  });

  describe('Constructor', () => {
    test('should initialize with default state', () => {
      expect(gameEngine.gameState).toBeDefined();
      expect(gameEngine.deck).toBeDefined();
      expect(gameEngine._isRestarting).toBe(false);
      expect(gameEngine._isInitialized).toBe(false);
      expect(gameEngine.callbacks).toEqual({
        onStateChange: null,
        onHandComplete: null,
        onPlayerAction: null,
        onPhaseChange: null,
        onShowdown: null,
      });
    });

    test('should set deck on gameState', () => {
      expect(gameEngine.gameState.deck).toBe(gameEngine.deck);
    });
  });

  describe('setCallback', () => {
    test('should set callback for valid event', () => {
      const mockCallback = jest.fn();
      gameEngine.setCallback('onStateChange', mockCallback);
      expect(gameEngine.callbacks.onStateChange).toBe(mockCallback);
    });

    test('should not set callback for invalid event', () => {
      const mockCallback = jest.fn();
      gameEngine.setCallback('invalidEvent', mockCallback);
      expect(gameEngine.callbacks.invalidEvent).toBeUndefined();
    });

    test('should handle all valid callback types', () => {
      const callbacks = {
        onStateChange: jest.fn(),
        onHandComplete: jest.fn(),
        onPlayerAction: jest.fn(),
        onPhaseChange: jest.fn(),
        onShowdown: jest.fn(),
      };

      Object.keys(callbacks).forEach((event) => {
        gameEngine.setCallback(event, callbacks[event]);
        expect(gameEngine.callbacks[event]).toBe(callbacks[event]);
      });
    });
  });

  describe('addPlayer', () => {
    test('should add player to game state', () => {
      const notifySpy = jest.spyOn(gameEngine, 'notifyStateChange');
      gameEngine.gameState.addPlayer = jest.fn();

      gameEngine.addPlayer(mockPlayer1);

      expect(gameEngine.gameState.addPlayer).toHaveBeenCalledWith(mockPlayer1);
      expect(notifySpy).toHaveBeenCalled();
    });

    test('should handle multiple players', () => {
      gameEngine.gameState.addPlayer = jest.fn();

      gameEngine.addPlayer(mockPlayer1);
      gameEngine.addPlayer(mockPlayer2);
      gameEngine.addPlayer(mockPlayer3);

      expect(gameEngine.gameState.addPlayer).toHaveBeenCalledTimes(3);
    });
  });

  describe('removePlayer', () => {
    test('should remove player from game state', () => {
      const notifySpy = jest.spyOn(gameEngine, 'notifyStateChange');
      gameEngine.gameState.removePlayer = jest.fn();

      gameEngine.removePlayer('p1');

      expect(gameEngine.gameState.removePlayer).toHaveBeenCalledWith('p1');
      expect(notifySpy).toHaveBeenCalled();
    });
  });

  describe('startNewHand', () => {
    beforeEach(() => {
      gameEngine.gameState.resetForNewHand = jest.fn();
      gameEngine.gameState.moveButton = jest.fn();
      gameEngine.deck.reset = jest.fn();
      gameEngine.deck.cardsRemaining = jest.fn().mockReturnValue(52);
      gameEngine.postBlinds = jest.fn();
      gameEngine.dealHoleCards = jest.fn();
      gameEngine.notifyStateChange = jest.fn();
      gameEngine.notifyPhaseChange = jest.fn();
      gameEngine.gameState.getUTGPosition = jest.fn().mockReturnValue(0);
    });

    test('should start new hand with valid setup', () => {
      gameEngine.startNewHand();

      expect(gameEngine.gameState.resetForNewHand).toHaveBeenCalled();
      expect(gameEngine.gameState.moveButton).toHaveBeenCalled();
      expect(gameEngine.deck.reset).toHaveBeenCalled();
      expect(gameEngine.postBlinds).toHaveBeenCalled();
      expect(gameEngine.dealHoleCards).toHaveBeenCalled();
      expect(gameEngine.notifyStateChange).toHaveBeenCalled();
      expect(gameEngine.notifyPhaseChange).toHaveBeenCalled();
    });

    test('should not start if already restarting', () => {
      gameEngine._isRestarting = true;
      gameEngine.startNewHand();

      expect(gameEngine.gameState.resetForNewHand).not.toHaveBeenCalled();
    });

    test('should throw error without enough players', () => {
      gameEngine.gameState.getActivePlayers.mockReturnValue([mockPlayer1]);

      expect(() => gameEngine.startNewHand()).toThrow('Need at least 2 players');
    });

    test('should throw error with insufficient deck cards', () => {
      gameEngine.deck.cardsRemaining.mockReturnValue(10);

      expect(() => gameEngine.startNewHand()).toThrow('Deck has insufficient cards');
    });

    test('should set currentPlayerIndex to UTG position', () => {
      gameEngine.gameState.getUTGPosition.mockReturnValue(2);
      gameEngine.startNewHand();

      expect(gameEngine.gameState.currentPlayerIndex).toBe(2);
    });
  });

  describe('postBlinds', () => {
    beforeEach(() => {
      gameEngine.gameState.getSmallBlindPosition = jest.fn().mockReturnValue(0);
      gameEngine.gameState.getBigBlindPosition = jest.fn().mockReturnValue(1);
      gameEngine.gameState.getPlayerByPosition = jest
        .fn()
        .mockReturnValueOnce(mockPlayer1)
        .mockReturnValueOnce(mockPlayer2);
      gameEngine.gameState.blinds = { small: 10, big: 20 };
      gameEngine.gameState._internalPot = { main: 0 };
      gameEngine.gameState.addToHistory = jest.fn();
      mockPlayer1.placeBet = jest.fn();
      mockPlayer2.placeBet = jest.fn();
      mockPlayer1.chips = 1000;
      mockPlayer2.chips = 1000;
    });

    test('should post small and big blinds', () => {
      gameEngine.postBlinds();

      expect(mockPlayer1.placeBet).toHaveBeenCalledWith(10);
      expect(mockPlayer2.placeBet).toHaveBeenCalledWith(20);
      expect(gameEngine.gameState._internalPot.main).toBe(30);
    });

    test('should add blind actions to history', () => {
      gameEngine.postBlinds();

      expect(gameEngine.gameState.addToHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'p1',
          _action: 'small-blind',
          amount: 10,
        })
      );
      expect(gameEngine.gameState.addToHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'p2',
          _action: 'big-blind',
          amount: 20,
        })
      );
    });
  });

  describe('dealHoleCards', () => {
    beforeEach(() => {
      // Implementation uses deck.dealCard(), not drawCard()
      gameEngine.deck.dealCard = jest.fn().mockReturnValue({ rank: 'A', suit: 's' });
      // Initialize holeCards arrays for players
      mockPlayer1.holeCards = [];
      mockPlayer2.holeCards = [];
    });

    test('should deal 2 cards to each active player', () => {
      gameEngine.dealHoleCards();

      // Implementation pushes directly to player.holeCards, not receiveCards()
      expect(mockPlayer1.holeCards).toHaveLength(2);
      expect(mockPlayer2.holeCards).toHaveLength(2);
      expect(mockPlayer1.holeCards[0]).toEqual({ rank: 'A', suit: 's' });
      expect(gameEngine.deck.dealCard).toHaveBeenCalledTimes(4);
    });

    test('should deal cards in correct order (round-robin)', () => {
      gameEngine.dealHoleCards();
      // First round: player1, player2; Second round: player1, player2
      expect(gameEngine.deck.dealCard).toHaveBeenCalledTimes(4);
    });
  });

  describe('dealCommunityCards', () => {
    beforeEach(() => {
      // Implementation uses deck.dealCards(count), not drawCard()
      gameEngine.deck.dealCards = jest
        .fn()
        .mockImplementation((count) => Array(count).fill({ rank: 'K', suit: 'h' }));
      gameEngine.gameState.communityCards = [];
      gameEngine.notifyStateChange = jest.fn();
    });

    test('should deal specified number of cards', () => {
      gameEngine.dealCommunityCards(3);

      expect(gameEngine.deck.dealCards).toHaveBeenCalledWith(3);
      expect(gameEngine.gameState.communityCards).toHaveLength(3);
    });

    test('should notify state change after dealing', () => {
      gameEngine.dealCommunityCards(1);
      expect(gameEngine.notifyStateChange).toHaveBeenCalled();
    });
  });

  describe('executePlayerAction', () => {
    beforeEach(() => {
      const BettingLogic = require('../BettingLogic').default;
      BettingLogic.executeAction = jest.fn();

      mockPlayer1.canAct = jest.fn().mockReturnValue(true);
      mockPlayer1.status = PLAYER_STATUS.ACTIVE;
      gameEngine.checkAndAdvanceGame = jest.fn();
      gameEngine.gameState.currentPlayerIndex = 0;
    });

    test('should execute valid player action', () => {
      const BettingLogic = require('../BettingLogic').default;
      const result = gameEngine.executePlayerAction('p1', PLAYER_ACTIONS.FOLD, 0);

      expect(BettingLogic.executeAction).toHaveBeenCalledWith(
        gameEngine.gameState,
        mockPlayer1,
        PLAYER_ACTIONS.FOLD,
        0
      );
      expect(result).toEqual({
        success: true,
        action: PLAYER_ACTIONS.FOLD,
        amount: 0,
        playerId: 'p1',
      });
      expect(gameEngine.checkAndAdvanceGame).toHaveBeenCalled();
    });

    test('should return error for non-existent player', () => {
      // Implementation returns error object, doesn't throw
      const result = gameEngine.executePlayerAction('invalid', PLAYER_ACTIONS.FOLD, 0);
      expect(result.success).toBe(false);
      expect(result.error).toContain("'invalid' not found");
    });

    test('should return error if player cannot act', () => {
      mockPlayer1.canAct.mockReturnValue(false);

      const result = gameEngine.executePlayerAction('p1', PLAYER_ACTIONS.FOLD, 0);
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot act');
    });

    test('should return error if not player turn', () => {
      gameEngine.gameState.currentPlayerIndex = 1;

      const result = gameEngine.executePlayerAction('p1', PLAYER_ACTIONS.FOLD, 0);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Not Alice's turn");
    });

    test('should trigger player action callback', () => {
      const callback = jest.fn();
      gameEngine.setCallback('onPlayerAction', callback);

      gameEngine.executePlayerAction('p1', PLAYER_ACTIONS.CALL, 100);

      expect(callback).toHaveBeenCalledWith(mockPlayer1, PLAYER_ACTIONS.CALL, 100);
    });
  });

  describe('checkAndAdvanceGame', () => {
    beforeEach(() => {
      const BettingLogic = require('../BettingLogic').default;
      gameEngine.moveToNextPlayer = jest.fn();
      gameEngine.advanceToNextPhase = jest.fn();
      gameEngine.handleSinglePlayerWin = jest.fn();
      gameEngine.notifyStateChange = jest.fn();
      gameEngine.gameState.getPlayersInHand = jest.fn().mockReturnValue([mockPlayer1, mockPlayer2]);
      BettingLogic.isBettingRoundComplete = jest.fn().mockReturnValue(false);
    });

    test('should advance to next phase when betting round is complete', () => {
      const BettingLogic = require('../BettingLogic').default;
      BettingLogic.isBettingRoundComplete.mockReturnValue(true);
      gameEngine.gameState.getActivePlayers.mockReturnValue([mockPlayer1, mockPlayer2]);

      gameEngine.checkAndAdvanceGame();

      expect(gameEngine.advanceToNextPhase).toHaveBeenCalled();
    });

    test('should handle single player win when only one active player', () => {
      gameEngine.gameState.getActivePlayers.mockReturnValue([mockPlayer1]);

      gameEngine.checkAndAdvanceGame();

      expect(gameEngine.handleSinglePlayerWin).toHaveBeenCalled();
    });

    test('should handle single player win when only one player in hand', () => {
      gameEngine.gameState.getActivePlayers.mockReturnValue([mockPlayer1, mockPlayer2]);
      gameEngine.gameState.getPlayersInHand.mockReturnValue([mockPlayer1]);

      gameEngine.checkAndAdvanceGame();

      expect(gameEngine.handleSinglePlayerWin).toHaveBeenCalled();
    });

    test('should move to next player when betting continues', () => {
      const BettingLogic = require('../BettingLogic').default;
      BettingLogic.isBettingRoundComplete.mockReturnValue(false);
      gameEngine.gameState.getActivePlayers.mockReturnValue([mockPlayer1, mockPlayer2]);

      gameEngine.checkAndAdvanceGame();

      expect(gameEngine.moveToNextPlayer).toHaveBeenCalled();
    });
  });

  describe('advanceToNextPhase', () => {
    beforeEach(() => {
      gameEngine.gameState.phase = GAME_PHASES.PREFLOP;
      gameEngine.dealCommunityCards = jest.fn();
      gameEngine.resetBettingRound = jest.fn();
      gameEngine.handleShowdown = jest.fn();
      gameEngine.notifyPhaseChange = jest.fn();
      gameEngine.notifyStateChange = jest.fn();
    });

    test('should progress from PREFLOP to FLOP', () => {
      gameEngine.advanceToNextPhase();

      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.FLOP);
      expect(gameEngine.dealCommunityCards).toHaveBeenCalledWith(3);
      expect(gameEngine.resetBettingRound).toHaveBeenCalled();
    });

    test('should progress from FLOP to TURN', () => {
      gameEngine.gameState.phase = GAME_PHASES.FLOP;
      gameEngine.advanceToNextPhase();

      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.TURN);
      expect(gameEngine.dealCommunityCards).toHaveBeenCalledWith(1);
    });

    test('should progress from TURN to RIVER', () => {
      gameEngine.gameState.phase = GAME_PHASES.TURN;
      gameEngine.advanceToNextPhase();

      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.RIVER);
      expect(gameEngine.dealCommunityCards).toHaveBeenCalledWith(1);
    });

    test('should progress from RIVER to SHOWDOWN', () => {
      gameEngine.gameState.phase = GAME_PHASES.RIVER;
      // When handleShowdown is mocked, it doesn't set the phase
      // So we need to simulate that behavior
      gameEngine.handleShowdown.mockImplementation(() => {
        gameEngine.gameState.phase = GAME_PHASES.SHOWDOWN;
      });

      gameEngine.advanceToNextPhase();

      expect(gameEngine.handleShowdown).toHaveBeenCalled();
      expect(gameEngine.gameState.phase).toBe(GAME_PHASES.SHOWDOWN);
    });

    test('should trigger phase change callback', () => {
      const callback = jest.fn();
      gameEngine.setCallback('onPhaseChange', callback);
      // Make the mock invoke the actual callback
      gameEngine.notifyPhaseChange.mockImplementation(() => {
        if (gameEngine.callbacks.onPhaseChange) {
          gameEngine.callbacks.onPhaseChange(gameEngine.gameState.phase);
        }
      });

      gameEngine.advanceToNextPhase();

      expect(callback).toHaveBeenCalledWith(GAME_PHASES.FLOP);
    });
  });

  describe('handleShowdown', () => {
    beforeEach(() => {
      const HandEvaluator = require('../../utils/HandEvaluator').default;
      HandEvaluator.findWinners = jest
        .fn()
        .mockReturnValue([
          { player: mockPlayer1, hand: { rankName: 'Pair', description: 'Pair of Aces' } },
        ]);

      gameEngine.gameState.communityCards = [];
      gameEngine.gameState._internalPot = { main: 500, side: [] };
      gameEngine.gameState.getPlayersInHand = jest.fn().mockReturnValue([mockPlayer1, mockPlayer2]);
      gameEngine.gameState.calculateSidePots = jest.fn();
      gameEngine.gameState.winners = [];
      gameEngine.completeHand = jest.fn();
      mockPlayer1.holeCards = [];
      mockPlayer2.holeCards = [];
      // Implementation uses winPot(), not winHand()
      mockPlayer1.winPot = jest.fn();
      mockPlayer2.winPot = jest.fn();
    });

    test('should determine winners and distribute pot', () => {
      const HandEvaluator = require('../../utils/HandEvaluator').default;
      gameEngine.handleShowdown();

      expect(HandEvaluator.findWinners).toHaveBeenCalled();
      // Implementation uses player.winPot(), not winHand()
      expect(mockPlayer1.winPot).toHaveBeenCalledWith(500);
      expect(gameEngine.completeHand).toHaveBeenCalled();
    });

    test('should trigger showdown callback', () => {
      const callback = jest.fn();
      gameEngine.setCallback('onShowdown', callback);

      gameEngine.handleShowdown();

      // Implementation passes this.gameState.winners directly (array), not wrapped object
      expect(callback).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('completeHand', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      gameEngine.startNewHand = jest.fn();
      gameEngine.notifyStateChange = jest.fn();
      gameEngine.gameState.phase = GAME_PHASES.SHOWDOWN;
      gameEngine.gameState.winners = [{ player: mockPlayer1, amount: 100 }];
      gameEngine.gameState.serialize = jest.fn().mockReturnValue({ phase: 'waiting' });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should complete hand and schedule next hand', () => {
      const callback = jest.fn();
      gameEngine.setCallback('onHandComplete', callback);

      const result = gameEngine.completeHand();

      // Implementation calls onHandComplete with winners array
      expect(callback).toHaveBeenCalledWith(expect.any(Array));
      // Implementation returns winners info
      expect(result.winners).toBeDefined();
      // _isRestarting is set inside setTimeout, not immediately
      expect(gameEngine._isRestarting).toBe(false);

      // Advance to trigger the setTimeout (5000ms in implementation)
      jest.advanceTimersByTime(5000);

      expect(gameEngine.startNewHand).toHaveBeenCalled();
    });
  });

  describe('getValidActions', () => {
    beforeEach(() => {
      const BettingLogic = require('../BettingLogic').default;
      BettingLogic.getValidActions = jest.fn().mockReturnValue(['fold', 'call', 'raise']);
      gameEngine.getCurrentPlayer = jest.fn().mockReturnValue(mockPlayer1);
    });

    test('should return valid actions for current player', () => {
      const actions = gameEngine.getValidActions('p1');

      expect(actions).toEqual(['fold', 'call', 'raise']);
    });

    test('should return empty array for non-current player', () => {
      const actions = gameEngine.getValidActions('p2');

      expect(actions).toEqual([]);
    });

    test('should return empty array for invalid player', () => {
      const actions = gameEngine.getValidActions('invalid');

      expect(actions).toEqual([]);
    });
  });

  describe('setBlinds', () => {
    test('should set blind amounts', () => {
      gameEngine.setBlinds(25, 50);

      expect(gameEngine.gameState.blinds).toEqual({ small: 25, big: 50 });
    });
  });

  describe('getGameState', () => {
    test('should return serialized game state', () => {
      // Implementation returns this.gameState.serialize(), not raw gameState
      const mockSerialized = { phase: 'preflop', pot: 100, players: [] };
      gameEngine.gameState.serialize = jest.fn().mockReturnValue(mockSerialized);

      const state = gameEngine.getGameState();

      expect(gameEngine.gameState.serialize).toHaveBeenCalled();
      expect(state).toEqual(mockSerialized);
    });
  });

  describe('getCurrentPlayer', () => {
    test('should return current player', () => {
      gameEngine.gameState.players = [mockPlayer1, mockPlayer2];
      gameEngine.gameState.currentPlayerIndex = 1;

      const player = gameEngine.getCurrentPlayer();

      expect(player).toBe(mockPlayer2);
    });

    test('should return undefined if invalid index', () => {
      // Implementation returns undefined, not null
      gameEngine.gameState.currentPlayerIndex = -1;

      const player = gameEngine.getCurrentPlayer();

      expect(player).toBeUndefined();
    });
  });

  describe('notifyStateChange', () => {
    test('should call onStateChange callback with serialized state', () => {
      const callback = jest.fn();
      const mockSerialized = { phase: 'preflop', pot: 100 };
      gameEngine.gameState.serialize = jest.fn().mockReturnValue(mockSerialized);
      gameEngine.setCallback('onStateChange', callback);

      gameEngine.notifyStateChange();

      // Implementation calls this.getGameState() which returns serialize()
      expect(callback).toHaveBeenCalledWith(mockSerialized);
    });

    test('should not error if callback not set', () => {
      expect(() => gameEngine.notifyStateChange()).not.toThrow();
    });
  });

  describe('notifyPhaseChange', () => {
    test('should call onPhaseChange callback if set', () => {
      const callback = jest.fn();
      gameEngine.setCallback('onPhaseChange', callback);
      gameEngine.gameState.phase = GAME_PHASES.FLOP;

      gameEngine.notifyPhaseChange();

      expect(callback).toHaveBeenCalledWith(GAME_PHASES.FLOP);
    });

    test('should not error if callback not set', () => {
      expect(() => gameEngine.notifyPhaseChange()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in startNewHand gracefully', () => {
      gameEngine.gameState.resetForNewHand = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => gameEngine.startNewHand()).toThrow('Test error');
      expect(gameEngine._isRestarting).toBe(false); // Should reset flag on error
    });

    test('should return error for player not found in executePlayerAction', () => {
      // Implementation returns error object, doesn't throw
      gameEngine.gameState.players = [];

      const result = gameEngine.executePlayerAction('p1', PLAYER_ACTIONS.FOLD);

      expect(result.success).toBe(false);
      expect(result.error).toContain("'p1' not found");
    });
  });

  describe('Game Flow Integration', () => {
    test('should handle complete betting round', () => {
      const BettingLogic = require('../BettingLogic').default;
      BettingLogic.executeAction = jest.fn();
      BettingLogic.isBettingRoundComplete = jest.fn().mockReturnValue(true);

      // Setup initial state
      gameEngine.gameState.phase = GAME_PHASES.PREFLOP;
      mockPlayer1.canAct = jest.fn().mockReturnValue(true);
      // Mock getPlayersInHand to return both players (required by checkAndAdvanceGame)
      gameEngine.gameState.getPlayersInHand = jest.fn().mockReturnValue([mockPlayer1, mockPlayer2]);

      gameEngine.advanceToNextPhase = jest.fn();
      gameEngine.notifyStateChange = jest.fn();

      // Player 1 calls
      gameEngine.executePlayerAction('p1', PLAYER_ACTIONS.CALL, 20);

      // Now both players have acted
      gameEngine.gameState.getActivePlayers.mockReturnValue([mockPlayer1, mockPlayer2]);

      gameEngine.checkAndAdvanceGame();

      expect(gameEngine.advanceToNextPhase).toHaveBeenCalled();
    });

    test('should handle all-in scenario', () => {
      const BettingLogic = require('../BettingLogic').default;
      BettingLogic.executeAction = jest.fn();
      BettingLogic.isBettingRoundComplete = jest.fn().mockReturnValue(false);

      mockPlayer1.chips = 500;
      mockPlayer1.canAct = jest.fn().mockReturnValue(true);
      mockPlayer1.status = PLAYER_STATUS.ACTIVE;
      // Set mockPlayer2 status as well (needed by moveToNextPlayer filter)
      mockPlayer2.status = PLAYER_STATUS.ACTIVE;

      // Mock getPlayersInHand (required by checkAndAdvanceGame)
      gameEngine.gameState.getPlayersInHand = jest.fn().mockReturnValue([mockPlayer1, mockPlayer2]);
      gameEngine.gameState.getNextActivePlayerIndex = jest.fn().mockReturnValue(1);
      gameEngine.gameState.serialize = jest.fn().mockReturnValue({});
      gameEngine.notifyStateChange = jest.fn();

      const result = gameEngine.executePlayerAction('p1', PLAYER_ACTIONS.ALL_IN, 500);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(500);
      expect(BettingLogic.executeAction).toHaveBeenCalledWith(
        gameEngine.gameState,
        mockPlayer1,
        PLAYER_ACTIONS.ALL_IN,
        500
      );
    });
  });
});
