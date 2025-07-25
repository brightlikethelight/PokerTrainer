/**
 * Hand History Integration Tests
 * Tests hand history capture, storage, and analysis integration
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../integration/setupIntegrationTests';

import GameEngine from '../../game/engine/GameEngine';
import Player from '../../game/entities/Player';
// AIPlayer is a static service, not a constructor
import { HandHistoryService } from '../../analytics/HandHistoryService';
import HandHistoryStorage from '../../storage/HandHistoryStorage';
import { useHandHistory } from '../../hooks/useHandHistory';
import HandHistoryDashboard from '../../components/study/HandHistoryDashboard';
import { PLAYER_ACTIONS, GAME_PHASES } from '../../constants/game-constants';

describe('Hand History Integration', () => {
  let gameEngine;
  let handHistoryService;
  let humanPlayer;
  let aiPlayer1;
  let aiPlayer2;
  let localStorage;

  beforeEach(() => {
    // Setup localStorage mock
    localStorage = global.integrationTestUtils.mockLocalStorage();

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

    // Connect hand history service to game engine
    gameEngine.handHistoryService = handHistoryService;
  });

  describe('Hand Recording and Storage', () => {
    test('should capture complete hand history from game to storage', async () => {
      gameEngine.startNewHand();

      const handId = `hand_${Date.now()}`;
      const sessionId = 'test_session_123';

      // Start recording hand
      handHistoryService.startRecording(handId, {
        sessionId,
        gameType: 'no-limit-holdem',
        blinds: { small: 10, big: 20 },
        playerCount: 3,
      });

      // Execute some actions and record them
      const actionSequence = [];

      // Post blinds
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

      // Human player calls
      if (gameEngine.getCurrentPlayer().id === humanPlayer.id) {
        const result = gameEngine.executePlayerAction(PLAYER_ACTIONS.CALL);
        if (result.success) {
          handHistoryService.recordAction(handId, {
            playerId: humanPlayer.id,
            action: 'call',
            amount: 20,
            timestamp: Date.now(),
            phase: 'preflop',
          });
          actionSequence.push({ player: 'human', action: 'call', amount: 20 });
        }
      }

      // AI players act
      let iterations = 0;
      const MAX_ITERATIONS = 20;
      while (!gameEngine.gameState.isBettingRoundComplete() && iterations < MAX_ITERATIONS) {
        iterations++;
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isAI) {
          const aiAction = currentPlayer.decideAction(gameEngine.gameState);
          const result = gameEngine.executePlayerAction(aiAction.action, aiAction.amount);

          if (result.success) {
            handHistoryService.recordAction(handId, {
              playerId: currentPlayer.id,
              action: aiAction.action,
              amount: aiAction.amount || 0,
              timestamp: Date.now(),
              phase: 'preflop',
            });
            actionSequence.push({
              player: currentPlayer.id,
              action: aiAction.action,
              amount: aiAction.amount || 0,
            });
          }
        } else {
          break;
        }
      }
      if (iterations >= MAX_ITERATIONS) {
        throw new Error('Betting round did not complete within iteration limit');
      }

      // Record community cards
      gameEngine.gameState.nextPhase(); // To flop
      handHistoryService.recordCommunityCards(handId, {
        phase: 'flop',
        cards: gameEngine.gameState.communityCards.slice(0, 3),
        timestamp: Date.now(),
      });

      // Complete and save hand
      const handResult = {
        winners: [{ playerId: humanPlayer.id, amount: 60 }],
        showdown: true,
        finalPot: 60,
        endPhase: 'flop',
      };

      handHistoryService.recordHandResult(handId, handResult);
      await handHistoryService.saveHand(handId);

      // Verify hand was saved
      const savedHands = await handHistoryService.getRecentHands(1);
      expect(savedHands).toHaveLength(1);
      expect(savedHands[0].id).toBe(handId);
      expect(savedHands[0].actions).toHaveLength.toBeGreaterThan(0);
      expect(savedHands[0].result).toEqual(handResult);

      // Verify localStorage interaction
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should handle hand history persistence across sessions', async () => {
      const session1Id = 'session_1';
      const session2Id = 'session_2';

      // Simulate first session
      const hand1Id = 'hand_1';
      handHistoryService.startRecording(hand1Id, {
        sessionId: session1Id,
        gameType: 'no-limit-holdem',
      });

      handHistoryService.recordAction(hand1Id, {
        playerId: humanPlayer.id,
        action: 'fold',
        amount: 0,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      await handHistoryService.saveHand(hand1Id);

      // Simulate second session
      const hand2Id = 'hand_2';
      handHistoryService.startRecording(hand2Id, {
        sessionId: session2Id,
        gameType: 'no-limit-holdem',
      });

      handHistoryService.recordAction(hand2Id, {
        playerId: humanPlayer.id,
        action: 'call',
        amount: 20,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      await handHistoryService.saveHand(hand2Id);

      // Verify both sessions are retrievable
      const allHands = await handHistoryService.getRecentHands(10);
      expect(allHands).toHaveLength(2);

      const session1Hands = await handHistoryService.getHandsBySession(session1Id);
      const session2Hands = await handHistoryService.getHandsBySession(session2Id);

      expect(session1Hands).toHaveLength(1);
      expect(session2Hands).toHaveLength(1);
      expect(session1Hands[0].id).toBe(hand1Id);
      expect(session2Hands[0].id).toBe(hand2Id);
    });
  });

  describe('Hand History Analysis Integration', () => {
    test('should generate accurate analytics from recorded hands', async () => {
      // Create multiple hands with known outcomes
      const hands = [];

      for (let i = 0; i < 5; i++) {
        const handId = `test_hand_${i}`;
        handHistoryService.startRecording(handId, {
          sessionId: 'analytics_test',
          gameType: 'no-limit-holdem',
        });

        // Vary the actions to create meaningful analytics
        const actions = [
          {
            playerId: humanPlayer.id,
            action: i % 2 === 0 ? 'call' : 'fold',
            amount: i % 2 === 0 ? 20 : 0,
          },
          { playerId: aiPlayer1.id, action: 'call', amount: 20 },
          { playerId: aiPlayer2.id, action: 'raise', amount: 40 },
        ];

        for (const action of actions) {
          handHistoryService.recordAction(handId, {
            ...action,
            timestamp: Date.now() + i * 1000,
            phase: 'preflop',
          });
        }

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
      expect(analytics.handsWon).toBe(3); // Won every other hand
      expect(analytics.winRate).toBeCloseTo(60, 1);
      expect(analytics.vpip).toBeCloseTo(60, 1); // Played 3 out of 5 hands
      expect(analytics.totalWinnings).toBeGreaterThan(0);

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
      });

      // Create a specific betting pattern
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

      // Verify specific pattern detection
      expect(patterns.aggressionFrequency.preflop).toBeCloseTo(0, 1); // Called, not aggressive
      expect(patterns.aggressionFrequency.flop).toBeCloseTo(100, 1); // Bet = aggressive
      expect(patterns.aggressionFrequency.turn).toBeCloseTo(100, 1); // Raised = aggressive
    });
  });

  describe('UI Integration with Hand History', () => {
    const HandHistoryWrapper = () => {
      const { hands, loading, error, loadHands } = useHandHistory();

      React.useEffect(() => {
        loadHands();
      }, [loadHands]);

      return (
        <div>
          {loading && <div data-testid="loading">Loading...</div>}
          {error && <div data-testid="error">{error}</div>}
          <div data-testid="hands-count">{hands.length}</div>
          {hands.map((hand) => (
            <div key={hand.id} data-testid={`hand-${hand.id}`}>
              {hand.id}
            </div>
          ))}
        </div>
      );
    };

    test('should integrate hand history hook with service layer', async () => {
      // Pre-populate some hand history
      const testHands = ['hand_1', 'hand_2', 'hand_3'];

      for (const handId of testHands) {
        handHistoryService.startRecording(handId, {
          sessionId: 'ui_test',
          gameType: 'no-limit-holdem',
        });

        handHistoryService.recordAction(handId, {
          playerId: humanPlayer.id,
          action: 'fold',
          amount: 0,
          timestamp: Date.now(),
          phase: 'preflop',
        });

        await handHistoryService.saveHand(handId);
      }

      // Render component with hook
      render(<HandHistoryWrapper />);

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for hands to load
      await waitFor(
        () => {
          expect(screen.getByTestId('hands-count')).toHaveTextContent('3');
        },
        { timeout: 5000 }
      );

      // Verify all hands are displayed
      for (const handId of testHands) {
        expect(screen.getByTestId(`hand-${handId}`)).toBeInTheDocument();
      }
    });

    test('should handle hand history dashboard integration', async () => {
      // Create comprehensive hand data
      const handData = {
        id: 'dashboard_test_hand',
        timestamp: Date.now(),
        gameType: 'no-limit-holdem',
        players: [
          { id: humanPlayer.id, name: humanPlayer.name, position: 0 },
          { id: aiPlayer1.id, name: aiPlayer1.name, position: 1 },
          { id: aiPlayer2.id, name: aiPlayer2.name, position: 2 },
        ],
        actions: [
          { playerId: humanPlayer.id, action: 'call', amount: 20, phase: 'preflop' },
          { playerId: aiPlayer1.id, action: 'raise', amount: 60, phase: 'preflop' },
        ],
        result: {
          winners: [{ playerId: humanPlayer.id, amount: 140 }],
          finalPot: 140,
        },
        heroPosition: 0,
      };

      // Mock the service to return our test data
      const mockGetRecentHands = jest.fn().mockResolvedValue([handData]);
      handHistoryService.getRecentHands = mockGetRecentHands;

      render(
        <HandHistoryDashboard userId={humanPlayer.id} handHistoryService={handHistoryService} />
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Hand History')).toBeInTheDocument();
      });

      // Verify hand is displayed
      await waitFor(() => {
        expect(screen.getByText(/dashboard_test_hand/)).toBeInTheDocument();
      });

      // Test hand selection
      const handElement = screen.getByText(/dashboard_test_hand/);
      await userEvent.click(handElement);

      // Should show hand details
      await waitFor(() => {
        expect(screen.getByText(/Final Pot: \$140/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Hand History Integration', () => {
    test('should capture hand history during live game play', async () => {
      // Setup game with history service integration
      gameEngine.handHistoryService = handHistoryService;
      gameEngine.startNewHand();

      // Live game session tracking
      const recordedActions = [];

      // Mock the recording to capture what's being saved
      const originalRecordAction = handHistoryService.recordAction;
      handHistoryService.recordAction = jest.fn((handId, actionData) => {
        recordedActions.push(actionData);
        return originalRecordAction.call(handHistoryService, handId, actionData);
      });

      // Play a quick hand - ensure all players fold quickly
      let actionCount = 0;
      const MAX_ACTIONS = 20; // Safety limit

      // Post blinds first
      if (gameEngine.gameState.phase === GAME_PHASES.PREFLOP) {
        // Execute small blind
        const sbPlayer = gameEngine.gameState.players[gameEngine.gameState.smallBlindPosition];
        if (sbPlayer) {
          gameEngine.currentPlayerIndex = gameEngine.gameState.smallBlindPosition;
          gameEngine.executePlayerAction('small_blind', 10);
        }

        // Execute big blind
        const bbPlayer = gameEngine.gameState.players[gameEngine.gameState.bigBlindPosition];
        if (bbPlayer) {
          gameEngine.currentPlayerIndex = gameEngine.gameState.bigBlindPosition;
          gameEngine.executePlayerAction('big_blind', 20);
        }
      }

      // Now play the hand - make everyone fold except one player
      while (!gameEngine.gameState.isHandComplete() && actionCount < MAX_ACTIONS) {
        const currentPlayer = gameEngine.getCurrentPlayer();

        if (!currentPlayer) {
          break; // No valid current player
        }

        // Make all players fold to end hand quickly
        const result = gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);

        if (!result || !result.success) {
          // If fold failed, try to advance game state
          if (gameEngine.gameState.getPlayersInHand().length <= 1) {
            break; // Hand should be complete
          }
          // Force advance to prevent infinite loop
          gameEngine.currentPlayerIndex =
            (gameEngine.currentPlayerIndex + 1) % gameEngine.gameState.players.length;
        }

        actionCount++;
      }

      if (actionCount >= MAX_ACTIONS) {
        console.warn('Real-time hand history test reached action limit');
      }

      gameEngine.completeHand();

      // Verify actions were recorded
      expect(recordedActions.length).toBeGreaterThan(0);

      // Check that blinds were recorded
      const blindActions = recordedActions.filter(
        (action) => action.action === 'small_blind' || action.action === 'big_blind'
      );
      expect(blindActions.length).toBeGreaterThan(0);

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
    test('should handle storage errors gracefully', async () => {
      // Simulate storage failure
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const handId = 'error_test_hand';
      handHistoryService.startRecording(handId, {
        sessionId: 'error_test',
        gameType: 'no-limit-holdem',
      });

      handHistoryService.recordAction(handId, {
        playerId: humanPlayer.id,
        action: 'fold',
        amount: 0,
        timestamp: Date.now(),
        phase: 'preflop',
      });

      // Attempt to save should handle error
      await expect(handHistoryService.saveHand(handId)).rejects.toThrow();

      // Service should continue to function
      const anotherHandId = 'recovery_test_hand';
      expect(() => {
        handHistoryService.startRecording(anotherHandId, {
          sessionId: 'recovery_test',
          gameType: 'no-limit-holdem',
        });
      }).not.toThrow();
    });

    test('should handle corrupted hand history data', async () => {
      // Simulate corrupted data in storage
      localStorage.getItem.mockReturnValue('invalid json data');

      // Should handle gracefully and return empty results
      const hands = await handHistoryService.getRecentHands(10);
      expect(hands).toEqual([]);

      // Should still be able to save new hands
      const handId = 'recovery_after_corruption';
      handHistoryService.startRecording(handId, {
        sessionId: 'recovery_test',
        gameType: 'no-limit-holdem',
      });

      expect(() => {
        handHistoryService.recordAction(handId, {
          playerId: humanPlayer.id,
          action: 'call',
          amount: 20,
          timestamp: Date.now(),
          phase: 'preflop',
        });
      }).not.toThrow();
    });
  });
});
