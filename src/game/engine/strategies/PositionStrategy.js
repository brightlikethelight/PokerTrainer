/**
 * PositionStrategy
 * Position-based hand range adjustments for AI decision making
 */

/**
 * Position-based opening range percentages
 * Represents the top X% of hands that should be played from each position
 */
const POSITION_RANGES = {
  // Early position: Play tight (top 12-15% of hands)
  early: {
    openRange: 0.12,
    threeBetRange: 0.05,
    callRange: 0.08,
    premiumThreshold: 0.85,
    strongThreshold: 0.7,
    playableThreshold: 0.5,
  },
  // Middle position: Slightly looser (top 16-20%)
  middle: {
    openRange: 0.18,
    threeBetRange: 0.07,
    callRange: 0.12,
    premiumThreshold: 0.8,
    strongThreshold: 0.65,
    playableThreshold: 0.45,
  },
  // Late position (cutoff): Much looser (top 25-30%)
  late: {
    openRange: 0.28,
    threeBetRange: 0.1,
    callRange: 0.18,
    premiumThreshold: 0.75,
    strongThreshold: 0.55,
    playableThreshold: 0.35,
  },
  // Button: Widest range (top 35-40%)
  button: {
    openRange: 0.38,
    threeBetRange: 0.12,
    callRange: 0.25,
    premiumThreshold: 0.7,
    strongThreshold: 0.5,
    playableThreshold: 0.3,
  },
  // Blinds: Defensive ranges
  blinds: {
    openRange: 0.25,
    threeBetRange: 0.08,
    callRange: 0.3, // Wider calling range in blinds due to pot odds
    premiumThreshold: 0.75,
    strongThreshold: 0.55,
    playableThreshold: 0.35,
    defendRange: 0.4, // Defend against steals with top 40%
  },
};

/**
 * Steal and defense percentages
 */
const STEAL_FREQUENCIES = {
  // How often to attempt steals from late position vs blinds
  button: 0.45, // Steal 45% from button when folded to
  cutoff: 0.35, // Steal 35% from cutoff
  hijack: 0.25, // Steal 25% from hijack

  // Defense frequencies against steals
  bigBlindDefend: 0.4, // Defend BB 40% vs steal attempts
  smallBlindDefend: 0.25, // Defend SB 25% vs steal attempts
};

class PositionStrategy {
  /**
   * Get position type for a player
   * @param {number} position - Player's seat position
   * @param {number} dealerPosition - Current dealer button position
   * @param {number} totalPlayers - Total players at table
   * @returns {string} Position type: 'early', 'middle', 'late', 'button', 'blinds'
   */
  static getPosition(position, dealerPosition, totalPlayers) {
    // Calculate relative position from dealer
    const relativePosition = (position - dealerPosition + totalPlayers) % totalPlayers;

    // For heads-up, just return 'button' or 'blinds'
    if (totalPlayers === 2) {
      return relativePosition === 0 ? 'button' : 'blinds';
    }

    // Map relative position to position type
    // Position 0 = dealer (button)
    // Position 1 = small blind
    // Position 2 = big blind
    // Position 3+ = early/middle/late depending on total players

    if (relativePosition === 0) return 'button';
    if (relativePosition === 1 || relativePosition === 2) return 'blinds';

    // For remaining positions, distribute into early/middle/late
    const nonBlindPositions = totalPlayers - 3; // Exclude BTN, SB, BB

    if (nonBlindPositions <= 3) {
      // 5-6 players: mostly late position
      if (relativePosition === 3) return 'late';
      return 'middle';
    }

    // 7+ players: proper distribution
    const thirdOfPositions = Math.ceil(nonBlindPositions / 3);
    const adjustedPosition = relativePosition - 3; // Position after BB

    if (adjustedPosition < thirdOfPositions) return 'early';
    if (adjustedPosition < thirdOfPositions * 2) return 'middle';
    return 'late';
  }

  /**
   * Get range parameters for a position
   * @param {string} positionType - Position type
   * @returns {Object} Range parameters
   */
  static getRangeForPosition(positionType) {
    return POSITION_RANGES[positionType] || POSITION_RANGES.middle;
  }

