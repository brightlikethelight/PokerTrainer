import Player from '../Player';
import { PLAYER_STATUS } from '../../../constants/game-constants';

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player('p1', 'Alice', 1000, 2);
  });

  describe('constructor', () => {
    it('sets default properties', () => {
      expect(player.id).toBe('p1');
      expect(player.name).toBe('Alice');
      expect(player.chips).toBe(1000);
      expect(player.position).toBe(2);
      expect(player._position).toBe(2);
      expect(player.isAI).toBe(false);
      expect(player.aiType).toBeUndefined();
      expect(player.holeCards).toEqual([]);
      expect(player.cards).toEqual([]);
      expect(player.status).toBe(PLAYER_STATUS.WAITING);
      expect(player._currentBet).toBe(0);
      expect(player.totalPotContribution).toBe(0);
      expect(player.lastAction).toBeNull();
      expect(player.isFolded).toBe(false);
      expect(player.isAllIn).toBe(false);
      expect(player.isDealer).toBe(false);
    });

    it('handles explicit AI parameters', () => {
      const bot = new Player('b1', 'Bot', 500, 0, true, 'tight-aggressive');
      expect(bot.isAI).toBe(true);
      expect(bot.aiType).toBe('tight-aggressive');
    });

    it('handles old-style string isAI param as aiType', () => {
      const bot = new Player('b1', 'Bot', 500, 0, 'loose-passive');
      expect(bot.isAI).toBe(true);
      expect(bot.aiType).toBe('loose-passive');
    });

    it('defaults position to null', () => {
      const p = new Player('x', 'X', 100);
      expect(p.position).toBeNull();
    });
  });

  describe('currentBet getter/setter', () => {
    it('reads from _currentBet', () => {
      player._currentBet = 42;
      expect(player.currentBet).toBe(42);
    });

    it('writes to _currentBet', () => {
      player.currentBet = 99;
      expect(player._currentBet).toBe(99);
    });
  });

  describe('placeBet', () => {
    it('deducts chips and updates bet trackers', () => {
      const result = player.placeBet(200);
      expect(result).toBe(200);
      expect(player.chips).toBe(800);
      expect(player._currentBet).toBe(200);
      expect(player.totalBetThisRound).toBe(200);
      expect(player.totalPotContribution).toBe(200);
    });

    it('sets all-in when betting exact remaining chips', () => {
      player.placeBet(1000);
      expect(player.chips).toBe(0);
      expect(player.status).toBe(PLAYER_STATUS.ALL_IN);
      expect(player.isAllIn).toBe(true);
    });

    it('throws on negative amount', () => {
      expect(() => player.placeBet(-1)).toThrow('Bet amount cannot be negative');
    });

    it('throws when amount exceeds chips', () => {
      expect(() => player.placeBet(1001)).toThrow('Insufficient chips');
    });

    it('accumulates across multiple calls', () => {
      player.placeBet(100);
      player.placeBet(150);
      expect(player.chips).toBe(750);
      expect(player._currentBet).toBe(250);
      expect(player.totalPotContribution).toBe(250);
    });
  });

  describe('fold', () => {
    it('sets folded state and clears cards', () => {
      player.setHoleCards([{ rank: 'A', suit: 'spades' }]);
      player.fold();
      expect(player.status).toBe(PLAYER_STATUS.FOLDED);
      expect(player.lastAction).toBe('fold');
      expect(player.isFolded).toBe(true);
      expect(player.holeCards).toEqual([]);
    });
  });

  describe('check', () => {
    it('sets checked status and lastAction', () => {
      player.check();
      expect(player.status).toBe(PLAYER_STATUS.CHECKED);
      expect(player.lastAction).toBe('check');
    });
  });

  describe('call', () => {
    it('places bet and sets called status', () => {
      const result = player.call(200);
      expect(result).toBe(200);
      expect(player.chips).toBe(800);
      expect(player.status).toBe(PLAYER_STATUS.CALLED);
      expect(player.lastAction).toBe('call');
    });

    it('goes all-in when call amount exceeds chips', () => {
      const shortStack = new Player('s1', 'Short', 50, 0);
      const result = shortStack.call(200);
      expect(result).toBe(50);
      expect(shortStack.chips).toBe(0);
      expect(shortStack.status).toBe(PLAYER_STATUS.ALL_IN);
      expect(shortStack.lastAction).toBe('call');
    });
  });

  describe('raise', () => {
    it('raises to target amount above current bet', () => {
      player.placeBet(100); // current bet = 100
      const result = player.raise(300); // raise TO 300
      expect(result).toBe(200); // additional 200
      expect(player._currentBet).toBe(300);
      expect(player.lastAction).toBe('raise');
      expect(player.status).toBe(PLAYER_STATUS.RAISED);
    });

    it('throws when raise amount is not above current bet', () => {
      player.placeBet(100);
      expect(() => player.raise(100)).toThrow('Raise amount must be greater than current bet');
      expect(() => player.raise(50)).toThrow('Raise amount must be greater than current bet');
    });
  });

  describe('bet', () => {
    it('delegates to placeBet and sets lastAction', () => {
      const result = player.bet(300);
      expect(result).toBe(300);
      expect(player.chips).toBe(700);
      expect(player.lastAction).toBe('bet');
    });
  });

  describe('winPot', () => {
    it('adds chips and updates win stats', () => {
      player.winPot(500);
      expect(player.chips).toBe(1500);
      expect(player.stats.handsWon).toBe(1);
      expect(player.stats.totalWinnings).toBe(500);
      expect(player.stats.biggestPotWon).toBe(500);
    });

    it('tracks biggest pot correctly', () => {
      player.winPot(200);
      player.winPot(800);
      player.winPot(300);
      expect(player.stats.biggestPotWon).toBe(800);
    });

    it('throws on negative amount', () => {
      expect(() => player.winPot(-1)).toThrow('Win amount cannot be negative');
    });
  });

  describe('resetForNewHand', () => {
    it('clears round state and increments handsPlayed', () => {
      player.placeBet(200);
      player.fold();
      player.resetForNewHand();

      expect(player.holeCards).toEqual([]);
      expect(player.status).toBe(PLAYER_STATUS.WAITING);
      expect(player._currentBet).toBe(0);
      expect(player.totalBetThisRound).toBe(0);
      expect(player.totalPotContribution).toBe(0);
      expect(player.lastAction).toBeNull();
      expect(player.isActive).toBe(true);
      expect(player.isFolded).toBe(false);
      expect(player.isAllIn).toBe(false);
      expect(player.stats.handsPlayed).toBe(1);
    });
  });

  describe('canAct', () => {
    it('returns true for active player with chips', () => {
      player.status = PLAYER_STATUS.WAITING;
      expect(player.canAct()).toBe(true);
    });

    it('returns false when folded', () => {
      player.fold();
      expect(player.canAct()).toBe(false);
    });

    it('returns false when all-in', () => {
      player.placeBet(1000);
      expect(player.canAct()).toBe(false);
    });

    it('returns false when chips are zero', () => {
      player.chips = 0;
      expect(player.canAct()).toBe(false);
    });
  });

  describe('isInHand', () => {
    it('returns true for active player', () => {
      expect(player.isInHand()).toBe(true);
    });

    it('returns true for all-in player', () => {
      player.status = PLAYER_STATUS.ALL_IN;
      expect(player.isInHand()).toBe(true);
    });

    it('returns false when folded', () => {
      player.fold();
      expect(player.isInHand()).toBe(false);
    });

    it('returns false when sitting out', () => {
      player.status = PLAYER_STATUS.SITTING_OUT;
      expect(player.isInHand()).toBe(false);
    });
  });

  describe('serialize', () => {
    it('returns correct shape for human player', () => {
      player.setHoleCards([
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
      ]);
      player.placeBet(50);
      const s = player.serialize();

      expect(s).toEqual({
        id: 'p1',
        name: 'Alice',
        chips: 950,
        position: 2,
        isAI: false,
        aiType: undefined,
        status: PLAYER_STATUS.WAITING,
        currentBet: 50,
        lastAction: null,
        hasCards: true,
        holeCards: [
          { rank: 'A', suit: 'spades' },
          { rank: 'K', suit: 'hearts' },
        ],
      });
    });

    it('hides hole cards for AI players', () => {
      const bot = new Player('b1', 'Bot', 500, 0, true, 'TAG');
      bot.setHoleCards([{ rank: '2', suit: 'clubs' }]);
      expect(bot.serialize().holeCards).toBeNull();
      expect(bot.serialize().hasCards).toBe(true);
    });
  });

  describe('updateStats', () => {
    it('increments vpip on preflop non-fold', () => {
      player.updateStats('call', 'preflop');
      expect(player.stats.vpip).toBe(1);
    });

    it('does not increment vpip on preflop fold', () => {
      player.updateStats('fold', 'preflop');
      expect(player.stats.vpip).toBe(0);
    });

    it('increments pfr on preflop raise', () => {
      player.updateStats('raise', 'preflop');
      expect(player.stats.pfr).toBe(1);
    });

    it('increments aggression on bet or raise any phase', () => {
      player.updateStats('bet', 'flop');
      player.updateStats('raise', 'turn');
      expect(player.stats.aggression).toBe(2);
    });

    it('does not increment aggression on call or check', () => {
      player.updateStats('call', 'flop');
      player.updateStats('check', 'turn');
      expect(player.stats.aggression).toBe(0);
    });
  });
});
