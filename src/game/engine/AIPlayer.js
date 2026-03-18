import { AI_PLAYER_TYPES, GAME_PHASES } from '../../constants/game-constants';
import RandomSource from '../utils/RandomSource';

import PositionStrategy from './strategies/PositionStrategy';

// Preflop hand strength evaluations
const HAND_STRENGTH = {
  PREMIUM_PAIR: 0.9,
  MEDIUM_PAIR: 0.7,
  LOW_PAIR: 0.5,
  ACE_BROADWAY: 0.8,
  ACE_MIDDLE: 0.6,
  KING_BROADWAY: 0.6,
  SUITED_CONNECTOR: 0.4,
  CONNECTED: 0.3,
  JUNK: 0.2,
  NO_COMMUNITY: 0.3,
};

// Postflop hand strength evaluations
const POSTFLOP_STRENGTH = {
  SET: 0.9,
  TWO_PAIR: 0.75,
  TOP_PAIR: 0.65,
  COMBO_DRAW: 0.55,
  SINGLE_DRAW: 0.45,
  NOTHING: 0.25,
};

// Tight-Aggressive thresholds
const TAG = {
  RAISE_IP: 0.6,
  RAISE_OOP: 0.7,
  CALL_IP: 0.35,
  CALL_OOP: 0.4,
  CALL_POT_RATIO_IP: 0.4,
  CALL_POT_RATIO_OOP: 0.3,
  RAISE_POT_MULT: 0.75,
  BET_POT_MULT: 0.75,
};

// Loose-Aggressive thresholds
const LAG = {
  RAISE_IP: 0.35,
  RAISE_OOP: 0.5,
  CALL_IP: 0.15,
  CALL_OOP: 0.25,
  BASE_BLUFF: 0.3,
  BLUFF_IP_MULT: 1.4,
  STEAL_MULT: 3,
  RAISE_POT_MULT: 0.5,
  BET_POT_MULT: 0.6,
  CALL_POT_RATIO: 0.5,
};

// Tight-Passive thresholds
const TP = {
  BET_IP: 0.75,
  BET_OOP: 0.8,
  CALL_IP: 0.45,
  CALL_OOP: 0.5,
  CALL_POT_RATIO_IP: 0.25,
  CALL_POT_RATIO_OOP: 0.2,
  BET_POT_MULT: 0.3,
};

// Loose-Passive thresholds
const LP = {
  BET_IP: 0.65,
  BET_OOP: 0.7,
  CALL_IP: 0.15,
  CALL_OOP: 0.2,
  CALL_POT_RATIO_IP: 0.5,
  CALL_POT_RATIO_OOP: 0.4,
  BET_POT_MULT: 0.25,
};

// Default action pot odds threshold
const DEFAULT_POT_ODDS_THRESHOLD = 3;

class AIPlayer {
  static getAction(player, gameState, validActions, gameEngine, rng = RandomSource.default) {
    // Store rng for use in strategy methods
    AIPlayer._rng = rng;
    const { aiType } = player;

    const holeCards = gameEngine.getPlayerCards(player.id);
    const communityCards = gameEngine.getCommunityCards();
    const isPreflop = gameState.phase === GAME_PHASES.PREFLOP;

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

    if (phase === GAME_PHASES.PREFLOP) {
      if (isPair) {
        if (highCard >= 12) return HAND_STRENGTH.PREMIUM_PAIR;
        if (highCard >= 9) return HAND_STRENGTH.MEDIUM_PAIR;
        return HAND_STRENGTH.LOW_PAIR;
      }

      if (highCard === 14) {
        if (lowCard >= 11) return HAND_STRENGTH.ACE_BROADWAY;
        if (lowCard >= 9) return HAND_STRENGTH.ACE_MIDDLE;
      }

      if (highCard === 13 && lowCard >= 11) return HAND_STRENGTH.KING_BROADWAY;

      if (isSuited && gap <= 4) return HAND_STRENGTH.SUITED_CONNECTOR;

      if (gap <= 2 && highCard >= 10) return HAND_STRENGTH.CONNECTED;

      return HAND_STRENGTH.JUNK;
    }

    return this.calculatePostFlopStrength(holeCards, communityCards);
  }

