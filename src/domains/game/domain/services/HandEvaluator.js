import { HAND_RANKINGS } from '../../../../constants/game-constants';

/**
 * Static utility class for evaluating poker hands and determining winners.
 * Implements Texas Hold'em hand ranking rules and comparison logic.
 *
 * @class HandEvaluator
 * @example
 * const cards = [card1, card2, card3, card4, card5, card6, card7];
 * const bestHand = HandEvaluator.evaluateHand(cards);
 * console.log(`Best hand: ${bestHand.description}`);
 */
class HandEvaluator {
  /**
   * Evaluates the best possible 5-card poker hand from 5-7 cards.
   *
   * @static
   * @param {Card[]} cards - Array of 5-7 cards to evaluate
   * @returns {Object} Hand evaluation result containing rank, cards, description, and tiebreakers
   * @throws {Error} If fewer than 5 cards provided
   * @example
   * const hand = HandEvaluator.evaluateHand([card1, card2, card3, card4, card5]);
   * // Returns: { rank: 8, rankName: "Straight", cards: [...], description: "Straight, Ten high" }
   */
  static evaluateHand(cards) {
    if (cards.length < 5) {
      throw new Error('Need at least 5 cards to evaluate');
    }

    const allCombinations = this.getCombinations(cards, 5);
    let bestHand = null;
    let bestRank = -1;
    let bestTiebreakers = [];

    for (const combination of allCombinations) {
      const evaluation = this.evaluateFiveCardHand(combination);

      if (
        evaluation.rank > bestRank ||
        (evaluation.rank === bestRank &&
          this.compareTiebreakers(evaluation.tiebreakers, bestTiebreakers) > 0)
      ) {
        bestRank = evaluation.rank;
        bestTiebreakers = evaluation.tiebreakers;
        bestHand = {
          rank: evaluation.rank,
          rankName: evaluation.rankName,
          cards: combination,
          tiebreakers: evaluation.tiebreakers,
          description: evaluation.description,
        };
      }
    }

    return bestHand;
  }

  static evaluateFiveCardHand(cards) {
    const sortedCards = [...cards].sort((a, b) => b.value - a.value);

    const isFlush = this.checkFlush(cards);
    const straightHighCard = this.checkStraight(sortedCards);
    const groups = this.groupByRank(cards);
    const groupSizes = Object.values(groups)
      .map((group) => group.length)
      .sort((a, b) => b - a);

    if (isFlush && straightHighCard) {
      if (straightHighCard === 14) {
        return {
          rank: HAND_RANKINGS.ROYAL_FLUSH,
          rankName: 'Royal Flush',
          tiebreakers: [],
          description: 'Royal Flush',
        };
      }
      return {
        rank: HAND_RANKINGS.STRAIGHT_FLUSH,
        rankName: 'Straight Flush',
        tiebreakers: [straightHighCard],
        description: `Straight Flush, ${this.getCardName(straightHighCard)} high`,
      };
    }

    if (groupSizes[0] === 4) {
      const fourOfAKindRank = this.getRankOfSize(groups, 4);
      const kicker = this.getRankOfSize(groups, 1);
      return {
        rank: HAND_RANKINGS.FOUR_OF_A_KIND,
        rankName: 'Four of a Kind',
        tiebreakers: [fourOfAKindRank, kicker],
        description: `Four of a Kind, ${this.getCardName(fourOfAKindRank)}s`,
      };
    }

    if (groupSizes[0] === 3 && groupSizes[1] === 2) {
      const threeOfAKindRank = this.getRankOfSize(groups, 3);
      const pairRank = this.getRankOfSize(groups, 2);
      return {
        rank: HAND_RANKINGS.FULL_HOUSE,
        rankName: 'Full House',
        tiebreakers: [threeOfAKindRank, pairRank],
        description: `Full House, ${this.getCardName(
          threeOfAKindRank
        )}s full of ${this.getCardName(pairRank)}s`,
      };
    }

    if (isFlush) {
      const flushCards = sortedCards.map((c) => c.value);
      return {
        rank: HAND_RANKINGS.FLUSH,
        rankName: 'Flush',
        tiebreakers: flushCards,
        description: `Flush, ${this.getCardName(flushCards[0])} high`,
      };
    }

    if (straightHighCard) {
      return {
        rank: HAND_RANKINGS.STRAIGHT,
        rankName: 'Straight',
        tiebreakers: [straightHighCard],
        description: `Straight, ${this.getCardName(straightHighCard)} high`,
      };
    }

    if (groupSizes[0] === 3) {
      const threeOfAKindRank = this.getRankOfSize(groups, 3);
      const kickers = this.getKickers(groups, [threeOfAKindRank], 2);
      return {
        rank: HAND_RANKINGS.THREE_OF_A_KIND,
        rankName: 'Three of a Kind',
        tiebreakers: [threeOfAKindRank, ...kickers],
        description: `Three of a Kind, ${this.getCardName(threeOfAKindRank)}s`,
      };
    }

    if (groupSizes[0] === 2 && groupSizes[1] === 2) {
      const pairs = this.getRanksOfSize(groups, 2).sort((a, b) => b - a);
      const kicker = this.getKickers(groups, pairs, 1)[0];
      return {
        rank: HAND_RANKINGS.TWO_PAIR,
        rankName: 'Two Pair',
        tiebreakers: [...pairs, kicker],
        description: `Two Pair, ${this.getCardName(pairs[0])}s and ${this.getCardName(pairs[1])}s`,
      };
    }

    if (groupSizes[0] === 2) {
      const pairRank = this.getRankOfSize(groups, 2);
      const kickers = this.getKickers(groups, [pairRank], 3);
      return {
        rank: HAND_RANKINGS.PAIR,
        rankName: 'Pair',
        tiebreakers: [pairRank, ...kickers],
        description: `Pair of ${this.getCardName(pairRank)}s`,
      };
    }

    const highCards = sortedCards.map((c) => c.value).slice(0, 5);
    return {
      rank: HAND_RANKINGS.HIGH_CARD,
      rankName: 'High Card',
      tiebreakers: highCards,
      description: `High Card, ${this.getCardName(highCards[0])}`,
    };
  }

