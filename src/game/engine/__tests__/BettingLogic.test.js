/**
 * BettingLogic Test Suite
 * Comprehensive tests for betting rules and validation
 */

import BettingLogic from '../BettingLogic';
import Player from '../../entities/Player';
import GameState from '../../entities/GameState';
import { PLAYER_ACTIONS, PLAYER_STATUS, GAME_PHASES } from '../../../constants/game-constants';

describe('BettingLogic', () => {
  let gameState;
  let player1, player2, player3;

  beforeEach(() => {
    gameState = new GameState();
    player1 = new Player('p1', 'Alice', 1000, 0);
    player2 = new Player('p2', 'Bob', 1000, 1);
    player3 = new Player('p3', 'Charlie', 1000, 2);

    gameState.addPlayer(player1);
    gameState.addPlayer(player2);
    gameState.addPlayer(player3);
    gameState.blinds = { small: 10, big: 20 };
    gameState.minimumRaise = 20;
    gameState.currentBet = 0;
    gameState.phase = GAME_PHASES.PREFLOP;
    gameState.handHistory = [];

    // Set up players as active
    player1.isActive = true;
    player1.status = PLAYER_STATUS.ACTIVE;
    player2.isActive = true;
    player2.status = PLAYER_STATUS.ACTIVE;
    player3.isActive = true;
    player3.status = PLAYER_STATUS.ACTIVE;
  });

  describe('validateAction', () => {
    describe('FOLD', () => {
      test('should validate fold action', () => {
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.FOLD);
        expect(result.valid).toBe(true);
      });

      test('should reject fold when player cannot act', () => {
        player1.status = PLAYER_STATUS.FOLDED;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.FOLD);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Player cannot act');
      });
    });

    describe('CHECK', () => {
      test('should validate check when no bet to call', () => {
        gameState.currentBet = 0;
        player1._currentBet = 0;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CHECK);
        expect(result.valid).toBe(true);
      });

      test('should reject check when there is a bet to call', () => {
        gameState.currentBet = 20;
        player1._currentBet = 0;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CHECK);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Cannot check');
      });
    });

    describe('CALL', () => {
      test('should validate call when there is a bet', () => {
        gameState.currentBet = 20;
        player1._currentBet = 0;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CALL);
        expect(result.valid).toBe(true);
        expect(result.amount).toBe(20);
      });

      test('should reject call when nothing to call', () => {
        gameState.currentBet = 0;
        player1._currentBet = 0;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CALL);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Nothing to call');
      });

      test('should allow all-in call with insufficient chips', () => {
        gameState.currentBet = 500;
        player1._currentBet = 0;
        player1.chips = 200;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CALL);
        expect(result.valid).toBe(true);
        expect(result.amount).toBe(200); // Can only call for 200
      });
    });

    describe('BET', () => {
      test('should validate bet when no current bet', () => {
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.BET, 50);
        expect(result.valid).toBe(true);
        expect(result.amount).toBe(50);
      });

      test('should reject bet when there is already a bet', () => {
        gameState.currentBet = 20;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.BET, 50);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Cannot bet');
      });

      test('should reject bet less than big blind', () => {
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.BET, 10);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('big blind');
      });

      test('should reject bet more than player chips', () => {
        player1.chips = 30;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.BET, 50);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Not enough chips');
      });
    });

    describe('RAISE', () => {
      beforeEach(() => {
        gameState.currentBet = 20;
        gameState.minimumRaise = 20;
        player1._currentBet = 0;
      });

      test('should validate valid raise', () => {
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.RAISE, 60);
        expect(result.valid).toBe(true);
        expect(result.amount).toBe(60);
      });

      test('should reject raise when no bet', () => {
        gameState.currentBet = 0;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.RAISE, 40);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Cannot raise when there is no bet');
      });

      test('should reject insufficient raise amount', () => {
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.RAISE, 30);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Raise must be at least');
      });

      test('should reject raise exceeding chips', () => {
        player1.chips = 30;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.RAISE, 60);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Not enough chips');
      });

      test('should allow all-in raise for less than minimum', () => {
        player1.chips = 35; // Less than min raise (40)
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.RAISE, 35);
        expect(result.valid).toBe(true);
      });
    });

    describe('ALL_IN', () => {
      test('should validate all-in with player chips', () => {
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.ALL_IN);
        expect(result.valid).toBe(true);
        expect(result.amount).toBe(1000);
      });

      test('should return correct amount for short stack', () => {
        player1.chips = 50;
        const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.ALL_IN);
        expect(result.valid).toBe(true);
        expect(result.amount).toBe(50);
      });
    });

    describe('Invalid action', () => {
      test('should reject invalid action type', () => {
        const result = BettingLogic.validateAction(gameState, player1, 'invalid-action');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Invalid');
      });
    });
  });

  describe('getValidActions', () => {
    test('should return empty array for player who cannot act', () => {
      player1.status = PLAYER_STATUS.FOLDED;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toEqual([]);
    });

    test('should return fold and check when no bet', () => {
      gameState.currentBet = 0;
      player1._currentBet = 0;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toContain(PLAYER_ACTIONS.FOLD);
      expect(actions).toContain(PLAYER_ACTIONS.CHECK);
    });

    test('should include bet when no current bet and enough chips', () => {
      gameState.currentBet = 0;
      player1._currentBet = 0;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toContain(PLAYER_ACTIONS.BET);
    });

    test('should return fold, call, raise when facing bet', () => {
      gameState.currentBet = 20;
      gameState.minimumRaise = 20;
      player1._currentBet = 0;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toContain(PLAYER_ACTIONS.FOLD);
      expect(actions).toContain(PLAYER_ACTIONS.CALL);
      expect(actions).toContain(PLAYER_ACTIONS.RAISE);
      expect(actions).not.toContain(PLAYER_ACTIONS.CHECK);
    });

    test('should include all-in when cannot call or raise', () => {
      gameState.currentBet = 500;
      gameState.minimumRaise = 500;
      player1._currentBet = 0;
      player1.chips = 100; // Can't call 500 or raise 1000
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toContain(PLAYER_ACTIONS.ALL_IN);
      expect(actions).not.toContain(PLAYER_ACTIONS.CALL);
      expect(actions).not.toContain(PLAYER_ACTIONS.RAISE);
    });

    test('should not include bet when chips less than big blind', () => {
      gameState.currentBet = 0;
      player1._currentBet = 0;
      player1.chips = 10; // Less than big blind (20)
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).not.toContain(PLAYER_ACTIONS.BET);
    });
  });

  describe('executeAction', () => {
    beforeEach(() => {
      // Set up mocks for player methods
      player1.fold = jest.fn();
      player1.check = jest.fn();
      player1.call = jest.fn();
      player1.bet = jest.fn();
      player1.raise = jest.fn();
      gameState.getTotalPot = jest.fn().mockReturnValue(100);
    });

    test('should execute fold correctly', () => {
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.FOLD);
      expect(player1.fold).toHaveBeenCalled();
    });

    test('should execute check correctly', () => {
      gameState.currentBet = 0;
      player1._currentBet = 0;
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.CHECK);
      expect(player1.check).toHaveBeenCalled();
    });

    test('should execute call correctly', () => {
      gameState.currentBet = 20;
      player1._currentBet = 0;
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.CALL);
      expect(player1.call).toHaveBeenCalledWith(20);
      expect(gameState._internalPot.main).toBe(20);
    });

    test('should execute bet correctly', () => {
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.BET, 50);
      expect(player1.bet).toHaveBeenCalledWith(50);
      expect(gameState.currentBet).toBe(50);
      expect(gameState._internalPot.main).toBe(50);
      expect(gameState.lastRaiserIndex).toBe(0);
    });

    test('should execute raise correctly', () => {
      gameState.currentBet = 20;
      gameState.minimumRaise = 20;
      player1._currentBet = 0;
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.RAISE, 60);
      expect(player1.raise).toHaveBeenCalledWith(60);
      expect(gameState.currentBet).toBe(60);
      expect(gameState._internalPot.main).toBe(60);
    });

    test('should execute all-in correctly', () => {
      player1.chips = 500;
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.ALL_IN);
      expect(player1.status).toBe('all-in');
      expect(player1.lastAction).toBe('all-in');
      expect(gameState._internalPot.main).toBe(500);
    });

    test('should record action in history', () => {
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.BET, 50);
      expect(gameState.handHistory.length).toBeGreaterThan(0);
      expect(gameState.handHistory[0].playerId).toBe('p1');
      expect(gameState.handHistory[0]._action).toBe(PLAYER_ACTIONS.BET);
    });

    test('should throw error for invalid action', () => {
      player1.status = PLAYER_STATUS.FOLDED;
      expect(() => {
        BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.BET, 50);
      }).toThrow();
    });
  });

  describe('isBettingRoundComplete', () => {
    beforeEach(() => {
      // Set up all players to be able to act
      player1.canAct = jest.fn().mockReturnValue(true);
      player2.canAct = jest.fn().mockReturnValue(true);
      player3.canAct = jest.fn().mockReturnValue(true);
      gameState.getPlayerByPosition = jest.fn().mockReturnValue(player2);
      gameState.getBigBlindPosition = jest.fn().mockReturnValue(1);
    });

    test('should return true when only one active player', () => {
      player1.canAct = jest.fn().mockReturnValue(true);
      player2.canAct = jest.fn().mockReturnValue(false);
      player3.canAct = jest.fn().mockReturnValue(false);
      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(true);
    });

    test('should return false when players have not acted', () => {
      player1.lastAction = null;
      player2.lastAction = null;
      player3.lastAction = null;
      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(false);
    });

    test('should return true when all bets matched and all acted', () => {
      player1.lastAction = 'call';
      player2.lastAction = 'call';
      player3.lastAction = 'call';
      player1._currentBet = 20;
      player2._currentBet = 20;
      player3._currentBet = 20;
      gameState.currentBet = 20;
      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(true);
    });

    test('should return false if bets are not matched', () => {
      player1.lastAction = 'call';
      player2.lastAction = 'raise';
      player3.lastAction = 'call';
      player1._currentBet = 20;
      player2._currentBet = 40;
      player3._currentBet = 20;
      gameState.currentBet = 40;
      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(false);
    });

    test('should handle big blind option in preflop', () => {
      gameState.phase = 'preflop';
      gameState.lastRaiserIndex = null;
      gameState.currentBet = 20;
      gameState.blinds = { small: 10, big: 20 };

      // All players called, but BB hasn't acted
      player1.lastAction = 'call';
      player2.lastAction = null; // BB
      player3.lastAction = 'call';
      player1._currentBet = 20;
      player2._currentBet = 20;
      player3._currentBet = 20;

      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(false);
    });
  });

  describe('calculateMinBet', () => {
    test('should return big blind as minimum bet', () => {
      gameState.blinds = { small: 25, big: 50 };
      expect(BettingLogic.calculateMinBet(gameState)).toBe(50);
    });
  });

  describe('calculateMinRaise', () => {
    test('should return current bet plus minimum raise', () => {
      gameState.currentBet = 100;
      gameState.minimumRaise = 50;
      expect(BettingLogic.calculateMinRaise(gameState)).toBe(150);
    });
  });

  describe('calculatePotOdds', () => {
    beforeEach(() => {
      gameState.getTotalPot = jest.fn().mockReturnValue(100);
    });

    test('should calculate pot odds correctly', () => {
      gameState.currentBet = 20;
      player1._currentBet = 0;

      const potOdds = BettingLogic.calculatePotOdds(gameState, player1);

      // Call amount is 20, pot after call would be 120
      // Pot odds = 20/120 * 100 = 16.67%
      expect(potOdds).toBeCloseTo(16.67, 0);
    });

    test('should return 100 when nothing to call', () => {
      gameState.currentBet = 0;
      player1._currentBet = 0;
      const potOdds = BettingLogic.calculatePotOdds(gameState, player1);
      expect(potOdds).toBe(100);
    });

    test('should return 100 when already matched bet', () => {
      gameState.currentBet = 20;
      player1._currentBet = 20;
      const potOdds = BettingLogic.calculatePotOdds(gameState, player1);
      expect(potOdds).toBe(100);
    });
  });

  describe('getBettingRoundSummary', () => {
    beforeEach(() => {
      gameState.getTotalPot = jest.fn().mockReturnValue(300);
      gameState.getPlayersInHand = jest.fn().mockReturnValue([player1, player2]);
      gameState.currentPlayerIndex = 0;
      gameState.currentBet = 50;
    });

    test('should return correct summary', () => {
      const summary = BettingLogic.getBettingRoundSummary(gameState);

      expect(summary._pot).toBe(300);
      expect(summary.toCall).toBe(50);
      expect(summary.playersRemaining).toBe(2);
      expect(summary.currentPlayer).toBe('Alice');
      expect(summary.phase).toBe(GAME_PHASES.PREFLOP);
    });

    test('should handle missing current player', () => {
      gameState.currentPlayerIndex = 5; // Invalid index
      const summary = BettingLogic.getBettingRoundSummary(gameState);
      expect(summary.currentPlayer).toBe('None');
    });
  });

  describe('hasActedSinceLastRaise', () => {
    test('should return true if no raise in history', () => {
      gameState.handHistory = [{ playerId: 'p1', action: PLAYER_ACTIONS.CALL }];
      expect(BettingLogic.hasActedSinceLastRaise(gameState, player1)).toBe(true);
    });

    test('should return true if player acted after raise', () => {
      gameState.handHistory = [
        { playerId: 'p2', action: PLAYER_ACTIONS.RAISE },
        { playerId: 'p1', action: PLAYER_ACTIONS.CALL },
      ];
      expect(BettingLogic.hasActedSinceLastRaise(gameState, player1)).toBe(true);
    });

    test('should return false if player has not acted since raise', () => {
      gameState.handHistory = [
        { playerId: 'p1', action: PLAYER_ACTIONS.CALL },
        { playerId: 'p2', action: PLAYER_ACTIONS.RAISE },
      ];
      expect(BettingLogic.hasActedSinceLastRaise(gameState, player1)).toBe(false);
    });
  });
});
