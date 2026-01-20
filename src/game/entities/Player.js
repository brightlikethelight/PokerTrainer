import { PLAYER_STATUS } from '../../constants/game-constants';

class Player {
  constructor(id, name, chips, position = null, isAI = false, aiType = null) {
    this.id = id;
    this.name = name;
    this.chips = chips;
    this.position = position;
    this._position = position; // Alias for compatibility

    // Handle AI type parameter - if aiType is passed as 3rd parameter (old style)
    if (typeof isAI === 'string') {
      this.aiType = isAI;
      this.isAI = true;
    } else {
      this.isAI = isAI;
      this.aiType = aiType || undefined;
    }

    this.holeCards = [];
    this.cards = this.holeCards; // Alias for compatibility
    this.status = PLAYER_STATUS.WAITING;
    this._currentBet = 0;
    this.totalBetThisRound = 0; // Alias for currentBet
    this.totalPotContribution = 0;
    this.lastAction = null;

    // Boolean properties for compatibility
    this.isActive = true;
    this.isFolded = false;
    this.isAllIn = false;
    this.isDealer = false;

    this.stats = {
      handsPlayed: 0,
      handsWon: 0,
      biggestPotWon: 0,
      totalWinnings: 0,
      vpip: 0,
      pfr: 0,
      aggression: 0,
    };
  }

  setHoleCards(cards) {
    this.holeCards = cards;
    this.cards = this.holeCards; // Keep alias in sync
  }

  receiveCards(cards) {
    this.setHoleCards(cards);
  }

  clearHoleCards() {
    this.holeCards = [];
    this.cards = this.holeCards; // Keep alias in sync
  }

  placeBet(amount) {
    if (amount < 0) {
      throw new Error('Bet amount cannot be negative');
    }

    if (amount > this.chips) {
      throw new Error('Insufficient chips');
    }

    const betAmount = Math.min(amount, this.chips);
    this.chips -= betAmount;
    this._currentBet += betAmount;
    this.totalBetThisRound += betAmount;
    this.totalPotContribution += betAmount;

    if (this.chips === 0) {
      this.status = PLAYER_STATUS.ALL_IN;
      this.isAllIn = true;
    }

    return betAmount;
  }

  fold() {
    this.status = PLAYER_STATUS.FOLDED;
    this.lastAction = 'fold';
    this.isFolded = true;
    this.clearHoleCards();
  }

  check() {
    this.lastAction = 'check';
    this.status = PLAYER_STATUS.CHECKED;
  }

  call(amount) {
    // Handle all-in case - call with all remaining chips if not enough
    const callAmount = amount > this.chips ? this.chips : amount;
    const actualAmount = this.placeBet(callAmount);
    this.lastAction = 'call';

    // If player used all chips, they're all-in, otherwise they called
    if (this.chips === 0) {
      this.status = PLAYER_STATUS.ALL_IN;
    } else {
      this.status = PLAYER_STATUS.CALLED;
    }

    return actualAmount;
  }

  bet(amount) {
    const betAmount = this.placeBet(amount);
    this.lastAction = 'bet';
    return betAmount;
  }

  raise(amount) {
    if (amount <= this._currentBet) {
      throw new Error('Raise amount must be greater than current bet');
    }

    // Calculate the additional amount to raise to the target
    const additionalAmount = amount - this._currentBet;
    const raiseAmount = this.placeBet(additionalAmount);
    this.lastAction = 'raise';
    this.status = PLAYER_STATUS.RAISED;
    return raiseAmount;
  }

  winPot(amount) {
    if (amount < 0) {
      throw new Error('Win amount cannot be negative');
    }

    this.chips += amount;
    this.stats.handsWon++;
    this.stats.totalWinnings += amount;

    if (amount > this.stats.biggestPotWon) {
      this.stats.biggestPotWon = amount;
    }
  }

  resetForNewHand() {
    this.clearHoleCards();
    this.status = PLAYER_STATUS.WAITING;
    this._currentBet = 0;
    this.totalBetThisRound = 0;
    this.totalPotContribution = 0;
    this.lastAction = null;
    this.isActive = true; // Players should be active and ready to act
    this.isFolded = false;
    this.isAllIn = false;
    this.stats.handsPlayed++;
  }

  resetBettingRound() {
    this._currentBet = 0;
    this.totalBetThisRound = 0;

    // Don't reset folded or all-in status
    if (this.status !== PLAYER_STATUS.FOLDED && this.status !== PLAYER_STATUS.ALL_IN) {
      this.status = PLAYER_STATUS.WAITING;
    }
  }

  checkIfActive() {
    return this.status === PLAYER_STATUS.ACTIVE || this.status === PLAYER_STATUS.ALL_IN;
  }

  canAct() {
    return (
      this.isActive &&
      this.chips > 0 &&
      this.status !== PLAYER_STATUS.FOLDED &&
      this.status !== PLAYER_STATUS.ALL_IN
    );
  }

  isInHand() {
    return (
      this.isActive &&
      this.status !== PLAYER_STATUS.FOLDED &&
      this.status !== PLAYER_STATUS.SITTING_OUT
    );
  }

  decideAction(gameState) {
    // This method should only be called for AI players
    if (!this.isAI) {
      throw new Error('decideAction can only be called on AI players');
    }

    // Import AIPlayer service dynamically to avoid circular dependencies
    const AIPlayer = require('../engine/AIPlayer').default;
    const BettingLogic = require('../engine/BettingLogic').default;

    // Get valid actions for this player
    const validActions = BettingLogic.getValidActions(gameState, this);

    // Get AI decision
    return AIPlayer.getAction(this, gameState, validActions, {
      getPlayerCards: () => this.holeCards,
      getCommunityCards: () => gameState.communityCards,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      chips: this.chips,
      _currentBet: this._currentBet,
      _position: this._position,
      cards: this.cards,
      isAI: this.isAI,
      aiType: this.aiType,
      status: this.status,
      isActive: this.isActive,
      isFolded: this.isFolded,
      isAllIn: this.isAllIn,
      isDealer: this.isDealer,
      totalBetThisRound: this.totalBetThisRound,
    };
  }

  getNetPosition() {
    return this.chips - this.totalPotContribution;
  }

  updateStats(_action, phase) {
    if (phase === 'preflop' && _action !== 'fold') {
      this.stats.vpip++;
    }

    if (phase === 'preflop' && (_action === 'bet' || _action === 'raise')) {
      this.stats.pfr++;
    }

    if (_action === 'bet' || _action === 'raise') {
      this.stats.aggression++;
    }
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      chips: this.chips,
      position: this.position,
      isAI: this.isAI,
      aiType: this.aiType,
      status: this.status,
      currentBet: this._currentBet,
      lastAction: this.lastAction,
      hasCards: this.holeCards.length > 0,
      holeCards: this.isAI
        ? null
        : this.holeCards.map((card) => ({ rank: card.rank, suit: card.suit })),
    };
  }

  get currentBet() {
    return this._currentBet;
  }

  set currentBet(value) {
    this._currentBet = value;
  }
}

export default Player;
