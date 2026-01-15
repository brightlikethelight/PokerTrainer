/**
 * OpponentModel
 * Tracks and analyzes opponent playing patterns for adaptive AI decision making
 */

import { PLAYER_ACTIONS, GAME_PHASES } from '../../constants/game-constants';

/**
 * Classification thresholds for player types
 */
const PLAYER_TYPE_THRESHOLDS = {
  // VPIP thresholds (Voluntarily Put $ In Pot)
  tight: 20, // < 20% VPIP = tight
  loose: 35, // > 35% VPIP = loose

  // PFR thresholds (Pre-Flop Raise)
  passive: 15, // < 15% PFR = passive
  aggressive: 25, // > 25% PFR = aggressive

  // Aggression Factor thresholds
  passiveAF: 1.0, // < 1.0 AF = passive
  aggressiveAF: 2.5, // > 2.5 AF = aggressive
};

class OpponentModel {
  constructor(playerId, playerName = 'Unknown') {
    this.playerId = playerId;
    this.playerName = playerName;

    // Pre-flop statistics
    this.stats = {
      // Opportunity counters
      preflopOpportunities: 0, // Hands where player could act preflop
      postflopOpportunities: 0, // Hands that reached postflop

      // Pre-flop actions
      voluntaryPutInPot: 0, // Times player voluntarily put money in (not blinds)
      preflopRaises: 0, // Times player raised preflop
      threeBets: 0, // Times player 3-bet
      threeBetOpportunities: 0, // Times player could 3-bet
      foldedToThreeBet: 0,
      facedThreeBet: 0,

      // Post-flop actions
      continuationBets: 0, // C-bets made
      continuationBetOpportunities: 0, // Opportunities to c-bet
      foldedToCBet: 0,
      facedCBet: 0,

      // Aggression tracking
      bets: 0,
      raises: 0,
      calls: 0,
      checks: 0,
      folds: 0,

      // Showdown stats
      wentToShowdown: 0, // Times player reached showdown
      wonAtShowdown: 0, // Times player won at showdown
      showdownOpportunities: 0, // Hands that reached showdown where player was involved

      // Hand results
      handsPlayed: 0,
      handsWon: 0,

      // Recent action history (for pattern detection)
      recentActions: [],
    };

    // Derived statistics (calculated on demand)
    this._cachedStats = null;
    this._cacheValid = false;
  }

  /**
   * Update model after a player action
   * @param {string} action - The action taken
   * @param {Object} context - Context about the action
   */
  updateFromAction(action, context = {}) {
    const { phase, isVoluntary = true, amount = 0 } = context;

    this._cacheValid = false;

    // Track the action
    this.stats.recentActions.push({
      action,
      phase,
      amount,
      timestamp: Date.now(),
    });

    // Keep only last 50 actions
    if (this.stats.recentActions.length > 50) {
      this.stats.recentActions.shift();
    }

    // Update counters based on action type
    switch (action) {
      case PLAYER_ACTIONS.FOLD:
        this.stats.folds++;
        break;

      case PLAYER_ACTIONS.CHECK:
        this.stats.checks++;
        break;

      case PLAYER_ACTIONS.CALL:
        this.stats.calls++;
        if (phase === GAME_PHASES.PREFLOP && isVoluntary) {
          this.stats.voluntaryPutInPot++;
        }
        break;

      case PLAYER_ACTIONS.BET:
        this.stats.bets++;
        if (phase === GAME_PHASES.PREFLOP && isVoluntary) {
          this.stats.voluntaryPutInPot++;
          this.stats.preflopRaises++;
        }
        break;

      case PLAYER_ACTIONS.RAISE:
        this.stats.raises++;
        if (phase === GAME_PHASES.PREFLOP) {
          this.stats.voluntaryPutInPot++;
          this.stats.preflopRaises++;
        }
        break;

      case PLAYER_ACTIONS.ALL_IN:
        // Count as aggressive action
        this.stats.raises++;
        if (phase === GAME_PHASES.PREFLOP && isVoluntary) {
          this.stats.voluntaryPutInPot++;
          this.stats.preflopRaises++;
        }
        break;
    }
  }

  /**
   * Record a preflop opportunity
   */
  recordPreflopOpportunity() {
    this.stats.preflopOpportunities++;
    this._cacheValid = false;
  }

  /**
   * Record a postflop opportunity
   */
  recordPostflopOpportunity() {
    this.stats.postflopOpportunities++;
    this._cacheValid = false;
  }

