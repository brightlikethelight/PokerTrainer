import { RANKS, SUITS } from '../../../../constants/game-constants';

import Card from './Card';

class Deck {
  constructor() {
    this.cards = [];
    this.dealtCards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    this.dealtCards = [];

    for (const suit of Object.values(SUITS)) {
      for (const rank of Object.values(RANKS)) {
        this.cards.push(new Card(rank, suit));
      }
    }

    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  dealCard() {
    if (this.cards.length === 0) {
      throw new Error('Not enough cards in deck');
    }

    const card = this.cards.shift(); // Deal from top (index 0)
    this.dealtCards.push(card);
    return card;
  }

  dealOne() {
    return this.dealCard();
  }

  dealCards(count) {
    if (count < 0) {
      throw new Error('Cannot deal negative number of cards');
    }

    if (count > this.cards.length) {
      throw new Error('Not enough cards in deck');
    }

    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push(this.dealCard());
    }
    return cards;
  }

  deal(count) {
    return this.dealCards(count);
  }

  cardsRemaining() {
    return this.cards.length;
  }

  getRemainingCards() {
    return this.cardsRemaining();
  }

  getDealtCards() {
    return [...this.dealtCards];
  }

  removeSpecificCards(cardsToRemove) {
    this.cards = this.cards.filter(
      (card) =>
        !cardsToRemove.some(
          (removeCard) => card.rank === removeCard.rank && card.suit === removeCard.suit
        )
    );
  }
}

export default Deck;