  static calculatePostFlopStrength(holeCards, communityCards) {
    if (!holeCards || holeCards.length < 2 || !communityCards) return 0;
    if (communityCards.length === 0) return HAND_STRENGTH.NO_COMMUNITY;

    const allCards = [...holeCards, ...communityCards];
    const hasTopPair = this.hasTopPair(holeCards, communityCards);
    const hasTwoPair = this.hasTwoPair(allCards);
    const hasSet = this.hasSet(holeCards, communityCards);
    const hasFlushDraw = this.hasFlushDraw(allCards);
    const hasStraightDraw = this.hasStraightDraw(allCards);

    if (hasSet) return POSTFLOP_STRENGTH.SET;
    if (hasTwoPair) return POSTFLOP_STRENGTH.TWO_PAIR;
    if (hasTopPair) return POSTFLOP_STRENGTH.TOP_PAIR;
    if (hasFlushDraw && hasStraightDraw) return POSTFLOP_STRENGTH.COMBO_DRAW;
    if (hasFlushDraw || hasStraightDraw) return POSTFLOP_STRENGTH.SINGLE_DRAW;

    return POSTFLOP_STRENGTH.NOTHING;
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
    const raiseThreshold = isInPosition ? TAG.RAISE_IP : TAG.RAISE_OOP;
    const callThreshold = isInPosition ? TAG.CALL_IP : TAG.CALL_OOP;
    const callPotRatio = isInPosition ? TAG.CALL_POT_RATIO_IP : TAG.CALL_POT_RATIO_OOP;

    // Strong hand: Raise aggressively
    if (handStrength >= raiseThreshold) {
      if (validActions.includes('raise')) {
        const baseBet =
          gameState.currentBet + gameState.minimumRaise + (potSize || 100) * TAG.RAISE_POT_MULT;
        const raiseAmount = PositionStrategy.adjustBetSizeForPosition(
          Math.min(baseBet, stackSize),
          positionType
        );
        return { action: 'raise', amount: Math.floor(raiseAmount) };
      }
      if (validActions.includes('bet')) {
        const baseBet = Math.max((potSize || 100) * TAG.BET_POT_MULT, gameState.blinds?.big || 20);
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
    const bluffFrequency = isInPosition ? LAG.BASE_BLUFF * LAG.BLUFF_IP_MULT : LAG.BASE_BLUFF;
    const stealFrequency = PositionStrategy.getStealFrequency(positionType);

    // Position-adjusted thresholds - LAG is looser from late position
    const raiseThreshold = isInPosition ? LAG.RAISE_IP : LAG.RAISE_OOP;
    const callThreshold = isInPosition ? LAG.CALL_IP : LAG.CALL_OOP;

    // Steal attempt from late position
    if (isPreflop && isInPosition && gameState.currentBet === gameState.blinds?.big) {
      if (AIPlayer._rng.random() < stealFrequency && validActions.includes('raise')) {
        const raiseAmount = Math.min(gameState.currentBet * LAG.STEAL_MULT, stackSize);
        return { action: 'raise', amount: Math.floor(raiseAmount) };
      }
    }

    if (handStrength >= raiseThreshold || AIPlayer._rng.random() < bluffFrequency) {
      if (validActions.includes('raise')) {
        const baseBet =
          gameState.currentBet + gameState.minimumRaise + (potSize || 100) * LAG.RAISE_POT_MULT;
        const raiseAmount = PositionStrategy.adjustBetSizeForPosition(
          Math.min(baseBet, stackSize),
          positionType
        );
        return { action: 'raise', amount: Math.floor(raiseAmount) };
      }
      if (validActions.includes('bet')) {
        const baseBet = Math.max((potSize || 100) * LAG.BET_POT_MULT, gameState.blinds?.big || 20);
        const betAmount = PositionStrategy.adjustBetSizeForPosition(
          Math.min(baseBet, stackSize),
          positionType
        );
        return { action: 'bet', amount: Math.floor(betAmount) };
      }
    }

    if (handStrength >= callThreshold) {
      if (validActions.includes('call') && callAmount <= (potSize || 100) * LAG.CALL_POT_RATIO) {
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
    const betThreshold = isInPosition ? TP.BET_IP : TP.BET_OOP;
    const callThreshold = isInPosition ? TP.CALL_IP : TP.CALL_OOP;
    const callPotRatio = isInPosition ? TP.CALL_POT_RATIO_IP : TP.CALL_POT_RATIO_OOP;

    if (handStrength >= betThreshold) {
      if (validActions.includes('bet')) {
        // TP bets small with strong hands
        const betAmount = Math.min(
          Math.max((potSize || 100) * TP.BET_POT_MULT, gameState.blinds?.big || 20),
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
    const betThreshold = isInPosition ? LP.BET_IP : LP.BET_OOP;
    const callThreshold = isInPosition ? LP.CALL_IP : LP.CALL_OOP;
    const callPotRatio = isInPosition ? LP.CALL_POT_RATIO_IP : LP.CALL_POT_RATIO_OOP;

    if (handStrength >= betThreshold) {
      if (validActions.includes('bet')) {
        // LP bets small even with strong hands
        const betAmount = Math.min(
          Math.max((potSize || 100) * LP.BET_POT_MULT, gameState.blinds?.big || 20),
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

    if (callAmount <= 0) {
      if (validActions.includes('check')) {
        return { action: 'check', amount: 0 };
      }
      return { action: 'fold', amount: 0 };
    }

    const potOdds = (gameState.totalPot || 0) / callAmount;

    if (validActions.includes('call') && potOdds > DEFAULT_POT_ODDS_THRESHOLD) {
      return { action: 'call', amount: callAmount };
    }

    return { action: 'fold', amount: 0 };
  }
}

// Default RNG for strategy methods (set per-call in getAction)
AIPlayer._rng = RandomSource.default;

export default AIPlayer;