  /**
   * Record a 3-bet opportunity
   * @param {boolean} didThreeBet - Whether player 3-bet
   */
  recordThreeBetOpportunity(didThreeBet) {
    this.stats.threeBetOpportunities++;
    if (didThreeBet) {
      this.stats.threeBets++;
    }
    this._cacheValid = false;
  }

  /**
   * Record facing a 3-bet
   * @param {boolean} folded - Whether player folded
   */
  recordFacedThreeBet(folded) {
    this.stats.facedThreeBet++;
    if (folded) {
      this.stats.foldedToThreeBet++;
    }
    this._cacheValid = false;
  }

  /**
   * Record a continuation bet opportunity
   * @param {boolean} didCBet - Whether player made c-bet
   */
  recordCBetOpportunity(didCBet) {
    this.stats.continuationBetOpportunities++;
    if (didCBet) {
      this.stats.continuationBets++;
    }
    this._cacheValid = false;
  }

  /**
   * Record facing a c-bet
   * @param {boolean} folded - Whether player folded
   */
  recordFacedCBet(folded) {
    this.stats.facedCBet++;
    if (folded) {
      this.stats.foldedToCBet++;
    }
    this._cacheValid = false;
  }

  /**
   * Record showdown result
   * @param {boolean} won - Whether player won
   */
  recordShowdown(won) {
    this.stats.wentToShowdown++;
    this.stats.showdownOpportunities++;
    if (won) {
      this.stats.wonAtShowdown++;
    }
    this._cacheValid = false;
  }

  /**
   * Record hand completion
   * @param {boolean} won - Whether player won the hand
   */
  recordHandComplete(won) {
    this.stats.handsPlayed++;
    if (won) {
      this.stats.handsWon++;
    }
    this._cacheValid = false;
  }

  /**
   * Calculate derived statistics
   * @returns {Object} Calculated statistics
   */
  getCalculatedStats() {
    if (this._cacheValid && this._cachedStats) {
      return this._cachedStats;
    }

    const s = this.stats;

    // VPIP: Voluntarily Put $ In Pot percentage
    const vpip =
      s.preflopOpportunities > 0 ? (s.voluntaryPutInPot / s.preflopOpportunities) * 100 : 0;

    // PFR: Pre-Flop Raise percentage
    const pfr = s.preflopOpportunities > 0 ? (s.preflopRaises / s.preflopOpportunities) * 100 : 0;

    // 3-bet percentage
    const threeBetPct =
      s.threeBetOpportunities > 0 ? (s.threeBets / s.threeBetOpportunities) * 100 : 0;

    // Fold to 3-bet percentage
    const foldToThreeBetPct =
      s.facedThreeBet > 0 ? (s.foldedToThreeBet / s.facedThreeBet) * 100 : 0;

    // C-bet percentage
    const cBetPct =
      s.continuationBetOpportunities > 0
        ? (s.continuationBets / s.continuationBetOpportunities) * 100
        : 0;

    // Fold to c-bet percentage
    const foldToCBetPct = s.facedCBet > 0 ? (s.foldedToCBet / s.facedCBet) * 100 : 0;

    // Aggression Factor: (bets + raises) / calls
    const aggressiveActions = s.bets + s.raises;
    const aggression =
      s.calls > 0 ? aggressiveActions / s.calls : aggressiveActions > 0 ? 3.0 : 1.0;

    // WTSD: Went To Showdown percentage
    const wtsd =
      s.showdownOpportunities > 0 ? (s.wentToShowdown / s.showdownOpportunities) * 100 : 0;

    // WSD: Won at Showdown percentage
    const wsd = s.wentToShowdown > 0 ? (s.wonAtShowdown / s.wentToShowdown) * 100 : 0;

    // Win rate
    const winRate = s.handsPlayed > 0 ? (s.handsWon / s.handsPlayed) * 100 : 0;

    this._cachedStats = {
      vpip,
      pfr,
      threeBetPct,
      foldToThreeBetPct,
      cBetPct,
      foldToCBetPct,
      aggression,
      wtsd,
      wsd,
      winRate,
      sampleSize: s.preflopOpportunities,
    };

    this._cacheValid = true;
    return this._cachedStats;
  }

