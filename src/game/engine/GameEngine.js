import { GAME_PHASES, PLAYER_STATUS } from '../../constants/game-constants';
import Deck from '../entities/Deck';
import GameState from '../entities/GameState';
import HandEvaluator from '../utils/HandEvaluator';

import BettingLogic from './BettingLogic';

/**
 * Core poker game engine that orchestrates Texas Hold'em gameplay.
 * Manages game state, player actions, betting rounds, and hand progression.
 *
 * @class GameEngine
 * @example
 * const gameEngine = new GameEngine();
 * gameEngine.addPlayer(new Player('player1', 'Alice', 1000, 0));
 * gameEngine.addPlayer(new Player('player2', 'Bob', 1000, 1));
 * gameEngine.setBlinds(10, 20);
 * gameEngine.startNewHand();
 */
class GameEngine {
  /**
   * Creates a new GameEngine instance.
   * Initializes the game state, deck, and event callbacks.
   *
   * @constructor
   */
  constructor() {
    this.gameState = new GameState();
    this.deck = new Deck();
    this.gameState.deck = this.deck;
    this._isRestarting = false;
    this._isInitialized = false;
    this.callbacks = {
      onStateChange: null,
      onHandComplete: null,
      onPlayerAction: null,
      onPhaseChange: null,
      onShowdown: null,
    };
  }

  /**
   * Sets a callback function for a specific game event.
   *
   * @param {string} event - The event name ('onStateChange', 'onHandComplete', 'onPlayerAction', 'onPhaseChange', 'onShowdown')
   * @param {Function} callback - The callback function to execute when the event occurs
   * @example
   * gameEngine.setCallback('onStateChange', (gameState) => {
   *   console.log('Game state updated:', gameState);
   * });
   */
  setCallback(event, callback) {
    if (Object.prototype.hasOwnProperty.call(this.callbacks, event)) {
      this.callbacks[event] = callback;
    }
  }

  /**
   * Adds a player to the game.
   *
   * @param {Player} player - The player object to add to the game
   * @throws {Error} If player is invalid or game is full
   * @example
   * const player = new Player('player1', 'Alice', 1000, 0);
   * gameEngine.addPlayer(player);
   */
  addPlayer(player) {
    this.gameState.addPlayer(player);
    this.notifyStateChange();
  }

  /**
   * Removes a player from the game.
   *
   * @param {string} playerId - The unique identifier of the player to remove
   * @example
   * gameEngine.removePlayer('player1');
   */
  removePlayer(playerId) {
    this.gameState.removePlayer(playerId);
    this.notifyStateChange();
  }

  /**
   * Starts a new poker hand.
   * Resets players, moves the dealer button, posts blinds, and deals hole cards.
   *
   * @throws {Error} If fewer than 2 players are available or deck has insufficient cards
   * @example
   * gameEngine.startNewHand();
   */
  startNewHand() {
    try {
      if (this._isRestarting) {
        return;
      }

      // Reset players for new hand first (sets status to ACTIVE)
      this.gameState.resetForNewHand();

      if (this.gameState.getActivePlayers().length < 2) {
        throw new Error('Need at least 2 players to start a hand');
      }

      this.gameState.moveButton();

      // Ensure deck is properly reset and has cards
      this.deck.reset();
      if (this.deck.cardsRemaining() < 20) {
        throw new Error('Deck has insufficient cards');
      }

      this.postBlinds();
      this.dealHoleCards();

      this.gameState.currentPlayerIndex = this.gameState.getUTGPosition();

      this.notifyStateChange();
      this.notifyPhaseChange();
    } catch (error) {
      this._isRestarting = false; // Reset the flag on error
      throw error; // Re-throw to be caught by ErrorBoundary
    }
  }

  postBlinds() {
    const smallBlindPosition = this.gameState.getSmallBlindPosition();
    const bigBlindPosition = this.gameState.getBigBlindPosition();

    const smallBlindPlayer = this.gameState.getPlayerByPosition(smallBlindPosition);
    const bigBlindPlayer = this.gameState.getPlayerByPosition(bigBlindPosition);

    if (smallBlindPlayer && smallBlindPlayer.chips > 0) {
      const sbAmount = Math.min(this.gameState.blinds.small, smallBlindPlayer.chips);
      smallBlindPlayer.placeBet(sbAmount);
      this.gameState._internalPot.main += sbAmount;

      this.gameState.addToHistory({
        playerId: smallBlindPlayer.id,
        playerName: smallBlindPlayer.name,
        _action: 'small-blind',
        amount: sbAmount,
      });
    }

    if (bigBlindPlayer && bigBlindPlayer.chips > 0) {
      const bbAmount = Math.min(this.gameState.blinds.big, bigBlindPlayer.chips);
      bigBlindPlayer.placeBet(bbAmount);
      this.gameState._internalPot.main += bbAmount;
      this.gameState.currentBet = bbAmount;

      this.gameState.addToHistory({
        playerId: bigBlindPlayer.id,
        playerName: bigBlindPlayer.name,
        _action: 'big-blind',
        amount: bbAmount,
      });
    }
  }

