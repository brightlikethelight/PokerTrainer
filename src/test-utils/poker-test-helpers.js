/**
 * Test utilities for poker game testing
 */

import Card from '../domains/game/domain/entities/Card';

/**
 * Create a card from string notation (e.g., 'As', 'Kh', '2c')
 * @param {string} notation - Card notation
 * @returns {Card} Card instance
 */
export const createCard = (notation) => {
  const rank = notation.slice(0, -1);
  const suit = notation.slice(-1);
  return new Card(rank, suit);
};

/**
 * Create multiple cards from string notations
 * @param {string[]} notations - Array of card notations
 * @returns {Card[]} Array of Card instances
 */
export const createCards = (notations) => notations.map(createCard);

/**
 * Create a specific poker hand for testing
 * @param {string} handType - Type of hand to create
 * @returns {Card[]} Array of cards forming the specified hand
 */
export const createPokerHand = (handType) => {
  const hands = {
    royalFlush: createCards(['As', 'Ks', 'Qs', 'Js', 'Ts']),
    straightFlush: createCards(['9h', '8h', '7h', '6h', '5h']),
    fourOfAKind: createCards(['Ah', 'As', 'Ad', 'Ac', 'Kh']),
    fullHouse: createCards(['Kh', 'Ks', 'Kd', 'Ah', 'As']),
    flush: createCards(['Ah', '9h', '7h', '5h', '3h']),
    straight: createCards(['9h', '8s', '7d', '6c', '5h']),
    threeOfAKind: createCards(['Qh', 'Qs', 'Qd', '9h', '7s']),
    twoPair: createCards(['Kh', 'Ks', '9h', '9s', '5d']),
    pair: createCards(['Ah', 'As', 'Kh', 'Qd', '9s']),
    highCard: createCards(['Ah', 'Kd', 'Qh', 'Js', '9h']),
  };

  return hands[handType] || [];
};

/**
 * Create a mock betting round state
 * @param {Object} overrides - State overrides
 * @returns {Object} Betting round state
 */
export const createBettingRoundState = (overrides = {}) => ({
  _pot: 100,
  _currentBet: 20,
  minRaise: 20,
  playersInHand: 4,
  activePlayers: 3,
  bettingComplete: false,
  ...overrides,
});

/**
 * Create a test game scenario
 * @param {string} scenario - Scenario name
 * @returns {Object} Complete game state for the scenario
 */
export const createTestScenario = (scenario) => {
  const scenarios = {
    headsUp: {
      players: [
        {
          id: '1',
          chips: 1000,
          _position: 0,
          cards: createCards(['As', 'Kh']),
        },
        {
          id: '2',
          chips: 1000,
          _position: 1,
          cards: createCards(['Qd', 'Qc']),
        },
      ],
      communityCards: createCards(['Ah', '7s', '2d']),
      pot: 100,
      dealerPosition: 0,
    },
    multiway: {
      players: [
        {
          id: '1',
          chips: 1000,
          _position: 0,
          cards: createCards(['As', 'Ks']),
        },
        {
          id: '2',
          chips: 800,
          _position: 1,
          cards: createCards(['Jh', '10h']),
        },
        {
          id: '3',
          chips: 1200,
          _position: 2,
          cards: createCards(['9d', '9c']),
        },
      ],
      communityCards: createCards(['Kh', '9h', '5s']),
      pot: 300,
      dealerPosition: 0,
    },
    allIn: {
      players: [
        {
          id: '1',
          chips: 0,
          _position: 0,
          cards: createCards(['Ac', 'Ad']),
          isAllIn: true,
        },
        { id: '2', chips: 500, _position: 1, cards: createCards(['Kh', 'Kd']) },
      ],
      communityCards: createCards(['Qs', 'Js', '10h', '9c', '8d']),
      pot: 2000,
      dealerPosition: 1,
    },
  };

  return scenarios[scenario] || {};
};

/**
 * Assert that a hand evaluation is correct
 * @param {Object} evaluation - Hand evaluation result
 * @param {number} expectedRank - Expected hand rank
 * @param {string} expectedDescription - Expected description
 */
export const assertHandEvaluation = (evaluation, expectedRank, expectedDescription) => {
  expect(evaluation.rank).toBe(expectedRank);
  expect(evaluation.description).toContain(expectedDescription);
};

/**
 * Simulate a series of player actions
 * @param {Object} gameEngine - Game engine instance
 * @param {Array} actions - Array of {playerId, _action, amount} objects
 */
export const simulateActions = async (gameEngine, actions) => {
  for (const { playerId, _action, amount } of actions) {
    await gameEngine.handlePlayerAction(playerId, _action, amount);
  }
};
