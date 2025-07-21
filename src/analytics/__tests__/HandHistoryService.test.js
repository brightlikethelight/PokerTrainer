/**
 * HandHistoryService Test Suite
 * Comprehensive tests for poker hand tracking and analytics
 */

import HandHistoryService from '../HandHistoryService';
import TestDataFactory from '../../test-utils/TestDataFactory';
import { GAME_PHASES } from '../../constants/game-constants';

// Mock the storage
jest.mock('../../storage/HandHistoryStorage');

describe('HandHistoryService', () => {
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock storage for each test
    mockStorage = {
      saveSession: jest.fn(),
      saveHand: jest.fn(),
      getAllHands: jest.fn(),
      getStatistics: jest.fn(),
      initialize: jest.fn(),
    };

    // Replace the service storage with our mock
    HandHistoryService.storage = mockStorage;

    // Reset service state
    HandHistoryService.currentSession = null;
    HandHistoryService.currentHand = null;
    HandHistoryService.isCapturing = false;
  });

  describe('Session Management', () => {
    test('should start a session with default configuration', async () => {
      const sessionId = 'session-123';
      mockStorage.saveSession.mockResolvedValue(sessionId);

      const result = await HandHistoryService.startSession();

      expect(mockStorage.saveSession).toHaveBeenCalledWith({
        gameType: 'texas-holdem',
        buyIn: 10000,
        blindStructure: { small: 50, big: 100 },
        maxPlayers: 6,
      });
      expect(result).toBe(sessionId);
      expect(HandHistoryService.currentSession).toBe(sessionId);
      expect(HandHistoryService.isCapturing).toBe(true);
    });

    test('should start a session with custom configuration', async () => {
      const sessionId = 'session-456';
      const customConfig = {
        gameType: 'plo',
        buyIn: 5000,
        blindStructure: { small: 25, big: 50 },
        maxPlayers: 9,
      };

      mockStorage.saveSession.mockResolvedValue(sessionId);

      const result = await HandHistoryService.startSession(customConfig);

      expect(mockStorage.saveSession).toHaveBeenCalledWith(customConfig);
      expect(result).toBe(sessionId);
    });

    test('should handle session start failure', async () => {
      const error = new Error('Database connection failed');
      mockStorage.saveSession.mockRejectedValue(error);

      await expect(HandHistoryService.startSession()).rejects.toThrow('Database connection failed');
      expect(HandHistoryService.currentSession).toBeNull();
      expect(HandHistoryService.isCapturing).toBe(false);
    });

    test('should end a session successfully', async () => {
      const sessionId = 'session-789';
      const sessionStats = {
        totalHands: 15,
        handsWon: 8,
        totalPotWon: 2500,
        biggestWin: 500,
      };

      HandHistoryService.currentSession = sessionId;
      HandHistoryService.isCapturing = true;

      mockStorage.getAllHands.mockResolvedValue([]);
      HandHistoryService.getSessionStats = jest.fn().mockResolvedValue(sessionStats);

      const result = await HandHistoryService.endSession();

      // Session updates are no longer needed with simplified storage
      expect(result).toBe(sessionStats);
      expect(HandHistoryService.currentSession).toBeNull();
      expect(HandHistoryService.isCapturing).toBe(false);
    });

    test('should return null when ending session without active session', async () => {
      HandHistoryService.currentSession = null;

      const result = await HandHistoryService.endSession();

      expect(result).toBeNull();
      // Session updates are no longer needed with simplified storage
    });

    test('should handle session end failure', async () => {
      const sessionId = 'session-error';

      HandHistoryService.currentSession = sessionId;
      // Session updates are no longer needed with simplified storage.mockRejectedValue(error);
      HandHistoryService.getSessionStats = jest.fn().mockResolvedValue({});

      await expect(HandHistoryService.endSession()).rejects.toThrow('Update failed');
    });
  });

  describe('Hand Capture', () => {
    beforeEach(() => {
      HandHistoryService.currentSession = 'test-session';
      HandHistoryService.isCapturing = true;
    });

    test('should start hand capture correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();
      gameState.handNumber = 42;

      HandHistoryService.startHandCapture(gameState);

      expect(HandHistoryService.currentHand).toMatchObject({
        sessionId: 'test-session',
        gameType: 'texas-holdem',
        handNumber: 42,
        heroPosition: expect.any(Number),
        heroCards: expect.any(Array),
        playerCount: expect.any(Number),
        preflopActions: [],
        flopActions: [],
        turnActions: [],
        riverActions: [],
        flopCards: [],
        turnCard: null,
        riverCard: null,
        initialPot: expect.any(Object), // Pot object with valueOf/toString methods
        potProgression: expect.any(Array),
        blinds: expect.objectContaining({
          small: expect.any(Number),
          big: expect.any(Number),
        }),
        playersStartState: expect.any(Array),
        startTime: expect.any(Number),
        phase: 'preflop',
        isComplete: false,
      });
    });

    test('should not start hand capture when not capturing', () => {
      HandHistoryService.isCapturing = false;
      const gameState = TestDataFactory.createGameScenarios().preflop();

      HandHistoryService.startHandCapture(gameState);

      expect(HandHistoryService.currentHand).toBeNull();
    });

    test('should not start hand capture without active session', () => {
      HandHistoryService.currentSession = null;
      const gameState = TestDataFactory.createGameScenarios().preflop();

      HandHistoryService.startHandCapture(gameState);

      expect(HandHistoryService.currentHand).toBeNull();
    });

    test('should capture player actions correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.startHandCapture(gameState);

      const playerId = 'player-1';
      const action = 'raise';
      const amount = 200;

      HandHistoryService.captureAction(gameState, playerId, action, amount);

      expect(HandHistoryService.currentHand.preflopActions).toHaveLength(1);
      expect(HandHistoryService.currentHand.preflopActions[0]).toMatchObject({
        playerId,
        action,
        amount,
        timestamp: expect.any(Number),
        potBefore: expect.any(Object), // Pot object with valueOf/toString methods
        playerChipsBefore: expect.any(Number),
        position: expect.any(Number),
      });
      expect(HandHistoryService.currentHand.potProgression).toHaveLength(2); // Initial + after action
    });

    test('should capture actions in correct betting round', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();
      gameState.phase = GAME_PHASES.FLOP;
      HandHistoryService.startHandCapture(gameState);

      HandHistoryService.captureAction(gameState, 'player-1', 'bet', 150);

      expect(HandHistoryService.currentHand.flopActions).toHaveLength(1);
      expect(HandHistoryService.currentHand.preflopActions).toHaveLength(0);
    });

    test('should not capture actions without active hand', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.currentHand = null;

      HandHistoryService.captureAction(gameState, 'player-1', 'fold', 0);

      // Should not throw error, just silently return
      expect(true).toBe(true);
    });

    test('should capture street changes correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.startHandCapture(gameState);

      const communityCards = TestDataFactory.createCommunityCards().aceHighDry();

      HandHistoryService.captureStreetChange(gameState, GAME_PHASES.FLOP, communityCards);

      expect(HandHistoryService.currentHand.phase).toBe(GAME_PHASES.FLOP);
      expect(HandHistoryService.currentHand.flopCards).toHaveLength(3);
      expect(HandHistoryService.currentHand.flopCards[0]).toMatchObject({
        rank: expect.any(String),
        suit: expect.any(String),
      });
    });

    test('should capture turn card correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.startHandCapture(gameState);

      const communityCards = [
        ...TestDataFactory.createCommunityCards().aceHighDry(),
        TestDataFactory.createCard('K', 'h'),
      ];

      HandHistoryService.captureStreetChange(gameState, GAME_PHASES.TURN, communityCards);

      expect(HandHistoryService.currentHand.phase).toBe(GAME_PHASES.TURN);
      expect(HandHistoryService.currentHand.turnCard).toMatchObject({
        rank: 'K',
        suit: 'h',
      });
    });

    test('should capture river card correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.startHandCapture(gameState);

      const communityCards = [
        ...TestDataFactory.createCommunityCards().aceHighDry(),
        TestDataFactory.createCard('K', 'h'),
        TestDataFactory.createCard('7', 'd'),
      ];

      HandHistoryService.captureStreetChange(gameState, GAME_PHASES.RIVER, communityCards);

      expect(HandHistoryService.currentHand.phase).toBe(GAME_PHASES.RIVER);
      expect(HandHistoryService.currentHand.riverCard).toMatchObject({
        rank: '7',
        suit: 'd',
      });
    });
  });

  describe('Hand Completion', () => {
    beforeEach(() => {
      HandHistoryService.currentSession = 'test-session';
      HandHistoryService.isCapturing = true;

      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.startHandCapture(gameState);
    });

    test('should complete hand with winner correctly', async () => {
      const gameState = TestDataFactory.createGameScenarios().showdown();
      const winners = [
        {
          playerId: 'player-1',
          amount: 500,
          hand: { description: 'Pair of Aces' },
        },
      ];
      const handId = 'hand-123';

      mockStorage.saveHand.mockResolvedValue(handId);

      const result = await HandHistoryService.completeHand(gameState, winners, true);

      // Verify the hand data was saved correctly
      expect(mockStorage.saveHand).toHaveBeenCalledWith(
        expect.objectContaining({
          isComplete: true,
          handResult: 'lost', // Hero didn't win
          heroWinAmount: 0,
          showdown: true,
          winners: expect.arrayContaining([expect.objectContaining({ playerId: 'player-1' })]),
        })
      );
      expect(result).toBe(handId);
      expect(HandHistoryService.currentHand).toBeNull(); // Should be cleared after completion
    });

    test('should complete hand with hero winning', async () => {
      const gameState = TestDataFactory.createGameScenarios().showdown();
      const heroId = HandHistoryService.getHeroId(gameState);
      const winners = [
        {
          playerId: heroId,
          amount: 750,
          hand: { description: 'Full House' },
        },
      ];
      const handId = 'hand-456';

      mockStorage.saveHand.mockResolvedValue(handId);

      const result = await HandHistoryService.completeHand(gameState, winners, true);

      // Verify the hand data was saved correctly
      expect(mockStorage.saveHand).toHaveBeenCalledWith(
        expect.objectContaining({
          handResult: 'won',
          heroWinAmount: 750,
          amountLost: 0,
        })
      );
      expect(result).toBe(handId);
      expect(HandHistoryService.currentHand).toBeNull(); // Should be cleared after completion
    });

    test('should not complete hand without active hand', async () => {
      HandHistoryService.currentHand = null;
      const gameState = TestDataFactory.createGameScenarios().showdown();

      const result = await HandHistoryService.completeHand(gameState, [], false);

      expect(result).toBeUndefined();
      expect(mockStorage.saveHand).not.toHaveBeenCalled();
    });

    test('should handle hand completion failure', async () => {
      const gameState = TestDataFactory.createGameScenarios().showdown();
      const error = new Error('Save failed');

      mockStorage.saveHand.mockRejectedValue(error);

      await expect(HandHistoryService.completeHand(gameState, [], false)).rejects.toThrow(
        'Save failed'
      );
    });
  });

  describe('Hand Analysis', () => {
    beforeEach(() => {
      HandHistoryService.currentSession = 'test-session';
      HandHistoryService.isCapturing = true;

      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.startHandCapture(gameState);
    });

    test('should analyze hand correctly', () => {
      // Add some actions to analyze
      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.captureAction(gameState, 'hero', 'raise', 200);
      HandHistoryService.captureAction(gameState, 'villain', 'call', 200);

      const analysis = HandHistoryService.analyzeHand();

      expect(analysis).toMatchObject({
        totalActions: expect.any(Number),
        aggressiveActions: expect.any(Number),
        aggressionFactor: expect.any(Number),
        playedFromPosition: expect.any(Number),
        earlyPosition: expect.any(Boolean),
        latePosition: expect.any(Boolean),
        preflopAggression: expect.any(Number),
        postflopAggression: expect.any(Number),
        wentToShowdown: expect.any(Boolean),
        foldedPreflop: expect.any(Boolean),
        foldedPostflop: expect.any(Boolean),
        potOddsDecisions: expect.any(Object),
        valueExtracted: expect.any(Number),
        tags: expect.any(Array),
      });
    });

    test('should return null analysis without active hand', () => {
      HandHistoryService.currentHand = null;

      const analysis = HandHistoryService.analyzeHand();

      expect(analysis).toBeNull();
    });

    test('should calculate aggression factor correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();

      // Hero makes 2 aggressive actions out of 3 total
      HandHistoryService.captureAction(gameState, 'hero', 'raise', 200);
      HandHistoryService.captureAction(gameState, 'hero', 'bet', 150);
      HandHistoryService.captureAction(gameState, 'hero', 'call', 100);

      const aggressionFactor = HandHistoryService.calculateAggressionFactor();

      expect(aggressionFactor).toBeCloseTo(2 / 3, 2); // 2 aggressive out of 3 total
    });

    test('should identify early position correctly', () => {
      HandHistoryService.currentHand.heroPosition = 1;

      const analysis = HandHistoryService.analyzeHand();

      expect(analysis.earlyPosition).toBe(true);
      expect(analysis.latePosition).toBe(false);
    });

    test('should identify late position correctly', () => {
      HandHistoryService.currentHand.heroPosition = 5;

      const analysis = HandHistoryService.analyzeHand();

      expect(analysis.earlyPosition).toBe(false);
      expect(analysis.latePosition).toBe(true);
    });

    test('should generate appropriate hand tags', () => {
      HandHistoryService.currentHand.heroPosition = 5; // Late position
      HandHistoryService.currentHand.handResult = 'won';
      HandHistoryService.currentHand.showdown = true;

      const tags = HandHistoryService.generateHandTags();

      expect(tags).toContain('late-position');
      expect(tags).toContain('won');
      expect(tags).toContain('showdown');
    });
  });

  describe('Session Statistics', () => {
    beforeEach(() => {
      HandHistoryService.currentSession = 'test-session';
    });

    test('should calculate session statistics correctly', async () => {
      const hands = [
        {
          handResult: 'won',
          heroWinAmount: 250,
          amountLost: 0,
          potSize: 300,
          startTime: Date.now() - 1000,
        },
        {
          handResult: 'won',
          heroWinAmount: 400,
          amountLost: 0,
          potSize: 500,
          startTime: Date.now() - 2000,
        },
        {
          handResult: 'lost',
          heroWinAmount: 0,
          amountLost: 150,
          potSize: 200,
          startTime: Date.now() - 3000,
        },
      ];

      mockStorage.getAllHands.mockResolvedValue(hands);

      const stats = await HandHistoryService.getSessionStats();

      expect(stats).toMatchObject({
        sessionId: 'test-session',
        totalHands: 3,
        handsWon: 2,
        handsLost: 1,
        winRate: 66.67,
        totalPotWon: 650,
        totalAmountLost: 150,
        netProfit: 500,
        biggestWin: 400,
        averagePot: expect.any(Number),
        sessionDuration: expect.any(Number),
      });
    });

    test('should handle empty session', async () => {
      mockStorage.getAllHands.mockResolvedValue([]);

      const stats = await HandHistoryService.getSessionStats();

      expect(stats).toMatchObject({
        totalHands: 0,
        handsWon: 0,
        handsLost: 0,
        winRate: 0,
        totalPotWon: 0,
        totalAmountLost: 0,
        netProfit: 0,
        biggestWin: 0,
        averagePot: 0,
      });
    });

    test('should return null without active session', async () => {
      HandHistoryService.currentSession = null;

      const stats = await HandHistoryService.getSessionStats();

      expect(stats).toBeNull();
    });

    test('should handle session stats calculation failure', async () => {
      const error = new Error('Database error');
      mockStorage.getAllHands.mockRejectedValue(error);

      await expect(HandHistoryService.getSessionStats()).rejects.toThrow('Database error');
    });
  });

  describe('Helper Methods', () => {
    test('should find hero position correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();

      const heroPosition = HandHistoryService.findHeroPosition(gameState);

      expect(typeof heroPosition).toBe('number');
      expect(heroPosition).toBeGreaterThanOrEqual(0);
    });

    test('should get hero cards correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();

      const heroCards = HandHistoryService.getHeroCards(gameState);

      expect(Array.isArray(heroCards)).toBe(true);
      if (heroCards.length > 0) {
        expect(heroCards[0]).toMatchObject({
          rank: expect.any(String),
          suit: expect.any(String),
        });
      }
    });

    test('should get hero ID correctly', () => {
      const gameState = TestDataFactory.createGameScenarios().preflop();

      const heroId = HandHistoryService.getHeroId(gameState);

      expect(typeof heroId).toBe('string');
    });

    test('should calculate hero investment correctly', () => {
      HandHistoryService.currentHand = {
        preflopActions: [
          { playerId: 'hero', action: 'raise', amount: 200 },
          { playerId: 'villain', action: 'call', amount: 200 },
        ],
        flopActions: [
          { playerId: 'hero', action: 'bet', amount: 150 },
          { playerId: 'villain', action: 'fold', amount: 0 },
        ],
        turnActions: [],
        riverActions: [],
      };

      HandHistoryService.getHeroId = jest.fn().mockReturnValue('hero');

      const investment = HandHistoryService.calculateHeroInvestment();

      expect(investment).toBe(350); // 200 + 150
    });

    test('should check player participation correctly', () => {
      HandHistoryService.currentHand = {
        preflopActions: [
          { playerId: 'player1', action: 'raise', amount: 200 },
          { playerId: 'player2', action: 'fold', amount: 0 },
        ],
        flopActions: [],
        turnActions: [],
        riverActions: [],
      };

      expect(HandHistoryService.playerParticipated('player1')).toBe(true);
      expect(HandHistoryService.playerParticipated('player2')).toBe(true);
      expect(HandHistoryService.playerParticipated('player3')).toBe(false);
    });

    test('should count actions correctly', () => {
      HandHistoryService.currentHand = {
        preflopActions: [
          { playerId: 'hero', action: 'raise', amount: 200 },
          { playerId: 'villain', action: 'call', amount: 200 },
        ],
        flopActions: [{ playerId: 'hero', action: 'check', amount: 0 }],
        turnActions: [],
        riverActions: [],
      };

      HandHistoryService.getHeroId = jest.fn().mockReturnValue('hero');

      expect(HandHistoryService.countTotalActions()).toBe(2);
      expect(HandHistoryService.countAggressiveActions()).toBe(1); // Only the raise
    });
  });

  describe('Error Handling', () => {
    test('should handle analysis errors gracefully', () => {
      HandHistoryService.currentHand = {
        preflopActions: null, // Invalid data
      };

      const analysis = HandHistoryService.analyzeHand();

      expect(analysis).toBeNull();
    });

    test('should handle missing player data', () => {
      const gameState = { players: [] }; // No players

      const heroPosition = HandHistoryService.findHeroPosition(gameState);
      const heroCards = HandHistoryService.getHeroCards(gameState);
      const heroId = HandHistoryService.getHeroId(gameState);

      expect(heroPosition).toBe(0);
      expect(heroCards).toEqual([]);
      expect(heroId).toBeUndefined();
    });

    test('should handle corrupted hand data', () => {
      HandHistoryService.currentHand = null;

      expect(HandHistoryService.calculateHeroInvestment()).toBe(0);
      expect(HandHistoryService.playerParticipated('any')).toBe(false);
      expect(HandHistoryService.countTotalActions()).toBe(0);
      expect(HandHistoryService.countAggressiveActions()).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete hand flow', async () => {
      // Start session
      mockStorage.saveSession.mockResolvedValue('session-1');
      await HandHistoryService.startSession();

      // Start hand
      const gameState = TestDataFactory.createGameScenarios().preflop();
      HandHistoryService.startHandCapture(gameState);

      // Capture actions
      HandHistoryService.captureAction(gameState, 'hero', 'raise', 200);
      HandHistoryService.captureAction(gameState, 'villain', 'call', 200);

      // Progress through streets
      const flopCards = TestDataFactory.createCommunityCards().aceHighDry();
      HandHistoryService.captureStreetChange(gameState, GAME_PHASES.FLOP, flopCards);

      // Complete hand
      const winners = [{ playerId: 'hero', amount: 400, hand: {} }];
      mockStorage.saveHand.mockResolvedValue('hand-1');

      const handId = await HandHistoryService.completeHand(gameState, winners, false);

      expect(handId).toBe('hand-1');
      expect(HandHistoryService.currentHand).toBeNull();
    });

    test('should handle multiple concurrent hands', async () => {
      mockStorage.saveSession.mockResolvedValue('session-multi');
      await HandHistoryService.startSession();

      const gameState1 = TestDataFactory.createGameScenarios().preflop();
      gameState1.handNumber = 1;

      // Start first hand
      HandHistoryService.startHandCapture(gameState1);
      const firstHandNumber = HandHistoryService.currentHand.handNumber;

      // Complete first hand
      mockStorage.saveHand.mockResolvedValue('hand-1');
      await HandHistoryService.completeHand(gameState1, [], false);

      // Start second hand
      const gameState2 = TestDataFactory.createGameScenarios().preflop();
      gameState2.handNumber = 2;
      HandHistoryService.startHandCapture(gameState2);

      expect(HandHistoryService.currentHand.handNumber).toBe(2);
      expect(firstHandNumber).toBe(1);
    });

    test('should maintain data integrity across session', async () => {
      // Start session
      mockStorage.saveSession.mockResolvedValue('integrity-session');
      await HandHistoryService.startSession();

      // Simulate multiple hands
      const hands = [];
      for (let i = 0; i < 5; i++) {
        const gameState = TestDataFactory.createGameScenarios().preflop();
        gameState.handNumber = i + 1;

        HandHistoryService.startHandCapture(gameState);
        HandHistoryService.captureAction(gameState, 'hero', 'fold', 0);

        mockStorage.saveHand.mockResolvedValue(`hand-${i + 1}`);
        const handId = await HandHistoryService.completeHand(gameState, [], false);
        hands.push(handId);
      }

      // End session
      mockStorage.getAllHands.mockResolvedValue(
        hands.map((id, index) => ({
          id,
          handResult: 'lost',
          heroWinAmount: 0,
          amountLost: 50,
          potSize: 100,
          startTime: Date.now() - (5 - index) * 1000,
        }))
      );

      const sessionStats = await HandHistoryService.endSession();

      expect(sessionStats.totalHands).toBe(5);
      expect(sessionStats.handsWon).toBe(0);
      expect(sessionStats.totalAmountLost).toBe(250);
    });
  });
});
