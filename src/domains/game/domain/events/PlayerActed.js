// PlayerActed Domain Event
// Fired whenever a player takes an action in the game

class PlayerActed {
  constructor(data) {
    this.eventType = 'PlayerActed';
    this.playerId = data.playerId;
    this.action = data.action;
    this.amount = data.amount || 0;
    this.gameState = data.gameState;
    this.timestamp = new Date();
    this.eventId = this._generateEventId();
    Object.freeze(this);
  }

  _generateEventId() {
    return `${this.eventType}_${this.playerId}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // Helper methods for analytics
  isAggressive() {
    return ['bet', 'raise', 'all-in'].includes(this.action);
  }

  isPassive() {
    return ['call', 'check'].includes(this.action);
  }

  isFold() {
    return this.action === 'fold';
  }

  getActionStrength() {
    const strengthMap = {
      fold: 0,
      check: 0.2,
      call: 0.4,
      bet: 0.8,
      raise: 1.0,
      'all-in': 1.2,
    };
    return strengthMap[this.action] || 0;
  }

  toJSON() {
    return {
      eventType: this.eventType,
      eventId: this.eventId,
      playerId: this.playerId,
      action: this.action,
      amount: this.amount,
      timestamp: this.timestamp.toISOString(),
      gamePhase: this.gameState?.phase,
      potSize: this.gameState?.getTotalPot?.() || 0,
      playersInHand: this.gameState?.getPlayersInHand?.()?.length || 0,
    };
  }

  toString() {
    return `Player ${this.playerId} ${this.action}${this.amount > 0 ? ` ${this.amount}` : ''}`;
  }
}

export default PlayerActed;
