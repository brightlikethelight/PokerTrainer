import Card from '../entities/Card';

describe('Card', () => {
  describe('constructor', () => {
    it('should create a card with valid rank and suit', () => {
      const card = new Card('A', 's');
      expect(card.rank).toBe('A');
      expect(card.suit).toBe('s');
    });

    it('should throw error for invalid rank', () => {
      expect(() => new Card('X', 's')).toThrow('Invalid rank: X');
    });

    it('should throw error for invalid suit', () => {
      expect(() => new Card('A', 'x')).toThrow('Invalid suit: x');
    });
  });

  describe('getValue', () => {
    it('should return correct value for ace', () => {
      const card = new Card('A', 's');
      expect(card.getValue()).toBe(14);
    });

    it('should return correct value for king', () => {
      const card = new Card('K', 'h');
      expect(card.getValue()).toBe(13);
    });

    it('should return correct value for number cards', () => {
      const card = new Card('7', 'd');
      expect(card.getValue()).toBe(7);
    });
  });

  describe('toString', () => {
    it('should return string representation of card', () => {
      const card = new Card('A', 's');
      expect(card.toString()).toBe('As');
    });

    it('should handle all suits correctly', () => {
      expect(new Card('K', 'h').toString()).toBe('Kh');
      expect(new Card('Q', 'd').toString()).toBe('Qd');
      expect(new Card('J', 'c').toString()).toBe('Jc');
    });
  });

  describe('equals', () => {
    it('should return true for same card', () => {
      const card1 = new Card('A', 's');
      const card2 = new Card('A', 's');
      expect(card1.equals(card2)).toBe(true);
    });

    it('should return false for different rank', () => {
      const card1 = new Card('A', 's');
      const card2 = new Card('K', 's');
      expect(card1.equals(card2)).toBe(false);
    });

    it('should return false for different suit', () => {
      const card1 = new Card('A', 's');
      const card2 = new Card('A', 'h');
      expect(card1.equals(card2)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      const card = new Card('A', 's');
      expect(card.equals(null)).toBe(false);
      expect(card.equals(undefined)).toBe(false);
    });
  });

  describe('compareRank', () => {
    it('should return positive when first card is higher', () => {
      const card1 = new Card('A', 's');
      const card2 = new Card('K', 'h');
      expect(card1.compareRank(card2)).toBeGreaterThan(0);
    });

    it('should return negative when first card is lower', () => {
      const card1 = new Card('2', 's');
      const card2 = new Card('3', 'h');
      expect(card1.compareRank(card2)).toBeLessThan(0);
    });

    it('should return zero for same rank', () => {
      const card1 = new Card('K', 's');
      const card2 = new Card('K', 'h');
      expect(card1.compareRank(card2)).toBe(0);
    });
  });

  describe('static createDeck', () => {
    it('should create a full 52-card deck', () => {
      const deck = Card.createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should contain all unique cards', () => {
      const deck = Card.createDeck();
      const cardStrings = deck.map((card) => card.toString());
      const uniqueCards = new Set(cardStrings);
      expect(uniqueCards.size).toBe(52);
    });

    it('should contain all ranks and suits', () => {
      const deck = Card.createDeck();
      const ranks = new Set(deck.map((card) => card.rank));
      const suits = new Set(deck.map((card) => card.suit));

      expect(ranks.size).toBe(13);
      expect(suits.size).toBe(4);
    });
  });
});
