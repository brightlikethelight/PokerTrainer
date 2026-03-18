import HandEvaluator from '../utils/HandEvaluator';

class ShowdownResolver {
  /**
   * Resolves showdown by evaluating hands and distributing pots.
   * Pure function — does not mutate players or pot state.
   *
   * @param {Player[]} playersInHand - Players still in the hand
   * @param {Card[]} communityCards - The 5 community cards
   * @param {PotManager} potManager - Pot manager with main/side pots
   * @returns {{ winners: Array<{ player, amount, hand, handDescription }> }}
   */
  static resolveShowdown(playersInHand, communityCards, potManager) {
    const playerHands = playersInHand.map((player) => ({
      player,
      cards: [...player.holeCards, ...communityCards],
    }));

    const mainPotWinners = HandEvaluator.findWinners(playerHands);
    const mainPotAmount = potManager.main;
    const mainPotShare = Math.floor(mainPotAmount / mainPotWinners.length);
    const mainPotRemainder = mainPotAmount - mainPotShare * mainPotWinners.length;

    const winners = [];

    mainPotWinners.forEach(({ player, hand }, index) => {
      const share = index === 0 ? mainPotShare + mainPotRemainder : mainPotShare;
      winners.push({
        player,
        amount: share,
        hand,
        handDescription: hand.description,
      });
    });

    for (const sidePot of potManager.side) {
      const eligibleHands = playerHands.filter(({ player }) =>
        sidePot.eligiblePlayers.includes(player)
      );

      const sidePotWinners = HandEvaluator.findWinners(eligibleHands);
      const sidePotShare = Math.floor(sidePot.amount / sidePotWinners.length);
      const sidePotRemainder = sidePot.amount - sidePotShare * sidePotWinners.length;

      sidePotWinners.forEach(({ player, hand }, index) => {
        const share = index === 0 ? sidePotShare + sidePotRemainder : sidePotShare;

        const existingWinner = winners.find((w) => w.player === player);
        if (existingWinner) {
          existingWinner.amount += share;
        } else {
          winners.push({
            player,
            amount: share,
            hand,
            handDescription: hand.description,
          });
        }
      });
    }

    return { winners };
  }

  /**
   * Resolves a win by fold (all other players folded).
   * Pure function — does not mutate player or pot state.
   *
   * @param {Player} winner - The last remaining player
   * @param {number} totalPot - Total pot amount
   * @returns {{ winners: Array<{ player, amount, handDescription }> }}
   */
  static resolveFoldWin(winner, totalPot) {
    return {
      winners: [
        {
          player: winner,
          amount: totalPot,
          handDescription: 'Won by default (others folded)',
        },
      ],
    };
  }
}

export default ShowdownResolver;
