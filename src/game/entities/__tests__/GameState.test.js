/**
 * GameState Test Suite
 * Comprehensive tests for game state management
 */

import GameState from '../GameState';
import Player from '../Player';
import { GAME_PHASES, PLAYER_STATUS } from '../../../constants/game-constants';

describe('GameState', () => {
  let gameState;
  let player1, player2, player3;

  beforeEach(() => {
    gameState = new GameState();
    player1 = new Player('p1', 'Alice', 1000, 0);
    player2 = new Player('p2', 'Bob', 1000, 1);
    player3 = new Player('p3', 'Charlie', 1000, 2);
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(gameState.players).toEqual([]);
      expect(gameState.communityCards).toEqual([]);
      expect(gameState._internalPot.main).toBe(0);
      expect(gameState._internalPot.side).toEqual([]);
      expect(gameState.phase).toBe(GAME_PHASES.WAITING);
      expect(gameState.currentBet).toBe(0);
      expect(gameState.handNumber).toBe(0);
    });

    test('should set default blind values', () => {
      expect(gameState.blinds.small).toBe(10);
      expect(gameState.blinds.big).toBe(20);
    });

    test('should initialize dealer position to 0', () => {
      expect(gameState.dealerPosition).toBe(0);
    });
  });

  describe('initialize', () => {
    test('should initialize with players array', () => {
      gameState.initialize([player1, player2, player3]);

      expect(gameState.players).toHaveLength(3);
      expect(gameState.phase).toBe(GAME_PHASES.PREFLOP);
    });

    test('should set correct positions for heads-up', () => {
      gameState.initialize([player1, player2]);

      expect(gameState.smallBlindPosition).toBe(0); // Dealer is SB in heads-up
      expect(gameState.bigBlindPosition).toBe(1);
      expect(gameState.currentPlayerIndex).toBe(0);
    });

    test('should set correct positions for multi-player', () => {
      gameState.initialize([player1, player2, player3]);

      expect(gameState.smallBlindPosition).toBe(1);
      expect(gameState.bigBlindPosition).toBe(2);
      expect(gameState.currentPlayerIndex).toBe(3); // UTG would be position 3
    });

    test('should reset pot on initialize', () => {
      gameState._internalPot.main = 500;
      gameState.initialize([player1, player2]);

      expect(gameState._internalPot.main).toBe(0);
    });
  });

  describe('validateState', () => {
    test('should return false with less than 2 players', () => {
      gameState.players = [player1];
      expect(gameState.validateState()).toBe(false);
    });

    test('should return false with invalid dealer position', () => {
      gameState.players = [player1, player2];
      gameState.dealerPosition = 5;
      expect(gameState.validateState()).toBe(false);
    });

    test('should return false with invalid current player index', () => {
      gameState.players = [player1, player2];
      gameState.currentPlayerIndex = -1;
      expect(gameState.validateState()).toBe(false);
    });

    test('should return true with valid state', () => {
      gameState.players = [player1, player2];
      gameState.dealerPosition = 0;
      gameState.currentPlayerIndex = 0;
      expect(gameState.validateState()).toBe(true);
    });
  });

  describe('Player Management', () => {
    describe('addPlayer', () => {
      test('should add player to players array', () => {
        gameState.addPlayer(player1);
        expect(gameState.players).toHaveLength(1);
        expect(gameState.players[0].id).toBe('p1');
      });

      test('should set player position correctly', () => {
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);

        expect(player1.position).toBe(0);
        expect(player2.position).toBe(1);
      });
    });

    describe('removePlayer', () => {
      test('should remove player by ID', () => {
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);
        gameState.removePlayer('p1');

        expect(gameState.players).toHaveLength(1);
        expect(gameState.players[0].id).toBe('p2');
      });

      test('should update remaining player positions', () => {
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);
        gameState.addPlayer(player3);
        gameState.removePlayer('p1');

        expect(player2.position).toBe(0);
        expect(player3.position).toBe(1);
      });
    });

    describe('getPlayerByPosition', () => {
      test('should return player at given position', () => {
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);

        const found = gameState.getPlayerByPosition(1);
        expect(found.id).toBe('p2');
      });

      test('should return undefined for invalid position', () => {
        gameState.addPlayer(player1);
        expect(gameState.getPlayerByPosition(5)).toBeUndefined();
      });
    });
  });

  describe('Active Player Methods', () => {
    beforeEach(() => {
      gameState.addPlayer(player1);
      gameState.addPlayer(player2);
      gameState.addPlayer(player3);
    });

    describe('getActivePlayers', () => {
      test('should return players who are active and have chips', () => {
        player1.isActive = true;
        player1.status = PLAYER_STATUS.ACTIVE;
        player2.isActive = true;
        player2.status = PLAYER_STATUS.ACTIVE;
        player3.isActive = true;
        player3.status = PLAYER_STATUS.FOLDED;

        const active = gameState.getActivePlayers();
        expect(active).toHaveLength(2);
      });

      test('should exclude players who are sitting out', () => {
        player1.isActive = true;
        player1.status = PLAYER_STATUS.ACTIVE;
        player2.isActive = true;
        player2.status = PLAYER_STATUS.SITTING_OUT;
        // Also set player3 to sitting out
        player3.isActive = true;
        player3.status = PLAYER_STATUS.SITTING_OUT;

        const active = gameState.getActivePlayers();
        expect(active).toHaveLength(1);
        expect(active[0].id).toBe('p1');
      });

      test('should exclude players with no chips', () => {
        player1.isActive = true;
        player1.status = PLAYER_STATUS.ACTIVE;
        player2.isActive = true;
        player2.chips = 0;
        player2.status = PLAYER_STATUS.ACTIVE;
        // Also set player3 to no chips
        player3.isActive = true;
        player3.chips = 0;
        player3.status = PLAYER_STATUS.ACTIVE;

        const active = gameState.getActivePlayers();
        expect(active).toHaveLength(1);
        expect(active[0].id).toBe('p1');
      });
    });

    describe('getPlayersInHand', () => {
      test('should return players still in the hand', () => {
        player1.isInHand = jest.fn().mockReturnValue(true);
        player2.isInHand = jest.fn().mockReturnValue(true);
        player3.isInHand = jest.fn().mockReturnValue(false);

        const inHand = gameState.getPlayersInHand();
        expect(inHand).toHaveLength(2);
      });
    });

    describe('getNextActivePlayerIndex', () => {
      test('should return next player who can act', () => {
        player1.canAct = jest.fn().mockReturnValue(false);
        player2.canAct = jest.fn().mockReturnValue(true);
        player3.canAct = jest.fn().mockReturnValue(false);

        const nextIndex = gameState.getNextActivePlayerIndex(0);
        expect(nextIndex).toBe(1);
      });

      test('should wrap around to beginning', () => {
        player1.canAct = jest.fn().mockReturnValue(true);
        player2.canAct = jest.fn().mockReturnValue(false);
        player3.canAct = jest.fn().mockReturnValue(false);

        const nextIndex = gameState.getNextActivePlayerIndex(2);
        expect(nextIndex).toBe(0);
      });

      test('should return -1 if no players can act', () => {
        player1.canAct = jest.fn().mockReturnValue(false);
        player2.canAct = jest.fn().mockReturnValue(false);
        player3.canAct = jest.fn().mockReturnValue(false);

        const nextIndex = gameState.getNextActivePlayerIndex(0);
        expect(nextIndex).toBe(-1);
      });

      test('should return -1 for empty players array', () => {
        gameState.players = [];
        expect(gameState.getNextActivePlayerIndex(0)).toBe(-1);
      });
    });
  });

  describe('Position Calculations', () => {
    beforeEach(() => {
      gameState.addPlayer(player1);
      gameState.addPlayer(player2);
      gameState.addPlayer(player3);
      gameState.dealerPosition = 0;
    });

    describe('moveButton', () => {
      test('should advance dealer position', () => {
        gameState.moveButton();
        expect(gameState.dealerPosition).toBe(1);
      });

      test('should skip players with no chips', () => {
        player2.chips = 0;
        gameState.moveButton();
        expect(gameState.dealerPosition).toBe(2);
      });

      test('should wrap around to beginning', () => {
        gameState.dealerPosition = 2;
        gameState.moveButton();
        expect(gameState.dealerPosition).toBe(0);
      });
    });

    describe('getSmallBlindPosition', () => {
      test('should return position after dealer', () => {
        expect(gameState.getSmallBlindPosition()).toBe(1);
      });

      test('should return dealer position in heads-up', () => {
        gameState.players = [player1, player2];
        expect(gameState.getSmallBlindPosition()).toBe(0);
      });

      test('should skip players with no chips', () => {
        player2.chips = 0;
        expect(gameState.getSmallBlindPosition()).toBe(2);
      });
    });

    describe('getBigBlindPosition', () => {
      test('should return position after small blind', () => {
        expect(gameState.getBigBlindPosition()).toBe(2);
      });

      test('should skip players with no chips', () => {
        player2.chips = 0;
        // SB is at 2, BB should be at 0 (wrapped)
        expect(gameState.getBigBlindPosition()).toBe(0);
      });
    });

    describe('getUTGPosition', () => {
      test('should return position after big blind', () => {
        expect(gameState.getUTGPosition()).toBe(0); // Wraps around
      });
    });
  });

  describe('Pot Management', () => {
    describe('getTotalPot', () => {
      test('should return main pot when no side pots', () => {
        gameState._internalPot = { main: 500, side: [] };
        expect(gameState.getTotalPot()).toBe(500);
      });

      test('should include side pots in total', () => {
        gameState._internalPot = {
          main: 500,
          side: [{ amount: 200 }, { amount: 100 }],
        };
        expect(gameState.getTotalPot()).toBe(800);
      });
    });

    describe('addToPot', () => {
      test('should add amount to main pot', () => {
        gameState.addToPot(100);
        expect(gameState._internalPot.main).toBe(100);
      });

      test('should track in pot history', () => {
        gameState.addToPot(100);
        gameState.addToPot(50);
        expect(gameState.potHistory).toEqual([100, 50]);
      });
    });

    describe('pot getter', () => {
      test('should return object that converts to number', () => {
        gameState._internalPot.main = 500;
        expect(+gameState.pot).toBe(500);
        expect(gameState.pot.main).toBe(500);
      });
    });

    describe('pot setter', () => {
      test('should set main pot when given number', () => {
        gameState.pot = 300;
        expect(gameState._internalPot.main).toBe(300);
      });

      test('should set full pot object when given object', () => {
        gameState.pot = { main: 400, side: [{ amount: 100 }] };
        expect(gameState._internalPot.main).toBe(400);
        expect(gameState._internalPot.side).toHaveLength(1);
      });
    });

    describe('calculateSidePots', () => {
      test('should calculate side pots for all-in players', () => {
        player1.isInHand = jest.fn().mockReturnValue(true);
        player2.isInHand = jest.fn().mockReturnValue(true);
        player3.isInHand = jest.fn().mockReturnValue(true);
        player1.totalPotContribution = 500;
        player2.totalPotContribution = 1000;
        player3.totalPotContribution = 1500;

        gameState.addPlayer(player1);
        gameState.addPlayer(player2);
        gameState.addPlayer(player3);

        gameState.calculateSidePots();

        expect(gameState._internalPot.main).toBe(1500); // 500 * 3
        expect(gameState._internalPot.side.length).toBeGreaterThan(0);
      });

      test('should handle empty contributions', () => {
        gameState.calculateSidePots();
        expect(gameState._internalPot.main).toBe(0);
      });
    });
  });

  describe('Phase Management', () => {
    describe('nextPhase', () => {
      test('should advance from PREFLOP to FLOP', () => {
        gameState.phase = GAME_PHASES.PREFLOP;
        gameState.nextPhase();
        expect(gameState.phase).toBe(GAME_PHASES.FLOP);
      });

      test('should advance from FLOP to TURN', () => {
        gameState.phase = GAME_PHASES.FLOP;
        gameState.nextPhase();
        expect(gameState.phase).toBe(GAME_PHASES.TURN);
      });

      test('should advance from TURN to RIVER', () => {
        gameState.phase = GAME_PHASES.TURN;
        gameState.nextPhase();
        expect(gameState.phase).toBe(GAME_PHASES.RIVER);
      });

      test('should advance from RIVER to SHOWDOWN', () => {
        gameState.phase = GAME_PHASES.RIVER;
        gameState.nextPhase();
        expect(gameState.phase).toBe(GAME_PHASES.SHOWDOWN);
      });

      test('should reset betting on phase change', () => {
        gameState.phase = GAME_PHASES.PREFLOP;
        gameState.currentBet = 100;
        gameState.minimumRaise = 50;

        gameState.nextPhase();

        expect(gameState.currentBet).toBe(0);
        expect(gameState.minimumRaise).toBe(0);
      });
    });
  });

  describe('Reset Methods', () => {
    describe('resetForNewHand', () => {
      beforeEach(() => {
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);
        player1.resetForNewHand = jest.fn();
        player2.resetForNewHand = jest.fn();
      });

      test('should clear community cards', () => {
        gameState.communityCards = [{ rank: 'A', suit: 's' }];
        gameState.resetForNewHand();
        expect(gameState.communityCards).toEqual([]);
      });

      test('should reset pot', () => {
        gameState._internalPot = { main: 500, side: [] };
        gameState.resetForNewHand();
        expect(gameState._internalPot.main).toBe(0);
      });

      test('should increment hand number', () => {
        gameState.handNumber = 5;
        gameState.resetForNewHand();
        expect(gameState.handNumber).toBe(6);
      });

      test('should set phase to PREFLOP', () => {
        gameState.phase = GAME_PHASES.SHOWDOWN;
        gameState.resetForNewHand();
        expect(gameState.phase).toBe(GAME_PHASES.PREFLOP);
      });

      test('should reset players for new hand', () => {
        gameState.resetForNewHand();
        expect(player1.resetForNewHand).toHaveBeenCalled();
        expect(player2.resetForNewHand).toHaveBeenCalled();
      });

      test('should set player to SITTING_OUT if no chips', () => {
        player2.chips = 0;
        gameState.resetForNewHand();
        expect(player2.status).toBe(PLAYER_STATUS.SITTING_OUT);
      });

      test('should clear winners', () => {
        gameState.winners = [{ player: player1 }];
        gameState.resetForNewHand();
        expect(gameState.winners).toEqual([]);
      });
    });
  });

  describe('Hand History', () => {
    test('should add action to history', () => {
      gameState.handNumber = 1;
      gameState.phase = GAME_PHASES.PREFLOP;

      gameState.addToHistory({ type: 'bet', amount: 50 });

      expect(gameState.handHistory).toHaveLength(1);
      expect(gameState.handHistory[0].handNumber).toBe(1);
      expect(gameState.handHistory[0].phase).toBe(GAME_PHASES.PREFLOP);
      expect(gameState.handHistory[0]._action).toEqual({ type: 'bet', amount: 50 });
      expect(gameState.handHistory[0].timestamp).toBeDefined();
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      gameState.addPlayer(player1);
      gameState.addPlayer(player2);
      player1.serialize = jest.fn().mockReturnValue({ id: 'p1', name: 'Alice' });
      player2.serialize = jest.fn().mockReturnValue({ id: 'p2', name: 'Bob' });
    });

    test('should serialize game state correctly', () => {
      gameState.phase = GAME_PHASES.FLOP;
      gameState._internalPot.main = 200;
      gameState.communityCards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
      ];

      const serialized = gameState.serialize();

      expect(serialized.phase).toBe(GAME_PHASES.FLOP);
      expect(serialized.players).toHaveLength(2);
      expect(serialized.communityCards).toHaveLength(3);
      expect(serialized.totalPot).toBe(200);
      expect(serialized.pot.main).toBe(200);
    });

    test('should include helper functions in serialized state', () => {
      const serialized = gameState.serialize();

      expect(typeof serialized.getTotalPot).toBe('function');
      expect(typeof serialized.getPlayersInHand).toBe('function');
      expect(typeof serialized.getActivePlayers).toBe('function');
    });
  });

  describe('Utility Methods', () => {
    describe('setCurrentBet', () => {
      test('should set current bet and minimum raise', () => {
        gameState.setCurrentBet(100, 50);

        expect(gameState.currentBet).toBe(100);
        expect(gameState._currentBet).toBe(100);
        expect(gameState.minimumRaise).toBe(50);
        expect(gameState.minRaise).toBe(50);
      });
    });

    describe('setCommunityCards', () => {
      test('should set community cards', () => {
        const cards = [{ rank: 'A', suit: 's' }];
        gameState.setCommunityCards(cards);
        expect(gameState.communityCards).toEqual(cards);
      });
    });

    describe('getCurrentPlayer', () => {
      test('should return player at current index', () => {
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);
        gameState.currentPlayerIndex = 1;

        expect(gameState.getCurrentPlayer()).toBe(player2);
      });
    });

    describe('isHandComplete', () => {
      test('should return true at showdown', () => {
        gameState.phase = GAME_PHASES.SHOWDOWN;
        expect(gameState.isHandComplete()).toBe(true);
      });

      test('should return true with one player in hand', () => {
        gameState.phase = GAME_PHASES.FLOP;
        gameState.addPlayer(player1);
        player1.isInHand = jest.fn().mockReturnValue(true);

        expect(gameState.isHandComplete()).toBe(true);
      });

      test('should return false with multiple players in hand', () => {
        gameState.phase = GAME_PHASES.FLOP;
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);
        player1.isInHand = jest.fn().mockReturnValue(true);
        player2.isInHand = jest.fn().mockReturnValue(true);

        expect(gameState.isHandComplete()).toBe(false);
      });
    });

    describe('toJSON', () => {
      test('should return serialized state', () => {
        player1.serialize = jest.fn().mockReturnValue({ id: 'p1' });
        gameState.addPlayer(player1);

        const json = gameState.toJSON();
        expect(json.players).toHaveLength(1);
      });
    });
  });
});
