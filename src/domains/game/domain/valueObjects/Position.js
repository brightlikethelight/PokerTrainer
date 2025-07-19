// Position Value Object
// Represents a player's position at the poker table
// Immutable value object with business rules

class Position {
  constructor(value, totalPlayers) {
    this._validatePosition(value, totalPlayers);
    this._value = value;
    this._totalPlayers = totalPlayers;
    Object.freeze(this);
  }

  _validatePosition(value, totalPlayers) {
    if (!Number.isInteger(value) || value < 0 || value >= totalPlayers) {
      throw new Error(`Invalid position: ${value}. Must be between 0 and ${totalPlayers - 1}`);
    }
    if (!Number.isInteger(totalPlayers) || totalPlayers < 2 || totalPlayers > 10) {
      throw new Error(`Invalid total players: ${totalPlayers}. Must be between 2 and 10`);
    }
  }

  get value() {
    return this._value;
  }

  get totalPlayers() {
    return this._totalPlayers;
  }

  // Business logic methods
  isDealer() {
    return this._value === 0;
  }

  isSmallBlind() {
    if (this._totalPlayers === 2) {
      return this.isDealer(); // In heads-up, dealer is small blind
    }
    return this._value === 1;
  }

  isBigBlind() {
    if (this._totalPlayers === 2) {
      return this._value === 1;
    }
    return this._value === 2;
  }

  isInEarlyPosition() {
    if (this._totalPlayers <= 6) {
      return this._value <= 2;
    }
    return this._value <= 3;
  }

  isInMiddlePosition() {
    if (this._totalPlayers <= 6) {
      return this._value > 2 && this._value < this._totalPlayers - 2;
    }
    return this._value > 3 && this._value < this._totalPlayers - 2;
  }

  isInLatePosition() {
    return this._value >= this._totalPlayers - 2;
  }

  getPositionName() {
    if (this.isDealer()) return 'BTN';
    if (this.isSmallBlind()) return 'SB';
    if (this.isBigBlind()) return 'BB';

    if (this._totalPlayers >= 6) {
      if (this._value === 3) return 'UTG';
      if (this._value === this._totalPlayers - 1) return 'CO';
    }

    if (this.isInEarlyPosition()) return 'EP';
    if (this.isInMiddlePosition()) return 'MP';
    if (this.isInLatePosition()) return 'LP';

    return `POS${this._value}`;
  }

  // Get relative position strength (0-1, where 1 is best position)
  getPositionStrength() {
    return this._value / (this._totalPlayers - 1);
  }

  // Move to next position (clockwise)
  next() {
    const nextValue = (this._value + 1) % this._totalPlayers;
    return new Position(nextValue, this._totalPlayers);
  }

  // Move to previous position (counter-clockwise)
  previous() {
    const prevValue = (this._value - 1 + this._totalPlayers) % this._totalPlayers;
    return new Position(prevValue, this._totalPlayers);
  }

  // Value object equality
  equals(other) {
    if (!(other instanceof Position)) {
      return false;
    }
    return this._value === other._value && this._totalPlayers === other._totalPlayers;
  }

  toString() {
    return `${this.getPositionName()}(${this._value}/${this._totalPlayers})`;
  }

  toJSON() {
    return {
      value: this._value,
      totalPlayers: this._totalPlayers,
      name: this.getPositionName(),
      strength: this.getPositionStrength(),
    };
  }

  // Factory methods
  static dealer(totalPlayers) {
    return new Position(0, totalPlayers);
  }

  static smallBlind(totalPlayers) {
    const value = totalPlayers === 2 ? 0 : 1;
    return new Position(value, totalPlayers);
  }

  static bigBlind(totalPlayers) {
    const value = totalPlayers === 2 ? 1 : 2;
    return new Position(value, totalPlayers);
  }

  static underTheGun(totalPlayers) {
    if (totalPlayers < 3) {
      throw new Error('UTG position requires at least 3 players');
    }
    const value = totalPlayers === 3 ? 0 : 3;
    return new Position(value, totalPlayers);
  }
}

export default Position;
