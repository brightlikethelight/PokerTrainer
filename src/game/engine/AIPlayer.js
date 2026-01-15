import { AI_PLAYER_TYPES } from '../../constants/game-constants';

import PositionStrategy from './strategies/PositionStrategy';

class AIPlayer {
  static getAction(player, gameState, validActions, gameEngine) {
    const { aiType } = player;

    const holeCards = gameEngine.getPlayerCards(player.id);
    const communityCards = gameEngine.getCommunityCards();
    const isPreflop = gameState.phase === 'preflop';

    // Get position information
    const positionType = PositionStrategy.getPosition(
      player.position,
      gameState.dealerPosition,
      gameState.players.length
    );

    // Evaluate hand strength with position adjustment
    const baseStrength = this.evaluateHandStrength(holeCards, communityCards, gameState.phase);
    const handStrength = PositionStrategy.adjustStrengthForPosition(
      baseStrength,
      positionType,
      isPreflop
    );

    // Create enhanced context for decision making
    const context = {
      handStrength,
      baseStrength,
      positionType,
      isPreflop,
      isInPosition: positionType === 'button' || positionType === 'late',
      facingRaise: gameState.currentBet > gameState.blinds.big,
    };

    switch (aiType) {
      case AI_PLAYER_TYPES.TAG:
        return this.getTightAggressiveAction(
          handStrength,
          validActions,
          gameState,
          player,
          context
        );
      case AI_PLAYER_TYPES.LAG:
        return this.getLooseAggressiveAction(
          handStrength,
          validActions,
          gameState,
          player,
          context
        );
      case AI_PLAYER_TYPES.TP:
        return this.getTightPassiveAction(handStrength, validActions, gameState, player, context);
      case AI_PLAYER_TYPES.LP:
        return this.getLoosePassiveAction(handStrength, validActions, gameState, player, context);
      default:
        return this.getDefaultAction(validActions, gameState, player);
    }
  }

  static evaluateHandStrength(holeCards, communityCards, phase) {
    if (!holeCards || holeCards.length < 2) return 0;

    const [card1, card2] = holeCards;
    const isPair = card1.rank === card2.rank;
    const isSuited = card1.suit === card2.suit;
    const highCard = Math.max(card1.value, card2.value);
    const lowCard = Math.min(card1.value, card2.value);
    const gap = highCard - lowCard;

    if (phase === 'preflop') {
      if (isPair) {
        if (highCard >= 12) return 0.9;
        if (highCard >= 9) return 0.7;
        return 0.5;
      }

      if (highCard === 14) {
        if (lowCard >= 11) return 0.8;
        if (lowCard >= 9) return 0.6;
      }

      if (highCard === 13 && lowCard >= 11) return 0.6;

      if (isSuited && gap <= 4) return 0.4;

      if (gap <= 2 && highCard >= 10) return 0.3;

      return 0.2;
    }

    return this.calculatePostFlopStrength(holeCards, communityCards);
  }

  static calculatePostFlopStrength(holeCards, communityCards) {
    if (communityCards.length === 0) return 0.3;

    const allCards = [...holeCards, ...communityCards];
    const hasTopPair = this.hasTopPair(holeCards, communityCards);
    const hasTwoPair = this.hasTwoPair(allCards);
    const hasSet = this.hasSet(holeCards, communityCards);
    const hasFlushDraw = this.hasFlushDraw(allCards);
    const hasStraightDraw = this.hasStraightDraw(allCards);

    if (hasSet) return 0.9;
    if (hasTwoPair) return 0.75;
    if (hasTopPair) return 0.65;
    if (hasFlushDraw && hasStraightDraw) return 0.55;
    if (hasFlushDraw || hasStraightDraw) return 0.45;

    return 0.25;
  }

  static hasTopPair(holeCards, communityCards) {
    if (communityCards.length === 0) return false;

    const maxCommunityValue = Math.max(...communityCards.map((c) => c.value));
    return holeCards.some((card) => card.value === maxCommunityValue);
  }

