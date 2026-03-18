import { PLAYER_ACTIONS, GAME_PHASES, PLAYER_STATUS } from '../../constants/game-constants';

class BettingLogic {
  static validateAction(gameState, player, _action, amount = 0) {
    if (!player.canAct()) {
      return { valid: false, reason: 'Player cannot act' };
    }

    const callAmount = gameState.currentBet - player.currentBet;

    switch (_action) {
      case PLAYER_ACTIONS.FOLD:
        return { valid: true };

      case PLAYER_ACTIONS.CHECK:
        if (callAmount > 0) {
          return {
            valid: false,
            reason: 'Cannot check when there is a bet to call',
          };
        }
        return { valid: true };

      case PLAYER_ACTIONS.CALL:
        if (callAmount === 0) {
          return { valid: false, reason: 'Nothing to call' };
        }
        // Allow calling even if player doesn't have enough chips (all-in for less)
        return { valid: true, amount: Math.min(callAmount, player.chips) };

      case PLAYER_ACTIONS.BET:
        if (gameState.currentBet > 0) {
          return {
            valid: false,
            reason: 'Cannot bet when there is already a bet',
          };
        }
        if (amount < gameState.blinds.big) {
          return { valid: false, reason: 'Bet must be at least the big blind' };
        }
        if (amount > player.chips) {
          return { valid: false, reason: 'Not enough chips' };
        }
        return { valid: true, amount };

      case PLAYER_ACTIONS.RAISE: {
        if (gameState.currentBet === 0) {
          return { valid: false, reason: 'Cannot raise when there is no bet' };
        }
        const minRaise = gameState.currentBet + gameState.minimumRaise;
        if (amount < minRaise && amount < player.chips) {
          return { valid: false, reason: `Raise must be at least ${minRaise}` };
        }
        if (amount > player.chips) {
          return { valid: false, reason: 'Not enough chips' };
        }
        return { valid: true, amount: Math.min(amount, player.chips) };
      }

      case PLAYER_ACTIONS.ALL_IN:
        return { valid: true, amount: player.chips };

      default:
        return { valid: false, reason: 'Invalid _action' };
    }
  }

  static getValidActions(gameState, player) {
    if (!player.canAct()) {
      return [];
    }

    const validActions = [];
    const callAmount = gameState.currentBet - player.currentBet;

    validActions.push(PLAYER_ACTIONS.FOLD);

    if (callAmount === 0) {
      validActions.push(PLAYER_ACTIONS.CHECK);

      if (player.chips >= gameState.blinds.big) {
        validActions.push(PLAYER_ACTIONS.BET);
      }
    } else {
      if (player.chips >= callAmount) {
        validActions.push(PLAYER_ACTIONS.CALL);
      }

      const minRaise = gameState.currentBet + gameState.minimumRaise;
      if (player.chips >= minRaise) {
        validActions.push(PLAYER_ACTIONS.RAISE);
      }
    }

    if (
      player.chips > 0 &&
      (callAmount > 0 || gameState.currentBet === 0) &&
      !validActions.includes(PLAYER_ACTIONS.CALL) &&
      !validActions.includes(PLAYER_ACTIONS.RAISE)
    ) {
      validActions.push(PLAYER_ACTIONS.ALL_IN);
    }

    return validActions;
  }

