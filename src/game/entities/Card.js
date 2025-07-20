import { RANKS, SUITS, RANK_VALUES } from '../../constants/game-constants';
import { createValidationError } from '../../services/error-handler';

class Card {
  constructor(rank, suit) {
    if (!Object.values(RANKS).includes(rank)) {
      throw createValidationError('rank', `Invalid rank: ${rank}`, rank);
    }
    if (!Object.values(SUITS).includes(suit)) {
      throw createValidationError('suit', `Invalid suit: ${suit}`, suit);
    }
    this.rank = rank;
    this.suit = suit;
    this.value = RANK_VALUES[rank];
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }

  equals(otherCard) {
    if (!otherCard || typeof otherCard !== 'object') {
      return false;
    }
    return this.rank === otherCard.rank && this.suit === otherCard.suit;
  }

  compareRank(otherCard) {
    if (!otherCard || typeof otherCard.value !== 'number') {
      throw createValidationError('otherCard', 'Invalid card for comparison', otherCard);
    }
    return this.value - otherCard.value;
  }

  getDisplayName() {
    const rankNames = {
      2: 'Two',
      3: 'Three',
      4: 'Four',
      5: 'Five',
      6: 'Six',
      7: 'Seven',
      8: 'Eight',
      9: 'Nine',
      T: 'Ten',
      J: 'Jack',
      Q: 'Queen',
      K: 'King',
      A: 'Ace',
    };

    const suitNames = {
      s: 'Spades',
      h: 'Hearts',
      d: 'Diamonds',
      c: 'Clubs',
    };

    return `${rankNames[this.rank]} of ${suitNames[this.suit]}`;
  }

  getUnicodeSymbol() {
    const suitSymbols = {
      s: '♠',
      h: '♥',
      d: '♦',
      c: '♣',
    };

    return `${this.rank}${suitSymbols[this.suit]}`;
  }
  getValue() {
    return this.value;
  }

  static createDeck() {
    const deck = [];
    for (const suit of Object.values(SUITS)) {
      for (const rank of Object.values(RANKS)) {
        deck.push(new Card(rank, suit));
      }
    }
    return deck;
  }
}

export default Card;
