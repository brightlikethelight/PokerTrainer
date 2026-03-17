/**
 * PotManager - Encapsulates pot tracking and side pot calculation.
 * Single source of truth for all pot-related state.
 */
class PotManager {
  constructor() {
    this.main = 0;
    this.side = [];
    this.history = [];
  }

  addToMain(amount) {
    this.main += amount;
    this.history.push({ type: 'add', amount, total: this.main });
  }

  getTotalPot() {
    return this.main + this.side.reduce((sum, p) => sum + p.amount, 0);
  }

  reset() {
    this.main = 0;
    this.side = [];
    this.history = [];
  }

  /**
   * Calculate side pots based on player contributions.
   * Accounts for folded players' contributions in the pot.
   */
  calculateSidePots(players) {
    const playersInHand = players.filter((p) => p.isInHand && p.isInHand());
    if (playersInHand.length === 0) return;

    const allContributions = [];
    players.forEach((player) => {
      if (player.totalPotContribution > 0) {
        allContributions.push({
          player,
          amount: player.totalPotContribution,
          isInHand: player.isInHand ? player.isInHand() : false,
        });
      }
    });

    if (allContributions.length === 0) return;

    allContributions.sort((a, b) => a.amount - b.amount);

    const totalContributions = allContributions.reduce((sum, c) => sum + c.amount, 0);
    const eligibleContributions = allContributions.filter((c) => c.isInHand);

    if (eligibleContributions.length === 0) {
      this.main = totalContributions;
      this.side = [];
      return;
    }

    if (eligibleContributions.length === 1) {
      this.main = totalContributions;
      this.side = [];
      return;
    }

    eligibleContributions.sort((a, b) => a.amount - b.amount);

    this.main = 0;
    this.side = [];
    let previousAmount = 0;
    const foldedContribution = allContributions
      .filter((c) => !c.isInHand)
      .reduce((sum, c) => sum + c.amount, 0);

    for (let i = 0; i < eligibleContributions.length; i++) {
      const currentAmount = eligibleContributions[i].amount;
      const numEligibleAtThisLevel = eligibleContributions.length - i;
      let potAmount = (currentAmount - previousAmount) * numEligibleAtThisLevel;

      if (i === 0) {
        potAmount += foldedContribution;
        this.main = potAmount;
      } else {
        const eligiblePlayers = eligibleContributions.slice(i).map((c) => c.player);
        this.side.push({
          amount: potAmount,
          eligiblePlayers,
        });
      }

      previousAmount = currentAmount;
    }
  }

  serialize() {
    return {
      main: this.main,
      side: [...this.side],
    };
  }
}

export default PotManager;
