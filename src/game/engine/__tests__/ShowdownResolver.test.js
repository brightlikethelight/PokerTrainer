import ShowdownResolver from '../ShowdownResolver';
import HandEvaluator from '../../utils/HandEvaluator';

jest.mock('../../utils/HandEvaluator');

describe('ShowdownResolver', () => {
  let player1, player2, player3;
  const communityCards = [
    { rank: 'A', suit: 's' },
    { rank: 'K', suit: 'h' },
    { rank: 'Q', suit: 'd' },
    { rank: 'J', suit: 'c' },
    { rank: 'T', suit: 's' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    player1 = {
      id: 'p1',
      name: 'Alice',
      holeCards: [
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 's' },
      ],
    };
    player2 = {
      id: 'p2',
      name: 'Bob',
      holeCards: [
        { rank: 'Q', suit: 'h' },
        { rank: 'J', suit: 's' },
      ],
    };
    player3 = {
      id: 'p3',
      name: 'Charlie',
      holeCards: [
        { rank: '2', suit: 'c' },
        { rank: '3', suit: 'd' },
      ],
    };
  });

  describe('resolveShowdown', () => {
    test('should award entire main pot to single winner', () => {
      HandEvaluator.findWinners.mockReturnValue([
        { player: player1, hand: { description: 'Royal Flush' } },
      ]);

      const potManager = { main: 300, side: [] };
      const result = ShowdownResolver.resolveShowdown(
        [player1, player2],
        communityCards,
        potManager
      );

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].player).toBe(player1);
      expect(result.winners[0].amount).toBe(300);
      expect(result.winners[0].handDescription).toBe('Royal Flush');
    });

    test('should split main pot evenly between tied winners', () => {
      HandEvaluator.findWinners.mockReturnValue([
        { player: player1, hand: { description: 'Straight' } },
        { player: player2, hand: { description: 'Straight' } },
      ]);

      const potManager = { main: 400, side: [] };
      const result = ShowdownResolver.resolveShowdown(
        [player1, player2],
        communityCards,
        potManager
      );

      expect(result.winners).toHaveLength(2);
      expect(result.winners[0].amount).toBe(200);
      expect(result.winners[1].amount).toBe(200);
    });

    test('should award remainder chip to first winner', () => {
      HandEvaluator.findWinners.mockReturnValue([
        { player: player1, hand: { description: 'Pair' } },
        { player: player2, hand: { description: 'Pair' } },
      ]);

      const potManager = { main: 301, side: [] };
      const result = ShowdownResolver.resolveShowdown(
        [player1, player2],
        communityCards,
        potManager
      );

      expect(result.winners[0].amount).toBe(151);
      expect(result.winners[1].amount).toBe(150);
    });

    test('should distribute side pots to eligible players only', () => {
      // Main pot: player1 wins
      HandEvaluator.findWinners
        .mockReturnValueOnce([{ player: player1, hand: { description: 'Two Pair' } }])
        .mockReturnValueOnce([{ player: player2, hand: { description: 'Flush' } }]);

      const potManager = {
        main: 300,
        side: [{ amount: 200, eligiblePlayers: [player2, player3] }],
      };

      const result = ShowdownResolver.resolveShowdown(
        [player1, player2, player3],
        communityCards,
        potManager
      );

      expect(result.winners).toHaveLength(2);
      const alice = result.winners.find((w) => w.player === player1);
      const bob = result.winners.find((w) => w.player === player2);
      expect(alice.amount).toBe(300);
      expect(bob.amount).toBe(200);
    });

    test('should merge amounts when same player wins main and side pot', () => {
      HandEvaluator.findWinners
        .mockReturnValueOnce([{ player: player1, hand: { description: 'Full House' } }])
        .mockReturnValueOnce([{ player: player1, hand: { description: 'Full House' } }]);

      const potManager = {
        main: 300,
        side: [{ amount: 200, eligiblePlayers: [player1, player2] }],
      };

      const result = ShowdownResolver.resolveShowdown(
        [player1, player2],
        communityCards,
        potManager
      );

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].amount).toBe(500);
    });

    test('should handle side pot remainder chips correctly', () => {
      HandEvaluator.findWinners
        .mockReturnValueOnce([{ player: player1, hand: { description: 'Pair' } }])
        .mockReturnValueOnce([
          { player: player2, hand: { description: 'Pair' } },
          { player: player3, hand: { description: 'Pair' } },
        ]);

      const potManager = {
        main: 100,
        side: [{ amount: 201, eligiblePlayers: [player2, player3] }],
      };

      const result = ShowdownResolver.resolveShowdown(
        [player1, player2, player3],
        communityCards,
        potManager
      );

      const bob = result.winners.find((w) => w.player === player2);
      const charlie = result.winners.find((w) => w.player === player3);
      expect(bob.amount).toBe(101);
      expect(charlie.amount).toBe(100);
    });

    test('should pass correct cards to HandEvaluator', () => {
      HandEvaluator.findWinners.mockReturnValue([
        { player: player1, hand: { description: 'High Card' } },
      ]);

      const potManager = { main: 100, side: [] };
      ShowdownResolver.resolveShowdown([player1], communityCards, potManager);

      const passedHands = HandEvaluator.findWinners.mock.calls[0][0];
      expect(passedHands[0].cards).toHaveLength(7);
      expect(passedHands[0].cards).toEqual([...player1.holeCards, ...communityCards]);
    });
  });

  describe('resolveFoldWin', () => {
    test('should award entire pot to winner', () => {
      const result = ShowdownResolver.resolveFoldWin(player1, 500);

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].player).toBe(player1);
      expect(result.winners[0].amount).toBe(500);
      expect(result.winners[0].handDescription).toBe('Won by default (others folded)');
    });

    test('should handle zero pot', () => {
      const result = ShowdownResolver.resolveFoldWin(player1, 0);

      expect(result.winners[0].amount).toBe(0);
    });
  });
});
