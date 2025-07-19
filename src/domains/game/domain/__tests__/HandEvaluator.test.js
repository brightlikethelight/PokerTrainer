import { HAND_RANKINGS } from '../../../../constants/game-constants';
import { createCards } from '../../../../test-utils/poker-test-helpers';
import HandEvaluator from '../services/HandEvaluator';

describe('HandEvaluator', () => {
  describe('evaluate', () => {
    it('should evaluate royal flush', () => {
      const cards = createCards(['As', 'Ks', 'Qs', 'Js', 'Ts', '9s', '8s']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
      expect(result.description).toBe('Royal Flush');
      expect(result.cards).toHaveLength(5);
      expect(result.cards.map((c) => c.toString())).toEqual(['As', 'Ks', 'Qs', 'Js', 'Ts']);
    });

    it('should evaluate straight flush', () => {
      const cards = createCards(['9h', '8h', '7h', '6h', '5h', '4h', '3h']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.STRAIGHT_FLUSH);
      expect(result.description).toBe('Straight Flush, Nine high');
    });

    it('should evaluate four of a kind', () => {
      const cards = createCards(['Kh', 'Ks', 'Kd', 'Kc', 'Ah', '2s', '3d']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.FOUR_OF_A_KIND);
      expect(result.description).toBe('Four of a Kind, Kings');
    });

    it('should evaluate full house', () => {
      const cards = createCards(['Ah', 'As', 'Ad', '8h', '8s', 'Kd', 'Qc']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.FULL_HOUSE);
      expect(result.description).toBe('Full House, Aces full of Eights');
    });

    it('should evaluate flush', () => {
      const cards = createCards(['Kd', 'Jd', '9d', '7d', '5d', 'Ah', '2s']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.FLUSH);
      expect(result.description).toContain('Flush');
    });

    it('should evaluate straight', () => {
      const cards = createCards(['9h', '8s', '7d', '6c', '5h', 'Ah', 'Kd']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.STRAIGHT);
      expect(result.description).toBe('Straight, Nine high');
    });

    it('should evaluate ace-low straight (wheel)', () => {
      const cards = createCards(['Ah', '5s', '4d', '3c', '2h', 'Kh', 'Qd']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.STRAIGHT);
      expect(result.description).toBe('Straight, Five high');
    });

    it('should evaluate three of a kind', () => {
      const cards = createCards(['Qh', 'Qs', 'Qd', '9h', '7s', '5d', '3c']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.THREE_OF_A_KIND);
      expect(result.description).toBe('Three of a Kind, Queens');
    });

    it('should evaluate two pair', () => {
      const cards = createCards(['Kh', 'Ks', '9h', '9s', '5d', '3c', '2h']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.TWO_PAIR);
      expect(result.description).toBe('Two Pair, Kings and Nines');
    });

    it('should evaluate one pair', () => {
      const cards = createCards(['Ah', 'As', 'Kh', 'Qd', '9s', '7h', '5c']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.PAIR);
      expect(result.description).toBe('Pair of Aces');
    });

    it('should evaluate high card', () => {
      const cards = createCards(['Ah', 'Kd', 'Qh', 'Js', '9h', '7d', '5c']);
      const result = HandEvaluator.evaluateHand(cards);

      expect(result.rank).toBe(HAND_RANKINGS.HIGH_CARD);
      expect(result.description).toBe('High Card, Ace');
    });
  });

  describe('compareHands', () => {
    it('should correctly compare different hand rankings', () => {
      const flush = HandEvaluator.evaluateHand(
        createCards(['Kh', 'Jh', '9h', '7h', '5h', 'Ad', '2s'])
      );
      const straight = HandEvaluator.evaluateHand(
        createCards(['9h', '8s', '7d', '6c', '5h', 'Ah', 'Kd'])
      );

      expect(HandEvaluator.compareHands(flush, straight)).toBeGreaterThan(0);
      expect(HandEvaluator.compareHands(straight, flush)).toBeLessThan(0);
    });

    it('should correctly compare same ranking by high cards', () => {
      const pair1 = HandEvaluator.evaluateHand(createCards(['Ah', 'As', 'Kh', 'Qd', '9s']));
      const pair2 = HandEvaluator.evaluateHand(createCards(['Kh', 'Ks', 'Qh', 'Jd', 'Ts']));

      expect(HandEvaluator.compareHands(pair1, pair2)).toBeGreaterThan(0);
    });

    it('should correctly compare kickers', () => {
      const pair1 = HandEvaluator.evaluateHand(createCards(['Ah', 'Ad', 'Kh', 'Qd', 'Js']));
      const pair2 = HandEvaluator.evaluateHand(createCards(['Ah', 'Ad', 'Kh', 'Qd', 'Ts']));

      expect(HandEvaluator.compareHands(pair1, pair2)).toBeGreaterThan(0);
    });

    it('should return 0 for equal hands', () => {
      const hand1 = HandEvaluator.evaluateHand(createCards(['Ah', 'Kh', 'Qh', 'Jh', 'Th']));
      const hand2 = HandEvaluator.evaluateHand(createCards(['As', 'Ks', 'Qs', 'Js', 'Ts']));

      expect(HandEvaluator.compareHands(hand1, hand2)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle less than 5 cards', () => {
      const cards = createCards(['Ah', 'Kh', 'Qh']);
      expect(() => HandEvaluator.evaluateHand(cards)).toThrow('Need at least 5 cards');
    });

    it('should handle null or undefined', () => {
      expect(() => HandEvaluator.evaluateHand(null)).toThrow();
      expect(() => HandEvaluator.evaluateHand(undefined)).toThrow();
    });
  });
});
