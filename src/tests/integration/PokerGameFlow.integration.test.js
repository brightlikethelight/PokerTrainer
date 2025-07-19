/**
 * Poker Game Flow Integration Tests
 * Tests complete poker game flow: deal → betting → showdown
 */

import '../integration/setupIntegrationTests';

import GameEngine from '../../domains/game/domain/services/GameEngine';
import Player from '../../domains/game/domain/entities/Player';
import AIPlayer from '../../domains/game/domain/services/AIPlayer';
import { PLAYER_ACTIONS, PLAYER_STATUS } from '../../constants/game-constants';

describe('Poker Game Flow Integration', () => {
  let gameEngine;
  let humanPlayer;
  let aiPlayer1;
  let aiPlayer2;

  beforeEach(() => {
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

    gameEngine.startNewHand();
  });

  describe('Complete Hand Flow', () => {
    test('should execute complete hand from deal to showdown', async () => {
      // Initial state verification
      expect(gameEngine.gameState.phase).toBe('preflop');
      expect(gameEngine.gameState.players).toHaveLength(3);

      // Verify blinds are posted
      const gameState = gameEngine.getGameState();
      const sbPosition = gameState.getSmallBlindPosition();
      const bbPosition = gameState.getBigBlindPosition();

      expect(gameState.players[sbPosition].currentBet).toBe(10);
      expect(gameState.players[bbPosition].currentBet).toBe(20);
      expect(gameState.currentBet).toBe(20);

      // Human player action (call)
      const currentPlayer = gameEngine.getCurrentPlayer();
      if (currentPlayer.id === humanPlayer.id) {
        const result = gameEngine.executePlayerAction(PLAYER_ACTIONS.CALL);
        expect(result.success).toBe(true);
        expect(humanPlayer.currentBet).toBe(20);
      }

      // AI players complete the betting round
      while (!gameEngine.gameState.isBettingRoundComplete()) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isAI) {
          const aiAction = AIPlayer.getAction(
            currentPlayer,
            gameEngine.getGameState(),
            gameEngine.getValidActions(currentPlayer.id),
            gameEngine
          );
          gameEngine.executePlayerAction(currentPlayer.id, aiAction._action, aiAction.amount);
        } else {
          break;
        }
      }

      // Progress to flop
      gameEngine.gameState.nextPhase();
      expect(gameEngine.gameState.phase).toBe('flop');
      expect(gameEngine.gameState.communityCards).toHaveLength(3);

      // Complete flop betting
      while (
        !gameEngine.gameState.isBettingRoundComplete() &&
        gameEngine.gameState.getActivePlayers().length > 1
      ) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isAI) {
          const aiAction = AIPlayer.getAction(
            currentPlayer,
            gameEngine.getGameState(),
            gameEngine.getValidActions(currentPlayer.id),
            gameEngine
          );
          gameEngine.executePlayerAction(currentPlayer.id, aiAction._action, aiAction.amount);
        } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
          gameEngine.executePlayerAction(PLAYER_ACTIONS.CHECK);
        } else {
          break;
        }
      }

      // Progress through remaining streets
      if (gameEngine.gameState.getActivePlayers().length > 1) {
        // Turn
        gameEngine.gameState.nextPhase();
        expect(gameEngine.gameState.phase).toBe('turn');
        expect(gameEngine.gameState.communityCards).toHaveLength(4);

        // Complete turn betting
        while (
          !gameEngine.gameState.isBettingRoundComplete() &&
          gameEngine.gameState.getActivePlayers().length > 1
        ) {
          const currentPlayer = gameEngine.getCurrentPlayer();
          if (currentPlayer && currentPlayer.isAI) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            gameEngine.executePlayerAction(aiAction.action, aiAction.amount);
          } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
            gameEngine.executePlayerAction(PLAYER_ACTIONS.CHECK);
          } else {
            break;
          }
        }

        if (gameEngine.gameState.getActivePlayers().length > 1) {
          // River
          gameEngine.gameState.nextPhase();
          expect(gameEngine.gameState.phase).toBe('river');
          expect(gameEngine.gameState.communityCards).toHaveLength(5);

          // Complete river betting
          while (
            !gameEngine.gameState.isBettingRoundComplete() &&
            gameEngine.gameState.getActivePlayers().length > 1
          ) {
            const currentPlayer = gameEngine.getCurrentPlayer();
            if (currentPlayer && currentPlayer.isAI) {
              const aiAction = currentPlayer.decideAction(gameEngine.gameState);
              gameEngine.executePlayerAction(aiAction.action, aiAction.amount);
            } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
              gameEngine.executePlayerAction(PLAYER_ACTIONS.CHECK);
            } else {
              break;
            }
          }
        }
      }

      // Complete hand
      const handResult = gameEngine.completeHand();
      expect(handResult).toBeDefined();
      expect(handResult.winners).toHaveLength.toBeGreaterThan(0);
      expect(gameEngine.gameState.phase).toBe('waiting');
    });

    test('should handle all-in scenarios correctly', async () => {
      // Set up short stack scenario
      humanPlayer.chips = 50;

      gameEngine.startNewHand();

      // Force human player all-in
      if (gameEngine.getCurrentPlayer().id === humanPlayer.id) {
        const result = gameEngine.executePlayerAction(PLAYER_ACTIONS.ALL_IN);
        expect(result.success).toBe(true);
        expect(humanPlayer.chips).toBe(0);
        expect(humanPlayer.status).toBe(PLAYER_STATUS.ALL_IN);
      }

      // Complete hand with side pot logic
      while (!gameEngine.gameState.isHandComplete()) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isAI) {
          const aiAction = AIPlayer.getAction(
            currentPlayer,
            gameEngine.getGameState(),
            gameEngine.getValidActions(currentPlayer.id),
            gameEngine
          );
          gameEngine.executePlayerAction(currentPlayer.id, aiAction._action, aiAction.amount);
        }

        if (gameEngine.gameState.isBettingRoundComplete()) {
          gameEngine.gameState.nextPhase();
        }
      }

      const handResult = gameEngine.completeHand();
      expect(handResult).toBeDefined();

      // Verify side pot creation
      const potStructure = gameEngine.gameState.createSidePots();
      expect(potStructure.sidePots).toBeDefined();
    });

    test('should handle heads-up play correctly', () => {
      // Remove one player for heads-up
      gameEngine.gameState.players = [humanPlayer, aiPlayer1];
      gameEngine.gameState.activePlayers = 2;

      gameEngine.startNewHand();

      // Verify heads-up blind structure
      expect(gameEngine.gameState.players[0].currentBet).toBe(10); // Small blind
      expect(gameEngine.gameState.players[1].currentBet).toBe(20); // Big blind

      // Complete heads-up hand
      let actionCount = 0;
      while (!gameEngine.gameState.isHandComplete() && actionCount < 20) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isAI) {
          const aiAction = AIPlayer.getAction(
            currentPlayer,
            gameEngine.getGameState(),
            gameEngine.getValidActions(currentPlayer.id),
            gameEngine
          );
          gameEngine.executePlayerAction(currentPlayer.id, aiAction._action, aiAction.amount);
        } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
          gameEngine.executePlayerAction(PLAYER_ACTIONS.CALL);
        }

        if (gameEngine.gameState.isBettingRoundComplete()) {
          gameEngine.gameState.nextPhase();
        }
        actionCount++;
      }

      expect(gameEngine.gameState.isHandComplete()).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid actions gracefully', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();

      // Try invalid action (check when there's a bet)
      if (currentPlayer && gameEngine.gameState.currentBet > 0) {
        const result = gameEngine.executePlayerAction(PLAYER_ACTIONS.CHECK);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot check');
      }

      // Try betting more than available chips
      const result2 = gameEngine.executePlayerAction(PLAYER_ACTIONS.BET, 10000);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Insufficient chips');
    });

    test('should handle player disconnection during hand', () => {
      // Store game state before disconnection
      const gameStateBefore = gameEngine.getGameState();
      const playerCountBefore = gameStateBefore.getActivePlayers().length;

      // Simulate player folding (disconnection)
      if (gameEngine.getCurrentPlayer().id === humanPlayer.id) {
        gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
        expect(humanPlayer.status).toBe(PLAYER_STATUS.FOLDED);
      }

      // Verify game continues with remaining players
      const gameStateAfter = gameEngine.getGameState();
      expect(gameStateAfter.getActivePlayers().length).toBeLessThan(playerCountBefore);

      // Complete hand
      while (!gameEngine.gameState.isHandComplete()) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (currentPlayer && currentPlayer.isAI) {
          const aiAction = AIPlayer.getAction(
            currentPlayer,
            gameEngine.getGameState(),
            gameEngine.getValidActions(currentPlayer.id),
            gameEngine
          );
          gameEngine.executePlayerAction(currentPlayer.id, aiAction._action, aiAction.amount);
        }

        if (gameEngine.gameState.isBettingRoundComplete()) {
          gameEngine.gameState.nextPhase();
        }
      }

      expect(gameEngine.gameState.isHandComplete()).toBe(true);
    });

    test('should handle rapid consecutive actions', async () => {
      // Simulate rapid user clicks
      const actions = [
        PLAYER_ACTIONS.CALL,
        PLAYER_ACTIONS.CALL, // Duplicate action
        PLAYER_ACTIONS.RAISE, // Invalid subsequent action
      ];

      const currentPlayer = gameEngine.getCurrentPlayer();
      if (currentPlayer && currentPlayer.id === humanPlayer.id) {
        const result1 = gameEngine.executePlayerAction(actions[0]);
        expect(result1.success).toBe(true);

        // Second action should fail (already acted)
        const result2 = gameEngine.executePlayerAction(actions[1]);
        expect(result2.success).toBe(false);
      }
    });
  });

  describe('Multi-Hand Session', () => {
    test('should handle multiple hands in sequence', () => {
      // Track initial chip state
      let handsPlayed = 0;
      const maxHands = 3;

      while (handsPlayed < maxHands && gameEngine.gameState.getActivePlayers().length > 1) {
        gameEngine.startNewHand();

        // Play out the hand quickly
        let actionCount = 0;
        while (!gameEngine.gameState.isHandComplete() && actionCount < 30) {
          const currentPlayer = gameEngine.getCurrentPlayer();
          if (currentPlayer && currentPlayer.isAI) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            gameEngine.executePlayerAction(aiAction.action, aiAction.amount);
          } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
            // Human player plays conservatively
            if (gameEngine.gameState.currentBet === 0) {
              gameEngine.executePlayerAction(PLAYER_ACTIONS.CHECK);
            } else {
              gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
            }
          }

          if (gameEngine.gameState.isBettingRoundComplete()) {
            gameEngine.gameState.nextPhase();
          }
          actionCount++;
        }

        gameEngine.completeHand();
        handsPlayed++;

        // Verify game state is reset properly
        expect(gameEngine.gameState.phase).toBe('waiting');
        expect(gameEngine.gameState.communityCards).toHaveLength(0);
        expect(gameEngine.gameState.currentBet).toBe(0);
      }

      expect(handsPlayed).toBe(maxHands);

      // Verify chip counts changed (someone won/lost)
      const finalChips = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);
      expect(finalChips).toBe(3000); // Total chips should remain constant
    });
  });

  describe('Game State Consistency', () => {
    test('should maintain pot integrity throughout hand', () => {
      gameEngine.startNewHand();

      let totalBets = 0;
      let potSize = 0;

      // Track pot changes through each action
      while (!gameEngine.gameState.isHandComplete()) {
        // Get current game state for validation
        const currentPlayer = gameEngine.getCurrentPlayer();

        if (currentPlayer && currentPlayer.isAI) {
          const aiAction = currentPlayer.decideAction(gameEngine.gameState);
          const result = gameEngine.executePlayerAction(aiAction.action, aiAction.amount);

          if (result.success && aiAction.amount > 0) {
            totalBets += aiAction.amount;
          }
        } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
          gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
        }

        const gameStateAfter = gameEngine.getGameState();
        potSize = gameStateAfter.getTotalPot();

        if (gameEngine.gameState.isBettingRoundComplete()) {
          gameEngine.gameState.nextPhase();
        }
      }

      // Verify pot equals total contributions
      expect(potSize).toBeGreaterThan(0);
      expect(potSize).toBeLessThanOrEqual(totalBets + 30); // Account for blinds
    });

    test('should maintain player chip conservation', () => {
      const initialTotalChips = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);

      // Play several hands
      for (let i = 0; i < 2; i++) {
        gameEngine.startNewHand();

        while (!gameEngine.gameState.isHandComplete()) {
          const currentPlayer = gameEngine.getCurrentPlayer();
          if (currentPlayer && currentPlayer.isAI) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            gameEngine.executePlayerAction(aiAction.action, aiAction.amount);
          } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
            gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
          }

          if (gameEngine.gameState.isBettingRoundComplete()) {
            gameEngine.gameState.nextPhase();
          }
        }

        gameEngine.completeHand();
      }

      const finalTotalChips = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);
      expect(finalTotalChips).toBe(initialTotalChips);
    });
  });
});
