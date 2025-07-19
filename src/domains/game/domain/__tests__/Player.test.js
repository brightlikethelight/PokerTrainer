import { PLAYER_STATUS, AI_PLAYER_TYPES } from '../../../../constants/game-constants';
import { createCards } from '../../../../test-utils/poker-test-helpers';
import Player from '../entities/Player';

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player('player1', 'John', 1000, 0);
  });

  describe('constructor', () => {
    it('should create a player with correct initial values', () => {
      expect(player.id).toBe('player1');
      expect(player.name).toBe('John');
      expect(player.chips).toBe(1000);
      expect(player._position).toBe(0);
      expect(player.cards).toEqual([]);
      expect(player._currentBet).toBe(0);
      expect(player.totalBetThisRound).toBe(0);
      expect(player.isActive).toBe(true);
      expect(player.isFolded).toBe(false);
      expect(player.isAllIn).toBe(false);
      expect(player.isDealer).toBe(false);
      expect(player.status).toBe(PLAYER_STATUS.WAITING);
    });

    it('should create an AI player when type is provided', () => {
      const aiPlayer = new Player('ai1', 'AI Player', 1000, 1, AI_PLAYER_TYPES.TAG);
      expect(aiPlayer.isAI).toBe(true);
      expect(aiPlayer.aiType).toBe(AI_PLAYER_TYPES.TAG);
    });

    it('should create a human player when no type is provided', () => {
      expect(player.isAI).toBe(false);
      expect(player.aiType).toBeUndefined();
    });
  });

  describe('receiveCards', () => {
    it('should set player cards', () => {
      const cards = createCards(['As', 'Kh']);
      player.receiveCards(cards);
      expect(player.cards).toEqual(cards);
    });

    it('should replace existing cards', () => {
      const cards1 = createCards(['As', 'Kh']);
      const cards2 = createCards(['Qd', 'Qc']);
      player.receiveCards(cards1);
      player.receiveCards(cards2);
      expect(player.cards).toEqual(cards2);
    });
  });

  describe('bet', () => {
    it('should deduct chips and set current bet', () => {
      player.bet(100);
      expect(player.chips).toBe(900);
      expect(player._currentBet).toBe(100);
      expect(player.totalBetThisRound).toBe(100);
    });

    it('should add to existing bet', () => {
      player.bet(100);
      player.bet(50);
      expect(player.chips).toBe(850);
      expect(player._currentBet).toBe(150);
      expect(player.totalBetThisRound).toBe(150);
    });

    it('should throw error if betting more than available chips', () => {
      expect(() => player.bet(1500)).toThrow('Insufficient chips');
    });

    it('should handle all-in correctly', () => {
      player.bet(1000);
      expect(player.chips).toBe(0);
      expect(player._currentBet).toBe(1000);
      expect(player.isAllIn).toBe(true);
    });
  });

  describe('fold', () => {
    it('should mark player as folded', () => {
      player.fold();
      expect(player.isFolded).toBe(true);
      expect(player.status).toBe(PLAYER_STATUS.FOLDED);
    });

    it('should clear cards when folding', () => {
      player.receiveCards(createCards(['As', 'Kh']));
      player.fold();
      expect(player.cards).toEqual([]);
    });
  });

  describe('check', () => {
    it('should set status to checked', () => {
      player.check();
      expect(player.status).toBe(PLAYER_STATUS.CHECKED);
    });
  });

  describe('call', () => {
    it('should match the call amount', () => {
      player.call(100);
      expect(player.chips).toBe(900);
      expect(player._currentBet).toBe(100);
      expect(player.status).toBe(PLAYER_STATUS.CALLED);
    });

    it('should handle all-in when calling', () => {
      player.call(1500); // More than player's chips
      expect(player.chips).toBe(0);
      expect(player._currentBet).toBe(1000);
      expect(player.isAllIn).toBe(true);
      expect(player.status).toBe(PLAYER_STATUS.ALL_IN);
    });
  });

  describe('raise', () => {
    it('should raise to the specified amount', () => {
      player.currentBet = 50;
      player.chips = 950;
      player.raise(200);
      expect(player.chips).toBe(800);
      expect(player._currentBet).toBe(200);
      expect(player.status).toBe(PLAYER_STATUS.RAISED);
    });

    it('should throw error if raise amount is less than current bet', () => {
      player._currentBet = 100;
      expect(() => player.raise(50)).toThrow('Raise amount must be greater than current bet');
    });
  });

  describe('winPot', () => {
    it('should add winnings to chips', () => {
      player.winPot(500);
      expect(player.chips).toBe(1500);
    });

    it('should handle negative amounts', () => {
      expect(() => player.winPot(-100)).toThrow();
    });
  });

  describe('resetForNewHand', () => {
    it('should reset all _hand-specific values', () => {
      player.cards = createCards(['As', 'Kh']);
      player.currentBet = 100;
      player.totalBetThisRound = 100;
      player.isFolded = true;
      player.isAllIn = true;
      player.status = PLAYER_STATUS.FOLDED;

      player.resetForNewHand();

      expect(player.cards).toEqual([]);
      expect(player._currentBet).toBe(0);
      expect(player.totalBetThisRound).toBe(0);
      expect(player.isFolded).toBe(false);
      expect(player.isAllIn).toBe(false);
      expect(player.status).toBe(PLAYER_STATUS.WAITING);
    });

    it('should not reset chips or position', () => {
      const originalChips = player.chips;
      const originalPosition = player.position;

      player.resetForNewHand();

      expect(player.chips).toBe(originalChips);
      expect(player._position).toBe(originalPosition);
    });
  });

  describe('resetBettingRound', () => {
    it('should reset current bet and status', () => {
      player.currentBet = 100;
      player.status = PLAYER_STATUS.RAISED;

      player.resetBettingRound();

      expect(player._currentBet).toBe(0);
      expect(player.status).toBe(PLAYER_STATUS.WAITING);
    });

    it('should not reset folded or all-in status', () => {
      player.isFolded = true;
      player.resetBettingRound();
      expect(player.isFolded).toBe(true);

      player.isFolded = false;
      player.isAllIn = true;
      player.resetBettingRound();
      expect(player.isAllIn).toBe(true);
    });
  });

  describe('isInHand', () => {
    it('should return true for active player', () => {
      expect(player.isInHand()).toBe(true);
    });

    it('should return false for folded player', () => {
      player.fold();
      expect(player.isInHand()).toBe(false);
    });

    it('should return false for inactive player', () => {
      player.isActive = false;
      expect(player.isInHand()).toBe(false);
    });

    it('should return true for all-in player', () => {
      player.bet(1000);
      expect(player.isInHand()).toBe(true);
    });
  });

  describe('canAct', () => {
    it('should return true for active player with chips', () => {
      expect(player.canAct()).toBe(true);
    });

    it('should return false for folded player', () => {
      player.fold();
      expect(player.canAct()).toBe(false);
    });

    it('should return false for all-in player', () => {
      player.bet(1000);
      expect(player.canAct()).toBe(false);
    });

    it('should return false for inactive player', () => {
      player.isActive = false;
      expect(player.canAct()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize player data correctly', () => {
      player.receiveCards(createCards(['As', 'Kh']));
      player.bet(100);

      const json = player.toJSON();

      expect(json).toEqual({
        id: 'player1',
        name: 'John',
        chips: 900,
        _position: 0,
        cards: player.cards,
        _currentBet: 100,
        totalBetThisRound: 100,
        isActive: true,
        isFolded: false,
        isAllIn: false,
        isDealer: false,
        status: PLAYER_STATUS.WAITING,
        isAI: false,
        aiType: undefined,
      });
    });
  });
});
