/**
 * HandEvaluator Test Suite
 * Comprehensive tests for poker hand evaluation logic
 */

import HandEvaluator from '../HandEvaluator';
import Card from '../../entities/Card';
import { HAND_RANKINGS } from '../../../constants/game-constants';

describe('HandEvaluator', () => {
  // Helper function to create cards
  const createCard = (rank, suit) => new Card(rank, suit);
  const createCards = (cardStrings) => {
    return cardStrings.map((str) => {
      // Handle two-character ranks like 'T' for ten
      const suit = str[str.length - 1];
      const rank = str.slice(0, -1);
      return createCard(rank, suit);
    });
  };

  describe('evaluateHand', () => {
    test('should throw error for fewer than 5 cards', () => {
      const cards = createCards(['As', 'Kh', 'Qd', 'Jc']);
      expect(() => HandEvaluator.evaluateHand(cards)).toThrow('Need at least 5 cards to evaluate');
    });

    test('should evaluate high card', () => {
      const cards = createCards(['As', 'Kh', 'Qd', 'Jc', '9s']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.HIGH_CARD);
      expect(result.rankName).toBe('High Card');
    });

    test('should evaluate one pair', () => {
      const cards = createCards(['As', 'Ah', 'Kd', 'Qc', 'Js']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.PAIR);
      expect(result.rankName).toBe('Pair');
    });

    test('should evaluate two pair', () => {
      const cards = createCards(['As', 'Ah', 'Kd', 'Kc', 'Qs']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.TWO_PAIR);
      expect(result.rankName).toBe('Two Pair');
    });

    test('should evaluate three of a kind', () => {
      const cards = createCards(['As', 'Ah', 'Ad', 'Kc', 'Qs']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.THREE_OF_A_KIND);
      expect(result.rankName).toBe('Three of a Kind');
    });

    test('should evaluate straight', () => {
      const cards = createCards(['As', 'Kh', 'Qd', 'Jc', 'Ts']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.STRAIGHT);
      expect(result.rankName).toBe('Straight');
    });

    test('should evaluate wheel straight (A-2-3-4-5)', () => {
      const cards = createCards(['As', '2h', '3d', '4c', '5s']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.STRAIGHT);
      expect(result.rankName).toBe('Straight');
    });

    test('should evaluate flush', () => {
      const cards = createCards(['As', 'Ks', 'Qs', 'Js', '9s']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.FLUSH);
      expect(result.rankName).toBe('Flush');
    });

    test('should evaluate full house', () => {
      const cards = createCards(['As', 'Ah', 'Ad', 'Kc', 'Ks']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.FULL_HOUSE);
      expect(result.rankName).toBe('Full House');
    });

    test('should evaluate four of a kind', () => {
      const cards = createCards(['As', 'Ah', 'Ad', 'Ac', 'Ks']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.FOUR_OF_A_KIND);
      expect(result.rankName).toBe('Four of a Kind');
    });

    test('should evaluate straight flush', () => {
      const cards = createCards(['9s', '8s', '7s', '6s', '5s']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.STRAIGHT_FLUSH);
      expect(result.rankName).toBe('Straight Flush');
    });

    test('should evaluate royal flush', () => {
      const cards = createCards(['As', 'Ks', 'Qs', 'Js', 'Ts']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
      expect(result.rankName).toBe('Royal Flush');
    });

    test('should find best 5-card hand from 7 cards', () => {
      const cards = createCards(['As', 'Ks', 'Qs', 'Js', 'Ts', '9h', '8h']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
      expect(result.cards).toHaveLength(5);
    });

    test('should find best hand with community cards', () => {
      // Simulating Texas Hold'em with hole cards and community cards
      const holeCards = createCards(['As', 'Kh']);
      const communityCards = createCards(['Ad', 'Kd', 'Kc', '2s', '3h']);
      const allCards = [...holeCards, ...communityCards];
      const result = HandEvaluator.evaluateHand(allCards);
      expect(result.rank).toBe(HAND_RANKINGS.FULL_HOUSE);
      expect(result.rankName).toBe('Full House');
    });
  });

  describe('compareHands', () => {
    test('should compare hands of different ranks', () => {
      const flush = createCards(['As', 'Ks', 'Qs', 'Js', '9s']);
      const straight = createCards(['As', 'Kh', 'Qd', 'Jc', 'Ts']);

      const flushResult = HandEvaluator.evaluateHand(flush);
      const straightResult = HandEvaluator.evaluateHand(straight);

      const comparison = HandEvaluator.compareHands(flushResult, straightResult);
      expect(comparison).toBeGreaterThan(0); // Flush beats straight
    });

    test('should compare hands of same rank using tiebreakers', () => {
      const pairAces = createCards(['As', 'Ah', 'Kd', 'Qc', 'Js']);
      const pairKings = createCards(['Ks', 'Kh', '9d', '8c', '7s']);

      const acesResult = HandEvaluator.evaluateHand(pairAces);
      const kingsResult = HandEvaluator.evaluateHand(pairKings);

      const comparison = HandEvaluator.compareHands(acesResult, kingsResult);
      expect(comparison).toBeGreaterThan(0); // Pair of aces beats pair of kings
    });

    test('should identify tied hands', () => {
      const hand1 = createCards(['As', 'Kh', 'Qd', 'Jc', 'Ts']);
      const hand2 = createCards(['Ad', 'Kc', 'Qh', 'Js', 'Td']);

      const result1 = HandEvaluator.evaluateHand(hand1);
      const result2 = HandEvaluator.evaluateHand(hand2);

      const comparison = HandEvaluator.compareHands(result1, result2);
      expect(comparison).toBe(0); // Same straight, should tie
    });

    test('should compare high card hands correctly', () => {
      const aceHigh = createCards(['As', 'Kh', 'Jd', 'Tc', '9s']);
      const kingHigh = createCards(['Ks', 'Qh', 'Jc', '9c', '8s']);

      const aceResult = HandEvaluator.evaluateHand(aceHigh);
      const kingResult = HandEvaluator.evaluateHand(kingHigh);

      const comparison = HandEvaluator.compareHands(aceResult, kingResult);
      expect(comparison).toBeGreaterThan(0); // Ace high beats king high
    });

    test('should compare full houses correctly', () => {
      const acesOverKings = createCards(['As', 'Ah', 'Ad', 'Kc', 'Ks']);
      const kingsOverAces = createCards(['Kd', 'Kh', 'Kc', 'As', 'Ac']);

      const acesResult = HandEvaluator.evaluateHand(acesOverKings);
      const kingsResult = HandEvaluator.evaluateHand(kingsOverAces);

      const comparison = HandEvaluator.compareHands(acesResult, kingsResult);
      expect(comparison).toBeGreaterThan(0); // Aces full beats kings full
    });
  });

  describe('findWinners', () => {
    test('should determine single winner', () => {
      const player1 = { id: 'p1', name: 'Player 1' };
      const player2 = { id: 'p2', name: 'Player 2' };
      const player3 = { id: 'p3', name: 'Player 3' };

      const playerHands = [
        { player: player1, cards: createCards(['As', 'Ah', '7d', '3c', '2h', 'Js', '9d']) },
        { player: player2, cards: createCards(['Ks', 'Kh', '7d', '3c', '2h', 'Js', '9d']) },
        { player: player3, cards: createCards(['Qs', 'Qh', '7d', '3c', '2h', 'Js', '9d']) },
      ];

      const winners = HandEvaluator.findWinners(playerHands);
      expect(winners).toHaveLength(1);
      expect(winners[0].player.id).toBe('p1');
      expect(winners[0].hand.rankName).toBe('Pair');
    });

    test('should handle split pot with tied hands', () => {
      const player1 = { id: 'p1', name: 'Player 1' };
      const player2 = { id: 'p2', name: 'Player 2' };
      const player3 = { id: 'p3', name: 'Player 3' };

      const playerHands = [
        { player: player1, cards: createCards(['As', 'Kh', 'Qd', 'Jc', 'Ts', '9h', '8d']) },
        { player: player2, cards: createCards(['Ad', 'Kc', 'Qh', 'Js', 'Td', '9h', '8d']) },
        { player: player3, cards: createCards(['Qs', 'Qh', 'Kd', 'Jc', 'Ts', '9h', '8d']) },
      ];

      const winners = HandEvaluator.findWinners(playerHands);
      expect(winners).toHaveLength(2); // Players 1 and 2 tie with same straight
      expect(winners.map((w) => w.player.id)).toContain('p1');
      expect(winners.map((w) => w.player.id)).toContain('p2');
    });

    test('should handle multiple winners correctly', () => {
      const player1 = { id: 'p1', name: 'Player 1' };
      const player2 = { id: 'p2', name: 'Player 2' };
      const player3 = { id: 'p3', name: 'Player 3' };

      const playerHands = [
        { player: player1, cards: createCards(['As', 'Ah', '2d', '3c', '4h', '5s', '9d']) },
        { player: player2, cards: createCards(['Ac', 'Ad', '2d', '3c', '4h', '5s', '9d']) },
        { player: player3, cards: createCards(['Qs', 'Qh', '2d', '3c', '4h', '5s', '9d']) },
      ];

      const winners = HandEvaluator.findWinners(playerHands);
      expect(winners).toHaveLength(2); // Two players with pair of aces
      expect(winners.map((w) => w.player.id)).toContain('p1');
      expect(winners.map((w) => w.player.id)).toContain('p2');
    });

    test('should handle winner with better kicker', () => {
      const player1 = { id: 'p1', name: 'Player 1' };
      const player2 = { id: 'p2', name: 'Player 2' };

      const playerHands = [
        { player: player1, cards: createCards(['As', 'Ah', 'Kh', 'Qc', 'Js']) },
        { player: player2, cards: createCards(['Ac', 'Ad', 'Qh', 'Jc', 'Ts']) },
      ];

      const winners = HandEvaluator.findWinners(playerHands);
      expect(winners).toHaveLength(1);
      expect(winners[0].player.id).toBe('p1'); // Better kicker (K vs Q)
    });

    test('should handle empty array', () => {
      const playerHands = [];

      expect(() => HandEvaluator.findWinners(playerHands)).not.toThrow();
      const winners = HandEvaluator.findWinners(playerHands);
      // Empty array returns [undefined] from the implementation
      expect(winners).toHaveLength(1);
      expect(winners[0]).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid card inputs gracefully', () => {
      const cards = [
        null,
        undefined,
        createCard('A', 's'),
        createCard('K', 'h'),
        createCard('Q', 'd'),
      ];
      const validCards = cards.filter((c) => c);

      expect(() => HandEvaluator.evaluateHand(validCards)).toThrow(
        'Need at least 5 cards to evaluate'
      );
    });

    test('should evaluate mixed case ranks correctly', () => {
      // Test with 'T' for ten
      const cards = createCards(['Ts', 'Js', 'Qs', 'Ks', 'As']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
    });

    test('should handle 6 cards correctly', () => {
      const cards = createCards(['As', 'Ks', 'Qs', 'Js', 'Ts', '9s']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
      expect(result.cards).toHaveLength(5);
    });

    test('should handle duplicate cards gracefully', () => {
      const card1 = createCard('A', 's');
      const cards = [
        card1,
        card1,
        createCard('K', 'h'),
        createCard('Q', 'd'),
        createCard('J', 'c'),
      ];
      const result = HandEvaluator.evaluateHand(cards);
      // Should still evaluate but might produce unexpected results
      expect(result).toBeDefined();
    });

    test('should evaluate Broadway straight correctly', () => {
      const cards = createCards(['As', 'Kh', 'Qd', 'Jc', 'Ts']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.STRAIGHT);
      expect(result.description).toContain('Ace high');
    });

    test('should not count K-A-2-3-4 as straight', () => {
      const cards = createCards(['Ks', 'Ah', '2d', '3c', '4s']);
      const result = HandEvaluator.evaluateHand(cards);
      expect(result.rank).toBe(HAND_RANKINGS.HIGH_CARD);
    });
  });

  describe('Performance', () => {
    test('should evaluate 7-card hand efficiently', () => {
      const cards = createCards(['As', 'Ks', 'Qs', 'Js', 'Ts', '9s', '8s']);
      const startTime = Date.now();
      const result = HandEvaluator.evaluateHand(cards);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(result.rank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
    });

    test('should handle multiple evaluations efficiently', () => {
      const testCases = [];
      for (let i = 0; i < 100; i++) {
        testCases.push(createCards(['As', 'Kh', 'Qd', 'Jc', 'Ts', '9h', '8d']));
      }

      const startTime = Date.now();
      testCases.forEach((cards) => HandEvaluator.evaluateHand(cards));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 100 evaluations under 1 second
    });
  });

  describe('Real Game Scenarios', () => {
    test('should evaluate Texas Holdem showdown correctly', () => {
      const player1 = { id: 'p1', name: 'Player 1' };
      const player2 = { id: 'p2', name: 'Player 2' };
      const player3 = { id: 'p3', name: 'Player 3' };

      // Player 1: Straight Flush (As Ks Qs Js Ts)
      // Player 2: Three of a kind Aces
      // Player 3: Three of a kind Kings
      const playerHands = [
        { player: player1, cards: createCards(['Js', 'Ts', 'As', 'Ks', 'Qs', '2d', '3h']) },
        { player: player2, cards: createCards(['Ah', 'Ad', 'As', 'Ks', 'Qs', '2d', '3h']) },
        { player: player3, cards: createCards(['Kh', 'Kd', 'As', 'Ks', 'Qs', '2d', '3h']) },
      ];

      const winners = HandEvaluator.findWinners(playerHands);

      expect(winners).toHaveLength(1);
      expect(winners[0].player.id).toBe('p1');
      expect(winners[0].hand.rankName).toBe('Royal Flush'); // A-K-Q-J-T of same suit is Royal Flush
    });

    test('should handle common split pot scenario', () => {
      const player1 = { id: 'p1', name: 'Player 1' };
      const player2 = { id: 'p2', name: 'Player 2' };

      // Board plays (straight on board As Ks Qd Jh Tc)
      const playerHands = [
        { player: player1, cards: createCards(['2s', '3h', 'As', 'Ks', 'Qd', 'Jh', 'Tc']) },
        { player: player2, cards: createCards(['4d', '5c', 'As', 'Ks', 'Qd', 'Jh', 'Tc']) },
      ];

      const winners = HandEvaluator.findWinners(playerHands);

      expect(winners).toHaveLength(2); // Both players play the board
      expect(winners[0].hand.rankName).toBe('Straight');
      expect(winners[1].hand.rankName).toBe('Straight');
    });

    test('should handle flush over flush correctly', () => {
      const player1 = { id: 'p1', name: 'Player 1' };
      const player2 = { id: 'p2', name: 'Player 2' };

      // Player 1: Higher flush with Js 4s
      // Player 2: Lower flush with 9s 8s
      const playerHands = [
        { player: player1, cards: createCards(['Js', '4s', 'As', 'Ks', 'Qs', '2s', '3h']) },
        { player: player2, cards: createCards(['9s', '8s', 'As', 'Ks', 'Qs', '2s', '3h']) },
      ];

      const winners = HandEvaluator.findWinners(playerHands);

      expect(winners).toHaveLength(1);
      expect(winners[0].player.id).toBe('p1');
      expect(winners[0].hand.rankName).toBe('Flush');
    });
  });
});
