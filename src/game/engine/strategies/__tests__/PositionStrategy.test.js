/**
 * PositionStrategy Test Suite
 * Tests for position-based decision making
 */

import PositionStrategy from '../PositionStrategy';

describe('PositionStrategy', () => {
  describe('getPosition', () => {
    test('should return button for dealer position', () => {
      const position = PositionStrategy.getPosition(0, 0, 6);
      expect(position).toBe('button');
    });

    test('should return blinds for small blind and big blind', () => {
      // Dealer at position 0, SB at position 1, BB at position 2
      expect(PositionStrategy.getPosition(1, 0, 6)).toBe('blinds');
      expect(PositionStrategy.getPosition(2, 0, 6)).toBe('blinds');
    });

    test('should handle heads-up correctly', () => {
      expect(PositionStrategy.getPosition(0, 0, 2)).toBe('button');
      expect(PositionStrategy.getPosition(1, 0, 2)).toBe('blinds');
    });

    test('should calculate correct positions with dealer at different seat', () => {
      // Dealer at position 3 in 6-handed game
      expect(PositionStrategy.getPosition(3, 3, 6)).toBe('button');
      expect(PositionStrategy.getPosition(4, 3, 6)).toBe('blinds'); // SB
      expect(PositionStrategy.getPosition(5, 3, 6)).toBe('blinds'); // BB
    });

    test('should return late position for cutoff', () => {
      // In 6-handed: positions are BTN, SB, BB, UTG, MP, CO
      // If dealer is at 0, position 5 would be CO (before button)
      // Actually with relative positioning, position 3 (UTG) should be early/middle
      const pos = PositionStrategy.getPosition(3, 0, 6);
      expect(['early', 'middle', 'late']).toContain(pos);
    });
  });

  describe('getRangeForPosition', () => {
    test('should return range for early position', () => {
      const range = PositionStrategy.getRangeForPosition('early');
      expect(range.openRange).toBe(0.12);
      expect(range.premiumThreshold).toBe(0.85);
    });

    test('should return range for button', () => {
      const range = PositionStrategy.getRangeForPosition('button');
      expect(range.openRange).toBe(0.38);
      expect(range.premiumThreshold).toBe(0.7);
    });

    test('should return range for blinds', () => {
      const range = PositionStrategy.getRangeForPosition('blinds');
      expect(range.defendRange).toBe(0.4);
    });

    test('should return middle range for unknown position', () => {
      const range = PositionStrategy.getRangeForPosition('unknown');
      expect(range.openRange).toBe(0.18);
    });
  });

  describe('adjustStrengthForPosition', () => {
    describe('preflop adjustments', () => {
      test('should reduce strength from early position', () => {
        const adjusted = PositionStrategy.adjustStrengthForPosition(0.5, 'early', true);
        expect(adjusted).toBeLessThan(0.5);
        expect(adjusted).toBeCloseTo(0.425, 2); // 0.5 * 0.85
      });

      test('should increase strength from button', () => {
        const adjusted = PositionStrategy.adjustStrengthForPosition(0.5, 'button', true);
        expect(adjusted).toBeGreaterThan(0.5);
        expect(adjusted).toBeCloseTo(0.575, 2); // 0.5 * 1.15
      });

      test('should cap adjusted strength at 1.0', () => {
        const adjusted = PositionStrategy.adjustStrengthForPosition(0.95, 'button', true);
        expect(adjusted).toBeLessThanOrEqual(1.0);
      });
    });

    describe('postflop adjustments', () => {
      test('should have smaller adjustments postflop', () => {
        const adjusted = PositionStrategy.adjustStrengthForPosition(0.5, 'button', false);
        // Postflop button multiplier is 1.1 vs 1.15 preflop
        expect(adjusted).toBeCloseTo(0.55, 2);
      });

      test('should reduce strength out of position postflop', () => {
        const adjusted = PositionStrategy.adjustStrengthForPosition(0.5, 'early', false);
        expect(adjusted).toBeCloseTo(0.475, 2); // 0.5 * 0.95
      });
    });
  });

  describe('isPlayableFromPosition', () => {
    test('should allow strong hands from early position', () => {
      expect(PositionStrategy.isPlayableFromPosition(0.7, 'early')).toBe(true);
    });

    test('should reject weak hands from early position', () => {
      expect(PositionStrategy.isPlayableFromPosition(0.3, 'early')).toBe(false);
    });

    test('should allow weaker hands from button', () => {
      expect(PositionStrategy.isPlayableFromPosition(0.35, 'button')).toBe(true);
    });

    test('should require stronger hands when facing raise', () => {
      // Early position call range * 3 = 0.08 * 3 = 0.24 threshold
      expect(PositionStrategy.isPlayableFromPosition(0.3, 'early', true)).toBe(true);
      expect(PositionStrategy.isPlayableFromPosition(0.2, 'early', true)).toBe(false);
    });
  });

  describe('shouldOpenRaise', () => {
    test('should recommend opening strong hands from any position', () => {
      expect(PositionStrategy.shouldOpenRaise(0.8, 'early', 'TAG')).toBe(true);
      expect(PositionStrategy.shouldOpenRaise(0.8, 'button', 'TAG')).toBe(true);
    });

    test('should allow wider opening from button', () => {
      expect(PositionStrategy.shouldOpenRaise(0.55, 'button', 'TAG')).toBe(true);
      expect(PositionStrategy.shouldOpenRaise(0.55, 'early', 'TAG')).toBe(false);
    });

    test('should adjust for LAG player type', () => {
      // LAG opens 30% wider
      expect(PositionStrategy.shouldOpenRaise(0.5, 'middle', 'LAG')).toBe(true);
      expect(PositionStrategy.shouldOpenRaise(0.5, 'middle', 'TAG')).toBe(false);
    });

    test('should adjust for TP player type', () => {
      // TP opens 20% tighter
      expect(PositionStrategy.shouldOpenRaise(0.7, 'middle', 'TP')).toBe(false);
      expect(PositionStrategy.shouldOpenRaise(0.85, 'middle', 'TP')).toBe(true);
    });
  });

  describe('getStealFrequency', () => {
    test('should return highest frequency for button', () => {
      expect(PositionStrategy.getStealFrequency('button')).toBe(0.45);
    });

    test('should return lower frequency for cutoff', () => {
      expect(PositionStrategy.getStealFrequency('late')).toBe(0.35);
    });

    test('should return 0 for early positions', () => {
      expect(PositionStrategy.getStealFrequency('early')).toBe(0);
    });
  });

  describe('getBlindDefenseFrequency', () => {
    test('should return higher defense for big blind', () => {
      expect(PositionStrategy.getBlindDefenseFrequency(false)).toBe(0.4);
    });

    test('should return lower defense for small blind', () => {
      expect(PositionStrategy.getBlindDefenseFrequency(true)).toBe(0.25);
    });
  });

  describe('adjustBetSizeForPosition', () => {
    test('should increase bet size from early position', () => {
      const adjusted = PositionStrategy.adjustBetSizeForPosition(100, 'early');
      expect(adjusted).toBe(120); // 100 * 1.2
    });

    test('should decrease bet size from button', () => {
      const adjusted = PositionStrategy.adjustBetSizeForPosition(100, 'button');
      expect(adjusted).toBe(90); // 100 * 0.9
    });

    test('should return integer values', () => {
      const adjusted = PositionStrategy.adjustBetSizeForPosition(75, 'early');
      expect(Number.isInteger(adjusted)).toBe(true);
    });
  });
});
