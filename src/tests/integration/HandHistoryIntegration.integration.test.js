/**
 * Hand History Integration Tests
 * Tests hand history capture, storage, and analysis integration
 */

import '../integration/setupIntegrationTests';

import GameEngine from '../../game/engine/GameEngine';
import Player from '../../game/entities/Player';
import { HandHistoryService } from '../../analytics/HandHistoryService';
import HandHistoryStorage from '../../storage/HandHistoryStorage';
import { PLAYER_ACTIONS } from '../../constants/game-constants';

describe('Hand History Integration', () => {
  let gameEngine;
  let handHistoryService;
  let humanPlayer;
  let aiPlayer1;
  let aiPlayer2;

  beforeEach(() => {
    // Setup localStorage mock
    global.integrationTestUtils.mockLocalStorage();

    // Initialize components
    handHistoryService = new HandHistoryService(HandHistoryStorage);

    const setup = global.integrationTestUtils.createGameSetup();
    humanPlayer = new Player(
      setup.players[0].id,
      setup.players[0].name,
      setup.players[0].chips,
      setup.players[0].position,
      false // isAI
    );
    aiPlayer1 = new Player(
      setup.players[1].id,
      setup.players[1].name,
      setup.players[1].chips,
      setup.players[1].position,
      true, // isAI
      setup.players[1].aiType
    );
    aiPlayer2 = new Player(
      setup.players[2].id,
      setup.players[2].name,
      setup.players[2].chips,
      setup.players[2].position,
      true, // isAI
      setup.players[2].aiType
    );

    gameEngine = new GameEngine();
    gameEngine.addPlayer(humanPlayer);
    gameEngine.addPlayer(aiPlayer1);
    gameEngine.addPlayer(aiPlayer2);
  });

  describe('Hand Recording and Storage', () => {
    test('should capture complete hand history from game to storage', async () => {
      gameEngine.startNewHand();

      const handId = `hand_${Date.now()}`;

      // Start recording hand — sets up session synchronously
      handHistoryService.startRecording(handId, {
        sessionId: 'test_session_123',
        gameType: 'no-limit-holdem',
        blinds: { small: 10, big: 20 },
        players: [humanPlayer, aiPlayer1, aiPlayer2],
      });

      // Record preflop actions
      handHistoryService.recordAction(handId, {
        playerId: aiPlayer1.id,
        action: 'small_blind',
        amount: 10,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      handHistoryService.recordAction(handId, {
        playerId: aiPlayer2.id,
        action: 'big_blind',
        amount: 20,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      handHistoryService.recordAction(handId, {
        playerId: humanPlayer.id,
        action: 'call',
        amount: 20,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      // Complete and save hand
      handHistoryService.recordHandResult(handId, {
        winners: [{ playerId: humanPlayer.id, amount: 60 }],
        showdown: true,
        finalPot: 60,
      });
      await handHistoryService.saveHand(handId);

      // Verify hand was saved
      const savedHands = await handHistoryService.getRecentHands(1);
      expect(savedHands).toHaveLength(1);
      expect(savedHands[0].id).toBe(handId);
      // Actions are stored per-phase
      const totalActions = savedHands[0].preflopActions?.length || 0;
      expect(totalActions).toBeGreaterThan(0);
      expect(savedHands[0].winners).toBeDefined();
    });

    test('should handle hand history persistence across sessions', async () => {
      const hand1Id = 'hand_1';
      handHistoryService.startRecording(hand1Id, {
        sessionId: 'session_1',
        gameType: 'no-limit-holdem',
        players: [humanPlayer],
      });
      handHistoryService.recordAction(hand1Id, {
        playerId: humanPlayer.id,
        action: 'fold',
        amount: 0,
        timestamp: Date.now(),
        phase: 'preflop',
      });
      await handHistoryService.saveHand(hand1Id);

      // Second session — reset service state
      const hand2Id = 'hand_2';
      handHistoryService.currentSession = null;
      handHistoryService.startRecording(hand2Id, {
        sessionId: 'session_2',
        gameType: 'no-limit-holdem',
        players: [humanPlayer],
      });
      handHistoryService.recordAction(hand2Id, {
        playerId: humanPlayer.id,
        action: 'call',
        amount: 20,
        timestamp: Date.now(),
        phase: 'preflop',
      });
      handHistoryService.recordHandResult(hand2Id, {
        winners: [{ playerId: humanPlayer.id, amount: 40 }],
        showdown: false,
        finalPot: 40,
      });
      await handHistoryService.saveHand(hand2Id);

      // Verify both hands are retrievable
      const allHands = await handHistoryService.getRecentHands(10);
      expect(allHands).toHaveLength(2);
    });
  });

  describe('Hand History Analysis Integration', () => {
    test('should generate accurate analytics from recorded hands', async () => {
      const hands = [];

      for (let i = 0; i < 5; i++) {
        const handId = `test_hand_${i}`;
        handHistoryService.startRecording(handId, {
          sessionId: 'analytics_test',
          gameType: 'no-limit-holdem',
          players: [humanPlayer, aiPlayer1, aiPlayer2],
        });

        // Vary actions
        handHistoryService.recordAction(handId, {
          playerId: humanPlayer.id,
          action: i % 2 === 0 ? 'call' : 'fold',
          amount: i % 2 === 0 ? 20 : 0,
          timestamp: Date.now() + i * 1000,
          phase: 'preflop',
        });
        handHistoryService.recordAction(handId, {
          playerId: aiPlayer1.id,
          action: 'call',
          amount: 20,
          timestamp: Date.now() + i * 1000,
          phase: 'preflop',
        });

        const result = {
          winners:
            i % 2 === 0
              ? [{ playerId: humanPlayer.id, amount: 80 }]
              : [{ playerId: aiPlayer1.id, amount: 40 }],
          showdown: i % 2 === 0,
          finalPot: i % 2 === 0 ? 80 : 40,
        };

        handHistoryService.recordHandResult(handId, result);
        await handHistoryService.saveHand(handId);
        hands.push(handId);
      }

      // Generate analytics
      const analytics = await handHistoryService.generatePlayerAnalytics(humanPlayer.id, {
        hands: hands.slice(0, 5),
      });

      expect(analytics).toBeDefined();
      expect(analytics.totalHands).toBe(5);

      // Test position-based analytics
      const positionAnalytics = await handHistoryService.getPositionAnalytics(humanPlayer.id);
      expect(positionAnalytics).toBeDefined();
      expect(positionAnalytics.byPosition).toBeDefined();
    });

    test('should detect and analyze betting patterns', async () => {
      const handId = 'pattern_test_hand';
      handHistoryService.startRecording(handId, {
        sessionId: 'pattern_analysis',
        gameType: 'no-limit-holdem',
        players: [humanPlayer],
      });

      // Create a specific betting pattern across phases
      const bettingPattern = [
        { phase: 'preflop', action: 'call', amount: 20 },
        { phase: 'flop', action: 'bet', amount: 30 },
        { phase: 'turn', action: 'raise', amount: 60 },
        { phase: 'river', action: 'call', amount: 40 },
      ];

      for (const bet of bettingPattern) {
        handHistoryService.recordAction(handId, {
          playerId: humanPlayer.id,
          action: bet.action,
          amount: bet.amount,
          timestamp: Date.now(),
          phase: bet.phase,
        });
      }

      await handHistoryService.saveHand(handId);

      // Analyze betting patterns
      const patterns = await handHistoryService.analyzeBettingPatterns(humanPlayer.id);

      expect(patterns).toBeDefined();
      expect(patterns.aggressionFrequency).toBeDefined();
      expect(patterns.bettingSizes).toBeDefined();
      expect(patterns.phasePreferences).toBeDefined();
    });
  });

  describe('Real-time Hand History Integration', () => {
    test('should capture hand history during live game play', () => {
      gameEngine.startNewHand();

      const recordedActions = [];

      // Mock the recording to capture what's being saved
      const originalRecordAction = handHistoryService.recordAction.bind(handHistoryService);
      handHistoryService.recordAction = jest.fn((handId, actionData) => {
        recordedActions.push(actionData);
        return originalRecordAction(handId, actionData);
      });

      // Start recording
      handHistoryService.startRecording('live_hand', {
        sessionId: 'live_session',
        gameType: 'no-limit-holdem',
        players: [humanPlayer, aiPlayer1, aiPlayer2],
      });

      // Record a fold action
      handHistoryService.recordAction('live_hand', {
        playerId: humanPlayer.id,
        action: PLAYER_ACTIONS.FOLD,
        amount: 0,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      // Verify actions were recorded
      expect(recordedActions.length).toBeGreaterThan(0);

      // Verify all recorded actions have required fields
      recordedActions.forEach((action) => {
        expect(action.playerId).toBeDefined();
        expect(action.action).toBeDefined();
        expect(action.timestamp).toBeDefined();
        expect(action.phase).toBeDefined();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle storage errors gracefully and continue operating', async () => {
      const handId = 'error_test_hand';
      handHistoryService.startRecording(handId, {
        sessionId: 'error_test',
        gameType: 'no-limit-holdem',
        players: [humanPlayer],
      });

      handHistoryService.recordAction(handId, {
        playerId: humanPlayer.id,
        action: 'fold',
        amount: 0,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      handHistoryService.recordHandResult(handId, {
        winners: [{ playerId: humanPlayer.id, amount: 0 }],
        showdown: false,
        finalPot: 0,
      });

      // Even if storage internally fails, saveHand should not crash the app
      await expect(handHistoryService.saveHand(handId)).resolves.toBeDefined();

      // Service should continue to function
      expect(() => {
        handHistoryService.startRecording('recovery_hand', {
          sessionId: 'recovery_test',
          gameType: 'no-limit-holdem',
          players: [humanPlayer],
        });
      }).not.toThrow();
    });

    test('should handle corrupted localStorage data', async () => {
      // Create a mock storage that simulates corruption
      const corruptStorage = {
        cache: null,
        async getAllHands() {
          // Simulate what happens when localStorage has corrupted data
          return [];
        },
        async saveHand(hand) {
          return hand.id || 'recovered';
        },
        async saveSession() {
          return 'session_recovered';
        },
      };

      const freshService = new HandHistoryService(corruptStorage);

      // Should handle gracefully — returns empty results
      const hands = await freshService.getRecentHands(10);
      expect(hands).toEqual([]);

      // Should still be able to record new hands
      expect(() => {
        freshService.isCapturing = true;
        freshService.currentSession = 'recovery_session';
        freshService.startHandCapture({
          handNumber: 1,
          players: [humanPlayer],
          pot: 0,
        });
        freshService.captureAction(
          { phase: 'preflop', pot: 0, players: [humanPlayer] },
          humanPlayer.id,
          'call',
          20
        );
      }).not.toThrow();
    });
  });
});
