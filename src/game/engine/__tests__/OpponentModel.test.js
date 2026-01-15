/**
 * OpponentModel Test Suite
 * Tests for opponent tracking and adaptive AI decision making
 */

import OpponentModel from '../OpponentModel';
import { PLAYER_ACTIONS, GAME_PHASES } from '../../../constants/game-constants';

describe('OpponentModel', () => {
  let model;

  beforeEach(() => {
    model = new OpponentModel('player1', 'TestPlayer');
  });

  describe('constructor', () => {
    test('should initialize with player info', () => {
      expect(model.playerId).toBe('player1');
      expect(model.playerName).toBe('TestPlayer');
    });

    test('should initialize stats to zero', () => {
      expect(model.stats.preflopOpportunities).toBe(0);
      expect(model.stats.voluntaryPutInPot).toBe(0);
      expect(model.stats.preflopRaises).toBe(0);
      expect(model.stats.handsPlayed).toBe(0);
    });

    test('should use default name when not provided', () => {
      const defaultModel = new OpponentModel('player2');
      expect(defaultModel.playerName).toBe('Unknown');
    });
  });

  describe('updateFromAction', () => {
    describe('fold action', () => {
      test('should increment fold counter', () => {
        model.updateFromAction(PLAYER_ACTIONS.FOLD, { phase: GAME_PHASES.PREFLOP });
        expect(model.stats.folds).toBe(1);
      });

      test('should track action in recent actions', () => {
        model.updateFromAction(PLAYER_ACTIONS.FOLD, { phase: GAME_PHASES.PREFLOP });
        expect(model.stats.recentActions).toHaveLength(1);
        expect(model.stats.recentActions[0].action).toBe(PLAYER_ACTIONS.FOLD);
      });
    });

    describe('check action', () => {
      test('should increment check counter', () => {
        model.updateFromAction(PLAYER_ACTIONS.CHECK, { phase: GAME_PHASES.FLOP });
        expect(model.stats.checks).toBe(1);
      });
    });

    describe('call action', () => {
      test('should increment call counter', () => {
        model.updateFromAction(PLAYER_ACTIONS.CALL, { phase: GAME_PHASES.FLOP });
        expect(model.stats.calls).toBe(1);
      });

      test('should increment VPIP for voluntary preflop call', () => {
        model.updateFromAction(PLAYER_ACTIONS.CALL, {
          phase: GAME_PHASES.PREFLOP,
          isVoluntary: true,
        });
        expect(model.stats.voluntaryPutInPot).toBe(1);
      });

      test('should not increment VPIP for non-voluntary call', () => {
        model.updateFromAction(PLAYER_ACTIONS.CALL, {
          phase: GAME_PHASES.PREFLOP,
          isVoluntary: false,
        });
        expect(model.stats.voluntaryPutInPot).toBe(0);
      });
    });

    describe('bet action', () => {
      test('should increment bet counter', () => {
        model.updateFromAction(PLAYER_ACTIONS.BET, { phase: GAME_PHASES.FLOP });
        expect(model.stats.bets).toBe(1);
      });

      test('should increment VPIP and PFR for preflop bet', () => {
        model.updateFromAction(PLAYER_ACTIONS.BET, {
          phase: GAME_PHASES.PREFLOP,
          isVoluntary: true,
        });
        expect(model.stats.voluntaryPutInPot).toBe(1);
        expect(model.stats.preflopRaises).toBe(1);
      });
    });

    describe('raise action', () => {
      test('should increment raise counter', () => {
        model.updateFromAction(PLAYER_ACTIONS.RAISE, { phase: GAME_PHASES.FLOP });
        expect(model.stats.raises).toBe(1);
      });

      test('should increment VPIP and PFR for preflop raise', () => {
        model.updateFromAction(PLAYER_ACTIONS.RAISE, { phase: GAME_PHASES.PREFLOP });
        expect(model.stats.voluntaryPutInPot).toBe(1);
        expect(model.stats.preflopRaises).toBe(1);
      });
    });

    describe('all-in action', () => {
      test('should increment raise counter for all-in', () => {
        model.updateFromAction(PLAYER_ACTIONS.ALL_IN, { phase: GAME_PHASES.FLOP });
        expect(model.stats.raises).toBe(1);
      });

      test('should track preflop all-in as VPIP and PFR', () => {
        model.updateFromAction(PLAYER_ACTIONS.ALL_IN, {
          phase: GAME_PHASES.PREFLOP,
          isVoluntary: true,
        });
        expect(model.stats.voluntaryPutInPot).toBe(1);
        expect(model.stats.preflopRaises).toBe(1);
      });
    });

    describe('recent actions management', () => {
      test('should keep only last 50 actions', () => {
        for (let i = 0; i < 60; i++) {
          model.updateFromAction(PLAYER_ACTIONS.CALL, { phase: GAME_PHASES.FLOP });
        }
        expect(model.stats.recentActions).toHaveLength(50);
      });

      test('should store timestamp with each action', () => {
        const before = Date.now();
        model.updateFromAction(PLAYER_ACTIONS.FOLD, { phase: GAME_PHASES.PREFLOP });
        const after = Date.now();

        expect(model.stats.recentActions[0].timestamp).toBeGreaterThanOrEqual(before);
        expect(model.stats.recentActions[0].timestamp).toBeLessThanOrEqual(after);
      });
    });
  });

  describe('opportunity recording', () => {
    test('recordPreflopOpportunity should increment counter', () => {
      model.recordPreflopOpportunity();
      model.recordPreflopOpportunity();
      expect(model.stats.preflopOpportunities).toBe(2);
    });

    test('recordPostflopOpportunity should increment counter', () => {
      model.recordPostflopOpportunity();
      expect(model.stats.postflopOpportunities).toBe(1);
    });

    test('recordThreeBetOpportunity should track 3-bets', () => {
      model.recordThreeBetOpportunity(true);
      model.recordThreeBetOpportunity(false);
      expect(model.stats.threeBetOpportunities).toBe(2);
      expect(model.stats.threeBets).toBe(1);
    });

    test('recordFacedThreeBet should track folds to 3-bets', () => {
      model.recordFacedThreeBet(true);
      model.recordFacedThreeBet(false);
      expect(model.stats.facedThreeBet).toBe(2);
      expect(model.stats.foldedToThreeBet).toBe(1);
    });

    test('recordCBetOpportunity should track c-bets', () => {
      model.recordCBetOpportunity(true);
      model.recordCBetOpportunity(false);
      expect(model.stats.continuationBetOpportunities).toBe(2);
      expect(model.stats.continuationBets).toBe(1);
    });

    test('recordFacedCBet should track folds to c-bets', () => {
      model.recordFacedCBet(true);
      model.recordFacedCBet(false);
      expect(model.stats.facedCBet).toBe(2);
      expect(model.stats.foldedToCBet).toBe(1);
    });
  });

  describe('showdown recording', () => {
    test('recordShowdown should track showdown stats', () => {
      model.recordShowdown(true);
      model.recordShowdown(false);
      expect(model.stats.wentToShowdown).toBe(2);
      expect(model.stats.showdownOpportunities).toBe(2);
      expect(model.stats.wonAtShowdown).toBe(1);
    });

    test('recordHandComplete should track hand results', () => {
      model.recordHandComplete(true);
      model.recordHandComplete(false);
      model.recordHandComplete(true);
      expect(model.stats.handsPlayed).toBe(3);
      expect(model.stats.handsWon).toBe(2);
    });
  });

  describe('getCalculatedStats', () => {
    beforeEach(() => {
      // Set up a player with some history
      for (let i = 0; i < 100; i++) {
        model.recordPreflopOpportunity();
      }
      // 25 VPIP actions (calls/raises)
      for (let i = 0; i < 25; i++) {
        model.updateFromAction(PLAYER_ACTIONS.CALL, {
          phase: GAME_PHASES.PREFLOP,
          isVoluntary: true,
        });
      }
      // 15 preflop raises
      model.stats.preflopRaises = 15;
    });

    test('should calculate VPIP correctly', () => {
      const stats = model.getCalculatedStats();
      expect(stats.vpip).toBe(25); // 25/100 = 25%
    });

    test('should calculate PFR correctly', () => {
      const stats = model.getCalculatedStats();
      expect(stats.pfr).toBe(15); // 15/100 = 15%
    });

    test('should calculate 3-bet percentage', () => {
      model.stats.threeBetOpportunities = 20;
      model.stats.threeBets = 4;
      const stats = model.getCalculatedStats();
      expect(stats.threeBetPct).toBe(20); // 4/20 = 20%
    });

    test('should calculate fold to 3-bet percentage', () => {
      model.stats.facedThreeBet = 10;
      model.stats.foldedToThreeBet = 7;
      const stats = model.getCalculatedStats();
      expect(stats.foldToThreeBetPct).toBe(70); // 7/10 = 70%
    });

    test('should calculate c-bet percentage', () => {
      model.stats.continuationBetOpportunities = 10;
      model.stats.continuationBets = 6;
      const stats = model.getCalculatedStats();
      expect(stats.cBetPct).toBe(60); // 6/10 = 60%
    });

    test('should calculate aggression factor', () => {
      model.stats.bets = 20;
      model.stats.raises = 10;
      model.stats.calls = 15;
      const stats = model.getCalculatedStats();
      expect(stats.aggression).toBe(2); // (20+10)/15 = 2.0
    });

    test('should handle zero calls in aggression calculation', () => {
      model.stats.bets = 10;
      model.stats.raises = 5;
      model.stats.calls = 0;
      const stats = model.getCalculatedStats();
      expect(stats.aggression).toBe(3.0); // Default when no calls but has aggressive actions
    });

    test('should calculate WTSD and WSD', () => {
      model.stats.showdownOpportunities = 20;
      model.stats.wentToShowdown = 10;
      model.stats.wonAtShowdown = 6;
      const stats = model.getCalculatedStats();
      expect(stats.wtsd).toBe(50); // 10/20 = 50%
      expect(stats.wsd).toBe(60); // 6/10 = 60%
    });

    test('should calculate win rate', () => {
      model.stats.handsPlayed = 50;
      model.stats.handsWon = 15;
      const stats = model.getCalculatedStats();
      expect(stats.winRate).toBe(30); // 15/50 = 30%
    });

    test('should cache results', () => {
      const stats1 = model.getCalculatedStats();
      const stats2 = model.getCalculatedStats();
      expect(stats1).toBe(stats2); // Same reference due to caching
    });

    test('should invalidate cache on stat update', () => {
      const stats1 = model.getCalculatedStats();
      model.updateFromAction(PLAYER_ACTIONS.FOLD, { phase: GAME_PHASES.PREFLOP });
      const stats2 = model.getCalculatedStats();
      expect(stats1).not.toBe(stats2);
    });

    test('should handle zero opportunities gracefully', () => {
      const emptyModel = new OpponentModel('empty', 'Empty');
      const stats = emptyModel.getCalculatedStats();
      expect(stats.vpip).toBe(0);
      expect(stats.pfr).toBe(0);
      expect(stats.sampleSize).toBe(0);
    });
  });

  describe('getPlayerType', () => {
    test('should return Unknown for small sample size', () => {
      model.stats.preflopOpportunities = 5;
      expect(model.getPlayerType()).toBe('Unknown');
    });

    test('should classify TAG player', () => {
      // Tight (VPIP < 20%) and Aggressive (AF > 2.5)
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 15; // 15% VPIP
      model.stats.bets = 30;
      model.stats.raises = 20;
      model.stats.calls = 15; // AF = 50/15 = 3.33

      expect(model.getPlayerType()).toBe('TAG');
    });

    test('should classify LAG player', () => {
      // Loose (VPIP > 35%) and Aggressive (AF > 2.5)
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 40; // 40% VPIP
      model.stats.bets = 30;
      model.stats.raises = 20;
      model.stats.calls = 15; // AF = 3.33

      expect(model.getPlayerType()).toBe('LAG');
    });

    test('should classify TP (Tight Passive) player', () => {
      // Tight (VPIP < 20%) and Passive (AF < 1.0)
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 15; // 15% VPIP
      model.stats.bets = 5;
      model.stats.raises = 3;
      model.stats.calls = 20; // AF = 8/20 = 0.4

      expect(model.getPlayerType()).toBe('TP');
    });

    test('should classify LP (Loose Passive) player', () => {
      // Loose (VPIP > 35%) and Passive (AF < 1.0)
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 50; // 50% VPIP
      model.stats.bets = 5;
      model.stats.raises = 3;
      model.stats.calls = 40; // AF = 8/40 = 0.2

      expect(model.getPlayerType()).toBe('LP');
    });

    test('should default tight to TAG', () => {
      // Tight but neutral aggression
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 15;
      model.stats.bets = 10;
      model.stats.raises = 5;
      model.stats.calls = 10; // AF = 1.5

      expect(model.getPlayerType()).toBe('TAG');
    });

    test('should default loose to LAG', () => {
      // Loose but neutral aggression
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 40;
      model.stats.bets = 10;
      model.stats.raises = 5;
      model.stats.calls = 10; // AF = 1.5

      expect(model.getPlayerType()).toBe('LAG');
    });
  });

  describe('getExploitStrategy', () => {
    beforeEach(() => {
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 25;
    });

    test('should return player type in strategy', () => {
      const strategy = model.getExploitStrategy();
      expect(strategy.playerType).toBeDefined();
    });

    test('should recommend 3-betting light against high fold to 3-bet', () => {
      model.stats.facedThreeBet = 10;
      model.stats.foldedToThreeBet = 8; // 80% fold to 3-bet

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain('3-bet light - opponent folds often to 3-bets');
      expect(strategy.adjustments.threeBetFrequency).toBe(1.5);
    });

    test('should recommend c-betting against high fold to c-bet', () => {
      model.stats.facedCBet = 10;
      model.stats.foldedToCBet = 7; // 70% fold to c-bet

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain(
        'C-bet frequently - opponent folds often to c-bets'
      );
      expect(strategy.adjustments.cBetFrequency).toBe(1.3);
    });

    test('should recommend value betting against loose player', () => {
      model.stats.voluntaryPutInPot = 45; // 45% VPIP

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain('Value bet thin - opponent plays too many hands');
      expect(strategy.adjustments.valueBetThreshold).toBe(0.9);
    });

    test('should recommend bluffing against passive player', () => {
      // Use small sample size so player type is 'Unknown' and only stat-based recommendations apply
      model.stats.preflopOpportunities = 5; // Below threshold for player type classification
      model.stats.voluntaryPutInPot = 2;
      model.stats.bets = 5;
      model.stats.raises = 3;
      model.stats.calls = 20; // AF = 8/20 = 0.4 (passive)

      const strategy = model.getExploitStrategy();
      expect(strategy.playerType).toBe('Unknown');
      expect(strategy.recommendations).toContain('Bluff more - opponent rarely raises');
      expect(strategy.adjustments.bluffFrequency).toBe(1.4);
    });

    test('should recommend reducing bluffs against calling station', () => {
      model.stats.showdownOpportunities = 20;
      model.stats.wentToShowdown = 10; // 50% WTSD

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain('Reduce bluffs - opponent calls down light');
      expect(strategy.adjustments.bluffFrequency).toBe(0.6);
    });

    test('should provide TAG-specific adjustments', () => {
      model.stats.voluntaryPutInPot = 15;
      model.stats.bets = 20;
      model.stats.raises = 10;
      model.stats.calls = 10;

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain('Respect their raises, steal their blinds');
      expect(strategy.adjustments.respectRaises).toBe(true);
      expect(strategy.adjustments.stealFrequency).toBe(1.3);
    });

    test('should provide LAG-specific adjustments', () => {
      model.stats.voluntaryPutInPot = 40;
      model.stats.bets = 30;
      model.stats.raises = 20;
      model.stats.calls = 15;

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain('Call down lighter, trap with strong hands');
      expect(strategy.adjustments.callThreshold).toBe(0.85);
      expect(strategy.adjustments.slowplayFrequency).toBe(1.3);
    });

    test('should provide TP-specific adjustments', () => {
      model.stats.voluntaryPutInPot = 15;
      model.stats.bets = 3;
      model.stats.raises = 2;
      model.stats.calls = 20;

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain('Value bet relentlessly, bluff rarely');
      expect(strategy.adjustments.valueBetFrequency).toBe(1.4);
      expect(strategy.adjustments.bluffFrequency).toBe(0.5);
    });

    test('should provide LP-specific adjustments', () => {
      model.stats.voluntaryPutInPot = 45;
      model.stats.bets = 3;
      model.stats.raises = 2;
      model.stats.calls = 30;

      const strategy = model.getExploitStrategy();
      expect(strategy.recommendations).toContain('Value bet wide, avoid bluffing');
      expect(strategy.adjustments.valueBetThreshold).toBe(0.7);
      expect(strategy.adjustments.bluffFrequency).toBe(0.3);
    });
  });

  describe('serialization', () => {
    beforeEach(() => {
      model.stats.preflopOpportunities = 50;
      model.stats.voluntaryPutInPot = 15;
      model.stats.handsPlayed = 50;
      model.stats.handsWon = 20;
      for (let i = 0; i < 25; i++) {
        model.updateFromAction(PLAYER_ACTIONS.CALL, { phase: GAME_PHASES.FLOP });
      }
    });

    test('serialize should include all data', () => {
      const serialized = model.serialize();

      expect(serialized.playerId).toBe('player1');
      expect(serialized.playerName).toBe('TestPlayer');
      expect(serialized.stats.preflopOpportunities).toBe(50);
      expect(serialized.calculatedStats).toBeDefined();
      expect(serialized.playerType).toBeDefined();
    });

    test('serialize should limit recent actions to 20', () => {
      const serialized = model.serialize();
      expect(serialized.stats.recentActions.length).toBeLessThanOrEqual(20);
    });

    test('deserialize should restore model', () => {
      const serialized = model.serialize();
      const restored = OpponentModel.deserialize(serialized);

      expect(restored.playerId).toBe('player1');
      expect(restored.playerName).toBe('TestPlayer');
      expect(restored.stats.preflopOpportunities).toBe(50);
      expect(restored.stats.voluntaryPutInPot).toBe(15);
    });

    test('deserialized model should calculate stats correctly', () => {
      const serialized = model.serialize();
      const restored = OpponentModel.deserialize(serialized);

      const stats = restored.getCalculatedStats();
      expect(stats.vpip).toBe(30); // 15/50 = 30%
    });
  });

  describe('reset', () => {
    test('should reset all stats to zero', () => {
      model.stats.preflopOpportunities = 100;
      model.stats.voluntaryPutInPot = 30;
      model.stats.handsPlayed = 100;
      model.updateFromAction(PLAYER_ACTIONS.CALL, { phase: GAME_PHASES.FLOP });

      model.reset();

      expect(model.stats.preflopOpportunities).toBe(0);
      expect(model.stats.voluntaryPutInPot).toBe(0);
      expect(model.stats.handsPlayed).toBe(0);
      expect(model.stats.recentActions).toHaveLength(0);
    });

    test('should invalidate cache after reset', () => {
      model.stats.preflopOpportunities = 100;
      const statsBefore = model.getCalculatedStats();

      model.reset();
      const statsAfter = model.getCalculatedStats();

      expect(statsBefore).not.toBe(statsAfter);
      expect(statsAfter.vpip).toBe(0);
    });
  });
});