  /**
   * Adjust hand strength based on position
   * @param {number} baseStrength - Base hand strength (0-1)
   * @param {string} positionType - Position type
   * @param {boolean} isPreflop - Whether this is preflop
   * @returns {number} Adjusted hand strength
   */
  static adjustStrengthForPosition(baseStrength, positionType, isPreflop = true) {
    if (!isPreflop) {
      // Position less important postflop, but still relevant
      const postflopMultiplier =
        {
          early: 0.95,
          middle: 1.0,
          late: 1.05,
          button: 1.1,
          blinds: 0.95,
        }[positionType] || 1.0;

      return Math.min(baseStrength * postflopMultiplier, 1.0);
    }

    // Preflop position adjustments
    // Better positions allow playing weaker hands more profitably
    const positionMultiplier =
      {
        early: 0.85, // Need stronger hands from early position
        middle: 0.92,
        late: 1.05,
        button: 1.15, // Can play weaker hands profitably from button
        blinds: 0.95, // Positional disadvantage postflop
      }[positionType] || 1.0;

    return Math.min(baseStrength * positionMultiplier, 1.0);
  }

  /**
   * Check if hand is playable from given position
   * @param {number} handStrength - Hand strength (0-1)
   * @param {string} positionType - Position type
   * @param {boolean} isRaised - Whether there's a raise to call
   * @returns {boolean} Whether hand should be played
   */
  static isPlayableFromPosition(handStrength, positionType, isRaised = false) {
    const range = this.getRangeForPosition(positionType);

    if (isRaised) {
      // Need stronger hand to call a raise
      return handStrength >= range.callRange * 3; // Convert to strength threshold
    }

    return handStrength >= range.playableThreshold;
  }

  /**
   * Check if hand should be opened from position
   * @param {number} handStrength - Hand strength (0-1)
   * @param {string} positionType - Position type
   * @param {string} aiType - AI player type
   * @returns {boolean} Whether to open raise
   */
  static shouldOpenRaise(handStrength, positionType, aiType = 'TAG') {
    const range = this.getRangeForPosition(positionType);

    // Adjust for AI type
    const typeMultiplier =
      {
        TAG: 1.0, // Standard ranges
        LAG: 1.3, // 30% wider
        TP: 0.8, // 20% tighter
        LP: 1.2, // 20% wider but passive
      }[aiType] || 1.0;

    const adjustedThreshold = range.strongThreshold / typeMultiplier;

    return handStrength >= adjustedThreshold;
  }

  /**
   * Get steal frequency for position
   * @param {string} positionType - Position type
   * @returns {number} Steal frequency (0-1)
   */
  static getStealFrequency(positionType) {
    return (
      {
        button: STEAL_FREQUENCIES.button,
        late: STEAL_FREQUENCIES.cutoff,
        middle: STEAL_FREQUENCIES.hijack,
      }[positionType] || 0
    );
  }

  /**
   * Get blind defense frequency
   * @param {boolean} isSmallBlind - Whether player is in small blind
   * @returns {number} Defense frequency (0-1)
   */
  static getBlindDefenseFrequency(isSmallBlind) {
    return isSmallBlind ? STEAL_FREQUENCIES.smallBlindDefend : STEAL_FREQUENCIES.bigBlindDefend;
  }

  /**
   * Calculate bet sizing adjustment based on position
   * @param {number} baseBetSize - Base bet size
   * @param {string} positionType - Position type
   * @returns {number} Adjusted bet size
   */
  static adjustBetSizeForPosition(baseBetSize, positionType) {
    const sizeMultiplier =
      {
        early: 1.2, // Larger bets from early position (protection)
        middle: 1.1,
        late: 1.0,
        button: 0.9, // Can bet smaller from position
        blinds: 1.1, // Larger bets out of position
      }[positionType] || 1.0;

    return Math.floor(baseBetSize * sizeMultiplier);
  }
}

export default PositionStrategy;
