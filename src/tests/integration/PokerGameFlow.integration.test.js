/**
 * Poker Game Flow Integration Tests
 * Tests complete poker game flow: deal → betting → showdown
 *
 * NOTE: GameEngine.executePlayerAction() calls checkAndAdvanceGame() internally,
 * which auto-advances phases when betting rounds complete. Tests must NOT
 * manually call advanceToNextPhase().
 *
 * NOTE: isHandComplete() only returns true for SHOWDOWN phase or <= 1 players.
 * After completeHand() resets phase to 'waiting', use phase check instead.
 */

import '../integration/setupIntegrationTests';

import GameEngine from '../../game/engine/GameEngine';
import Player from '../../game/entities/Player';
import AIPlayer from '../../game/engine/AIPlayer';
import { PLAYER_ACTIONS, PLAYER_STATUS } from '../../constants/game-constants';

// Helper: play through a hand until completion or limit reached
function playHandToCompletion(gameEngine, humanPlayer, maxActions = 30) {
  let actionCount = 0;
  while (actionCount < maxActions) {
    // Check if hand is done (engine may have auto-completed via showdown)
    const phase = gameEngine.gameState.phase;
    if (phase === 'waiting' || phase === 'showdown') break;
    if (gameEngine.gameState.getPlayersInHand().length <= 1) break;

    const currentPlayer = gameEngine.getCurrentPlayer();
    if (!currentPlayer) break;
    if (!currentPlayer.canAct()) break;

    if (currentPlayer.isAI) {
      const aiAction = AIPlayer.getAction(
        currentPlayer,
        gameEngine.getGameState(),
        gameEngine.getValidActions(currentPlayer.id),
        gameEngine
      );
      const result = gameEngine.executePlayerAction(
        currentPlayer.id,
        aiAction.action,
        aiAction.amount
      );
      if (!result.success) break;
    } else if (currentPlayer.id === humanPlayer.id) {
      const validActions = gameEngine.getValidActions(humanPlayer.id);
      let action;
      if (validActions.includes(PLAYER_ACTIONS.CHECK)) {
        action = PLAYER_ACTIONS.CHECK;
      } else if (validActions.includes(PLAYER_ACTIONS.CALL)) {
        action = PLAYER_ACTIONS.CALL;
      } else {
        action = PLAYER_ACTIONS.FOLD;
      }
      const result = gameEngine.executePlayerAction(humanPlayer.id, action);
      if (!result.success) break;
    } else {
      break;
    }
    actionCount++;
  }
  return actionCount;
}

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
      false
    );
    aiPlayer1 = new Player(
      setup.players[1].id,
      setup.players[1].name,
      setup.players[1].chips,
      setup.players[1].position,
      true,
      setup.players[1].aiType
    );
    aiPlayer2 = new Player(
      setup.players[2].id,
      setup.players[2].name,
      setup.players[2].chips,
      setup.players[2].position,
      true,
      setup.players[2].aiType
    );

    gameEngine = new GameEngine();
    gameEngine.addPlayer(humanPlayer);
    gameEngine.addPlayer(aiPlayer1);
    gameEngine.addPlayer(aiPlayer2);
    // Do NOT start a hand here — let each test control its own lifecycle
  });

  describe('Complete Hand Flow', () => {
    test('should execute complete hand from deal to showdown', () => {
      gameEngine.startNewHand();

      expect(gameEngine.gameState.phase).toBe('preflop');
      expect(gameEngine.gameState.players).toHaveLength(3);
      expect(gameEngine.gameState.currentBet).toBe(20);

      // Play hand to completion (engine auto-advances phases)
      playHandToCompletion(gameEngine, humanPlayer);

      // Engine should have completed the hand
      expect(['waiting', 'showdown']).toContain(gameEngine.gameState.phase);
    });

    test('should handle all-in scenarios correctly', () => {
      humanPlayer.chips = 50;
      gameEngine.startNewHand();

      // Force human player all-in if they're first to act
      const currentPlayer = gameEngine.getCurrentPlayer();
      if (currentPlayer && currentPlayer.id === humanPlayer.id) {
        const result = gameEngine.executePlayerAction(humanPlayer.id, PLAYER_ACTIONS.ALL_IN);
        expect(result.success).toBe(true);
        expect(humanPlayer.chips).toBe(0);
        expect(humanPlayer.status).toBe(PLAYER_STATUS.ALL_IN);
      }

      // Complete hand
      playHandToCompletion(gameEngine, humanPlayer);

      expect(['waiting', 'showdown']).toContain(gameEngine.gameState.phase);
    });

    test('should handle heads-up play correctly', () => {
      gameEngine.gameState.players = [humanPlayer, aiPlayer1];
      gameEngine.gameState.activePlayers = 2;
      gameEngine.startNewHand();

      playHandToCompletion(gameEngine, humanPlayer, 40);

      expect(['waiting', 'showdown']).toContain(gameEngine.gameState.phase);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid actions gracefully', () => {
      gameEngine.startNewHand();
      const currentPlayer = gameEngine.getCurrentPlayer();

      // Try invalid action (check when there's a bet)
      if (currentPlayer && gameEngine.gameState.currentBet > 0) {
        const result = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.CHECK);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }

      // Try betting more than available chips
      const result2 = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.BET, 10000);
      expect(result2.success).toBe(false);
      expect(result2.error).toBeDefined();
    });

    test('should handle player disconnection during hand', () => {
      gameEngine.startNewHand();

      const playerCountBefore = gameEngine.getGameState().getActivePlayers().length;

      // Fold the current player (whoever it is)
      const currentPlayer = gameEngine.getCurrentPlayer();
      expect(currentPlayer).toBeDefined();
      gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
      expect(currentPlayer.status).toBe(PLAYER_STATUS.FOLDED);

      // Verify active player count decreased
      const playerCountAfter = gameEngine.getGameState().getActivePlayers().length;
      expect(playerCountAfter).toBeLessThan(playerCountBefore);

      // Complete hand
      playHandToCompletion(gameEngine, humanPlayer);

      expect(['waiting', 'showdown']).toContain(gameEngine.gameState.phase);
    });

    test('should handle rapid consecutive actions', () => {
      gameEngine.startNewHand();
      const currentPlayer = gameEngine.getCurrentPlayer();
      if (currentPlayer && currentPlayer.id === humanPlayer.id) {
        const result1 = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.CALL);
        expect(result1.success).toBe(true);

        // Second action should fail (not this player's turn anymore)
        const result2 = gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.CALL);
        expect(result2.success).toBe(false);
      }
    });
  });

  describe('Multi-Hand Session', () => {
    test('should handle multiple hands in sequence', () => {
      let handsPlayed = 0;
      const maxHands = 3;

      for (let i = 0; i < maxHands; i++) {
        gameEngine.startNewHand();

        playHandToCompletion(gameEngine, humanPlayer);
        gameEngine.completeHand();
        handsPlayed++;

        expect(gameEngine.gameState.phase).toBe('waiting');
      }

      expect(handsPlayed).toBe(maxHands);

      // Total chips should remain constant
      const finalChips = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);
      expect(finalChips).toBe(3000);
    });
  });

  describe('Game State Consistency', () => {
    test('should maintain pot integrity throughout hand', () => {
      gameEngine.startNewHand();

      // Human folds early to simplify
      const currentPlayer = gameEngine.getCurrentPlayer();
      if (currentPlayer && currentPlayer.id === humanPlayer.id) {
        gameEngine.executePlayerAction(humanPlayer.id, PLAYER_ACTIONS.FOLD);
      }

      // Let AI finish the hand
      playHandToCompletion(gameEngine, humanPlayer);
      gameEngine.completeHand();

      // After completion, all chips are distributed — total should be conserved
      const totalChips = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);
      expect(totalChips).toBe(3000);
    });

    test('should maintain player chip conservation', () => {
      const initialTotalChips = 3000; // 3 * 1000

      for (let i = 0; i < 2; i++) {
        gameEngine.startNewHand();

        // Human folds immediately
        const cp = gameEngine.getCurrentPlayer();
        if (cp && cp.id === humanPlayer.id) {
          gameEngine.executePlayerAction(humanPlayer.id, PLAYER_ACTIONS.FOLD);
        }

        playHandToCompletion(gameEngine, humanPlayer);
        gameEngine.completeHand();
      }

      const finalTotalChips = gameEngine.gameState.players.reduce((sum, p) => sum + p.chips, 0);
      expect(finalTotalChips).toBe(initialTotalChips);
    });
  });
});