  /**
   * Computes the result of an action without mutating any state.
   * Returns a result object describing what mutations should be applied.
   */
  static computeActionResult(gameState, player, _action, amount = 0) {
    const validation = this.validateAction(gameState, player, _action, amount);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const result = {
      action: _action,
      amount: validation.amount || 0,
      mutations: {
        potDelta: 0,
        newCurrentBet: gameState.currentBet,
        newMinRaise: gameState.minimumRaise,
        newLastRaiser: gameState.lastRaiserIndex,
        playerAction: _action,
        playerStatus: null,
      },
      historyEntry: {
        playerId: player.id,
        playerName: player.name,
        _action,
        amount: validation.amount || 0,
        phase: gameState.phase,
        handNumber: gameState.handNumber,
      },
    };

    switch (_action) {
      case PLAYER_ACTIONS.FOLD:
        result.mutations.playerStatus = PLAYER_STATUS.FOLDED;
        break;

      case PLAYER_ACTIONS.CHECK:
        result.mutations.playerStatus = PLAYER_STATUS.CHECKED;
        break;

      case PLAYER_ACTIONS.CALL: {
        const callAmount = validation.amount || gameState.currentBet - player.currentBet;
        const actualCall = Math.min(callAmount, player.chips);
        result.amount = actualCall;
        result.mutations.potDelta = actualCall;
        result.mutations.playerStatus =
          player.chips <= actualCall ? PLAYER_STATUS.ALL_IN : PLAYER_STATUS.CALLED;
        break;
      }

      case PLAYER_ACTIONS.BET:
        result.mutations.potDelta = validation.amount;
        result.mutations.newCurrentBet = validation.amount;
        result.mutations.newMinRaise = validation.amount;
        result.mutations.newLastRaiser = player.position;
        break;

      case PLAYER_ACTIONS.RAISE: {
        const raiseAmount = validation.amount;
        const actualRaise = raiseAmount - player.currentBet;
        result.mutations.potDelta = actualRaise;
        result.mutations.newMinRaise = raiseAmount - gameState.currentBet;
        result.mutations.newCurrentBet = raiseAmount;
        result.mutations.newLastRaiser = player.position;
        break;
      }

      case PLAYER_ACTIONS.ALL_IN: {
        const allInAmount = player.chips;
        const totalBetTarget = player.currentBet + allInAmount;
        result.amount = allInAmount;
        result.mutations.potDelta = allInAmount;
        result.mutations.playerStatus = PLAYER_STATUS.ALL_IN;
        result.mutations.playerAction = PLAYER_ACTIONS.ALL_IN;

        if (gameState.currentBet === 0) {
          if (allInAmount >= gameState.blinds.big) {
            result.mutations.newCurrentBet = allInAmount;
            result.mutations.newMinRaise = allInAmount;
            result.mutations.newLastRaiser = player.position;
          }
        } else if (totalBetTarget > gameState.currentBet) {
          if (totalBetTarget >= gameState.currentBet + gameState.minimumRaise) {
            result.mutations.newMinRaise = totalBetTarget - gameState.currentBet;
            result.mutations.newCurrentBet = totalBetTarget;
            result.mutations.newLastRaiser = player.position;
          }
        }
        break;
      }
    }

    return result;
  }

  /**
   * Applies a computed action result to the game state and player.
   */
  static applyActionResult(gameState, player, result) {
    switch (result.action) {
      case PLAYER_ACTIONS.FOLD:
        player.fold();
        break;

      case PLAYER_ACTIONS.CHECK:
        player.check();
        break;

      case PLAYER_ACTIONS.CALL:
        player.call(result.amount);
        gameState.addToPot(result.amount);
        break;

      case PLAYER_ACTIONS.BET:
        player.bet(result.mutations.newCurrentBet);
        gameState.currentBet = result.mutations.newCurrentBet;
        gameState.minimumRaise = result.mutations.newMinRaise;
        gameState.addToPot(result.mutations.potDelta);
        gameState.lastRaiserIndex = result.mutations.newLastRaiser;
        break;

      case PLAYER_ACTIONS.RAISE: {
        const raiseTarget = result.mutations.newCurrentBet;
        player.raise(raiseTarget);
        gameState.minimumRaise = result.mutations.newMinRaise;
        gameState.currentBet = result.mutations.newCurrentBet;
        gameState.addToPot(result.mutations.potDelta);
        gameState.lastRaiserIndex = result.mutations.newLastRaiser;
        break;
      }

      case PLAYER_ACTIONS.ALL_IN: {
        const allInAmount = result.amount;
        const totalBetTarget = player.currentBet + allInAmount;

        if (gameState.currentBet === 0) {
          player.bet(allInAmount);
        } else if (totalBetTarget > gameState.currentBet) {
          player.raise(totalBetTarget);
        } else {
          player.call(allInAmount);
        }

        player.status = PLAYER_STATUS.ALL_IN;
        player.lastAction = PLAYER_ACTIONS.ALL_IN;
        gameState.addToPot(allInAmount);

        if (result.mutations.newCurrentBet !== gameState.currentBet) {
          gameState.currentBet = result.mutations.newCurrentBet;
        }
        if (result.mutations.newMinRaise !== gameState.minimumRaise) {
          gameState.minimumRaise = result.mutations.newMinRaise;
        }
        if (result.mutations.newLastRaiser !== gameState.lastRaiserIndex) {
          gameState.lastRaiserIndex = result.mutations.newLastRaiser;
        }
        break;
      }
    }

    gameState.handHistory.push({
      ...result.historyEntry,
      potAfter: gameState.getTotalPot(),
      timestamp: Date.now(),
    });
  }

