/**
 * Domain Services Integration Tests
 * Tests domain service integrations and error handling
 */

import '../integration/setupIntegrationTests';

import GameEngine from '../../domains/game/domain/services/GameEngine';
import Player from '../../domains/game/domain/entities/Player';
import BettingLogic from '../../domains/game/domain/services/BettingLogic';
import { createCards } from '../../test-utils/poker-test-helpers';
import { PLAYER_ACTIONS, PLAYER_STATUS, AI_PLAYER_TYPES } from '../../constants/game-constants';

describe('Domain Services Integration', () => {
  let gameEngine;
  let humanPlayer;
  let aiPlayer;

  beforeEach(() => {
    humanPlayer = new Player('human', 'Human Player', 1000, 0);
    aiPlayer = new Player('ai', 'AI Player', 1000, 1, true, AI_PLAYER_TYPES.TAG);

    gameEngine = new GameEngine();
    gameEngine.addPlayer(humanPlayer);
    gameEngine.addPlayer(aiPlayer);
  });

  describe('GameEngine and BettingLogic Integration', () => {
    test('should validate and execute actions through betting logic', () => {
      gameEngine.startNewHand();

      const gameState = gameEngine.getGameState();
      const currentPlayer = gameEngine.getCurrentPlayer();

      expect(currentPlayer).toBeDefined();

      // Test action validation integration
      const validActions = BettingLogic.getValidActions(gameState, currentPlayer);
      expect(validActions).toContain(PLAYER_ACTIONS.FOLD);

      // Test action execution integration
      const foldValidation = BettingLogic.validateAction(
        gameState,
        currentPlayer,
        PLAYER_ACTIONS.FOLD
      );
      expect(foldValidation.valid).toBe(true);

      const result = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
      expect(result.success).toBe(true);
      expect(currentPlayer.status).toBe(PLAYER_STATUS.FOLDED);
    });

    test('should integrate betting logic with game state updates', () => {
      gameEngine.startNewHand();

      const gameState = gameEngine.getGameState();
      const initialPot = gameState.getTotalPot();
      const currentPlayer = gameEngine.getCurrentPlayer();

      if (gameState.currentBet === 0) {
        // Test bet action integration
        const betAmount = 50;
        const result = gameEngine.executePlayerAction(
          currentPlayer.id,
          PLAYER_ACTIONS.BET,
          betAmount
        );

        expect(result.success).toBe(true);
        expect(currentPlayer.currentBet).toBe(betAmount);
        expect(gameState.currentBet).toBe(betAmount);
        expect(gameState.getTotalPot()).toBe(initialPot + betAmount);
      } else {
        // Test call action integration
        // Calculate call amount for action validation
        const result = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.CALL);

        expect(result.success).toBe(true);
        expect(currentPlayer.currentBet).toBe(gameState.currentBet);
      }
    });

    test('should handle complex betting scenarios with multiple players', () => {
      // Add third player for complex scenario
      const thirdPlayer = new Player('player3', 'Player 3', 1000, 2);
      gameEngine.addPlayer(thirdPlayer);

      gameEngine.startNewHand();

      let actionCount = 0;
      const maxActions = 15;

      while (!gameEngine.gameState.isBettingRoundComplete() && actionCount < maxActions) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        const gameState = gameEngine.getGameState();

        if (currentPlayer) {
          const validActions = BettingLogic.getValidActions(gameState, currentPlayer);
          expect(validActions.length).toBeGreaterThan(0);

          // Choose a valid action
          let actionToTake = validActions[0];
          let amount = 0;

          if (validActions.includes(PLAYER_ACTIONS.CALL)) {
            actionToTake = PLAYER_ACTIONS.CALL;
            amount = gameState.currentBet - currentPlayer.currentBet;
          } else if (validActions.includes(PLAYER_ACTIONS.CHECK)) {
            actionToTake = PLAYER_ACTIONS.CHECK;
          }

          const result = gameEngine.executePlayerAction(currentPlayer.id, actionToTake, amount);
          expect(result.success).toBe(true);
        }

        actionCount++;
      }

      expect(gameEngine.gameState.isBettingRoundComplete()).toBe(true);
    });
  });

  describe('Hand Evaluation Integration', () => {
    test('should integrate hand evaluator with game completion', () => {
      gameEngine.startNewHand();

      // Force hands to showdown
      const players = gameEngine.gameState.getActivePlayers();
      players.forEach((player) => {
        if (player.id === humanPlayer.id) {
          player.setHoleCards(createCards(['As', 'Ks']));
        } else {
          player.setHoleCards(createCards(['Qh', 'Qd']));
        }
      });

      // Set community cards
      gameEngine.gameState.setCommunityCards(createCards(['Ac', 'Kh', '7d', '3s', '2c']));

      // Force showdown by making all players all-in or folded
      gameEngine.gameState.phase = 'river';
      gameEngine.handleShowdown();

      // Get winners from game state
      const handResult = { winners: gameEngine.gameState.winners };

      expect(handResult).toBeDefined();
      expect(handResult.winners.length).toBeGreaterThan(0);

      // Human player should win with two pair (Aces and Kings)
      const humanWon = handResult.winners.some((winner) => winner.player.id === humanPlayer.id);
      expect(humanWon).toBe(true);
    });

    test('should handle side pot evaluation correctly', () => {
      // Set up all-in scenario
      humanPlayer.chips = 100;
      aiPlayer.chips = 500;

      gameEngine.startNewHand();

      // Force all-in
      const currentPlayer = gameEngine.getCurrentPlayer();
      const result1 = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.ALL_IN);
      expect(result1.success).toBe(true);
      expect(humanPlayer.chips).toBe(0);

      // AI calls
      const nextPlayer = gameEngine.getCurrentPlayer();
      const result2 = gameEngine.executePlayerAction(nextPlayer.id, PLAYER_ACTIONS.CALL);
      expect(result2.success).toBe(true);

      // Complete hand with side pot logic
      const handResult = gameEngine.completeHand();
      expect(handResult).toBeDefined();

      // Verify pot structure was handled correctly
      const totalChipsAfter = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);
      expect(totalChipsAfter).toBe(1600); // Total should remain constant
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid game states gracefully', () => {
      // Try to start hand without enough players
      gameEngine.gameState.players = [humanPlayer];

      expect(() => {
        gameEngine.startNewHand();
      }).toThrow('Need at least 2 players to start a hand');

      // Add player back and verify recovery
      gameEngine.addPlayer(aiPlayer);
      expect(() => {
        gameEngine.startNewHand();
      }).not.toThrow();
    });

    test('should handle betting logic errors correctly', () => {
      gameEngine.startNewHand();

      const currentPlayer = gameEngine.getCurrentPlayer();
      const gameState = gameEngine.getGameState();

      // Try invalid action
      if (gameState.currentBet > 0) {
        const result = gameEngine.executePlayerAction(PLAYER_ACTIONS.CHECK);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }

      // Try betting more than available chips
      const result2 = gameEngine.executePlayerAction(PLAYER_ACTIONS.BET, 10000);
      expect(result2.success).toBe(false);
      expect(result2.error).toBeDefined();

      // Verify game state wasn't corrupted
      expect(gameEngine.gameState.getActivePlayers().length).toBe(2);
      // Player should have chips minus blind
      expect(currentPlayer.chips).toBeLessThanOrEqual(1000);
    });

    test('should handle card dealing errors', () => {
      gameEngine.startNewHand();

      // Manually exhaust deck to test error handling
      const cardsToExhaust = gameEngine.deck.cardsRemaining() - 2; // Leave only 2 cards
      for (let i = 0; i < cardsToExhaust; i++) {
        try {
          gameEngine.deck.dealCard();
        } catch (error) {
          // Expected when deck runs out
          break;
        }
      }

      // With only 2 cards left, starting a new hand should fail (need at least 4 for 2 players)
      expect(() => {
        gameEngine.startNewHand();
      }).toThrow();

      // Verify deck reset restores functionality
      gameEngine.deck.reset();
      expect(() => {
        gameEngine.startNewHand();
      }).not.toThrow();
    });
  });

  describe('Performance and State Management', () => {
    test('should maintain consistent state across multiple hands', () => {
      const initialChipSum = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);

      // Play multiple quick hands
      for (let i = 0; i < 3; i++) {
        gameEngine.startNewHand();

        // Quick resolution
        let actionCount = 0;
        while (!gameEngine.gameState.isHandComplete() && actionCount < 10) {
          const currentPlayer = gameEngine.getCurrentPlayer();
          if (currentPlayer) {
            gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
          }
          actionCount++;
        }

        gameEngine.completeHand();

        // Verify state consistency - chips should remain constant (minus any in pot)
        const currentChipSum = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);
        const potAmount = gameEngine.gameState.getTotalPot();
        expect(currentChipSum + potAmount).toBe(initialChipSum);

        expect(gameEngine.gameState.phase).toBe('waiting');
        expect(gameEngine.gameState.communityCards).toHaveLength(0);
        expect(gameEngine.gameState.currentBet).toBe(0);
      }
    });

    test('should handle rapid successive actions efficiently', () => {
      gameEngine.startNewHand();

      const startTime = Date.now();
      const actions = [];

      // Execute rapid actions
      for (let i = 0; i < 5; i++) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (currentPlayer && !gameEngine.gameState.isHandComplete()) {
          const actionStart = Date.now();
          const result = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
          const actionEnd = Date.now();

          actions.push({
            duration: actionEnd - actionStart,
            success: result.success,
          });
        }
      }

      const totalTime = Date.now() - startTime;

      // Performance verification
      expect(totalTime).toBeLessThan(100); // Should complete quickly
      actions.forEach((action) => {
        expect(action.duration).toBeLessThan(10); // Each action should be fast
        expect(action.success).toBe(true);
      });
    });
  });

  describe('AI Integration with Domain Services', () => {
    test('should integrate AI decision making with betting logic', () => {
      gameEngine.startNewHand();

      // Let AI make decisions and verify they're valid
      let aiActionCount = 0;
      while (!gameEngine.gameState.isHandComplete() && aiActionCount < 10) {
        const currentPlayer = gameEngine.getCurrentPlayer();

        if (currentPlayer && currentPlayer.isAI) {
          const gameState = gameEngine.getGameState();
          const validActions = BettingLogic.getValidActions(gameState, currentPlayer);

          const aiDecision = currentPlayer.decideAction(gameState);
          expect(aiDecision).toBeDefined();
          expect(validActions).toContain(aiDecision.action);

          const result = gameEngine.executePlayerAction(aiDecision.action, aiDecision.amount);
          expect(result.success).toBe(true);

          aiActionCount++;
        } else if (currentPlayer) {
          gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
        }
      }

      expect(aiActionCount).toBeGreaterThan(0);
    });

    test('should handle AI errors gracefully', () => {
      gameEngine.startNewHand();

      const currentPlayer = gameEngine.getCurrentPlayer();
      if (currentPlayer && currentPlayer.isAI) {
        // Manually corrupt game state to test AI error handling
        const originalCurrentBet = gameEngine.gameState.currentBet;
        gameEngine.gameState.currentBet = -1; // Invalid state

        // AI should still make a decision or handle error gracefully
        expect(() => {
          const decision = currentPlayer.decideAction(gameEngine.gameState);
          expect(decision).toBeDefined();
        }).not.toThrow();

        // Restore state
        gameEngine.gameState.currentBet = originalCurrentBet;
      }
    });
  });
});