  static hasTwoPair(cards) {
    const ranks = {};
    cards.forEach((card) => {
      ranks[card.rank] = (ranks[card.rank] || 0) + 1;
    });

    const pairs = Object.values(ranks).filter((count) => count >= 2);
    return pairs.length >= 2;
  }

  static hasSet(holeCards, communityCards) {
    if (holeCards[0].rank !== holeCards[1].rank) return false;

    return communityCards.some((card) => card.rank === holeCards[0].rank);
  }

  static hasFlushDraw(cards) {
    const suits = {};
    cards.forEach((card) => {
      suits[card.suit] = (suits[card.suit] || 0) + 1;
    });

    return Object.values(suits).some((count) => count >= 4);
  }

  static hasStraightDraw(cards) {
    const values = [...new Set(cards.map((c) => c.value))].sort((a, b) => a - b);

    for (let i = 0; i <= values.length - 4; i++) {
      let consecutive = 1;
      for (let j = i; j < i + 4 && j < values.length - 1; j++) {
        if (values[j + 1] - values[j] === 1) {
          consecutive++;
        }
      }
      if (consecutive >= 4) return true;
    }

    return false;
  }

  static getTightAggressiveAction(handStrength, validActions, gameState, player, context = {}) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot || 0;
    const stackSize = player.chips;
    const { positionType = 'middle', isInPosition = false } = context;

    // Position-adjusted thresholds
    const raiseThreshold = isInPosition ? 0.6 : 0.7;
    const callThreshold = isInPosition ? 0.35 : 0.4;
    const callPotRatio = isInPosition ? 0.4 : 0.3;

    // Strong hand: Raise aggressively
    if (handStrength >= raiseThreshold) {
      if (validActions.includes('raise')) {
        const baseBet = gameState.currentBet + gameState.minimumRaise + (potSize || 100) * 0.75;
        const raiseAmount = PositionStrategy.adjustBetSizeForPosition(
          Math.min(baseBet, stackSize),
          positionType
        );
        return { action: 'raise', amount: Math.floor(raiseAmount) };
      }
      if (validActions.includes('bet')) {
        const baseBet = Math.max((potSize || 100) * 0.75, gameState.blinds?.big || 20);
        const betAmount = PositionStrategy.adjustBetSizeForPosition(
          Math.min(baseBet, stackSize),
          positionType
        );
        return { action: 'bet', amount: Math.floor(betAmount) };
      }
    }

    // Medium hand: Call if price is right
    if (handStrength >= callThreshold) {
      if (validActions.includes('call') && callAmount <= (potSize || 100) * callPotRatio) {
        return { action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { action: 'check', amount: 0 };
      }
    }

    // Weak hand: Check or fold
    if (validActions.includes('check')) {
      return { action: 'check', amount: 0 };
    }

    return { action: 'fold', amount: 0 };
  }

  static getLooseAggressiveAction(handStrength, validActions, gameState, player, context = {}) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot || 0;
    const stackSize = player.chips;
    const { positionType = 'middle', isInPosition = false, isPreflop = true } = context;

    // LAG plays more hands from position and bluffs more
    const baseBluffFrequency = 0.3;
    const bluffFrequency = isInPosition ? baseBluffFrequency * 1.4 : baseBluffFrequency;
    const stealFrequency = PositionStrategy.getStealFrequency(positionType);

    // Position-adjusted thresholds - LAG is looser from late position
    const raiseThreshold = isInPosition ? 0.35 : 0.5;
    const callThreshold = isInPosition ? 0.15 : 0.25;

    // Steal attempt from late position
    if (isPreflop && isInPosition && gameState.currentBet === gameState.blinds?.big) {
      if (Math.random() < stealFrequency && validActions.includes('raise')) {
        const raiseAmount = Math.min(gameState.currentBet * 3, stackSize);
        return { action: 'raise', amount: Math.floor(raiseAmount) };
      }
    }

