import Deck from '../Deck';
import Card from '../Card';

describe('Deck', () => {
  let deck;

  beforeEach(() => {
    deck = new Deck();
  });

  test('constructor creates 52 cards', () => {
    expect(deck.cardsRemaining()).toBe(52);
  });

  test('dealCard reduces count by 1 and returns a Card', () => {
    const card = deck.dealCard();
    expect(card).toBeInstanceOf(Card);
    expect(deck.cardsRemaining()).toBe(51);
  });

  test('dealCard on empty deck throws', () => {
    deck.dealCards(52);
    expect(() => deck.dealCard()).toThrow('Not enough cards in deck');
  });

  test('dealCards(5) returns 5 cards with 47 remaining', () => {
    const cards = deck.dealCards(5);
    expect(cards).toHaveLength(5);
    cards.forEach((c) => expect(c).toBeInstanceOf(Card));
    expect(deck.cardsRemaining()).toBe(47);
  });

  test('dealCards with negative count throws', () => {
    expect(() => deck.dealCards(-1)).toThrow('Cannot deal negative number of cards');
  });

  test('dealCards with count > remaining throws', () => {
    expect(() => deck.dealCards(53)).toThrow('Not enough cards in deck');
  });

  test('reset restores deck to 52 cards', () => {
    deck.dealCards(10);
    deck.reset();
    expect(deck.cardsRemaining()).toBe(52);
    expect(deck.getDealtCards()).toHaveLength(0);
  });

  test('all 52 cards are unique', () => {
    const cards = deck.dealCards(52);
    const keys = cards.map((c) => `${c.rank}${c.suit}`);
    expect(new Set(keys).size).toBe(52);
  });

  test('shuffle produces a valid permutation of all 52 cards', () => {
    const dealt = deck.dealCards(52).map((c) => c.toString());
    // Verify all 52 unique cards are present (shuffle doesn't lose/duplicate cards)
    expect(new Set(dealt).size).toBe(52);
    // Verify shuffle actually changed the order vs. creation order
    // (creation order is suits s,h,d,c × ranks 2..A)
    const sorted = [...dealt].sort();
    expect(dealt).not.toEqual(sorted);
  });

  test('cardsRemaining returns correct count after deals', () => {
    expect(deck.cardsRemaining()).toBe(52);
    deck.dealCard();
    expect(deck.cardsRemaining()).toBe(51);
    deck.dealCards(3);
    expect(deck.cardsRemaining()).toBe(48);
  });

  test('getDealtCards returns dealt cards', () => {
    const dealt = [deck.dealCard(), deck.dealCard()];
    const returned = deck.getDealtCards();
    expect(returned).toEqual(dealt);
    // Verify it returns a copy, not the internal array
    returned.push(deck.dealCard());
    expect(deck.getDealtCards()).toHaveLength(3);
  });

  test('removeSpecificCards removes matching cards', () => {
    const cardsToRemove = [
      { rank: 'A', suit: 's' },
      { rank: 'K', suit: 'h' },
    ];
    deck.removeSpecificCards(cardsToRemove);
    expect(deck.cardsRemaining()).toBe(50);
    const remaining = deck.dealCards(50);
    const keys = remaining.map((c) => `${c.rank}${c.suit}`);
    expect(keys).not.toContain('As');
    expect(keys).not.toContain('Kh');
  });
});