  static checkFlush(cards) {
    const suits = {};
    for (const card of cards) {
      suits[card.suit] = (suits[card.suit] || 0) + 1;
    }
    return Object.values(suits).some((count) => count >= 5);
  }

  static checkStraight(sortedCards) {
    const values = sortedCards.map((c) => c.value);

    for (let i = 0; i <= values.length - 5; i++) {
      let isStraight = true;
      for (let j = 0; j < 4; j++) {
        if (values[i + j] - values[i + j + 1] !== 1) {
          isStraight = false;
          break;
        }
      }
      if (isStraight) {
        return values[i];
      }
    }

    if (
      values[0] === 14 &&
      values[values.length - 4] === 5 &&
      values[values.length - 3] === 4 &&
      values[values.length - 2] === 3 &&
      values[values.length - 1] === 2
    ) {
      return 5;
    }

    return null;
  }

  static groupByRank(cards) {
    const groups = {};
    for (const card of cards) {
      if (!groups[card.value]) {
        groups[card.value] = [];
      }
      groups[card.value].push(card);
    }
    return groups;
  }

  static getRankOfSize(groups, size) {
    for (const [rank, cards] of Object.entries(groups)) {
      if (cards.length === size) {
        return parseInt(rank);
      }
    }
    return null;
  }

  static getRanksOfSize(groups, size) {
    const ranks = [];
    for (const [rank, cards] of Object.entries(groups)) {
      if (cards.length === size) {
        ranks.push(parseInt(rank));
      }
    }
    return ranks;
  }

  static getKickers(groups, usedRanks, count) {
    const kickers = [];
    const sortedRanks = Object.keys(groups)
      .map((r) => parseInt(r))
      .filter((r) => !usedRanks.includes(r))
      .sort((a, b) => b - a);

    for (let i = 0; i < count && i < sortedRanks.length; i++) {
      kickers.push(sortedRanks[i]);
    }

    return kickers;
  }

  static compareTiebreakers(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] > b[i]) return 1;
      if (a[i] < b[i]) return -1;
    }
    return 0;
  }

  static getCardName(value) {
    const names = {
      2: 'Two',
      3: 'Three',
      4: 'Four',
      5: 'Five',
      6: 'Six',
      7: 'Seven',
      8: 'Eight',
      9: 'Nine',
      10: 'Ten',
      11: 'Jack',
      12: 'Queen',
      13: 'King',
      14: 'Ace',
    };
    return names[value] || value.toString();
  }

  static getCombinations(arr, size) {
    const combinations = [];

    function backtrack(start, current) {
      if (current.length === size) {
        combinations.push([...current]);
        return;
      }

      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]);
        backtrack(i + 1, current);
        current.pop();
      }
    }

    backtrack(0, []);
    return combinations;
  }

  /**
   * Compares two evaluated poker hands to determine which is stronger.
   *
   * @static
   * @param {Object} hand1 - First hand evaluation result
   * @param {Object} hand2 - Second hand evaluation result
   * @returns {number} 1 if hand1 wins, -1 if hand2 wins, 0 if tie
   * @example
   * const result = HandEvaluator.compareHands(straightHand, flushHand);
   * // Returns: -1 (flush beats straight)
   */
  static compareHands(hand1, hand2) {
    if (hand1.rank > hand2.rank) return 1;
    if (hand1.rank < hand2.rank) return -1;

    return this.compareTiebreakers(hand1.tiebreakers, hand2.tiebreakers);
  }

  /**
   * Determines the winning player(s) from a collection of player hands.
   * Handles ties by returning multiple winners when hands are equal.
   *
   * @static
   * @param {Object[]} playerHands - Array of {player, cards} objects
   * @returns {Object[]} Array of {player, hand} objects for winning player(s)
   * @example
   * const winners = HandEvaluator.findWinners([
   *   {player: player1, cards: [...]},
   *   {player: player2, cards: [...]}
   * ]);
   * console.log(`${winners[0].player.name} wins with ${winners[0].hand.description}`);
   */
  static findWinners(playerHands) {
    const evaluatedHands = playerHands.map(({ player, cards }) => ({
      player,
      hand: this.evaluateHand(cards),
    }));

    evaluatedHands.sort((a, b) => this.compareHands(b.hand, a.hand));

    const winners = [evaluatedHands[0]];
    for (let i = 1; i < evaluatedHands.length; i++) {
      if (this.compareHands(evaluatedHands[0].hand, evaluatedHands[i].hand) === 0) {
        winners.push(evaluatedHands[i]);
      } else {
        break;
      }
    }

    return winners;
  }
}

export default HandEvaluator;
