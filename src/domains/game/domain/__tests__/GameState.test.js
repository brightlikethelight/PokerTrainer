import { GAME_PHASES } from '../../../../constants/game-constants';
import { createCards } from '../../../../test-utils/poker-test-helpers';
import GameState from '../entities/GameState';
import Player from '../entities/Player';

describe('GameState', () => {
  let gameState;
  let players;

  beforeEach(() => {
    players = [
      new Player('1', 'Player 1', 1000, 0),
      new Player('2', 'Player 2', 1000, 1),
      new Player('3', 'Player 3', 1000, 2),
      new Player('4', 'Player 4', 1000, 3),
    ];
    gameState = new GameState();
    gameState.initialize(players);
  });

  describe('initialize', () => {
    it('should set up initial game state', () => {
      expect(gameState.players).toEqual(players);
      expect(gameState.dealerPosition).toBe(0);
      expect(gameState.smallBlindPosition).toBe(1);
      expect(gameState.bigBlindPosition).toBe(2);
      expect(gameState.currentPlayerIndex).toBe(3);
      expect(gameState._pot).toBe(0);
      expect(gameState._currentBet).toBe(0);
      expect(gameState.minRaise).toBe(0);
      expect(gameState.phase).toBe(GAME_PHASES.PREFLOP);
      expect(gameState.communityCards).toEqual([]);
    });

    it('should handle two players correctly', () => {
      const twoPlayers = [
        new Player('1', 'Player 1', 1000, 0),
        new Player('2', 'Player 2', 1000, 1),
      ];
      gameState.initialize(twoPlayers);

      expect(gameState.dealerPosition).toBe(0);
      expect(gameState.smallBlindPosition).toBe(0); // Dealer is SB in heads-up
      expect(gameState.bigBlindPosition).toBe(1);
      expect(gameState.currentPlayerIndex).toBe(0); // SB acts first preflop in heads-up
    });
  });

  describe('nextDealer', () => {
    it('should move dealer _position clockwise', () => {
      gameState.nextDealer();
      expect(gameState.dealerPosition).toBe(1);
      expect(gameState.smallBlindPosition).toBe(2);
      expect(gameState.bigBlindPosition).toBe(3);
    });

    it('should wrap around to first player', () => {
      gameState.dealerPosition = 3;
      gameState.nextDealer();
      expect(gameState.dealerPosition).toBe(0);
    });

    it('should skip inactive players', () => {
      players[1].isActive = false;
      gameState.nextDealer();
      expect(gameState.dealerPosition).toBe(2); // Skips player 1
    });
  });

  describe('addToPot', () => {
    it('should increase pot size', () => {
      gameState.addToPot(100);
      expect(+gameState.pot).toBe(100); // Convert to number for comparison

      gameState.addToPot(50);
      expect(gameState._pot).toBe(150);
    });

    it('should update pot history', () => {
      gameState.addToPot(100);
      expect(gameState.potHistory).toContain(100);
    });
  });

  describe('setCurrentBet', () => {
    it('should update current bet and min raise', () => {
      gameState.setCurrentBet(100, 50);
      expect(gameState._currentBet).toBe(100);
      expect(gameState.minRaise).toBe(50);
    });
  });

  describe('nextPhase', () => {
    it('should progress through phases correctly', () => {
      expect(gameState.phase).toBe(GAME_PHASES.PREFLOP);

      gameState.nextPhase();
      expect(gameState.phase).toBe(GAME_PHASES.FLOP);

      gameState.nextPhase();
      expect(gameState.phase).toBe(GAME_PHASES.TURN);

      gameState.nextPhase();
      expect(gameState.phase).toBe(GAME_PHASES.RIVER);

      gameState.nextPhase();
      expect(gameState.phase).toBe(GAME_PHASES.SHOWDOWN);
    });

    it('should reset current bet when moving to new phase', () => {
      gameState.currentBet = 100;
      gameState.minRaise = 50;

      gameState.nextPhase();

      expect(gameState._currentBet).toBe(0);
      expect(gameState.minRaise).toBe(0);
    });
  });

  describe('setCommunityCards', () => {
    it('should set community cards', () => {
      const cards = createCards(['As', 'Kh', 'Qd']);
      gameState.setCommunityCards(cards);
      expect(gameState.communityCards).toEqual(cards);
    });
  });

  describe('getActivePlayers', () => {
    it('should return only active, non-folded players', () => {
      players[1].fold();
      players[2].isActive = false;

      const activePlayers = gameState.getActivePlayers();
      expect(activePlayers).toHaveLength(2);
      expect(activePlayers).toContain(players[0]);
      expect(activePlayers).toContain(players[3]);
    });
  });

  describe('getPlayersInHand', () => {
    it('should return players still in the _hand', () => {
      players[1].fold();

      const playersInHand = gameState.getPlayersInHand();
      expect(playersInHand).toHaveLength(3);
      expect(playersInHand).not.toContain(players[1]);
    });

    it('should include all-in players', () => {
      players[0].bet(1000); // All-in

      const playersInHand = gameState.getPlayersInHand();
      expect(playersInHand).toContain(players[0]);
    });
  });

  describe('nextPlayer', () => {
    it('should move to next active player', () => {
      gameState.currentPlayerIndex = 0;
      gameState.nextPlayer();
      expect(gameState.currentPlayerIndex).toBe(1);
    });

    it('should skip folded players', () => {
      gameState.currentPlayerIndex = 0;
      players[1].fold();
      gameState.nextPlayer();
      expect(gameState.currentPlayerIndex).toBe(2);
    });

    it('should skip all-in players', () => {
      gameState.currentPlayerIndex = 0;
      players[1].bet(1000); // All-in
      gameState.nextPlayer();
      expect(gameState.currentPlayerIndex).toBe(2);
    });

    it('should wrap around', () => {
      gameState.currentPlayerIndex = 3;
      gameState.nextPlayer();
      expect(gameState.currentPlayerIndex).toBe(0);
    });
  });

  describe('getCurrentPlayer', () => {
    it('should return the current player', () => {
      gameState.currentPlayerIndex = 2;
      expect(gameState.getCurrentPlayer()).toBe(players[2]);
    });
  });

  describe('isHandComplete', () => {
    it('should return true when only one player remains', () => {
      players[1].fold();
      players[2].fold();
      players[3].fold();

      expect(gameState.isHandComplete()).toBe(true);
    });

    it('should return true in showdown phase', () => {
      gameState.phase = GAME_PHASES.SHOWDOWN;
      expect(gameState.isHandComplete()).toBe(true);
    });

    it('should return false when multiple players remain', () => {
      expect(gameState.isHandComplete()).toBe(false);
    });
  });

  describe('resetForNewHand', () => {
    it('should reset game state for new _hand', () => {
      gameState.pot = 500;
      gameState.currentBet = 100;
      gameState.phase = GAME_PHASES.RIVER;
      gameState.communityCards = createCards(['As', 'Kh', 'Qd']);

      gameState.resetForNewHand();

      expect(gameState._pot).toBe(0);
      expect(gameState._currentBet).toBe(0);
      expect(gameState.phase).toBe(GAME_PHASES.PREFLOP);
      expect(gameState.communityCards).toEqual([]);
    });

    it('should reset all players', () => {
      players.forEach((player) => {
        player._currentBet = 100;
        player.isFolded = true;
      });

      gameState.resetForNewHand();

      players.forEach((player) => {
        expect(player._currentBet).toBe(0);
        expect(player.isFolded).toBe(false);
      });
    });
  });

  describe('createSidePots', () => {
    it('should create side pots for all-in scenarios', () => {
      players[0].chips = 100;
      players[0].currentBet = 100;
      players[0].isAllIn = true;

      players[1].currentBet = 300;
      players[2]._currentBet = 300;
      players[3].fold();

      const sidePots = gameState.createSidePots();

      expect(sidePots).toHaveLength(2);
      expect(sidePots[0].amount).toBe(300); // Main pot
      expect(sidePots[0].eligiblePlayers).toHaveLength(3);
      expect(sidePots[1].amount).toBe(400); // Side _pot
      expect(sidePots[1].eligiblePlayers).toHaveLength(2);
    });
  });

  describe('toJSON', () => {
    it('should serialize game state', () => {
      const json = gameState.toJSON();

      expect(json).toHaveProperty('players');
      expect(json).toHaveProperty('dealerPosition');
      expect(json).toHaveProperty('_pot');
      expect(json).toHaveProperty('phase');
      expect(json).toHaveProperty('communityCards');
    });
  });

  describe('validateState', () => {
    it('should return true for valid state', () => {
      expect(gameState.validateState()).toBe(true);
    });

    it('should handle edge cases', () => {
      gameState.players = [];
      expect(gameState.validateState()).toBe(false);

      gameState.players = players;
      gameState.dealerPosition = -1;
      expect(gameState.validateState()).toBe(false);
    });
  });
});
