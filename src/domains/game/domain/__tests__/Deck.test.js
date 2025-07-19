import Card from '../entities/Card';
import Deck from '../entities/Deck';

describe('Deck', () => {
  let deck;

  beforeEach(() => {
    deck = new Deck();
  });

  describe('constructor', () => {
    it('should create a deck with 52 cards', () => {
      expect(deck.cards).toHaveLength(52);
    });

    it('should shuffle the deck on creation', () => {
      const deck2 = new Deck();
      // Very unlikely two shuffled decks are in the same order
      const sameOrder = deck.cards.every(
        (card, _index) => card.toString() === deck2.cards[_index].toString()
      );
      expect(sameOrder).toBe(false);
    });
  });

  describe('shuffle', () => {
    it('should maintain 52 cards after shuffling', () => {
      deck.shuffle();
      expect(deck.cards).toHaveLength(52);
    });

    it('should change card order', () => {
      const originalOrder = deck.cards.map((card) => card.toString());
      deck.shuffle();
      const newOrder = deck.cards.map((card) => card.toString());

      expect(originalOrder).not.toEqual(newOrder);
    });

    it('should contain all original cards', () => {
      const originalCards = new Set(deck.cards.map((card) => card.toString()));
      deck.shuffle();
      const shuffledCards = new Set(deck.cards.map((card) => card.toString()));

      expect(shuffledCards).toEqual(originalCards);
    });
  });

  describe('deal', () => {
    it('should return the specified number of cards', () => {
      const cards = deck.deal(5);
      expect(cards).toHaveLength(5);
      expect(cards.every((card) => card instanceof Card)).toBe(true);
    });

    it('should remove dealt cards from the deck', () => {
      deck.deal(5);
      expect(deck.cards).toHaveLength(47);
    });

    it('should deal cards from the top of the deck', () => {
      const topCard = deck.cards[0].toString();
      const dealtCards = deck.deal(1);
      expect(dealtCards[0].toString()).toBe(topCard);
    });

    it('should throw error when dealing more cards than available', () => {
      deck.deal(50); // 2 cards left
      expect(() => deck.deal(5)).toThrow('Not enough cards in deck');
    });
  });

  describe('dealOne', () => {
    it('should return a single card', () => {
      const card = deck.dealOne();
      expect(card).toBeInstanceOf(Card);
    });

    it('should remove the card from the deck', () => {
      deck.dealOne();
      expect(deck.cards).toHaveLength(51);
    });

    it('should throw error when deck is empty', () => {
      deck.deal(52); // Empty the deck
      expect(() => deck.dealOne()).toThrow('Not enough cards in deck');
    });
  });

  describe('getRemainingCards', () => {
    it('should return correct count for full deck', () => {
      expect(deck.getRemainingCards()).toBe(52);
    });

    it('should return correct count after dealing', () => {
      deck.deal(10);
      expect(deck.getRemainingCards()).toBe(42);
    });

    it('should return 0 for empty deck', () => {
      deck.deal(52);
      expect(deck.getRemainingCards()).toBe(0);
    });
  });

  describe('reset', () => {
    it('should restore deck to 52 cards', () => {
      deck.deal(20);
      deck.reset();
      expect(deck.cards).toHaveLength(52);
    });

    it('should shuffle after reset', () => {
      const originalOrder = deck.cards.map((card) => card.toString());
      deck.deal(20);
      deck.reset();
      const resetOrder = deck.cards.map((card) => card.toString());

      expect(originalOrder).not.toEqual(resetOrder);
    });

    it('should contain all cards after reset', () => {
      deck.deal(30);
      deck.reset();

      const allCards = Card.createDeck();
      const resetCards = new Set(deck.cards.map((card) => card.toString()));
      const expectedCards = new Set(allCards.map((card) => card.toString()));

      expect(resetCards).toEqual(expectedCards);
    });
  });

  describe('edge cases', () => {
    it('should handle dealing 0 cards', () => {
      const cards = deck.deal(0);
      expect(cards).toEqual([]);
      expect(deck.cards).toHaveLength(52);
    });

    it('should handle negative number in deal', () => {
      expect(() => deck.deal(-1)).toThrow();
    });
  });
});
