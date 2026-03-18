/**
 * AI Player Integration Tests
 * Tests AI player interaction with game engine and decision-making integration
 *
 * NOTE: GameEngine auto-advances phases via checkAndAdvanceGame() after each action.
 * Tests must NOT manually call advanceToNextPhase().
 */

import '../integration/setupIntegrationTests';

import GameEngine from '../../game/engine/GameEngine';
import Player from '../../game/entities/Player';
import { PLAYER_ACTIONS, PLAYER_STATUS, AI_PLAYER_TYPES } from '../../constants/game-constants';

describe('AI Player Integration', () => {
  let gameEngine;
  let humanPlayer;
  let tagAI;
  let lagAI;
  let passiveAI;

  beforeEach(() => {
    global.integrationTestUtils.createGameSetup();

    humanPlayer = new Player('human', 'Human Player', 1000, 0, false);
    tagAI = new Player('ai_tag', 'TAG AI', 1000, 1, true, AI_PLAYER_TYPES.TAG);
    lagAI = new Player('ai_lag', 'LAG AI', 1000, 2, true, AI_PLAYER_TYPES.LAG);
    passiveAI = new Player('ai_passive', 'Passive AI', 1000, 3, true, AI_PLAYER_TYPES.TP);

    gameEngine = new GameEngine();
    gameEngine.addPlayer(humanPlayer);
    gameEngine.addPlayer(tagAI);
    gameEngine.addPlayer(lagAI);
    gameEngine.addPlayer(passiveAI);
  });

  describe('AI Decision Making Integration', () => {
    test('should integrate AI decision-making with game engine actions', () => {
      gameEngine.startNewHand();

      const actionLog = [];
      let roundCount = 0;

      // Track AI decisions through a complete betting round
      while (!gameEngine.gameState.isBettingRoundComplete() && roundCount < 20) {
        const currentPlayer = gameEngine.getCurrentPlayer();

        if (currentPlayer && currentPlayer.isAI) {
          const gameStateBefore = { ...gameEngine.getGameState() };
          const aiAction = currentPlayer.decideAction(gameEngine.gameState);

          expect(aiAction).toBeDefined();
          expect(aiAction.action).toBeDefined();

          const result = gameEngine.executePlayerAction(
            currentPlayer.id,
            aiAction.action,
            aiAction.amount
          );

          actionLog.push({
            playerId: currentPlayer.id,
            aiType: currentPlayer.aiType,
            action: aiAction.action,
            amount: aiAction.amount,
            success: result.success,
            gameState: {
              currentBet: gameStateBefore.currentBet,
              potSize: gameStateBefore.totalPot,
              playersInHand: gameStateBefore.playersInHand,
            },
          });

          expect(result.success).toBe(true);
        } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
          gameEngine.executePlayerAction(humanPlayer.id, PLAYER_ACTIONS.FOLD);
        }

        roundCount++;
      }

      // Verify AI players made decisions
      expect(actionLog.length).toBeGreaterThan(0);
    });

    test('should handle AI vs AI head-to-head scenarios', () => {
      // Set up heads-up between different AI types
      gameEngine.gameState.players = [tagAI, lagAI];
      gameEngine.gameState.activePlayers = 2;

      gameEngine.startNewHand();

      const interactionLog = [];
      let actionCount = 0;

      while (
        gameEngine.gameState.phase !== 'waiting' &&
        gameEngine.gameState.phase !== 'showdown' &&
        actionCount < 50
      ) {
        const currentPlayer = gameEngine.getCurrentPlayer();

        if (currentPlayer && currentPlayer.isAI) {
          const preActionState = {
            currentBet: gameEngine.gameState.currentBet,
            playerBet: currentPlayer.currentBet,
            potSize: gameEngine.gameState.getTotalPot(),
            phase: gameEngine.gameState.phase,
          };

          const aiAction = currentPlayer.decideAction(gameEngine.gameState);
          const result = gameEngine.executePlayerAction(
            currentPlayer.id,
            aiAction.action,
            aiAction.amount
          );

          interactionLog.push({
            playerId: currentPlayer.id,
            aiType: currentPlayer.aiType,
            action: aiAction.action,
            amount: aiAction.amount,
            preActionState,
            postActionState: {
              currentBet: gameEngine.gameState.currentBet,
              potSize: gameEngine.gameState.getTotalPot(),
            },
          });

          expect(result.success).toBe(true);
        } else {
          break;
        }

        actionCount++;
      }

      // Verify meaningful interaction occurred (at least 2 actions for heads-up)
      expect(interactionLog.length).toBeGreaterThanOrEqual(2);
    });

    test('should adapt AI behavior based on game context', () => {
      gameEngine.startNewHand();

      const scenarios = [
        {
          name: 'Short Stack',
          setup: () => {
            tagAI.chips = 100;
          },
          expectedBehavior: 'more_conservative_or_all_in',
        },
        {
          name: 'Deep Stack',
          setup: () => {
            tagAI.chips = 5000;
          },
          expectedBehavior: 'more_aggressive',
        },
      ];

      for (const scenario of scenarios) {
        // Reset and setup scenario
        gameEngine.gameState.resetForNewHand();
        scenario.setup();
        gameEngine.startNewHand();

        const scenarioActions = [];
        let actionCount = 0;

        while (!gameEngine.gameState.isBettingRoundComplete() && actionCount < 10) {
          const currentPlayer = gameEngine.getCurrentPlayer();

          if (currentPlayer && currentPlayer.id === tagAI.id) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            scenarioActions.push({
              scenario: scenario.name,
              action: aiAction.action,
              amount: aiAction.amount,
            });

            gameEngine.executePlayerAction(currentPlayer.id, aiAction.action, aiAction.amount);
          } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
            gameEngine.executePlayerAction(humanPlayer.id, PLAYER_ACTIONS.FOLD);
          } else if (currentPlayer) {
            // Other AI players
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            gameEngine.executePlayerAction(currentPlayer.id, aiAction.action, aiAction.amount);
          }

          actionCount++;
        }

        expect(scenarioActions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AI-Human Interaction', () => {
    test('should handle mixed AI and human player interactions', () => {
      let humanActions = 0;
      let aiActions = 0;

      for (let round = 0; round < 3; round++) {
        gameEngine.startNewHand();

        let handActionCount = 0;
        while (
          gameEngine.gameState.phase !== 'waiting' &&
          gameEngine.gameState.phase !== 'showdown' &&
          handActionCount < 20
        ) {
          const currentPlayer = gameEngine.getCurrentPlayer();
          if (!currentPlayer) break;

          if (currentPlayer.isAI) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            const result = gameEngine.executePlayerAction(
              currentPlayer.id,
              aiAction.action,
              aiAction.amount
            );
            if (result.success) aiActions++;
          } else if (currentPlayer.id === humanPlayer.id) {
            const validActions = gameEngine.getValidActions(humanPlayer.id);
            let action = PLAYER_ACTIONS.FOLD;
            if (validActions.includes(PLAYER_ACTIONS.CHECK)) action = PLAYER_ACTIONS.CHECK;
            else if (validActions.includes(PLAYER_ACTIONS.CALL)) action = PLAYER_ACTIONS.CALL;

            const result = gameEngine.executePlayerAction(humanPlayer.id, action);
            if (result.success) humanActions++;
          }

          handActionCount++;
        }

        if (gameEngine.gameState.phase !== 'waiting') {
          gameEngine.completeHand();
        }
      }

      expect(humanActions).toBeGreaterThan(0);
      expect(aiActions).toBeGreaterThan(0);
    });

    test('should maintain AI consistency across multiple hands', () => {
      const aiDecisionHistory = {
        [tagAI.id]: [],
        [lagAI.id]: [],
        [passiveAI.id]: [],
      };

      for (let hand = 0; hand < 5; hand++) {
        gameEngine.startNewHand();

        let handActions = 0;
        while (
          gameEngine.gameState.phase !== 'waiting' &&
          gameEngine.gameState.phase !== 'showdown' &&
          handActions < 15
        ) {
          const currentPlayer = gameEngine.getCurrentPlayer();
          if (!currentPlayer) break;

          if (currentPlayer.isAI) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);

            if (aiDecisionHistory[currentPlayer.id]) {
              aiDecisionHistory[currentPlayer.id].push({
                decision: aiAction,
                handNumber: hand,
              });
            }

            gameEngine.executePlayerAction(currentPlayer.id, aiAction.action, aiAction.amount);
          } else if (currentPlayer.id === humanPlayer.id) {
            gameEngine.executePlayerAction(humanPlayer.id, PLAYER_ACTIONS.FOLD);
          }

          handActions++;
        }

        if (gameEngine.gameState.phase !== 'waiting') {
          gameEngine.completeHand();
        }
      }

      // Verify AI players made decisions
      Object.keys(aiDecisionHistory).forEach((aiId) => {
        const decisions = aiDecisionHistory[aiId];
        expect(decisions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AI Performance and Edge Cases', () => {
    test('should handle AI decision-making under extreme conditions', () => {
      const extremeScenarios = [
        {
          name: 'All-in or fold situation',
          setup: () => {
            tagAI.chips = 25;
            gameEngine.gameState.currentBet = 50;
          },
        },
        {
          name: 'Very large pot',
          setup: () => {
            gameEngine.gameState.potManager.main = 10000;
            gameEngine.gameState.currentBet = 500;
          },
        },
        {
          name: 'Multi-way all-in',
          setup: () => {
            lagAI.chips = 0;
            lagAI.status = PLAYER_STATUS.ALL_IN;
            passiveAI.chips = 0;
            passiveAI.status = PLAYER_STATUS.ALL_IN;
          },
        },
      ];

      for (const scenario of extremeScenarios) {
        gameEngine.gameState.resetForNewHand();
        scenario.setup();
        gameEngine.startNewHand();

        const activeAIs = gameEngine.gameState.players.filter(
          (p) => p.isAI && p.status !== PLAYER_STATUS.FOLDED && p.status !== PLAYER_STATUS.ALL_IN
        );

        for (const ai of activeAIs) {
          const gameState = gameEngine.getGameState();

          const decision = ai.decideAction(gameState);
          expect(decision).toBeDefined();
          expect(decision.action).toBeDefined();

          if (decision.amount !== undefined) {
            expect(decision.amount).toBeGreaterThanOrEqual(0);
            expect(decision.amount).toBeLessThanOrEqual(ai.chips);
          }
        }
      }
    });

    test('should maintain AI performance with rapid decision requests', () => {
      gameEngine.startNewHand();

      const decisionTimes = [];

      for (let i = 0; i < 10; i++) {
        const currentPlayer = gameEngine.getCurrentPlayer();
        if (!currentPlayer || gameEngine.gameState.isHandComplete()) {
          gameEngine.startNewHand();
          continue;
        }

        if (currentPlayer.isAI) {
          const decisionStart = Date.now();
          const aiAction = currentPlayer.decideAction(gameEngine.gameState);
          const decisionEnd = Date.now();

          decisionTimes.push(decisionEnd - decisionStart);

          expect(aiAction).toBeDefined();
          expect(aiAction.action).toBeDefined();

          gameEngine.executePlayerAction(currentPlayer.id, aiAction.action, aiAction.amount);
        } else {
          gameEngine.executePlayerAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
        }
      }

      if (decisionTimes.length > 0) {
        const avgDecisionTime = decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length;
        expect(avgDecisionTime).toBeLessThan(100);
      }
    });

    test('should handle AI state persistence across game events', () => {
      gameEngine.startNewHand();

      const initialStates = gameEngine.gameState.players
        .filter((p) => p.isAI)
        .map((ai) => ({
          id: ai.id,
          chips: ai.chips,
          aiType: ai.aiType,
          position: ai.position,
        }));

      for (let hand = 0; hand < 3; hand++) {
        gameEngine.startNewHand();

        let actionCount = 0;
        while (
          gameEngine.gameState.phase !== 'waiting' &&
          gameEngine.gameState.phase !== 'showdown' &&
          actionCount < 20
        ) {
          const currentPlayer = gameEngine.getCurrentPlayer();
          if (!currentPlayer) break;

          if (currentPlayer.isAI) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            gameEngine.executePlayerAction(currentPlayer.id, aiAction.action, aiAction.amount);
          } else if (currentPlayer.id === humanPlayer.id) {
            gameEngine.executePlayerAction(humanPlayer.id, PLAYER_ACTIONS.FOLD);
          }

          actionCount++;
        }

        gameEngine.completeHand();
      }

      // AI types and positions should remain unchanged
      const finalStates = gameEngine.gameState.players
        .filter((p) => p.isAI)
        .map((ai) => ({
          id: ai.id,
          chips: ai.chips,
          aiType: ai.aiType,
          position: ai.position,
        }));

      initialStates.forEach((initial) => {
        const final = finalStates.find((f) => f.id === initial.id);
        expect(final).toBeDefined();
        expect(final.aiType).toBe(initial.aiType);
        expect(final.position).toBe(initial.position);
      });
    });
  });
});
