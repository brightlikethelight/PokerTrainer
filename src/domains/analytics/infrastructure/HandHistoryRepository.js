// Hand History Repository - IndexedDB Implementation
// Stores complete hand histories for analysis and study

import logger from '../../../services/logger';

class HandHistoryRepository {
  constructor() {
    this.dbName = 'PokerTrainerHistory';
    this.version = 1;
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', { error: request.error });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        logger.info('Hand History database initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Hand History Store
        if (!db.objectStoreNames.contains('hands')) {
          const handStore = db.createObjectStore('hands', {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Indexes for efficient querying
          handStore.createIndex('sessionId', 'sessionId', { unique: false });
          handStore.createIndex('timestamp', 'timestamp', { unique: false });
          handStore.createIndex('heroPosition', 'heroPosition', {
            unique: false,
          });
          handStore.createIndex('handResult', 'handResult', { unique: false });
          handStore.createIndex('potSize', 'potSize', { unique: false });
          handStore.createIndex('gameType', 'gameType', { unique: false });
        }

        // Sessions Store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', {
            keyPath: 'id',
            autoIncrement: true,
          });

          sessionStore.createIndex('startTime', 'startTime', { unique: false });
          sessionStore.createIndex('endTime', 'endTime', { unique: false });
          sessionStore.createIndex('totalHands', 'totalHands', {
            unique: false,
          });
        }

        // Player Statistics Store
        if (!db.objectStoreNames.contains('playerStats')) {
          const statsStore = db.createObjectStore('playerStats', {
            keyPath: 'playerId',
          });

          statsStore.createIndex('lastUpdated', 'lastUpdated', {
            unique: false,
          });
          statsStore.createIndex('totalHands', 'totalHands', { unique: false });
          statsStore.createIndex('winRate', 'winRate', { unique: false });
        }