  /**
   * Classify player type based on statistics
   * @returns {string} Player type: 'TAG', 'LAG', 'TP', 'LP', or 'Unknown'
   */
  getPlayerType() {
    const stats = this.getCalculatedStats();

    // Need minimum sample size for reliable classification
    if (stats.sampleSize < 10) {
      return 'Unknown';
    }

    const isTight = stats.vpip < PLAYER_TYPE_THRESHOLDS.tight;
    const isLoose = stats.vpip > PLAYER_TYPE_THRESHOLDS.loose;
    const isPassive = stats.aggression < PLAYER_TYPE_THRESHOLDS.passiveAF;
    const isAggressive = stats.aggression > PLAYER_TYPE_THRESHOLDS.aggressiveAF;

    if (isTight && isAggressive) return 'TAG';
    if (isLoose && isAggressive) return 'LAG';
    if (isTight && isPassive) return 'TP';
    if (isLoose && isPassive) return 'LP';

    // Default classifications based on primary characteristic
    if (isTight) return 'TAG'; // Tight players tend to be more skilled
    if (isLoose) return 'LAG'; // Loose players tend to be more aggressive
    if (isAggressive) return 'LAG';
    if (isPassive) return 'LP';

    return 'Unknown';
  }

  /**
   * Get exploitation strategy against this opponent
   * @returns {Object} Strategy recommendations
   */
  getExploitStrategy() {
    const stats = this.getCalculatedStats();
    const playerType = this.getPlayerType();

    const strategy = {
      playerType,
      recommendations: [],
      adjustments: {},
    };

    // Exploit based on statistics
    if (stats.foldToThreeBetPct > 70) {
      strategy.recommendations.push('3-bet light - opponent folds often to 3-bets');
      strategy.adjustments.threeBetFrequency = 1.5; // Increase 3-bet frequency by 50%
    }

    if (stats.foldToCBetPct > 60) {
      strategy.recommendations.push('C-bet frequently - opponent folds often to c-bets');
      strategy.adjustments.cBetFrequency = 1.3;
    }

    if (stats.vpip > 40) {
      strategy.recommendations.push('Value bet thin - opponent plays too many hands');
      strategy.adjustments.valueBetThreshold = 0.9; // Lower value bet threshold
    }

    if (stats.aggression < 1.0) {
      strategy.recommendations.push('Bluff more - opponent rarely raises');
      strategy.adjustments.bluffFrequency = 1.4;
    }

    if (stats.wtsd > 35) {
      strategy.recommendations.push('Reduce bluffs - opponent calls down light');
      strategy.adjustments.bluffFrequency = 0.6;
    }

    // Player type specific adjustments
    switch (playerType) {
      case 'TAG':
        strategy.recommendations.push('Respect their raises, steal their blinds');
        strategy.adjustments.respectRaises = true;
        strategy.adjustments.stealFrequency = 1.3;
        break;

      case 'LAG':
        strategy.recommendations.push('Call down lighter, trap with strong hands');
        strategy.adjustments.callThreshold = 0.85;
        strategy.adjustments.slowplayFrequency = 1.3;
        break;

      case 'TP':
        strategy.recommendations.push('Value bet relentlessly, bluff rarely');
        strategy.adjustments.valueBetFrequency = 1.4;
        strategy.adjustments.bluffFrequency = 0.5;
        break;

      case 'LP':
        strategy.recommendations.push('Value bet wide, avoid bluffing');
        strategy.adjustments.valueBetThreshold = 0.7;
        strategy.adjustments.bluffFrequency = 0.3;
        break;
    }

    return strategy;
  }

  /**
   * Serialize model for storage
   * @returns {Object} Serialized model
   */
  serialize() {
    return {
      playerId: this.playerId,
      playerName: this.playerName,
      stats: { ...this.stats, recentActions: this.stats.recentActions.slice(-20) },
      calculatedStats: this.getCalculatedStats(),
      playerType: this.getPlayerType(),
    };
  }

  /**
   * Load model from serialized data
   * @param {Object} data - Serialized model data
   * @returns {OpponentModel} Restored model
   */
  static deserialize(data) {
    const model = new OpponentModel(data.playerId, data.playerName);
    model.stats = { ...data.stats };
    return model;
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.stats = {
      preflopOpportunities: 0,
      postflopOpportunities: 0,
      voluntaryPutInPot: 0,
      preflopRaises: 0,
      threeBets: 0,
      threeBetOpportunities: 0,
      foldedToThreeBet: 0,
      facedThreeBet: 0,
      continuationBets: 0,
      continuationBetOpportunities: 0,
      foldedToCBet: 0,
      facedCBet: 0,
      bets: 0,
      raises: 0,
      calls: 0,
      checks: 0,
      folds: 0,
      wentToShowdown: 0,
      wonAtShowdown: 0,
      showdownOpportunities: 0,
      handsPlayed: 0,
      handsWon: 0,
      recentActions: [],
    };
    this._cacheValid = false;
  }
}

export default OpponentModel;
