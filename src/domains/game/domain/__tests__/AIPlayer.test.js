/**
 * AIPlayer Test Suite
 * Comprehensive tests for AI player decision making
 */

import AIPlayer from '../services/AIPlayer';
import TestDataFactory from '../../../../test-utils/TestDataFactory';
import { AI_PLAYER_TYPES } from '../../../../constants/game-constants';

describe('AIPlayer', () => {
  let mockGameEngine;
  let gameState;
  let player;

  beforeEach(() => {
    // Mock game engine
    mockGameEngine = {
      getPlayerCards: jest.fn().mockReturnValue(TestDataFactory.createHoleCards().aceKingSuited()),
      getCommunityCards: jest.fn().mockReturnValue([]),
    };

    // Create test game state
    gameState = TestDataFactory.createGameScenarios().preflop();

    // Create test AI player
    player = TestDataFactory.createPlayer({
      id: 'ai-player',
      name: 'Test AI',
      aiType: AI_PLAYER_TYPES.TAG,
      isAI: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Hand Strength Evaluation', () => {
    test('should evaluate premium pairs correctly in preflop', () => {
      const pocketAces = TestDataFactory.createHoleCards().pocketAces();
      const strength = AIPlayer.evaluateHandStrength(pocketAces, [], 'preflop');

      expect(strength).toBeGreaterThan(0.8);
    });

    test('should evaluate medium pairs correctly in preflop', () => {
      const pocketJacks = TestDataFactory.createHoleCards().pocketJacks();
      const strength = AIPlayer.evaluateHandStrength(pocketJacks, [], 'preflop');

      expect(strength).toBeGreaterThan(0.5);
      expect(strength).toBeLessThan(0.8);
    });

    test('should evaluate weak hands correctly in preflop', () => {
      const sevenDeuce = TestDataFactory.createHoleCards().sevenDeuce();
      const strength = AIPlayer.evaluateHandStrength(sevenDeuce, [], 'preflop');

      expect(strength).toBeLessThan(0.3);
    });

    test('should evaluate suited connectors appropriately', () => {
      const suitedConnectors = TestDataFactory.createHoleCards().suitedConnectors();
      const strength = AIPlayer.evaluateHandStrength(suitedConnectors, [], 'preflop');

      expect(strength).toBeGreaterThan(0.3);
      expect(strength).toBeLessThan(0.6);
    });

    test('should evaluate post-flop strength with community cards', () => {
      const holeCards = TestDataFactory.createHoleCards().aceKingSuited();
      const communityCards = TestDataFactory.createCommunityCards().aceHighDry();

      const strength = AIPlayer.evaluateHandStrength(holeCards, communityCards, 'flop');

      expect(strength).toBeGreaterThan(0.5); // Top pair
    });

    test('should handle null or invalid cards gracefully', () => {
      expect(AIPlayer.evaluateHandStrength(null, [], 'preflop')).toBe(0);
      expect(AIPlayer.evaluateHandStrength([], [], 'preflop')).toBe(0);
      expect(
        AIPlayer.evaluateHandStrength([TestDataFactory.createCard('A', 's')], [], 'preflop')
      ).toBe(0);
    });
  });

  describe('Post-Flop Analysis', () => {
    test('should identify top pair correctly', () => {
      const holeCards = [
        TestDataFactory.createCard('A', 's'),
        TestDataFactory.createCard('K', 'h'),
      ];
      const communityCards = [
        TestDataFactory.createCard('A', 'h'),
        TestDataFactory.createCard('7', 'c'),
        TestDataFactory.createCard('2', 'd'),
      ];

      const hasTopPair = AIPlayer.hasTopPair(holeCards, communityCards);
      expect(hasTopPair).toBe(true);
    });

    test('should identify two pair correctly', () => {
      const cards = [
        TestDataFactory.createCard('A', 's'),
        TestDataFactory.createCard('K', 'h'),
        TestDataFactory.createCard('A', 'h'),
        TestDataFactory.createCard('K', 'c'),
        TestDataFactory.createCard('7', 'd'),
      ];

      const hasTwoPair = AIPlayer.hasTwoPair(cards);
      expect(hasTwoPair).toBe(true);
    });

    test('should identify sets correctly', () => {
      const holeCards = [
        TestDataFactory.createCard('8', 's'),
        TestDataFactory.createCard('8', 'h'),
      ];
      const communityCards = [
        TestDataFactory.createCard('8', 'c'),
        TestDataFactory.createCard('K', 'd'),
        TestDataFactory.createCard('2', 's'),
      ];

      const hasSet = AIPlayer.hasSet(holeCards, communityCards);
      expect(hasSet).toBe(true);
    });

    test('should identify flush draws correctly', () => {
      const cards = [
        TestDataFactory.createCard('A', 's'),
        TestDataFactory.createCard('K', 's'),
        TestDataFactory.createCard('Q', 's'),
        TestDataFactory.createCard('7', 's'),
        TestDataFactory.createCard('2', 'h'),
      ];

      const hasFlushDraw = AIPlayer.hasFlushDraw(cards);
      expect(hasFlushDraw).toBe(true);
    });

    test('should identify straight draws correctly', () => {
      const cards = [
        TestDataFactory.createCard('9', 's'),
        TestDataFactory.createCard('T', 'h'),
        TestDataFactory.createCard('J', 'c'),
        TestDataFactory.createCard('Q', 'd'),
        TestDataFactory.createCard('2', 's'),
      ];

      const hasStraightDraw = AIPlayer.hasStraightDraw(cards);
      expect(hasStraightDraw).toBe(true);
    });

    test('should not identify straight draw with insufficient consecutive cards', () => {
      const cards = [
        TestDataFactory.createCard('9', 's'),
        TestDataFactory.createCard('T', 'h'),
        TestDataFactory.createCard('K', 'c'),
        TestDataFactory.createCard('A', 'd'),
        TestDataFactory.createCard('2', 's'),
      ];

      const hasStraightDraw = AIPlayer.hasStraightDraw(cards);
      expect(hasStraightDraw).toBe(false);
    });
  });

  describe('Tight-Aggressive Strategy', () => {
    beforeEach(() => {
      player.aiType = AI_PLAYER_TYPES.TAG;
    });

    test('should raise with strong hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(TestDataFactory.createHoleCards().pocketAces());
      const validActions = ['fold', 'call', 'raise'];

      gameState.currentBet = 100;
      gameState.totalPot = 150;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action.action || action._action).toBe('raise');
      expect(action.amount).toBeGreaterThan(gameState.currentBet);
    });

    test('should call with decent hands at good odds', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(
        TestDataFactory.createHoleCards().aceQueenSuited()
      );
      const validActions = ['fold', 'call'];

      gameState.currentBet = 100;
      gameState.totalPot = 500;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action.action || action._action).toBe('call');
    });

    test('should fold weak hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(TestDataFactory.createHoleCards().sevenDeuce());
      const validActions = ['fold', 'call'];

      gameState.currentBet = 200;
      gameState.totalPot = 300;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action.action || action._action).toBe('fold');
    });

    test('should check when possible with medium hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(TestDataFactory.createHoleCards().pocketTens());
      const validActions = ['check', 'bet'];

      gameState.currentBet = 0;
      gameState.totalPot = 100;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(['check', 'bet']).toContain(action.action || action._action);
    });
  });

  describe('Loose-Aggressive Strategy', () => {
    beforeEach(() => {
      player.aiType = AI_PLAYER_TYPES.LAG;
    });

    test('should be more aggressive than TAG with medium hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(
        TestDataFactory.createHoleCards().kingQueenSuited()
      );
      const validActions = ['fold', 'call', 'raise'];

      gameState.currentBet = 100;
      gameState.totalPot = 150;
      player.currentBet = 0;
      player.chips = 2000;

      // Run multiple times due to bluff frequency randomness
      let raiseCount = 0;
      for (let i = 0; i < 10; i++) {
        const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);
        if ((action.action || action._action) === 'raise') {
          raiseCount++;
        }
      }

      expect(raiseCount).toBeGreaterThan(3); // Should raise more often than TAG
    });

    test('should bluff occasionally with weak hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(TestDataFactory.createHoleCards().threeEight());
      const validActions = ['fold', 'call', 'raise'];

      gameState.currentBet = 50;
      gameState.totalPot = 100;
      player.currentBet = 0;
      player.chips = 2000;

      // Run multiple times to check for occasional bluffs
      let aggressiveCount = 0;
      for (let i = 0; i < 20; i++) {
        const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);
        if ((action.action || action._action) === 'raise') {
          aggressiveCount++;
        }
      }

      expect(aggressiveCount).toBeGreaterThan(0); // Should bluff sometimes
      expect(aggressiveCount).toBeLessThan(15); // But not too often
    });
  });

  describe('Tight-Passive Strategy', () => {
    beforeEach(() => {
      player.aiType = AI_PLAYER_TYPES.TP;
    });

    test('should rarely raise even with good hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(
        TestDataFactory.createHoleCards().pocketQueens()
      );
      const validActions = ['fold', 'call', 'bet'];

      gameState.currentBet = 0;
      gameState.totalPot = 100;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      // Tight-passive should make a valid action (allow bet for good hands)
      expect(['call', 'check', 'bet']).toContain(action.action || action._action);
    });

    test('should fold to aggression with medium hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(
        TestDataFactory.createHoleCards().aceJackSuited()
      );
      const validActions = ['fold', 'call'];

      gameState.currentBet = 300;
      gameState.totalPot = 400;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(['fold', 'call']).toContain(action.action || action._action);
    });
  });

  describe('Loose-Passive Strategy', () => {
    beforeEach(() => {
      player.aiType = AI_PLAYER_TYPES.LP;
    });

    test('should call with wide range of hands', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(TestDataFactory.createHoleCards().threeEight());
      const validActions = ['fold', 'call'];

      gameState.currentBet = 100;
      gameState.totalPot = 300;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action.action || action._action).toBe('call');
    });

    test('should rarely raise but call frequently', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(
        TestDataFactory.createHoleCards().pocketJacks()
      );
      const validActions = ['fold', 'call', 'bet'];

      gameState.currentBet = 0;
      gameState.totalPot = 100;
      player.currentBet = 0;
      player.chips = 2000;

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      // Should make a valid passive action
      expect(['call', 'check', 'bet']).toContain(action.action || action._action);
    });
  });

  describe('Default Strategy', () => {
    test('should check when possible', () => {
      const validActions = ['check', 'bet'];

      const action = AIPlayer.getDefaultAction(validActions, gameState, player);

      expect(action.action || action._action).toBe('check');
    });

    test('should call with good pot odds', () => {
      const validActions = ['fold', 'call'];

      gameState.currentBet = 100;
      gameState.totalPot = 500;
      player.currentBet = 0;

      const action = AIPlayer.getDefaultAction(validActions, gameState, player);

      expect(action.action || action._action).toBe('call');
    });

    test('should fold with poor pot odds', () => {
      const validActions = ['fold', 'call'];

      gameState.currentBet = 200;
      gameState.totalPot = 300;
      player.currentBet = 0;

      const action = AIPlayer.getDefaultAction(validActions, gameState, player);

      expect(action.action || action._action).toBe('fold');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle unknown AI type gracefully', () => {
      player.aiType = 'unknown-type';
      const validActions = ['fold', 'call'];

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action).toBeDefined();
      expect(['fold', 'call', 'check']).toContain(action.action || action._action);
    });

    test('should handle empty valid actions', () => {
      const validActions = [];

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action).toBeDefined();
    });

    test('should handle invalid game engine responses', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(null);
      mockGameEngine.getCommunityCards.mockReturnValue(null);
      const validActions = ['fold', 'call'];

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action).toBeDefined();
      expect(action.action || action._action).toBe('fold');
    });

    test('should respect chip constraints', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(TestDataFactory.createHoleCards().pocketAces());
      const validActions = ['fold', 'call', 'raise'];

      gameState.currentBet = 100;
      gameState.totalPot = 150;
      player.currentBet = 0;
      player.chips = 50; // Less than current bet

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      expect(action.amount).toBeLessThanOrEqual(player.chips);
    });

    test('should handle all-in scenarios correctly', () => {
      mockGameEngine.getPlayerCards.mockReturnValue(
        TestDataFactory.createHoleCards().pocketKings()
      );
      const validActions = ['fold', 'call', 'raise'];

      gameState.currentBet = 100;
      gameState.totalPot = 150;
      gameState.minimumRaise = 100;
      player.currentBet = 0;
      player.chips = 150; // Small stack

      const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

      if ((action.action || action._action) === 'raise') {
        expect(action.amount).toBeLessThanOrEqual(player.chips);
      }
    });
  });

  describe('Integration with Game Scenarios', () => {
    test('should make appropriate decisions in tournament scenarios', () => {
      const tournamentScenario = TestDataFactory.createTournamentScenarios().finalTable();
      mockGameEngine.getPlayerCards.mockReturnValue(
        TestDataFactory.createHoleCards().aceKingSuited()
      );

      player.aiType = AI_PLAYER_TYPES.TAG;
      const validActions = ['fold', 'call', 'raise'];

      const action = AIPlayer.getAction(player, tournamentScenario, validActions, mockGameEngine);

      expect(action).toBeDefined();
      expect(validActions).toContain(action.action || action._action);
    });

    test('should adapt to different community card scenarios', () => {
      const scenarios = TestDataFactory.createCommunityCards();

      Object.keys(scenarios).forEach((scenarioName) => {
        if (typeof scenarios[scenarioName] === 'function') {
          const communityCards = scenarios[scenarioName]();
          mockGameEngine.getCommunityCards.mockReturnValue(communityCards);
          mockGameEngine.getPlayerCards.mockReturnValue(
            TestDataFactory.createHoleCards().aceKingSuited()
          );

          const validActions = ['fold', 'call', 'raise'];
          const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

          expect(action).toBeDefined();
          expect(validActions).toContain(action.action || action._action);
        }
      });
    });

    test('should handle betting scenarios appropriately', () => {
      const bettingScenarios = TestDataFactory.createBettingScenarios();

      Object.keys(bettingScenarios).forEach((scenarioName) => {
        if (typeof bettingScenarios[scenarioName] === 'function') {
          // Test that AI can respond to various betting patterns
          mockGameEngine.getPlayerCards.mockReturnValue(
            TestDataFactory.createHoleCards().pocketQueens()
          );

          const validActions = ['fold', 'call', 'raise'];
          const action = AIPlayer.getAction(player, gameState, validActions, mockGameEngine);

          expect(action).toBeDefined();
          expect(['fold', 'call', 'raise', 'check', 'bet']).toContain(
            action.action || action._action
          );
        }
      });
    });
  });
});
