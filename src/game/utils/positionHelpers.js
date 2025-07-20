/**
 * Position Helpers
 * Simple utility functions for poker table positions
 */

/**
 * Check if position is dealer
 * @param {number} position - Player position
 * @returns {boolean}
 */
export function isDealer(position) {
  return position === 0;
}

/**
 * Check if position is small blind
 * @param {number} position - Player position
 * @param {number} totalPlayers - Total players at table
 * @returns {boolean}
 */
export function isSmallBlind(position, totalPlayers) {
  if (totalPlayers === 2) {
    return position === 0; // In heads-up, dealer is small blind
  }
  return position === 1;
}

/**
 * Check if position is big blind
 * @param {number} position - Player position
 * @param {number} totalPlayers - Total players at table
 * @returns {boolean}
 */
export function isBigBlind(position, totalPlayers) {
  if (totalPlayers === 2) {
    return position === 1;
  }
  return position === 2;
}

/**
 * Get position type (early, middle, late, blinds)
 * @param {number} position - Player position
 * @param {number} totalPlayers - Total players at table
 * @returns {string} Position type
 */
export function getPositionType(position, totalPlayers) {
  if (isSmallBlind(position, totalPlayers) || isBigBlind(position, totalPlayers)) {
    return 'blinds';
  }

  if (totalPlayers <= 6) {
    // 6-max: positions 3+ are late position
    return position >= 3 ? 'late' : 'early';
  }

  // Full ring (7-10 players)
  const nonBlindPlayers = totalPlayers - 2;
  const earlyPositions = Math.floor(nonBlindPlayers / 3);
  const middlePositions = Math.floor(nonBlindPlayers / 3);

  if (position <= 2 + earlyPositions) {
    return 'early';
  } else if (position <= 2 + earlyPositions + middlePositions) {
    return 'middle';
  } else {
    return 'late';
  }
}

/**
 * Calculate distance from dealer button
 * @param {number} position - Player position
 * @param {number} dealerPosition - Dealer position
 * @param {number} totalPlayers - Total players at table
 * @returns {number} Distance from dealer
 */
export function distanceFromDealer(position, dealerPosition, totalPlayers) {
  if (position === dealerPosition) return 0;

  if (position > dealerPosition) {
    return position - dealerPosition;
  } else {
    return totalPlayers - dealerPosition + position;
  }
}

/**
 * Get next position
 * @param {number} currentPosition - Current position
 * @param {number} totalPlayers - Total players at table
 * @returns {number} Next position
 */
export function getNextPosition(currentPosition, totalPlayers) {
  return (currentPosition + 1) % totalPlayers;
}

/**
 * Get previous position
 * @param {number} currentPosition - Current position
 * @param {number} totalPlayers - Total players at table
 * @returns {number} Previous position
 */
export function getPreviousPosition(currentPosition, totalPlayers) {
  return (currentPosition - 1 + totalPlayers) % totalPlayers;
}

/**
 * Validate position
 * @param {number} position - Position to validate
 * @param {number} totalPlayers - Total players at table
 * @returns {boolean} Is valid
 */
export function isValidPosition(position, totalPlayers) {
  return (
    Number.isInteger(position) &&
    position >= 0 &&
    position < totalPlayers &&
    Number.isInteger(totalPlayers) &&
    totalPlayers >= 2 &&
    totalPlayers <= 10
  );
}
