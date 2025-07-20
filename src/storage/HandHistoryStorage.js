/**
 * Simplified Hand History Storage using localStorage
 * Replaces the complex IndexedDB implementation with a simple, maintainable solution
 */

import logger from '../services/logger';

const STORAGE_KEY = 'poker_trainer_hand_history';
const MAX_STORED_HANDS = 1000; // Prevent localStorage from growing too large

class HandHistoryStorage {
  constructor() {
    this.cache = null;
  }

  /**
   * Initialize storage and load cached data
   */
  async initialize() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.cache = stored ? JSON.parse(stored) : { hands: [], sessions: [] };
      logger.info('Hand history storage initialized', {
        handCount: this.cache.hands.length,
        sessionCount: this.cache.sessions.length,
      });
    } catch (error) {
      logger.error('Failed to initialize hand history storage', error);
      this.cache = { hands: [], sessions: [] };
    }
  }

  /**
   * Save a hand to storage
   */
  async saveHand(hand) {
    try {
      if (!this.cache) await this.initialize();

      // Add timestamp if not present
      const handWithTimestamp = {
        ...hand,
        timestamp: hand.timestamp || Date.now(),
        id: hand.id || `hand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Add to beginning of array (most recent first)
      this.cache.hands.unshift(handWithTimestamp);

      // Trim to max size
      if (this.cache.hands.length > MAX_STORED_HANDS) {
        this.cache.hands = this.cache.hands.slice(0, MAX_STORED_HANDS);
      }

      // Persist to localStorage
      this._persist();

      return handWithTimestamp.id;
    } catch (error) {
      logger.error('Failed to save hand', error);
      throw error;
    }
  }

  /**
   * Get all hands
   */
  async getAllHands() {
    if (!this.cache) await this.initialize();
    return [...this.cache.hands];
  }

  /**
   * Get hands by date range
   */
  async getHandsByDateRange(startDate, endDate) {
    if (!this.cache) await this.initialize();

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return this.cache.hands.filter((hand) => {
      const timestamp = hand.timestamp || 0;
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Get hands by player
   */
  async getHandsByPlayer(playerId) {
    if (!this.cache) await this.initialize();

    return this.cache.hands.filter(
      (hand) => hand.players && hand.players.some((p) => p.id === playerId)
    );
  }

  /**
   * Save a session
   */
  async saveSession(session) {
    try {
      if (!this.cache) await this.initialize();

      const sessionWithTimestamp = {
        ...session,
        id: session.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: session.startTime || Date.now(),
        endTime: session.endTime || Date.now(),
      };

      this.cache.sessions.unshift(sessionWithTimestamp);

      // Keep only last 100 sessions
      if (this.cache.sessions.length > 100) {
        this.cache.sessions = this.cache.sessions.slice(0, 100);
      }

      this._persist();

      return sessionWithTimestamp.id;
    } catch (error) {
      logger.error('Failed to save session', error);
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions() {
    if (!this.cache) await this.initialize();
    return [...this.cache.sessions];
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    if (!this.cache) await this.initialize();

    const hands = this.cache.hands;
    const sessions = this.cache.sessions;

    // Calculate basic statistics
    const stats = {
      totalHands: hands.length,
      totalSessions: sessions.length,
      handsWon: hands.filter((h) => h.result && h.result.won).length,
      totalWinnings: hands.reduce((sum, h) => sum + (h.result?.profit || 0), 0),
      averageProfit:
        hands.length > 0
          ? hands.reduce((sum, h) => sum + (h.result?.profit || 0), 0) / hands.length
          : 0,
      lastPlayed: hands.length > 0 ? new Date(hands[0].timestamp) : null,
    };

    return stats;
  }

  /**
   * Clear all data
   */
  async clear() {
    this.cache = { hands: [], sessions: [] };
    localStorage.removeItem(STORAGE_KEY);
    logger.info('Hand history storage cleared');
  }

  /**
   * Persist cache to localStorage
   * @private
   */
  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Storage full, remove oldest hands
        logger.warn('localStorage quota exceeded, removing oldest hands');
        this.cache.hands = this.cache.hands.slice(0, Math.floor(MAX_STORED_HANDS * 0.8));
        this.cache.sessions = this.cache.sessions.slice(0, 80);

        // Try again
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
        } catch (retryError) {
          logger.error('Failed to persist after cleanup', retryError);
        }
      } else {
        logger.error('Failed to persist hand history', error);
      }
    }
  }
}

// Export singleton instance
export default new HandHistoryStorage();