        logger.info('Database schema created/updated');
      };
    });
  }

  async saveHand(handData) {
    await this.initialize();

    const transaction = this.db.transaction(['hands'], 'readwrite');
    const store = transaction.objectStore('hands');

    const enrichedHandData = {
      ...handData,
      timestamp: Date.now(),
      version: '1.0',
      // Ensure required fields
      sessionId: handData.sessionId || this.generateSessionId(),
      heroPosition: handData.heroPosition || 0,
      gameType: handData.gameType || 'texas-holdem',
    };

    return new Promise((resolve, reject) => {
      const request = store.add(enrichedHandData);

      request.onsuccess = () => {
        const handId = request.result;
        logger.info('Hand saved with ID', { handId });
        resolve(handId);
      };

      request.onerror = () => {
        logger.error('Failed to save hand', { error: request.error });
        reject(request.error);
      };
    });
  }

  async getHandsBySession(sessionId) {
    await this.initialize();

    const transaction = this.db.transaction(['hands'], 'readonly');
    const store = transaction.objectStore('hands');
    const index = store.index('sessionId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(sessionId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getRecentHands(limit = 50) {
    await this.initialize();

    const transaction = this.db.transaction(['hands'], 'readonly');
    const store = transaction.objectStore('hands');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const hands = [];
      const request = index.openCursor(null, 'prev'); // Most recent first

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor && hands.length < limit) {
          hands.push(cursor.value);
          cursor.continue();
        } else {
          resolve(hands);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getHandsByPosition(position) {
    await this.initialize();

    const transaction = this.db.transaction(['hands'], 'readonly');
    const store = transaction.objectStore('hands');
    const index = store.index('heroPosition');

    return new Promise((resolve, reject) => {
      const request = index.getAll(position);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getHandsByDateRange(startDate, endDate) {
    await this.initialize();

    const transaction = this.db.transaction(['hands'], 'readonly');
    const store = transaction.objectStore('hands');
    const index = store.index('timestamp');

    const range = IDBKeyRange.bound(startDate.getTime(), endDate.getTime());

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async createSession(sessionData) {
    await this.initialize();

    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    const sessionInfo = {
      ...sessionData,
      startTime: Date.now(),
      totalHands: 0,
      handsWon: 0,
      totalPotWon: 0,
      biggestPot: 0,
      version: '1.0',
    };

    return new Promise((resolve, reject) => {
      const request = store.add(sessionInfo);

      request.onsuccess = () => {
        const sessionId = request.result;
        logger.info('Session created with ID', { sessionId });
        resolve(sessionId);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateSession(sessionId, updates) {
    await this.initialize();

    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(sessionId);

      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (!session) {
          reject(new Error(`Session ${sessionId} not found`));
          return;
        }

        const updatedSession = {
          ...session,
          ...updates,
          lastUpdated: Date.now(),
        };

        const putRequest = store.put(updatedSession);

        putRequest.onsuccess = () => {
          resolve(updatedSession);
        };

        putRequest.onerror = () => {
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  async getAnalytics(options = {}) {
    await this.initialize();

    const { dateRange, position, gameType, minPotSize } = options;

    let hands = await this.getRecentHands(1000); // Get large sample

    // Apply filters
    if (dateRange) {
      const { start, end } = dateRange;
      hands = hands.filter(
        (hand) => hand.timestamp >= start.getTime() && hand.timestamp <= end.getTime()
      );
    }

    if (position !== undefined) {
      hands = hands.filter((hand) => hand.heroPosition === position);
    }

    if (gameType) {
      hands = hands.filter((hand) => hand.gameType === gameType);
    }

    if (minPotSize) {
      hands = hands.filter((hand) => hand.potSize >= minPotSize);
    }

    // Calculate analytics
    const totalHands = hands.length;
    const handsWon = hands.filter((hand) => hand.handResult === 'won').length;
    const winRate = totalHands > 0 ? (handsWon / totalHands) * 100 : 0;

    const totalPotWon = hands
      .filter((hand) => hand.handResult === 'won')
      .reduce((sum, hand) => sum + (hand.potSize || 0), 0);

    const totalPotLost = hands
      .filter((hand) => hand.handResult === 'lost')
      .reduce((sum, hand) => sum + (hand.amountLost || 0), 0);

    const netProfit = totalPotWon - totalPotLost;

    const biggestWin = Math.max(
      ...hands.filter((hand) => hand.handResult === 'won').map((hand) => hand.potSize || 0),
      0
    );

    // Position analysis
    const positionStats = {};
    for (let pos = 0; pos < 6; pos++) {
      const positionHands = hands.filter((hand) => hand.heroPosition === pos);
      positionStats[pos] = {
        totalHands: positionHands.length,
        handsWon: positionHands.filter((hand) => hand.handResult === 'won').length,
        winRate:
          positionHands.length > 0
            ? (positionHands.filter((hand) => hand.handResult === 'won').length /
                positionHands.length) *
              100
            : 0,
      };
    }

    return {
      totalHands,
      handsWon,
      winRate: Math.round(winRate * 100) / 100,
      netProfit,
      totalPotWon,
      totalPotLost,
      biggestWin,
      positionStats,
      averagePotSize:
        totalHands > 0 ? hands.reduce((sum, hand) => sum + (hand.potSize || 0), 0) / totalHands : 0,
      handsAnalyzed: hands.length,
      dateRange: dateRange || 'all-time',
    };
  }

  async exportHandHistory(options = {}) {
    const hands = await this.getRecentHands(options.limit || 1000);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      totalHands: hands.length,
      hands: hands.map((hand) => ({
        ...hand,
        // Remove sensitive data if needed
        timestamp: new Date(hand.timestamp).toISOString(),
      })),
    };

    return exportData;
  }

  async clearOldData(daysToKeep = 30) {
    await this.initialize();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const transaction = this.db.transaction(['hands'], 'readwrite');
    const store = transaction.objectStore('hands');
    const index = store.index('timestamp');

    const range = IDBKeyRange.upperBound(cutoffDate.getTime());

    return new Promise((resolve, reject) => {
      let deletedCount = 0;
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          logger.info('Deleted old hand records', { deletedCount });
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export default HandHistoryRepository;