    if (handStrength >= raiseThreshold || Math.random() < bluffFrequency) {
      if (validActions.includes('raise')) {
        const baseBet = gameState.currentBet + gameState.minimumRaise + (potSize || 100) * 0.5;
        const raiseAmount = PositionStrategy.adjustBetSizeForPosition(
          Math.min(baseBet, stackSize),
          positionType
        );
        return { action: 'raise', amount: Math.floor(raiseAmount) };
      }
      if (validActions.includes('bet')) {
        const baseBet = Math.max((potSize || 100) * 0.6, gameState.blinds?.big || 20);
        const betAmount = PositionStrategy.adjustBetSizeForPosition(
          Math.min(baseBet, stackSize),
          positionType
        );
        return { action: 'bet', amount: Math.floor(betAmount) };
      }
    }

    if (handStrength >= callThreshold) {
      if (validActions.includes('call') && callAmount <= (potSize || 100) * 0.5) {
        return { action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { action: 'check', amount: 0 };
      }
    }

    if (validActions.includes('check')) {
      return { action: 'check', amount: 0 };
    }

    return { action: 'fold', amount: 0 };
  }

  static getTightPassiveAction(handStrength, validActions, gameState, player, context = {}) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot || 0;
    const stackSize = player.chips;
    const { isInPosition = false } = context;

    // TP plays fewer hands and prefers calling to raising
    // Position adjustments are smaller for passive players
    const betThreshold = isInPosition ? 0.75 : 0.8;
    const callThreshold = isInPosition ? 0.45 : 0.5;
    const callPotRatio = isInPosition ? 0.25 : 0.2;

    if (handStrength >= betThreshold) {
      if (validActions.includes('bet')) {
        // TP bets small with strong hands
        const betAmount = Math.min(
          Math.max((potSize || 100) * 0.3, gameState.blinds?.big || 20),
          stackSize
        );
        return { action: 'bet', amount: Math.floor(betAmount) };
      }
      if (validActions.includes('call')) {
        return { action: 'call', amount: callAmount };
      }
    }

    if (handStrength >= callThreshold) {
      if (validActions.includes('call') && callAmount <= (potSize || 100) * callPotRatio) {
        return { action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { action: 'check', amount: 0 };
      }
    }

    if (validActions.includes('check')) {
      return { action: 'check', amount: 0 };
    }

    return { action: 'fold', amount: 0 };
  }

  static getLoosePassiveAction(handStrength, validActions, gameState, player, context = {}) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot || 0;
    const stackSize = player.chips;
    const { isInPosition = false } = context;

    // LP plays many hands but rarely raises - the classic "calling station"
    // Position slightly affects their calling range
    const betThreshold = isInPosition ? 0.65 : 0.7;
    const callThreshold = isInPosition ? 0.15 : 0.2;
    const callPotRatio = isInPosition ? 0.5 : 0.4;

    if (handStrength >= betThreshold) {
      if (validActions.includes('bet')) {
        // LP bets small even with strong hands
        const betAmount = Math.min(
          Math.max((potSize || 100) * 0.25, gameState.blinds?.big || 20),
          stackSize
        );
        return { action: 'bet', amount: Math.floor(betAmount) };
      }
    }

    // LP has wide calling range - they like to see flops and showdowns
    if (handStrength >= callThreshold) {
      if (validActions.includes('call') && callAmount <= (potSize || 100) * callPotRatio) {
        return { action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { action: 'check', amount: 0 };
      }
    }

    if (validActions.includes('check')) {
      return { action: 'check', amount: 0 };
    }

    return { action: 'fold', amount: 0 };
  }

  static getDefaultAction(validActions, gameState, player) {
    if (validActions.includes('check')) {
      return { action: 'check', amount: 0 };
    }

    const callAmount = gameState.currentBet - player.currentBet;
    const _potOdds = gameState.totalPot / callAmount;

    if (validActions.includes('call') && _potOdds > 3) {
      return { action: 'call', amount: callAmount };
    }

    return { action: 'fold', amount: 0 };
  }
}

export default AIPlayer;
