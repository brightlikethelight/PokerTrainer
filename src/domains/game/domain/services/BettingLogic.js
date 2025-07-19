import { PLAYER_ACTIONS } from '../../../../constants/game-constants';

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

  static executeAction(gameState, player, _action, amount = 0) {
    const validation = this.validateAction(gameState, player, _action, amount);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const previousBet = player.currentBet;

    switch (_action) {
      case PLAYER_ACTIONS.FOLD:
        player.fold();
        break;

      case PLAYER_ACTIONS.CHECK:
        player.check();
        break;

      case PLAYER_ACTIONS.CALL: {
        const callAmount = validation.amount || gameState.currentBet - player.currentBet;
        const actualCall = Math.min(callAmount, player.chips);
        player.call(actualCall);
        gameState.potObject.main += actualCall;
        break;
      }

      case PLAYER_ACTIONS.BET:
        player.bet(validation.amount);
        gameState.currentBet = validation.amount;
        gameState.minimumRaise = validation.amount;
        gameState.potObject.main += validation.amount;
        gameState.lastRaiserIndex = player.position;
        break;

      case PLAYER_ACTIONS.RAISE: {
        const raiseAmount = validation.amount;
        const actualRaise = raiseAmount - player.currentBet;
        player.raise(raiseAmount); // Pass total target amount, not additional

        gameState.minimumRaise = raiseAmount - gameState.currentBet;
        gameState.currentBet = raiseAmount;
        gameState.potObject.main += actualRaise;
        gameState.lastRaiserIndex = player.position;
        break;
      }

      case PLAYER_ACTIONS.ALL_IN: {
        const allInAmount = player.chips;

        if (gameState.currentBet === 0) {
          player.bet(allInAmount);
          if (allInAmount >= gameState.blinds.big) {
            gameState.currentBet = allInAmount;
            gameState.minimumRaise = allInAmount;
            gameState.lastRaiserIndex = player.position;
          }
        } else if (player.currentBet + allInAmount > gameState.currentBet) {
          player.raise(allInAmount);
          const totalBet = previousBet + allInAmount;

          if (totalBet >= gameState.currentBet + gameState.minimumRaise) {
            gameState.minimumRaise = totalBet - gameState.currentBet;
            gameState.currentBet = totalBet;
            gameState.lastRaiserIndex = player.position;
          }
        } else {
          player.call(allInAmount);
        }

        // Ensure all-in players have correct status
        player.status = 'all-in';
        player.lastAction = 'all-in';
        gameState.potObject.main += allInAmount;
        break;
      }
    }

    gameState.handHistory.push({
      playerId: player.id,
      playerName: player.name,
      _action,
      amount: validation.amount || 0,
      potAfter: gameState.getTotalPot(),
      phase: gameState.phase,
      handNumber: gameState.handNumber,
      timestamp: Date.now(),
    });
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
      gameState.phase === 'preflop' &&
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
    // Find last raise _index (compatible with all browsers)
    let lastRaiseIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].action === PLAYER_ACTIONS.RAISE || history[i].action === PLAYER_ACTIONS.BET) {
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
