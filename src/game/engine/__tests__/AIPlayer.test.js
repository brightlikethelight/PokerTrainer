import AIPlayer from '../AIPlayer';

// --- Mock helpers ---

function card(rank, suit) {
  const RANK_VALUES = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  return { rank, suit, value: RANK_VALUES[rank] };
}

function makeGameState(overrides = {}) {
  return {
    currentBet: 20,
    totalPot: 100,
    blinds: { big: 20, small: 10 },
    minimumRaise: 20,
    phase: 'preflop',
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    id: 'bot1',
    aiType: 'tight-aggressive',
    isAI: true,
    position: 2,
    chips: 1000,
    currentBet: 0,
    canAct: () => true,
    ...overrides,
  };
}

// --- Tests ---

describe('AIPlayer', () => {
  // -----------------------------------------------
  // evaluateHandStrength
  // -----------------------------------------------
  describe('evaluateHandStrength', () => {
    it('rates premium pair (AA) >= 0.9 preflop', () => {
      const strength = AIPlayer.evaluateHandStrength(
        [card('A', 's'), card('A', 'h')],
        [],
        'preflop'
      );
      expect(strength).toBeGreaterThanOrEqual(0.9);
    });

    it('rates medium pair (99) around 0.7 preflop', () => {
      const strength = AIPlayer.evaluateHandStrength(
        [card('9', 's'), card('9', 'h')],
        [],
        'preflop'
      );
      expect(strength).toBeCloseTo(0.7, 1);
    });

    it('rates low pair (55) around 0.5 preflop', () => {
      const strength = AIPlayer.evaluateHandStrength(
        [card('5', 's'), card('5', 'h')],
        [],
        'preflop'
      );
      expect(strength).toBeCloseTo(0.5, 1);
    });

    it('rates AK >= 0.8 preflop', () => {
      const strength = AIPlayer.evaluateHandStrength(
        [card('A', 's'), card('K', 'h')],
        [],
        'preflop'
      );
      expect(strength).toBeGreaterThanOrEqual(0.8);
    });

    it('rates junk hand (72o) <= 0.3 preflop', () => {
      const strength = AIPlayer.evaluateHandStrength(
        [card('7', 's'), card('2', 'h')],
        [],
        'preflop'
      );
      expect(strength).toBeLessThanOrEqual(0.3);
    });

    it('returns 0 when holeCards is null', () => {
      expect(AIPlayer.evaluateHandStrength(null, [], 'preflop')).toBe(0);
    });

    it('returns 0 when holeCards has fewer than 2 cards', () => {
      expect(AIPlayer.evaluateHandStrength([card('A', 's')], [], 'preflop')).toBe(0);
    });

    it('delegates to calculatePostFlopStrength on flop/turn/river', () => {
      const holeCards = [card('A', 's'), card('K', 's')];
      const community = [card('A', 'h'), card('7', 'd'), card('2', 'c')];
      const strength = AIPlayer.evaluateHandStrength(holeCards, community, 'flop');
      // Top pair with AK on A-high board → should get top pair strength 0.65
      expect(strength).toBeGreaterThanOrEqual(0.6);
    });
  });

  // -----------------------------------------------
  // Helper methods
  // -----------------------------------------------
  describe('hasTopPair', () => {
    it('returns true when hole card matches highest community card', () => {
      const holeCards = [card('K', 's'), card('9', 'h')];
      const community = [card('K', 'd'), card('7', 'c'), card('3', 's')];
      expect(AIPlayer.hasTopPair(holeCards, community)).toBe(true);
    });

    it('returns false when no hole card matches top community card', () => {
      const holeCards = [card('9', 's'), card('8', 'h')];
      const community = [card('K', 'd'), card('7', 'c'), card('3', 's')];
      expect(AIPlayer.hasTopPair(holeCards, community)).toBe(false);
    });

    it('returns false with empty community cards', () => {
      expect(AIPlayer.hasTopPair([card('A', 's'), card('K', 'h')], [])).toBe(false);
    });
  });

  describe('hasTwoPair', () => {
    it('returns true with 2+ pairs in combined cards', () => {
      const cards = [
        card('K', 's'),
        card('9', 'h'),
        card('K', 'd'),
        card('9', 'c'),
        card('3', 's'),
      ];
      expect(AIPlayer.hasTwoPair(cards)).toBe(true);
    });

    it('returns false with only one pair', () => {
      const cards = [
        card('K', 's'),
        card('9', 'h'),
        card('K', 'd'),
        card('7', 'c'),
        card('3', 's'),
      ];
      expect(AIPlayer.hasTwoPair(cards)).toBe(false);
    });
  });

  describe('hasSet', () => {
    it('returns true when pocket pair matches a board card', () => {
      const holeCards = [card('9', 's'), card('9', 'h')];
      const community = [card('9', 'd'), card('K', 'c'), card('3', 's')];
      expect(AIPlayer.hasSet(holeCards, community)).toBe(true);
    });

    it('returns false when hole cards are not a pair', () => {
      const holeCards = [card('A', 's'), card('K', 'h')];
      const community = [card('A', 'd'), card('K', 'c'), card('3', 's')];
      expect(AIPlayer.hasSet(holeCards, community)).toBe(false);
    });
  });

  describe('hasFlushDraw', () => {
    it('returns true with 4 cards of the same suit', () => {
      const cards = [
        card('A', 's'),
        card('K', 's'),
        card('9', 's'),
        card('4', 's'),
        card('7', 'd'),
      ];
      expect(AIPlayer.hasFlushDraw(cards)).toBe(true);
    });

    it('returns false with only 3 of the same suit', () => {
      const cards = [
        card('A', 's'),
        card('K', 's'),
        card('9', 's'),
        card('4', 'd'),
        card('7', 'd'),
      ];
      expect(AIPlayer.hasFlushDraw(cards)).toBe(false);
    });
  });

  describe('hasStraightDraw', () => {
    it('returns true with 4 consecutive values', () => {
      const cards = [
        card('9', 's'),
        card('T', 'h'),
        card('J', 'd'),
        card('Q', 'c'),
        card('3', 's'),
      ];
      expect(AIPlayer.hasStraightDraw(cards)).toBe(true);
    });

    it('returns false without 4 consecutive values', () => {
      const cards = [
        card('2', 's'),
        card('5', 'h'),
        card('9', 'd'),
        card('K', 'c'),
        card('A', 's'),
      ];
      expect(AIPlayer.hasStraightDraw(cards)).toBe(false);
    });
  });

  // -----------------------------------------------
  // getDefaultAction
  // -----------------------------------------------
  describe('getDefaultAction', () => {
    it('returns check when check is available', () => {
      const result = AIPlayer.getDefaultAction(['check', 'fold'], makeGameState(), makePlayer());
      expect(result).toEqual({ action: 'check', amount: 0 });
    });

    it('returns call when pot odds > 3', () => {
      // potOdds = totalPot / callAmount = 200 / 20 = 10 > 3
      const result = AIPlayer.getDefaultAction(
        ['call', 'fold'],
        makeGameState({ totalPot: 200, currentBet: 40 }),
        makePlayer({ currentBet: 20 })
      );
      expect(result).toEqual({ action: 'call', amount: 20 });
    });

    it('returns fold when pot odds are poor', () => {
      // potOdds = 10 / 50 = 0.2 < 3
      const result = AIPlayer.getDefaultAction(
        ['call', 'fold'],
        makeGameState({ totalPot: 10, currentBet: 50 }),
        makePlayer({ currentBet: 0 })
      );
      expect(result).toEqual({ action: 'fold', amount: 0 });
    });

    it('does NOT throw when callAmount is 0 (division-by-zero regression)', () => {
      // currentBet === player.currentBet → callAmount = 0
      const result = AIPlayer.getDefaultAction(
        ['fold'],
        makeGameState({ currentBet: 20 }),
        makePlayer({ currentBet: 20 })
      );
      // callAmount <= 0 path: no 'check' in validActions → fold
      expect(result).toEqual({ action: 'fold', amount: 0 });
    });

    it('returns fold (not check) when callAmount <= 0 and check is unavailable', () => {
      const result = AIPlayer.getDefaultAction(
        ['call', 'fold'],
        makeGameState({ currentBet: 10 }),
        makePlayer({ currentBet: 10 })
      );
      expect(result).toEqual({ action: 'fold', amount: 0 });
    });
  });

  // -----------------------------------------------
  // Type-specific action methods
  // -----------------------------------------------
  describe('getTightAggressiveAction', () => {
    const defaultContext = { positionType: 'middle', isInPosition: false, isPreflop: true };

    it('folds weak hands when no check available', () => {
      const result = AIPlayer.getTightAggressiveAction(
        0.1,
        ['call', 'fold', 'raise'],
        makeGameState(),
        makePlayer(),
        defaultContext
      );
      expect(result.action).toBe('fold');
    });

    it('raises with strong hands', () => {
      const result = AIPlayer.getTightAggressiveAction(
        0.85,
        ['call', 'fold', 'raise'],
        makeGameState(),
        makePlayer(),
        defaultContext
      );
      expect(result.action).toBe('raise');
      expect(result.amount).toBeGreaterThan(0);
    });

    it('checks weak hands when check is available', () => {
      const result = AIPlayer.getTightAggressiveAction(
        0.1,
        ['check', 'bet'],
        makeGameState({ currentBet: 0 }),
        makePlayer(),
        defaultContext
      );
      expect(result.action).toBe('check');
    });
  });

  describe('getLooseAggressiveAction', () => {
    it('raises more liberally than TAG', () => {
      // Seed Math.random to return 0 (no bluff), but hand is medium-strong
      // LAG raiseThreshold (out of position) = 0.5 so 0.55 should raise
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const context = { positionType: 'middle', isInPosition: false, isPreflop: false };
      const result = AIPlayer.getLooseAggressiveAction(
        0.55,
        ['call', 'fold', 'raise'],
        makeGameState(),
        makePlayer(),
        context
      );
      expect(result.action).toBe('raise');
      Math.random.mockRestore();
    });

    it('sometimes bluffs even with weak hands', () => {
      // Force random to trigger bluff
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const context = { positionType: 'middle', isInPosition: false, isPreflop: false };
      const result = AIPlayer.getLooseAggressiveAction(
        0.1,
        ['call', 'fold', 'raise'],
        makeGameState(),
        makePlayer(),
        context
      );
      // bluffFrequency = 0.3, random = 0.1 < 0.3 → bluff raise
      expect(result.action).toBe('raise');
      Math.random.mockRestore();
    });
  });

  describe('getTightPassiveAction', () => {
    const defaultContext = { positionType: 'middle', isInPosition: false, isPreflop: true };

    it('prefers calling over raising with strong-ish hands', () => {
      // strength 0.6 is above call threshold (0.5) but below bet threshold (0.8)
      const result = AIPlayer.getTightPassiveAction(
        0.6,
        ['call', 'fold', 'raise'],
        makeGameState({ currentBet: 20, totalPot: 200 }),
        makePlayer({ currentBet: 0 }),
        defaultContext
      );
      // callAmount=20, potRatio check: 20 <= 200*0.2=40 → call
      expect(result.action).toBe('call');
    });

    it('folds medium hands facing large bets', () => {
      // strength 0.6, callAmount=100, potRatio: 100 > 200*0.2=40 → not met
      const result = AIPlayer.getTightPassiveAction(
        0.6,
        ['call', 'fold'],
        makeGameState({ currentBet: 100, totalPot: 200 }),
        makePlayer({ currentBet: 0 }),
        defaultContext
      );
      expect(result.action).toBe('fold');
    });
  });

  describe('getLoosePassiveAction', () => {
    const defaultContext = { positionType: 'middle', isInPosition: false, isPreflop: true };

    it('calls with wide range (calling station behavior)', () => {
      // strength 0.25 is above LP call threshold (0.2)
      // callAmount=20, potRatio: 20 <= 200*0.4=80 → call
      const result = AIPlayer.getLoosePassiveAction(
        0.25,
        ['call', 'fold'],
        makeGameState({ currentBet: 20, totalPot: 200 }),
        makePlayer({ currentBet: 0 }),
        defaultContext
      );
      expect(result.action).toBe('call');
    });

    it('folds only very weak hands', () => {
      // strength 0.1 is below LP call threshold (0.2)
      const result = AIPlayer.getLoosePassiveAction(
        0.1,
        ['call', 'fold'],
        makeGameState(),
        makePlayer(),
        defaultContext
      );
      expect(result.action).toBe('fold');
    });

    it('rarely bets — only with very strong hands', () => {
      // strength 0.6 is below LP bet threshold (0.7) → should not bet
      const result = AIPlayer.getLoosePassiveAction(
        0.6,
        ['check', 'bet'],
        makeGameState({ currentBet: 0 }),
        makePlayer(),
        defaultContext
      );
      // 0.6 >= callThreshold 0.2, check is available → check
      expect(result.action).toBe('check');
    });
  });

  // -----------------------------------------------
  // Post-flop strength & helper edge cases
  // -----------------------------------------------
  describe('calculatePostFlopStrength', () => {
    it('returns 0.9 for a set (pocket pair + matching community card)', () => {
      const holeCards = [card('T', 's'), card('T', 'h')];
      const community = [card('T', 'd'), card('7', 'c'), card('2', 's')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, community)).toBe(0.9);
    });

    it('returns 0.75 for two pair', () => {
      const holeCards = [card('K', 's'), card('9', 'h')];
      const community = [card('K', 'd'), card('9', 'c'), card('3', 's')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, community)).toBe(0.75);
    });

    it('returns 0.65 for top pair', () => {
      const holeCards = [card('A', 's'), card('6', 'h')];
      const community = [card('A', 'd'), card('9', 'c'), card('3', 's')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, community)).toBe(0.65);
    });

    it('returns 0.55 for flush draw + straight draw', () => {
      // 4 spades → flush draw; 7-8-9-T consecutive → straight draw
      const holeCards = [card('8', 's'), card('9', 's')];
      const community = [card('T', 's'), card('7', 's'), card('2', 'h')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, community)).toBe(0.55);
    });

    it('returns 0.45 for flush draw only', () => {
      // 4 spades → flush draw; no 4 consecutive values
      const holeCards = [card('A', 's'), card('3', 's')];
      const community = [card('8', 's'), card('5', 's'), card('K', 'd')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, community)).toBe(0.45);
    });

    it('returns 0.45 for straight draw only', () => {
      // 5-6-7-8 consecutive → straight draw; no 4 of same suit
      const holeCards = [card('5', 's'), card('6', 'h')];
      const community = [card('7', 'd'), card('8', 'c'), card('K', 's')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, community)).toBe(0.45);
    });

    it('returns 0.25 when no pair, no draw', () => {
      const holeCards = [card('2', 's'), card('4', 'h')];
      const community = [card('9', 'd'), card('K', 'c'), card('J', 's')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, community)).toBe(0.25);
    });

    it('returns 0.3 with empty community cards', () => {
      const holeCards = [card('A', 's'), card('K', 'h')];
      expect(AIPlayer.calculatePostFlopStrength(holeCards, [])).toBe(0.3);
    });
  });

  describe('hasFlushDraw – additional cases', () => {
    it('returns true with 5 suited cards (already a flush)', () => {
      const cards = [
        card('A', 's'),
        card('K', 's'),
        card('9', 's'),
        card('4', 's'),
        card('7', 's'),
      ];
      expect(AIPlayer.hasFlushDraw(cards)).toBe(true);
    });
  });

  describe('hasStraightDraw – additional cases', () => {
    it('returns false when values have a gap in the sequence', () => {
      // 5, 6, 8, 9 — gap at 7 breaks any run of 4
      const cards = [
        card('5', 's'),
        card('6', 'h'),
        card('8', 'd'),
        card('9', 'c'),
        card('K', 's'),
      ];
      expect(AIPlayer.hasStraightDraw(cards)).toBe(false);
    });
  });

  describe('hasTopPair – additional cases', () => {
    it('returns true when second hole card matches highest community card', () => {
      const holeCards = [card('3', 's'), card('A', 'h')];
      const community = [card('A', 'd'), card('9', 'c'), card('5', 's')];
      expect(AIPlayer.hasTopPair(holeCards, community)).toBe(true);
    });

    it('returns false when hole card matches non-top community card', () => {
      const holeCards = [card('9', 's'), card('5', 'h')];
      const community = [card('A', 'd'), card('9', 'c'), card('3', 's')];
      expect(AIPlayer.hasTopPair(holeCards, community)).toBe(false);
    });
  });

  describe('hasTwoPair – additional cases', () => {
    it('returns false with no pairs at all', () => {
      const cards = [
        card('A', 's'),
        card('K', 'h'),
        card('Q', 'd'),
        card('J', 'c'),
        card('9', 's'),
      ];
      expect(AIPlayer.hasTwoPair(cards)).toBe(false);
    });
  });

  describe('hasSet – additional cases', () => {
    it('returns false when pocket pair has no match on board', () => {
      const holeCards = [card('8', 's'), card('8', 'h')];
      const community = [card('A', 'd'), card('K', 'c'), card('3', 's')];
      expect(AIPlayer.hasSet(holeCards, community)).toBe(false);
    });
  });
});
