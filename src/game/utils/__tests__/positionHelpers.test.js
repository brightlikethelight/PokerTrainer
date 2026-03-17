import {
  isDealer,
  isSmallBlind,
  isBigBlind,
  getPositionType,
  distanceFromDealer,
  getNextPosition,
  getPreviousPosition,
  isValidPosition,
} from '../positionHelpers';

describe('positionHelpers', () => {
  describe('isDealer', () => {
    it('returns true for position 0', () => {
      expect(isDealer(0)).toBe(true);
    });

    it('returns false for non-zero positions', () => {
      expect(isDealer(1)).toBe(false);
      expect(isDealer(5)).toBe(false);
    });
  });

  describe('isSmallBlind', () => {
    it('returns true for position 0 in heads-up', () => {
      expect(isSmallBlind(0, 2)).toBe(true);
    });

    it('returns true for position 1 in 6-player', () => {
      expect(isSmallBlind(1, 6)).toBe(true);
    });

    it('returns false for other positions in 6-player', () => {
      expect(isSmallBlind(0, 6)).toBe(false);
      expect(isSmallBlind(2, 6)).toBe(false);
    });
  });

  describe('isBigBlind', () => {
    it('returns true for position 1 in heads-up', () => {
      expect(isBigBlind(1, 2)).toBe(true);
    });

    it('returns true for position 2 in 6-player', () => {
      expect(isBigBlind(2, 6)).toBe(true);
    });

    it('returns false for other positions in 6-player', () => {
      expect(isBigBlind(0, 6)).toBe(false);
      expect(isBigBlind(1, 6)).toBe(false);
    });
  });

  describe('getPositionType', () => {
    it('returns blinds for SB and BB positions', () => {
      expect(getPositionType(1, 6)).toBe('blinds');
      expect(getPositionType(2, 6)).toBe('blinds');
    });

    it('returns late for positions >= 3 in 6-max', () => {
      expect(getPositionType(3, 6)).toBe('late');
      expect(getPositionType(5, 6)).toBe('late');
    });

    it('returns early for non-blind low positions in 6-max', () => {
      expect(getPositionType(0, 6)).toBe('early');
    });
  });

  describe('distanceFromDealer', () => {
    it('returns 0 when position equals dealer', () => {
      expect(distanceFromDealer(3, 3, 6)).toBe(0);
    });

    it('handles wrap-around correctly', () => {
      expect(distanceFromDealer(1, 4, 6)).toBe(3);
    });

    it('returns simple difference when position > dealer', () => {
      expect(distanceFromDealer(4, 1, 6)).toBe(3);
    });
  });

  describe('getNextPosition', () => {
    it('increments position normally', () => {
      expect(getNextPosition(2, 6)).toBe(3);
    });

    it('wraps around to 0 from last position', () => {
      expect(getNextPosition(5, 6)).toBe(0);
    });
  });

  describe('getPreviousPosition', () => {
    it('decrements position normally', () => {
      expect(getPreviousPosition(3, 6)).toBe(2);
    });

    it('wraps around to last position from 0', () => {
      expect(getPreviousPosition(0, 6)).toBe(5);
    });
  });

  describe('isValidPosition', () => {
    it('returns true for valid in-range integers', () => {
      expect(isValidPosition(0, 6)).toBe(true);
      expect(isValidPosition(5, 6)).toBe(true);
    });

    it('returns false for negative positions', () => {
      expect(isValidPosition(-1, 6)).toBe(false);
    });

    it('returns false for out-of-range positions', () => {
      expect(isValidPosition(6, 6)).toBe(false);
    });

    it('returns false for non-integer positions', () => {
      expect(isValidPosition(1.5, 6)).toBe(false);
    });

    it('returns false when totalPlayers < 2 or > 10', () => {
      expect(isValidPosition(0, 1)).toBe(false);
      expect(isValidPosition(0, 11)).toBe(false);
    });
  });
});