  dealHoleCards() {
    const activePlayers = this.gameState.getActivePlayers();

    for (let i = 0; i < 2; i++) {
      for (const player of activePlayers) {
        const card = this.deck.dealCard();
        player.holeCards.push(card);
      }
    }
  }

  dealCommunityCards(count) {
    const cards = this.deck.dealCards(count);
    this.gameState.communityCards.push(...cards);
    this.notifyStateChange();
  }

  /**
   * Executes a player action (fold, call, raise, check, all-in).
   * Validates the action, updates game state, and advances the game.
   *
   * @param {string} playerId - The unique identifier of the acting player
   * @param {string} _action - The action to execute ('fold', 'call', 'raise', 'check', 'all-in')
   * @param {number} [amount=0] - The amount for betting actions (required for 'raise')
   * @throws {Error} If player not found, cannot act, or action is invalid
   * @example
   * gameEngine.executePlayerAction('player1', 'raise', 100);
   * gameEngine.executePlayerAction('player2', 'fold');
   * gameEngine.executePlayerAction('player3', 'call');
   */
  executePlayerAction(playerId, _action, amount = 0) {
    try {
      // Enhanced validation
      if (!this.gameState || !this.gameState.players) {
        throw new Error('Game state not initialized');
      }

      const player = this.gameState.players.find((p) => p && p.id === playerId);
      if (!player) {
        // eslint-disable-next-line no-console
        console.error(
          'Available players:',
          this.gameState.players.map((p) => (p ? p.id : 'null'))
        );
        throw new Error(`Player with ID '${playerId}' not found in game`);
      }

      // Check player can act
      if (!player.canAct()) {
        throw new Error(`Player '${player.name}' cannot act (status: ${player.status})`);
      }

      // Enhanced turn validation
      const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
      if (!currentPlayer) {
        throw new Error(`No current player at index ${this.gameState.currentPlayerIndex}`);
      }

      if (currentPlayer.id !== playerId) {
        throw new Error(`Not ${player.name}'s turn (current: ${currentPlayer.name})`);
      }

      BettingLogic.executeAction(this.gameState, player, _action, amount);

      if (this.callbacks.onPlayerAction) {
        this.callbacks.onPlayerAction(player, _action, amount);
      }

      // Immediately check for single player wins after any action
      this.checkAndAdvanceGame();

      // Return success result
      return {
        success: true,
        action: _action,
        amount,
        playerId,
      };
    } catch (error) {
      // Enhanced error logging
      // eslint-disable-next-line no-console
      console.error('GameEngine executePlayerAction error:', {
        playerId,
        _action,
        amount,
        gameStateExists: !!this.gameState,
        playersCount: this.gameState?.players?.length || 0,
        currentPlayerIndex: this.gameState?.currentPlayerIndex,
        error: error.message,
      });

      // Return error result instead of throwing
      return {
        success: false,
        error: error.message,
        action: _action,
        amount,
        playerId,
      };
    }
  }

  checkAndAdvanceGame() {
    const activePlayers = this.gameState.getActivePlayers();

    if (activePlayers.length === 1) {
      this.handleSinglePlayerWin();
      return;
    }

    // Check if all players have folded except one
    const playersInHand = this.gameState.getPlayersInHand();
    if (playersInHand.length === 1) {
      this.handleSinglePlayerWin();
      return;
    }

    if (BettingLogic.isBettingRoundComplete(this.gameState)) {
      this.advanceToNextPhase();
    } else {
      this.moveToNextPlayer();
    }

    this.notifyStateChange();
  }

  moveToNextPlayer() {
    // Count players who can still act (ACTIVE status only)
    const activePlayersCount = this.gameState.players.filter(
      (p) => p.status === PLAYER_STATUS.ACTIVE
    ).length;

    // If only 0 or 1 active players remain, everyone else is all-in or folded
    // We should go directly to showdown
    if (activePlayersCount <= 1) {
      // Skip to showdown by advancing through all remaining phases
      while (this.gameState.phase !== GAME_PHASES.SHOWDOWN) {
        this.advanceToNextPhase();
      }
      return;
    }

    this.gameState.currentPlayerIndex = this.gameState.getNextActivePlayerIndex(
      this.gameState.currentPlayerIndex
    );

    if (this.gameState.currentPlayerIndex === -1) {
      this.advanceToNextPhase();
    }
  }