  /**
   * Validates, computes, and applies an action in one call. Backward compatible.
   */
  static executeAction(gameState, player, _action, amount = 0) {
    const result = this.computeActionResult(gameState, player, _action, amount);
    this.applyActionResult(gameState, player, result);
  }

  static isBettingRoundComplete(gameState) {
    const activePlayers = gameState.players.filter((p) => p.canAct());

    if (activePlayers.length <= 1) {
      return true;
    }

    // Check if all active players have acted
    const allPlayersActed = activePlayers.every((p) => p.lastAction !== null);

    // Check if all active players have matched the current bet
    const allBetsMatched = activePlayers.every((p) => p.currentBet === gameState.currentBet);

    // Special case: Big blind option in preflop
    if (
      gameState.phase === GAME_PHASES.PREFLOP &&
      gameState.lastRaiserIndex === null &&
      gameState.currentBet === gameState.blinds.big
    ) {
      const bigBlindPosition = gameState.getBigBlindPosition();
      const bigBlindPlayer = gameState.getPlayerByPosition(bigBlindPosition);

      // If big blind hasn't acted yet and all others have called/folded, betting round is not complete
      if (bigBlindPlayer && bigBlindPlayer.canAct() && !bigBlindPlayer.lastAction) {
        return false;
      }
    }

    // If there was a raise, check if all players have acted since the raise
    if (gameState.lastRaiserIndex !== null) {
      for (const player of activePlayers) {
        if (player.position === gameState.lastRaiserIndex) {
          continue; // The raiser doesn't need to act again
        }

        if (!this.hasActedSinceLastRaise(gameState, player)) {
          return false;
        }
      }
    }

    // Betting round is complete if all players have acted and matched the bet
    return allPlayersActed && allBetsMatched;
  }

  static hasActedSinceLastRaise(gameState, player) {
    const history = gameState.handHistory;
    // Find last raise index (compatible with all browsers)
    let lastRaiseIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      const actionType = history[i]._action || history[i].action;
      if (actionType === PLAYER_ACTIONS.RAISE || actionType === PLAYER_ACTIONS.BET) {
        lastRaiseIndex = i;
        break;
      }
    }

    if (lastRaiseIndex === -1) return true;

    return history.slice(lastRaiseIndex + 1).some((h) => h.playerId === player.id);
  }

  static calculateMinBet(gameState) {
    return gameState.blinds.big;
  }

  static calculateMinRaise(gameState) {
    return gameState.currentBet + gameState.minimumRaise;
  }

  static calculatePotOdds(gameState, player) {
    const callAmount = gameState.currentBet - player.currentBet;
    if (callAmount <= 0) return 100;

    const potAfterCall = gameState.getTotalPot() + callAmount;
    return (callAmount / potAfterCall) * 100;
  }

  static getBettingRoundSummary(gameState) {
    const activePlayers = gameState.getPlayersInHand();
    const _pot = gameState.getTotalPot();
    const toCall = gameState.currentBet;

    return {
      _pot,
      toCall,
      playersRemaining: activePlayers.length,
      currentPlayer: gameState.players[gameState.currentPlayerIndex]?.name || 'None',
      phase: gameState.phase,
    };
  }
}

export default BettingLogic;
