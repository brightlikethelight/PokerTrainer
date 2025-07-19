/**
 * AI Player Integration Tests
 * Tests AI player interaction with game engine and decision-making integration
 */

import '../integration/setupIntegrationTests';

import GameEngine from '../../domains/game/domain/services/GameEngine';
import Player from '../../domains/game/domain/entities/Player';
import BettingLogic from '../../domains/game/domain/services/BettingLogic';
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
    test('should integrate AI decision-making with game engine actions', async () => {
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

          const result = gameEngine.executePlayerAction(aiAction.action, aiAction.amount);

          actionLog.push({
            playerId: currentPlayer.id,
            aiType: currentPlayer.aiType,
            action: aiAction.action,
            amount: aiAction.amount,
            success: result.success,
            gameState: {
              currentBet: gameStateBefore.currentBet,
              potSize: gameStateBefore.getTotalPot(),
              playersInHand: gameStateBefore.getActivePlayers().length,
            },
          });

          expect(result.success).toBe(true);
        } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
          // Human player folds to let AI players interact
          gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
        }

        roundCount++;
      }

      // Verify AI players made different types of decisions
      expect(actionLog.length).toBeGreaterThan(0);

      const tagActions = actionLog.filter((log) => log.aiType === AI_PLAYER_TYPES.TAG);
      const lagActions = actionLog.filter((log) => log.aiType === AI_PLAYER_TYPES.LAG);
      const passiveActions = actionLog.filter((log) => log.aiType === AI_PLAYER_TYPES.PASSIVE);

      // TAG should be more selective
      if (tagActions.length > 0) {
        const tagAggression =
          tagActions.filter(
            (a) => a.action === PLAYER_ACTIONS.BET || a.action === PLAYER_ACTIONS.RAISE
          ).length / tagActions.length;

        // LAG should be more aggressive
        if (lagActions.length > 0) {
          const lagAggression =
            lagActions.filter(
              (a) => a.action === PLAYER_ACTIONS.BET || a.action === PLAYER_ACTIONS.RAISE
            ).length / lagActions.length;

          expect(lagAggression).toBeGreaterThanOrEqual(tagAggression);
        }
      }

      // Passive AI should mostly check/call
      if (passiveActions.length > 0) {
        const passiveNonAggressive = passiveActions.filter(
          (a) => a.action === PLAYER_ACTIONS.CHECK || a.action === PLAYER_ACTIONS.CALL
        ).length;
        expect(passiveNonAggressive).toBeGreaterThan(0);
      }
    });

    test('should handle AI vs AI head-to-head scenarios', async () => {
      // Set up heads-up between different AI types
      gameEngine.gameState.players = [tagAI, lagAI];
      gameEngine.gameState.activePlayers = 2;

      gameEngine.startNewHand();

      const interactionLog = [];
      let actionCount = 0;

      while (!gameEngine.gameState.isHandComplete() && actionCount < 50) {
        const currentPlayer = gameEngine.getCurrentPlayer();

        if (currentPlayer && currentPlayer.isAI) {
          const preActionState = {
            currentBet: gameEngine.gameState.currentBet,
            playerBet: currentPlayer.currentBet,
            potSize: gameEngine.gameState.getTotalPot(),
            phase: gameEngine.gameState.phase,
          };

          const aiAction = currentPlayer.decideAction(gameEngine.gameState);
          const result = gameEngine.executePlayerAction(aiAction.action, aiAction.amount);

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
        }

        if (gameEngine.gameState.isBettingRoundComplete()) {
          gameEngine.gameState.nextPhase();
        }

        actionCount++;
      }

      // Verify meaningful interaction occurred
      expect(interactionLog.length).toBeGreaterThan(2);

      // Check for strategic differences
      const tagInteractions = interactionLog.filter((log) => log.aiType === AI_PLAYER_TYPES.TAG);
      const lagInteractions = interactionLog.filter((log) => log.aiType === AI_PLAYER_TYPES.LAG);

      if (tagInteractions.length > 0 && lagInteractions.length > 0) {
        // Should see different betting patterns
        const tagBetSizes = tagInteractions.filter((i) => i.amount > 0).map((i) => i.amount);
        const lagBetSizes = lagInteractions.filter((i) => i.amount > 0).map((i) => i.amount);

        if (tagBetSizes.length > 0 && lagBetSizes.length > 0) {
          const tagAvgBet = tagBetSizes.reduce((a, b) => a + b, 0) / tagBetSizes.length;
          const lagAvgBet = lagBetSizes.reduce((a, b) => a + b, 0) / lagBetSizes.length;

          // LAG should generally bet larger sizes
          expect(lagAvgBet).toBeGreaterThanOrEqual(tagAvgBet * 0.8);
        }
      }
    });

    test('should adapt AI behavior based on game context', async () => {
      gameEngine.startNewHand();

      // Test different scenarios and AI adaptation
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
        {
          name: 'Heads Up',
          setup: () => {
            gameEngine.gameState.players = [humanPlayer, tagAI];
            gameEngine.gameState.activePlayers = 2;
          },
          expectedBehavior: 'wider_range',
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
            const gameContext = {
              stackSize: currentPlayer.chips,
              playersInHand: gameEngine.gameState.getActivePlayers().length,
              currentBet: gameEngine.gameState.currentBet,
              potSize: gameEngine.gameState.getTotalPot(),
            };

            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            scenarioActions.push({
              scenario: scenario.name,
              action: aiAction.action,
              amount: aiAction.amount,
              context: gameContext,
            });

            gameEngine.executePlayerAction(aiAction.action, aiAction.amount);
          } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
            gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
          }

          actionCount++;
        }

        // Verify AI adapted to scenario
        expect(scenarioActions.length).toBeGreaterThan(0);

        if (scenario.name === 'Short Stack') {
          // Should either fold quickly or go all-in
          const decisiveActions = scenarioActions.filter(
            (a) =>
              a.action === PLAYER_ACTIONS.FOLD ||
              a.action === PLAYER_ACTIONS.ALL_IN ||
              a.amount >= tagAI.chips * 0.8
          );
          expect(decisiveActions.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('AI-Human Interaction', () => {
    test('should handle mixed AI and human player interactions', async () => {
      gameEngine.startNewHand();

      let humanActions = 0;
      let aiActions = 0;
      const interactionSequence = [];

      // Simulate several rounds of human-AI interaction
      for (let round = 0; round < 3; round++) {
        gameEngine.startNewHand();

        let handActionCount = 0;
        while (!gameEngine.gameState.isHandComplete() && handActionCount < 20) {
          const currentPlayer = gameEngine.getCurrentPlayer();

          if (currentPlayer && currentPlayer.isAI) {
            const aiAction = currentPlayer.decideAction(gameEngine.gameState);
            const result = gameEngine.executePlayerAction(aiAction.action, aiAction.amount);

            if (result.success) {
              aiActions++;
              interactionSequence.push({
                round,
                playerType: 'AI',
                playerId: currentPlayer.id,
                action: aiAction.action,
                amount: aiAction.amount,
              });
            }
          } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
            // Simulate human decision based on game state
            const gameState = gameEngine.getGameState();
            let humanAction;

            if (gameState.currentBet === 0) {
              humanAction = Math.random() > 0.5 ? PLAYER_ACTIONS.CHECK : PLAYER_ACTIONS.BET;
            } else if (gameState.currentBet <= humanPlayer.chips * 0.1) {
              humanAction = Math.random() > 0.3 ? PLAYER_ACTIONS.CALL : PLAYER_ACTIONS.FOLD;
            } else {
              humanAction = PLAYER_ACTIONS.FOLD;
            }

            const amount =
              humanAction === PLAYER_ACTIONS.BET
                ? Math.min(50, humanPlayer.chips)
                : gameState.currentBet - humanPlayer.currentBet;

            const result = gameEngine.executePlayerAction(humanAction, amount);

            if (result.success) {
              humanActions++;
              interactionSequence.push({
                round,
                playerType: 'Human',
                playerId: currentPlayer.id,
                action: humanAction,
                amount,
              });
            }
          }

          if (gameEngine.gameState.isBettingRoundComplete()) {
            gameEngine.gameState.nextPhase();
          }

          handActionCount++;
        }

        if (!gameEngine.gameState.isHandComplete()) {
          gameEngine.completeHand();
        }
      }

      // Verify interaction occurred
      expect(humanActions).toBeGreaterThan(0);
      expect(aiActions).toBeGreaterThan(0);
      expect(interactionSequence.length).toBeGreaterThan(3);

      // Verify alternating interactions
      const humanInteractions = interactionSequence.filter((i) => i.playerType === 'Human');
      const aiInteractions = interactionSequence.filter((i) => i.playerType === 'AI');

      expect(humanInteractions.length).toBeGreaterThan(0);
      expect(aiInteractions.length).toBeGreaterThan(0);
    });

    test('should maintain AI consistency across multiple hands', async () => {
      gameEngine.startNewHand();

      const aiDecisionHistory = {
        [tagAI.id]: [],
        [lagAI.id]: [],
        [passiveAI.id]: [],
      };

      // Play multiple hands to observe consistency
      for (let hand = 0; hand < 5; hand++) {
        gameEngine.startNewHand();

        let handActions = 0;
        while (!gameEngine.gameState.isHandComplete() && handActions < 15) {
          const currentPlayer = gameEngine.getCurrentPlayer();

          if (currentPlayer && currentPlayer.isAI) {
            const gameContext = {
              hand,
              currentBet: gameEngine.gameState.currentBet,
              potSize: gameEngine.gameState.getTotalPot(),
              position: currentPlayer.position,
              stackSize: currentPlayer.chips,
            };

            const aiAction = currentPlayer.decideAction(gameEngine.gameState);

            aiDecisionHistory[currentPlayer.id].push({
              context: gameContext,
              decision: aiAction,
              handNumber: hand,
            });

            gameEngine.executePlayerAction(aiAction.action, aiAction.amount);
          } else if (currentPlayer && currentPlayer.id === humanPlayer.id) {
            gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
          }

          if (gameEngine.gameState.isBettingRoundComplete()) {
            gameEngine.gameState.nextPhase();
          }

          handActions++;
        }

        if (!gameEngine.gameState.isHandComplete()) {
          gameEngine.completeHand();
        }
      }

      // Analyze consistency for each AI type
      Object.keys(aiDecisionHistory).forEach((aiId) => {
        const decisions = aiDecisionHistory[aiId];
        if (decisions.length > 2) {
          // Check for pattern consistency
          const aggressiveActions = decisions.filter(
            (d) =>
              d.decision.action === PLAYER_ACTIONS.BET || d.decision.action === PLAYER_ACTIONS.RAISE
          ).length;

          const passiveActions = decisions.filter(
            (d) =>
              d.decision.action === PLAYER_ACTIONS.CHECK ||
              d.decision.action === PLAYER_ACTIONS.CALL
          ).length;

          const player = gameEngine.gameState.players.find((p) => p.id === aiId);

          if (player.aiType === AI_PLAYER_TYPES.LAG) {
            // LAG should show more aggressive actions
            expect(aggressiveActions).toBeGreaterThanOrEqual(passiveActions * 0.5);
          } else if (player.aiType === AI_PLAYER_TYPES.PASSIVE) {
            // Passive should show more passive actions
            expect(passiveActions).toBeGreaterThanOrEqual(aggressiveActions);
          }
        }
      });
    });
  });

  describe('AI Performance and Edge Cases', () => {
    test('should handle AI decision-making under extreme conditions', async () => {
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
            gameEngine.gameState.pot.main = 10000;
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

          // AI should make a valid decision even in extreme conditions
          const decision = ai.decideAction(gameState);
          expect(decision).toBeDefined();
          expect(decision.action).toBeDefined();

          // Decision should be logically sound
          const validActions = BettingLogic.getValidActions(gameState, ai);
          expect(validActions).toContain(decision.action);

          if (decision.amount !== undefined) {
            expect(decision.amount).toBeGreaterThanOrEqual(0);
            expect(decision.amount).toBeLessThanOrEqual(ai.chips);
          }
        }
      }
    });

    test('should maintain AI performance with rapid decision requests', async () => {
      gameEngine.startNewHand();

      const startTime = Date.now();
      const decisionTimes = [];

      // Request rapid AI decisions
      for (let i = 0; i < 10; i++) {
        const currentPlayer = gameEngine.getCurrentPlayer();

        if (currentPlayer && currentPlayer.isAI) {
          const decisionStart = Date.now();
          const aiAction = currentPlayer.decideAction(gameEngine.gameState);
          const decisionEnd = Date.now();

          decisionTimes.push(decisionEnd - decisionStart);

          expect(aiAction).toBeDefined();
          expect(aiAction.action).toBeDefined();

          gameEngine.executePlayerAction(aiAction.action, aiAction.amount);
        } else {
          // Advance to next AI player
          gameEngine.executePlayerAction(PLAYER_ACTIONS.FOLD);
        }

        // Reset hand if needed
        if (gameEngine.gameState.isHandComplete()) {
          gameEngine.startNewHand();
        }
      }

      const totalTime = Date.now() - startTime;
      const avgDecisionTime = decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length;

      // AI decisions should be reasonably fast (< 100ms on average)
      expect(avgDecisionTime).toBeLessThan(100);
      expect(totalTime).toBeLessThan(2000); // Total should be under 2 seconds
    });

    test('should handle AI state persistence across game events', async () => {
      gameEngine.startNewHand();

      // Record initial AI states
      const initialStates = gameEngine.gameState.players
        .filter((p) => p.isAI)
        .map((ai) => ({
          id: ai.id,
          chips: ai.chips,
          aiType: ai.aiType,
          position: ai.position,
        }));

      // Play several hands with various events
      for (let hand = 0; hand < 3; hand++) {
        gameEngine.startNewHand();

        // Simulate hand with AI decisions
        let actionCount = 0;
        while (!gameEngine.gameState.isHandComplete() && actionCount < 20) {
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

          actionCount++;
        }

        gameEngine.completeHand();
      }

      // Verify AI states persisted correctly
      const finalStates = gameEngine.gameState.players
        .filter((p) => p.isAI)
        .map((ai) => ({
          id: ai.id,
          chips: ai.chips,
          aiType: ai.aiType,
          position: ai.position,
        }));

      // AI types and positions should remain unchanged
      initialStates.forEach((initial) => {
        const final = finalStates.find((f) => f.id === initial.id);
        expect(final).toBeDefined();
        expect(final.aiType).toBe(initial.aiType);
        expect(final.position).toBe(initial.position);
        // Chips should have changed (won or lost)
        expect(final.chips).not.toBe(initial.chips);
      });
    });
  });
});
