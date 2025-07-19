import { PLAYER_ACTIONS, PLAYER_STATUS } from '../../../../constants/game-constants';
import BettingLogic from '../services/BettingLogic';
import GameState from '../entities/GameState';
import Player from '../entities/Player';

describe('BettingLogic', () => {
  let gameState;
  let player1, player2, player3;

  beforeEach(() => {
    gameState = new GameState();
    player1 = new Player('p1', 'Player 1', 1000, 0);
    player2 = new Player('p2', 'Player 2', 1000, 1);
    player3 = new Player('p3', 'Player 3', 1000, 2);

    gameState.addPlayer(player1);
    gameState.addPlayer(player2);
    gameState.addPlayer(player3);

    gameState.blinds = { small: 10, big: 20 };
    gameState.resetForNewHand();
  });

  describe('validateAction', () => {
    it('should allow fold at any time', () => {
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.FOLD);
      expect(result.valid).toBe(true);
    });

    it('should allow check when no bet to call', () => {
      gameState.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CHECK);
      expect(result.valid).toBe(true);
    });

    it('should not allow check when there is a bet', () => {
      gameState.currentBet = 50;
      player1.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CHECK);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot check when there is a bet to call');
    });

    it('should allow call when facing a bet', () => {
      gameState.currentBet = 50;
      player1.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CALL);
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(50);
    });

    it('should not allow call when nothing to call', () => {
      gameState.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CALL);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Nothing to call');
    });

    it('should allow bet when no current bet', () => {
      gameState.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.BET, 40);
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(40);
    });

    it('should enforce minimum bet size', () => {
      gameState.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.BET, 10);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Bet must be at least the big blind');
    });

    it('should allow raise when facing a bet', () => {
      gameState.currentBet = 50;
      gameState.minimumRaise = 50;
      player1.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.RAISE, 100);
      expect(result.valid).toBe(true);
    });

    it('should enforce minimum raise size', () => {
      gameState.currentBet = 50;
      gameState.minimumRaise = 50;
      player1.currentBet = 0;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.RAISE, 75);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Raise must be at least');
    });

    it('should cap actions at player chip count', () => {
      player1.chips = 30;
      gameState.currentBet = 50;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CALL);
      expect(result.valid).toBe(true);
      expect(result.amount).toBe(30); // All-in for less
    });

    it('should not allow actions from folded players', () => {
      player1.status = PLAYER_STATUS.FOLDED;
      const result = BettingLogic.validateAction(gameState, player1, PLAYER_ACTIONS.CHECK);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Player cannot act');
    });
  });

  describe('getValidActions', () => {
    it('should return fold, check, bet when no current bet', () => {
      gameState.currentBet = 0;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toContain(PLAYER_ACTIONS.FOLD);
      expect(actions).toContain(PLAYER_ACTIONS.CHECK);
      expect(actions).toContain(PLAYER_ACTIONS.BET);
      expect(actions).not.toContain(PLAYER_ACTIONS.CALL);
      expect(actions).not.toContain(PLAYER_ACTIONS.RAISE);
    });

    it('should return fold, call, raise when facing a bet', () => {
      gameState.currentBet = 50;
      gameState.minimumRaise = 50;
      player1.currentBet = 0;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toContain(PLAYER_ACTIONS.FOLD);
      expect(actions).toContain(PLAYER_ACTIONS.CALL);
      expect(actions).toContain(PLAYER_ACTIONS.RAISE);
      expect(actions).not.toContain(PLAYER_ACTIONS.CHECK);
      expect(actions).not.toContain(PLAYER_ACTIONS.BET);
    });

    it('should only allow fold and all-in when short stacked', () => {
      gameState.currentBet = 100;
      player1.chips = 50;
      player1.currentBet = 0;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toContain(PLAYER_ACTIONS.FOLD);
      expect(actions).toContain(PLAYER_ACTIONS.ALL_IN);
      expect(actions).not.toContain(PLAYER_ACTIONS.CALL);
      expect(actions).not.toContain(PLAYER_ACTIONS.RAISE);
    });

    it('should return empty array for inactive players', () => {
      player1.status = PLAYER_STATUS.FOLDED;
      const actions = BettingLogic.getValidActions(gameState, player1);
      expect(actions).toEqual([]);
    });
  });

  describe('executeAction', () => {
    it('should properly execute a bet', () => {
      const initialChips = player1.chips;
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.BET, 50);

      expect(player1.chips).toBe(initialChips - 50);
      expect(player1.currentBet).toBe(50);
      expect(gameState.currentBet).toBe(50);
      expect(gameState.pot.main).toBe(50);
      expect(gameState.lastRaiserIndex).toBe(player1.position);
    });

    it('should properly execute a call', () => {
      gameState.currentBet = 50;
      player2.currentBet = 50;
      player2.chips = 950;
      gameState.pot.main = 50;

      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.CALL, 50);

      expect(player1.chips).toBe(950);
      expect(player1.currentBet).toBe(50);
      expect(gameState.pot.main).toBe(100);
    });

    it('should properly execute a raise', () => {
      gameState.currentBet = 50;
      gameState.minimumRaise = 50;
      gameState.pot.main = 50;

      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.RAISE, 150);

      expect(player1.chips).toBe(850);
      expect(player1.currentBet).toBe(150);
      expect(gameState.currentBet).toBe(150);
      expect(gameState.minimumRaise).toBe(100);
      expect(gameState.pot.main).toBe(200);
    });

    it('should properly execute fold', () => {
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.FOLD);

      expect(player1.status).toBe(PLAYER_STATUS.FOLDED);
      expect(player1.lastAction).toBe('fold');
    });

    it('should properly execute all-in', () => {
      player1.chips = 75;
      gameState.currentBet = 100;

      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.ALL_IN);

      expect(player1.chips).toBe(0);
      expect(player1.currentBet).toBe(75);
      expect(player1.status).toBe(PLAYER_STATUS.ALL_IN);
      expect(gameState.pot.main).toBe(75);
    });

    it('should add action to history', () => {
      const historyLength = gameState.handHistory.length;
      BettingLogic.executeAction(gameState, player1, PLAYER_ACTIONS.BET, 50);

      expect(gameState.handHistory.length).toBe(historyLength + 1);
      const lastAction = gameState.handHistory[gameState.handHistory.length - 1];
      expect(lastAction.playerId).toBe(player1.id);
      expect(lastAction._action).toBe(PLAYER_ACTIONS.BET);
      expect(lastAction.amount).toBe(50);
    });
  });

  describe('isBettingRoundComplete', () => {
    it('should return true when all active players have matched current bet', () => {
      gameState.currentBet = 50;
      player1.currentBet = 50;
      player1.lastAction = 'call';
      player2.currentBet = 50;
      player2.lastAction = 'call';
      player3.currentBet = 50;
      player3.lastAction = 'bet';

      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(true);
    });

    it('should return false when players need to act', () => {
      gameState.currentBet = 50;
      player1.currentBet = 0;
      player2.currentBet = 50;
      player3.currentBet = 50;

      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(false);
    });

    it('should return true when only one active player remains', () => {
      player1.status = PLAYER_STATUS.FOLDED;
      player2.status = PLAYER_STATUS.FOLDED;

      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(true);
    });

    it('should handle big blind option correctly', () => {
      gameState.phase = 'preflop';
      gameState.currentBet = 20;

      // Set up all players to have matched the big blind
      gameState.players.forEach((player, _index) => {
        if (_index < 2) {
          // First two players called
          player.currentBet = 20;
          player.lastAction = PLAYER_ACTIONS.CALL;
        }
      });

      // Simulate BB position (last player)
      const bbPosition = gameState.getBigBlindPosition();
      const bbPlayer = gameState.players[bbPosition];
      bbPlayer.currentBet = 20;
      bbPlayer.lastAction = null; // BB hasn't acted yet
      gameState.currentPlayerIndex = bbPosition;

      // BB hasn't acted yet
      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(false);

      // BB acts
      bbPlayer.lastAction = PLAYER_ACTIONS.CHECK;
      expect(BettingLogic.isBettingRoundComplete(gameState)).toBe(true);
    });
  });

  describe('calculatePotOdds', () => {
    it('should calculate correct pot odds', () => {
      gameState.pot.main = 100;
      gameState.currentBet = 50;
      player1.currentBet = 0;

      const odds = BettingLogic.calculatePotOdds(gameState, player1);
      expect(odds).toBeCloseTo(33.33, 1); // (50/150)*100 = 33.33%
    });

    it('should return 100 when no bet to call', () => {
      gameState.currentBet = 0;
      const odds = BettingLogic.calculatePotOdds(gameState, player1);
      expect(odds).toBe(100); // No call required = 100%
    });
  });
});