  advanceToNextPhase() {
    this.resetBettingRound();

    switch (this.gameState.phase) {
      case GAME_PHASES.PREFLOP:
        this.gameState.phase = GAME_PHASES.FLOP;
        this.dealCommunityCards(3);
        break;

      case GAME_PHASES.FLOP:
        this.gameState.phase = GAME_PHASES.TURN;
        this.dealCommunityCards(1);
        break;

      case GAME_PHASES.TURN:
        this.gameState.phase = GAME_PHASES.RIVER;
        this.dealCommunityCards(1);
        break;

      case GAME_PHASES.RIVER:
        this.handleShowdown();
        return;
    }

    const dealerPosition = this.gameState.dealerPosition;
    this.gameState.currentPlayerIndex = this.gameState.getNextActivePlayerIndex(dealerPosition);

    this.notifyPhaseChange();
    this.notifyStateChange();
  }

  resetBettingRound() {
    this.gameState.currentBet = 0;
    this.gameState.minimumRaise = this.gameState.blinds.big;
    this.gameState.lastRaiserIndex = null;

    this.gameState.players.forEach((player) => {
      player._currentBet = 0;
      player.lastAction = null;
    });
  }

  handleSinglePlayerWin() {
    const playersInHand = this.gameState.getPlayersInHand();
    if (playersInHand.length !== 1) {
      // Invalid state - multiple players in hand
      return;
    }

    const winner = playersInHand[0];
    this.gameState.calculateSidePots();

    const totalPot = this.gameState.getTotalPot();
    winner.winPot(totalPot);

    this.gameState.winners = [
      {
        player: winner,
        amount: totalPot,
        handDescription: 'Won by default (others folded)',
      },
    ];

    // eslint-disable-next-line no-console
    // Winner determined by fold
    this.completeHand();
  }

  handleShowdown() {
    this.gameState.phase = GAME_PHASES.SHOWDOWN;
    this.gameState.calculateSidePots();

    const playerHands = this.gameState.getPlayersInHand().map((player) => ({
      player,
      cards: [...player.holeCards, ...this.gameState.communityCards],
    }));

    const mainPotWinners = HandEvaluator.findWinners(playerHands);
    const mainPotAmount = this.gameState._internalPot.main;
    const mainPotShare = Math.floor(mainPotAmount / mainPotWinners.length);

    this.gameState.winners = [];

    mainPotWinners.forEach(({ player, hand }) => {
      player.winPot(mainPotShare);
      this.gameState.winners.push({
        player,
        amount: mainPotShare,
        hand,
        handDescription: hand.description,
      });
    });

    for (const sidePot of this.gameState._internalPot.side) {
      const eligibleHands = playerHands.filter(({ player }) =>
        sidePot.eligiblePlayers.includes(player)
      );

      const sidePotWinners = HandEvaluator.findWinners(eligibleHands);
      const sidePotShare = Math.floor(sidePot.amount / sidePotWinners.length);

      sidePotWinners.forEach(({ player, hand }) => {
        player.winPot(sidePotShare);

        const existingWinner = this.gameState.winners.find((w) => w.player === player);
        if (existingWinner) {
          existingWinner.amount += sidePotShare;
        } else {
          this.gameState.winners.push({
            player,
            amount: sidePotShare,
            hand,
            handDescription: hand.description,
          });
        }
      });
    }

    if (this.callbacks.onShowdown) {
      this.callbacks.onShowdown(this.gameState.winners);
    }

    this.completeHand();
  }

  completeHand() {
    if (this.callbacks.onHandComplete) {
      this.callbacks.onHandComplete(this.gameState.winners);
    }

    // Store winners before resetting
    const winners = this.gameState.winners;

    // Reset phase to waiting after hand completion
    this.gameState.phase = 'waiting';
    this.notifyStateChange();

    // Only restart if we have enough players and aren't in an error state
    setTimeout(() => {
      try {
        if (this.gameState.getActivePlayers().length >= 2 && !this._isRestarting) {
          this._isRestarting = true;
          this.startNewHand();
          this._isRestarting = false;
        }
      } catch (error) {
        // Failed to restart hand - don't automatically retry
        this._isRestarting = false;
      }
    }, 5000);

    // Return the winners info
    return {
      winners,
    };
  }

