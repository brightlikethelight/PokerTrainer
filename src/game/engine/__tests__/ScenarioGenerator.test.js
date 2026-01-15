/**
 * ScenarioGenerator Test Suite
 * Tests for practice scenario generation
 */

import ScenarioGenerator, {
  SCENARIO_TYPES,
  HAND_CATEGORIES,
  BOARD_TEXTURES,
} from '../ScenarioGenerator';
import Card from '../../entities/Card';

describe('ScenarioGenerator', () => {
  describe('generatePreflopScenario', () => {
    test('should generate a valid preflop scenario', () => {
      const scenario = ScenarioGenerator.generatePreflopScenario('intermediate');

      expect(scenario).toBeDefined();
      expect(scenario.phase).toBe('preflop');
      expect(scenario.difficulty).toBe('intermediate');
      expect(scenario.heroPosition).toBeDefined();
      expect(scenario.heroHand).toHaveLength(2);
      expect(scenario.heroHand[0]).toBeInstanceOf(Card);
      expect(scenario.description).toBeDefined();
      expect(scenario.correctActions).toBeDefined();
      expect(Array.isArray(scenario.correctActions)).toBe(true);
    });

    test('should generate PREFLOP_OPEN scenario type correctly', () => {
      // Generate multiple scenarios to get an OPEN type
      let openScenario = null;
      for (let i = 0; i < 50; i++) {
        const scenario = ScenarioGenerator.generatePreflopScenario('beginner');
        if (scenario.type === SCENARIO_TYPES.PREFLOP_OPEN) {
          openScenario = scenario;
          break;
        }
      }

      if (openScenario) {
        expect(openScenario.toCall).toBe(0);
        expect(openScenario.currentBet).toBe(10);
        expect(openScenario.description).toContain('Action folds to you');
      }
    });

    test('should generate PREFLOP_FACING_RAISE scenario type correctly', () => {
      let raiseScenario = null;
      for (let i = 0; i < 50; i++) {
        const scenario = ScenarioGenerator.generatePreflopScenario('intermediate');
        if (scenario.type === SCENARIO_TYPES.PREFLOP_FACING_RAISE) {
          raiseScenario = scenario;
          break;
        }
      }

      if (raiseScenario) {
        expect(raiseScenario.toCall).toBe(30);
        expect(raiseScenario.villainPosition).toBeDefined();
        expect(raiseScenario.villainAction).toBe('raise');
        expect(raiseScenario.description).toContain('raises to 3x');
      }
    });

    test('should generate PREFLOP_3BET scenario type correctly', () => {
      let threeBetScenario = null;
      for (let i = 0; i < 50; i++) {
        const scenario = ScenarioGenerator.generatePreflopScenario('advanced');
        if (scenario.type === SCENARIO_TYPES.PREFLOP_3BET) {
          threeBetScenario = scenario;
          break;
        }
      }

      if (threeBetScenario) {
        expect(threeBetScenario.toCall).toBe(90);
        expect(threeBetScenario.heroRaised).toBe(true);
        expect(threeBetScenario.description).toContain('3-bets');
      }
    });

    test('should use simpler positions for beginner difficulty', () => {
      const positions = [];
      for (let i = 0; i < 20; i++) {
        const scenario = ScenarioGenerator.generatePreflopScenario('beginner');
        positions.push(scenario.heroPosition);
      }

      // Beginner should only have button and big_blind
      const uniquePositions = [...new Set(positions)];
      uniquePositions.forEach((pos) => {
        expect(['button', 'big_blind']).toContain(pos);
      });
    });
  });

  describe('generatePostflopScenario', () => {
    test('should generate a valid postflop scenario', () => {
      const scenario = ScenarioGenerator.generatePostflopScenario('intermediate');

      expect(scenario).toBeDefined();
      expect(['flop', 'river']).toContain(scenario.phase);
      expect(scenario.difficulty).toBe('intermediate');
      expect(scenario.heroHand).toHaveLength(2);
      expect(scenario.board).toBeDefined();
      expect(scenario.board.length).toBeGreaterThanOrEqual(3);
      expect(scenario.potSize).toBeGreaterThan(0);
    });

    test('should generate FLOP_CBET scenario with correct context', () => {
      let cbetScenario = null;
      for (let i = 0; i < 50; i++) {
        const scenario = ScenarioGenerator.generatePostflopScenario('intermediate');
        if (scenario.type === SCENARIO_TYPES.FLOP_CBET) {
          cbetScenario = scenario;
          break;
        }
      }

      if (cbetScenario) {
        expect(cbetScenario.phase).toBe('flop');
        expect(cbetScenario.isAggressor).toBe(true);
        expect(cbetScenario.board).toHaveLength(3);
        expect(cbetScenario.description).toContain('You raised preflop');
        expect(cbetScenario.description).toContain('Villain checks');
      }
    });

    test('should generate FLOP_FACING_CBET scenario with correct context', () => {
      let facingCbetScenario = null;
      for (let i = 0; i < 50; i++) {
        const scenario = ScenarioGenerator.generatePostflopScenario('intermediate');
        if (scenario.type === SCENARIO_TYPES.FLOP_FACING_CBET) {
          facingCbetScenario = scenario;
          break;
        }
      }

      if (facingCbetScenario) {
        expect(facingCbetScenario.phase).toBe('flop');
        expect(facingCbetScenario.isAggressor).toBe(false);
        expect(facingCbetScenario.toCall).toBe(40);
        expect(facingCbetScenario.villainAction).toBe('bet');
        expect(facingCbetScenario.description).toContain('Villain bets');
      }
    });

    test('should generate river scenarios with 5 community cards', () => {
      let riverScenario = null;
      for (let i = 0; i < 50; i++) {
        const scenario = ScenarioGenerator.generatePostflopScenario('advanced');
        if (scenario.phase === 'river') {
          riverScenario = scenario;
          break;
        }
      }

      if (riverScenario) {
        expect(riverScenario.board).toHaveLength(5);
        expect(riverScenario.potSize).toBe(120);
      }
    });
  });

  describe('generateQuizQuestion', () => {
    test('should generate position quiz', () => {
      const quiz = ScenarioGenerator.generateQuizQuestion('position');

      expect(quiz.type).toBe('multiple_choice');
      expect(quiz.concept).toBe('position');
      expect(quiz.question).toBeDefined();
      expect(quiz.options).toHaveLength(4);
      expect(quiz.correctAnswer).toBeDefined();
      expect(quiz.explanation).toBeDefined();
    });

    test('should generate pot odds quiz', () => {
      const quiz = ScenarioGenerator.generateQuizQuestion('pot_odds');

      expect(quiz.type).toBe('calculation');
      expect(quiz.concept).toBe('pot_odds');
      expect(quiz.question).toContain('pot odds');
      expect(quiz.options).toHaveLength(4);
    });

    test('should generate hand ranges quiz', () => {
      const quiz = ScenarioGenerator.generateQuizQuestion('hand_ranges');

      expect(quiz.type).toBe('multiple_choice');
      expect(quiz.concept).toBe('hand_ranges');
      expect(quiz.question).toContain('percentile');
    });

    test('should generate bet sizing quiz', () => {
      const quiz = ScenarioGenerator.generateQuizQuestion('bet_sizing');

      expect(quiz.type).toBe('multiple_choice');
      expect(quiz.concept).toBe('bet_sizing');
      expect(quiz.question).toContain('bet sizing');
    });

    test('should default to position quiz for unknown concept', () => {
      const quiz = ScenarioGenerator.generateQuizQuestion('unknown');

      expect(quiz.concept).toBe('position');
    });
  });

  describe('correctActions generation', () => {
    test('should provide correct actions with explanations', () => {
      const scenario = ScenarioGenerator.generatePreflopScenario('intermediate');

      expect(scenario.correctActions.length).toBeGreaterThan(0);
      scenario.correctActions.forEach((action) => {
        expect(action.action).toBeDefined();
        expect(action.explanation).toBeDefined();
        expect(typeof action.isOptimal).toBe('boolean');
      });
    });

    test('should have at least one optimal action', () => {
      const scenario = ScenarioGenerator.generatePreflopScenario('intermediate');

      const hasOptimal = scenario.correctActions.some((a) => a.isOptimal);
      expect(hasOptimal).toBe(true);
    });
  });

  describe('HAND_CATEGORIES', () => {
    test('should have all required categories', () => {
      expect(HAND_CATEGORIES.premium).toBeDefined();
      expect(HAND_CATEGORIES.strong).toBeDefined();
      expect(HAND_CATEGORIES.medium).toBeDefined();
      expect(HAND_CATEGORIES.speculative).toBeDefined();
      expect(HAND_CATEGORIES.marginal).toBeDefined();
      expect(HAND_CATEGORIES.trash).toBeDefined();
    });

    test('should have valid hands in each category', () => {
      Object.values(HAND_CATEGORIES).forEach((category) => {
        category.forEach((hand) => {
          expect(hand).toHaveLength(2);
          expect(hand[0]).toHaveLength(2); // [rank, suit]
          expect(hand[1]).toHaveLength(2);
        });
      });
    });
  });

  describe('BOARD_TEXTURES', () => {
    test('should have all board texture types', () => {
      expect(BOARD_TEXTURES.dry).toBeDefined();
      expect(BOARD_TEXTURES.wet).toBeDefined();
      expect(BOARD_TEXTURES.paired).toBeDefined();
      expect(BOARD_TEXTURES.draw_heavy).toBeDefined();
    });

    test('should have valid board cards', () => {
      Object.values(BOARD_TEXTURES).forEach((boards) => {
        boards.forEach((board) => {
          expect(board).toHaveLength(3);
          board.forEach((card) => {
            expect(card).toHaveLength(2);
            expect(['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']).toContain(
              card[0]
            );
            expect(['s', 'h', 'd', 'c']).toContain(card[1]);
          });
        });
      });
    });
  });

  describe('SCENARIO_TYPES', () => {
    test('should have all scenario types defined', () => {
      expect(SCENARIO_TYPES.PREFLOP_OPEN).toBe('preflop_open');
      expect(SCENARIO_TYPES.PREFLOP_FACING_RAISE).toBe('preflop_facing_raise');
      expect(SCENARIO_TYPES.PREFLOP_3BET).toBe('preflop_3bet');
      expect(SCENARIO_TYPES.FLOP_CBET).toBe('flop_cbet');
      expect(SCENARIO_TYPES.FLOP_FACING_CBET).toBe('flop_facing_cbet');
      expect(SCENARIO_TYPES.TURN_DECISION).toBe('turn_decision');
      expect(SCENARIO_TYPES.RIVER_DECISION).toBe('river_decision');
      expect(SCENARIO_TYPES.BLUFF_SPOT).toBe('bluff_spot');
      expect(SCENARIO_TYPES.VALUE_BET).toBe('value_bet');
    });
  });

  describe('helper methods', () => {
    test('formatBoard should format cards correctly', () => {
      const cards = [new Card('A', 's'), new Card('K', 'h'), new Card('Q', 'd')];
      const formatted = ScenarioGenerator.formatBoard(cards);
      expect(formatted).toBe('As Kh Qd');
    });

    test('formatHand should format hand correctly', () => {
      const cards = [new Card('A', 's'), new Card('K', 's')];
      const formatted = ScenarioGenerator.formatHand(cards);
      expect(formatted).toBe('As Ks');
    });
  });
});
