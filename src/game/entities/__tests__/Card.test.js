import Card from '../Card';
import { RANKS, SUITS } from '../../../constants/game-constants';

describe('Card', () => {
  describe('constructor validation', () => {
    test('throws on invalid rank', () => {
      expect(() => new Card('X', SUITS.SPADES)).toThrow('Invalid rank: X');
    });

    test('throws on invalid suit', () => {
      expect(() => new Card(RANKS.ACE, 'z')).toThrow('Invalid suit: z');
    });

    test('creates card with valid rank and suit', () => {
      const card = new Card(RANKS.ACE, SUITS.SPADES);
      expect(card.rank).toBe(RANKS.ACE);
      expect(card.suit).toBe(SUITS.SPADES);
    });
  });

  describe('equals()', () => {
    test('returns true for same rank and suit', () => {
      const a = new Card(RANKS.KING, SUITS.HEARTS);
      const b = new Card(RANKS.KING, SUITS.HEARTS);
      expect(a.equals(b)).toBe(true);
    });

    test('returns false for different rank', () => {
      const a = new Card(RANKS.KING, SUITS.HEARTS);
      const b = new Card(RANKS.QUEEN, SUITS.HEARTS);
      expect(a.equals(b)).toBe(false);
    });

    test('returns false for different suit', () => {
      const a = new Card(RANKS.KING, SUITS.HEARTS);
      const b = new Card(RANKS.KING, SUITS.CLUBS);
      expect(a.equals(b)).toBe(false);
    });

    test('returns false for null', () => {
      const card = new Card(RANKS.ACE, SUITS.SPADES);
      expect(card.equals(null)).toBe(false);
    });

    test('returns false for non-object', () => {
      const card = new Card(RANKS.ACE, SUITS.SPADES);
      expect(card.equals('As')).toBe(false);
    });
  });

  describe('compareRank()', () => {
    test('returns positive when this card ranks higher', () => {
      const ace = new Card(RANKS.ACE, SUITS.SPADES);
      const two = new Card(RANKS.TWO, SUITS.HEARTS);
      expect(ace.compareRank(two)).toBeGreaterThan(0);
    });

    test('returns negative when this card ranks lower', () => {
      const two = new Card(RANKS.TWO, SUITS.HEARTS);
      const ace = new Card(RANKS.ACE, SUITS.SPADES);
      expect(two.compareRank(ace)).toBeLessThan(0);
    });

    test('returns zero for equal ranks', () => {
      const a = new Card(RANKS.TEN, SUITS.SPADES);
      const b = new Card(RANKS.TEN, SUITS.CLUBS);
      expect(a.compareRank(b)).toBe(0);
    });

    test('throws on invalid input', () => {
      const card = new Card(RANKS.ACE, SUITS.SPADES);
      expect(() => card.compareRank(null)).toThrow('Invalid card for comparison');
      expect(() => card.compareRank({ value: 'not a number' })).toThrow(
        'Invalid card for comparison'
      );
    });
  });

  describe('getDisplayName()', () => {
    test('Ace of Spades', () => {
      const card = new Card(RANKS.ACE, SUITS.SPADES);
      expect(card.getDisplayName()).toBe('Ace of Spades');
    });

    test('Two of Hearts', () => {
      const card = new Card(RANKS.TWO, SUITS.HEARTS);
      expect(card.getDisplayName()).toBe('Two of Hearts');
    });

    test('Ten of Diamonds', () => {
      const card = new Card(RANKS.TEN, SUITS.DIAMONDS);
      expect(card.getDisplayName()).toBe('Ten of Diamonds');
    });
  });

  describe('getUnicodeSymbol()', () => {
    test.each([
      [SUITS.SPADES, '♠'],
      [SUITS.HEARTS, '♥'],
      [SUITS.DIAMONDS, '♦'],
      [SUITS.CLUBS, '♣'],
    ])('suit %s renders symbol %s', (suit, symbol) => {
      const card = new Card(RANKS.ACE, suit);
      expect(card.getUnicodeSymbol()).toBe(`A${symbol}`);
    });
  });

  describe('getValue()', () => {
    test('returns numeric rank value', () => {
      expect(new Card(RANKS.TWO, SUITS.CLUBS).getValue()).toBe(2);
      expect(new Card(RANKS.ACE, SUITS.SPADES).getValue()).toBe(14);
      expect(new Card(RANKS.TEN, SUITS.DIAMONDS).getValue()).toBe(10);
    });
  });

  describe('toString()', () => {
    test('returns rank concatenated with suit', () => {
      const card = new Card(RANKS.JACK, SUITS.CLUBS);
      expect(card.toString()).toBe('Jc');
    });
  });
});
