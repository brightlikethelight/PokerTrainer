/**
 * RandomSource - Provides seeded and unseeded random number generation.
 * Use seeded instances for deterministic AI behavior and testing.
 * Use the default (unseeded) instance for production randomness.
 */
class RandomSource {
  /**
   * @param {number|null} seed - Optional seed for deterministic output.
   *   If null, uses Math.random() (non-deterministic).
   */
  constructor(seed = null) {
    this._seed = seed;
    if (seed !== null) {
      // mulberry32 seeded PRNG
      this._state = seed | 0;
    }
  }

  /**
   * Returns a random float in [0, 1).
   * If seeded, output is deterministic for the same seed.
   */
  random() {
    if (this._seed === null) {
      return Math.random();
    }
    // mulberry32 algorithm
    this._state |= 0;
    this._state = (this._state + 0x6d2b79f5) | 0;
    let t = Math.imul(this._state ^ (this._state >>> 15), 1 | this._state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in [min, max] (inclusive).
   */
  randInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
}

/** Default unseeded instance — uses Math.random() */
RandomSource.default = new RandomSource();

export default RandomSource;