  /**
   * Gets the list of valid actions for a specific player.
   *
   * @param {string} playerId - The unique identifier of the player
   * @returns {string[]} Array of valid action names ('fold', 'call', 'raise', 'check', 'all-in')
   * @example
   * const actions = gameEngine.getValidActions('player1');
   * // Returns: ['fold', 'call', 'raise']
   */
  getValidActions(playerId) {
    // Enhanced validation for getting valid actions
    if (!this.gameState || !this.gameState.players) {
      // eslint-disable-next-line no-console
      console.warn('getValidActions: No game state or players');
      return [];
    }

    const player = this.gameState.players.find((p) => p && p.id === playerId);
    if (!player) {
      // eslint-disable-next-line no-console
      console.warn(`getValidActions: Player '${playerId}' not found`);
      return [];
    }

    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) {
      // eslint-disable-next-line no-console
      console.warn('getValidActions: No current player');
      return [];
    }

    if (currentPlayer.id !== playerId) {
      // This is normal - player is not currently acting
      return [];
    }

    // Player can act - get valid actions from betting logic
    try {
      return BettingLogic.getValidActions(this.gameState, player);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('getValidActions: Error getting valid actions:', error);
      return [];
    }
  }

  /**
   * Gets the current serialized game state.
   * Returns a snapshot of the game state suitable for UI rendering.
   *
   * @returns {Object} Serialized game state object containing players, pot, cards, phase, etc.
   * @example
   * const state = gameEngine.getGameState();
   * console.log(`Current phase: ${state.phase}, Pot: ${state.pot.main}`);
   */
  getGameState() {
    return this.gameState.serialize();
  }

  notifyStateChange() {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.getGameState());
    }
  }

  notifyPhaseChange() {
    if (this.callbacks.onPhaseChange) {
      this.callbacks.onPhaseChange(this.gameState.phase);
    }
  }

  /**
   * Sets the blind amounts for the game.
   *
   * @param {number} small - The small blind amount
   * @param {number} big - The big blind amount
   * @example
   * gameEngine.setBlinds(10, 20); // Sets small blind to 10, big blind to 20
   */
  setBlinds(small, big) {
    this.gameState.blinds = { small, big };
    this.gameState.minimumRaise = big;
  }

  /**
   * Gets the hole cards for a specific player.
   *
   * @param {string} playerId - The unique identifier of the player
   * @returns {Card[]} Array of the player's hole cards (empty array if player not found)
   * @example
   * const cards = gameEngine.getPlayerCards('player1');
   * // Returns: [Card{rank: 'A', suit: 's'}, Card{rank: 'K', suit: 'h'}]
   */
  getPlayerCards(playerId) {
    const player = this.gameState.players.find((p) => p.id === playerId);
    return player ? player.holeCards : [];
  }

  /**
   * Gets the hole cards for all players in the game.
   *
   * @returns {Object[]} Array of objects containing playerId and cards
   * @example
   * const allCards = gameEngine.getAllPlayerCards();
   * // Returns: [{playerId: 'player1', cards: [Card, Card]}, ...]
   */
  getAllPlayerCards() {
    return this.gameState.players.map((player) => ({
      playerId: player.id,
      cards: player.holeCards,
    }));
  }

  /**
   * Gets a copy of the community cards currently on the board.
   *
   * @returns {Card[]} Array of community cards (0-5 cards depending on game phase)
   * @example
   * const board = gameEngine.getCommunityCards();
   * // Returns: [Card, Card, Card] on the flop
   */
  getCommunityCards() {
    return [...this.gameState.communityCards];
  }

  /**
   * Gets the player who is currently acting.
   *
   * @returns {Player|undefined} The current player object, or undefined if no current player
   * @example
   * const currentPlayer = gameEngine.getCurrentPlayer();
   * console.log(`${currentPlayer.name} is up to act`);
   */
  getCurrentPlayer() {
    // Enhanced safety checks for current player access
    if (!this.gameState || !this.gameState.players || this.gameState.players.length === 0) {
      return undefined;
    }

    const index = this.gameState.currentPlayerIndex;
    if (index < 0 || index >= this.gameState.players.length) {
      // eslint-disable-next-line no-console
      console.warn(
        `Invalid currentPlayerIndex: ${index}, players length: ${this.gameState.players.length}`
      );
      return undefined;
    }

    const player = this.gameState.players[index];
    if (!player) {
      // eslint-disable-next-line no-console
      console.warn(`No player found at index: ${index}`);
      return undefined;
    }

    return player;
  }

  /**
   * Calculates pot odds for a specific player's current situation.
   *
   * @param {string} playerId - The unique identifier of the player
   * @returns {number} Pot odds as a percentage (0-100), or 0 if player not found
   * @example
   * const odds = gameEngine.getPotOdds('player1');
   * console.log(`Pot odds: ${odds.toFixed(1)}%`);
   */
  getPotOdds(playerId) {
    const player = this.gameState.players.find((p) => p.id === playerId);
    if (!player) return 0;

    return BettingLogic.calculatePotOdds(this.gameState, player);
  }
}

export default GameEngine;
