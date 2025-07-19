import { AI_PLAYER_TYPES } from '../../../../constants/game-constants';

class AIPlayer {
  static getAction(player, gameState, validActions, gameEngine) {
    const { aiType } = player;

    const holeCards = gameEngine.getPlayerCards(player.id);
    const communityCards = gameEngine.getCommunityCards();
    const handStrength = this.evaluateHandStrength(holeCards, communityCards, gameState.phase);

    switch (aiType) {
      case AI_PLAYER_TYPES.TAG:
        return this.getTightAggressiveAction(handStrength, validActions, gameState, player);
      case AI_PLAYER_TYPES.LAG:
        return this.getLooseAggressiveAction(handStrength, validActions, gameState, player);
      case AI_PLAYER_TYPES.TP:
        return this.getTightPassiveAction(handStrength, validActions, gameState, player);
      case AI_PLAYER_TYPES.LP:
        return this.getLoosePassiveAction(handStrength, validActions, gameState, player);
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

  static getTightAggressiveAction(handStrength, validActions, gameState, player) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot;
    const stackSize = player.chips;

    if (handStrength >= 0.7) {
      if (validActions.includes('raise')) {
        const raiseAmount = Math.min(
          gameState.currentBet + gameState.minimumRaise + potSize * 0.75,
          stackSize
        );
        return { _action: 'raise', amount: Math.floor(raiseAmount) };
      }
      if (validActions.includes('bet')) {
        const betAmount = Math.min(potSize * 0.75, stackSize);
        return { _action: 'bet', amount: Math.floor(betAmount) };
      }
    }

    if (handStrength >= 0.4) {
      if (validActions.includes('call') && callAmount <= potSize * 0.3) {
        return { _action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { _action: 'check', amount: 0 };
      }
    }

    if (validActions.includes('check')) {
      return { _action: 'check', amount: 0 };
    }

    return { _action: 'fold', amount: 0 };
  }

  static getLooseAggressiveAction(handStrength, validActions, gameState, player) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot;
    const stackSize = player.chips;
    const bluffFrequency = 0.3;

    if (handStrength >= 0.5 || Math.random() < bluffFrequency) {
      if (validActions.includes('raise')) {
        const raiseAmount = Math.min(
          gameState.currentBet + gameState.minimumRaise + potSize * 0.5,
          stackSize
        );
        return { _action: 'raise', amount: Math.floor(raiseAmount) };
      }
      if (validActions.includes('bet')) {
        const betAmount = Math.min(potSize * 0.6, stackSize);
        return { _action: 'bet', amount: Math.floor(betAmount) };
      }
    }

    if (handStrength >= 0.25) {
      if (validActions.includes('call') && callAmount <= potSize * 0.5) {
        return { _action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { _action: 'check', amount: 0 };
      }
    }

    if (validActions.includes('check')) {
      return { _action: 'check', amount: 0 };
    }

    return { _action: 'fold', amount: 0 };
  }

  static getTightPassiveAction(handStrength, validActions, gameState, player) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot;
    const stackSize = player.chips;

    if (handStrength >= 0.8) {
      if (validActions.includes('bet')) {
        const betAmount = Math.min(potSize * 0.3, stackSize);
        return { _action: 'bet', amount: Math.floor(betAmount) };
      }
      if (validActions.includes('call')) {
        return { _action: 'call', amount: callAmount };
      }
    }

    if (handStrength >= 0.5) {
      if (validActions.includes('call') && callAmount <= potSize * 0.2) {
        return { _action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { _action: 'check', amount: 0 };
      }
    }

    if (validActions.includes('check')) {
      return { _action: 'check', amount: 0 };
    }

    return { _action: 'fold', amount: 0 };
  }

  static getLoosePassiveAction(handStrength, validActions, gameState, player) {
    const callAmount = gameState.currentBet - player.currentBet;
    const potSize = gameState.totalPot;
    const stackSize = player.chips;

    if (handStrength >= 0.7) {
      if (validActions.includes('bet')) {
        const betAmount = Math.min(potSize * 0.25, stackSize);
        return { _action: 'bet', amount: Math.floor(betAmount) };
      }
    }

    if (handStrength >= 0.2) {
      if (validActions.includes('call') && callAmount <= potSize * 0.4) {
        return { _action: 'call', amount: callAmount };
      }
      if (validActions.includes('check')) {
        return { _action: 'check', amount: 0 };
      }
    }

    if (validActions.includes('check')) {
      return { _action: 'check', amount: 0 };
    }

    return { _action: 'fold', amount: 0 };
  }

  static getDefaultAction(validActions, gameState, player) {
    if (validActions.includes('check')) {
      return { _action: 'check', amount: 0 };
    }

    const callAmount = gameState.currentBet - player.currentBet;
    const _potOdds = gameState.totalPot / callAmount;

    if (validActions.includes('call') && _potOdds > 3) {
      return { action: 'call', amount: callAmount };
    }

    return { _action: 'fold', amount: 0 };
  }
}

export default AIPlayer;
