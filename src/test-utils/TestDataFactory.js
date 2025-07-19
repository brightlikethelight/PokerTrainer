/**
 * Test Data Factory - Comprehensive poker testing utilities
 * Provides realistic game scenarios, hands, and edge cases
 */

import Player from '../domains/game/domain/entities/Player';
import Card from '../domains/game/domain/entities/Card';
import Deck from '../domains/game/domain/entities/Deck';
import GameState from '../domains/game/domain/entities/GameState';
import { RANKS, SUITS, GAME_PHASES, PLAYER_STATUS } from '../constants/game-constants';

class TestDataFactory {
  // =============================================================================
  // PLAYER CREATION
  // =============================================================================

  /**
   * Create a test player with customizable options
   */
  static createPlayer(options = {}) {
    const defaults = {
      id: 'test-player',
      name: 'Test Player',
      chips: 1000,
      position: 0,
      isAI: false,
      aiType: null,
    };

    const config = { ...defaults, ...options };
    return new Player(
      config.id,
      config.name,
      config.chips,
      config.position,
      config.isAI,
      config.aiType
    );
  }

  /**
   * Create a set of test players
   */
  static createPlayerSet(count = 2, baseConfig = {}) {
    const players = [];
    for (let i = 0; i < count; i++) {
      players.push(
        this.createPlayer({
          id: `player-${i}`,
          name: `Player ${i + 1}`,
          position: i,
          ...baseConfig,
        })
      );
    }
    return players;
  }

  /**
   * Create AI players with different styles
   */
  static createAIPlayerSet() {
    return [
      this.createPlayer({
        id: 'ai-tag',
        name: 'TAG Player',
        isAI: true,
        aiType: 'tight-aggressive',
      }),
      this.createPlayer({
        id: 'ai-lag',
        name: 'LAG Player',
        isAI: true,
        aiType: 'loose-aggressive',
      }),
      this.createPlayer({
        id: 'ai-tp',
        name: 'Tight Passive',
        isAI: true,
        aiType: 'tight-passive',
      }),
      this.createPlayer({
        id: 'ai-lp',
        name: 'Loose Passive',
        isAI: true,
        aiType: 'loose-passive',
      }),
    ];
  }

  // =============================================================================
  // CARD CREATION
  // =============================================================================

  /**
   * Create a specific card
   */
  static createCard(rank, suit) {
    return new Card(rank, suit);
  }

  /**
   * Create cards from string notation (e.g., 'As Kh')
   */
  static createCardsFromString(cardString) {
    const cards = [];
    const cardPairs = cardString.trim().split(/\s+/);

    for (const cardPair of cardPairs) {
      if (cardPair.length !== 2) continue;
      const rank = cardPair[0];
      const suit = cardPair[1];
      cards.push(new Card(rank, suit));
    }

    return cards;
  }

  /**
   * Create specific hole card combinations
   */
  static createHoleCards() {
    return {
      // Premium hands
      pocketAces: () => [new Card('A', 's'), new Card('A', 'h')],
      pocketKings: () => [new Card('K', 's'), new Card('K', 'h')],
      aceKingSuited: () => [new Card('A', 's'), new Card('K', 's')],
      aceKingOffsuit: () => [new Card('A', 's'), new Card('K', 'h')],

      // Strong hands
      pocketQueens: () => [new Card('Q', 's'), new Card('Q', 'h')],
      aceQueenSuited: () => [new Card('A', 's'), new Card('Q', 's')],
      kingQueenSuited: () => [new Card('K', 's'), new Card('Q', 's')],

      // Medium hands
      pocketJacks: () => [new Card('J', 's'), new Card('J', 'h')],
      pocketTens: () => [new Card('T', 's'), new Card('T', 'h')],
      aceJackSuited: () => [new Card('A', 's'), new Card('J', 's')],

      // Weak hands
      sevenDeuce: () => [new Card('7', 's'), new Card('2', 'h')],
      threeEight: () => [new Card('3', 's'), new Card('8', 'h')],

      // Drawing hands
      suitedConnectors: () => [new Card('8', 's'), new Card('9', 's')],
      oneGapper: () => [new Card('J', 's'), new Card('9', 's')],

      // Random hand
      random: () => {
        const deck = Deck.createDeck();
        return [deck[0], deck[1]];
      },
    };
  }

  /**
   * Create community card scenarios
   */
  static createCommunityCards() {
    return {
      // Dry boards
      aceHighDry: () => this.createCardsFromString('As 7h 2c'),
      kingHighDry: () => this.createCardsFromString('Ks 8h 3c'),

      // Wet boards
      flushDraw: () => this.createCardsFromString('As Ks 7s'),
      straightDraw: () => this.createCardsFromString('9h Ts Jc'),
      flushAndStraightDraw: () => this.createCardsFromString('8s 9s Ts'),

      // Paired boards
      pairedBoard: () => this.createCardsFromString('As Ah 7c'),
      tripsBoard: () => this.createCardsFromString('As Ah Ac 7h 2c'),

      // Complete runouts
      completeBoard: () => this.createCardsFromString('As Kh Qc Jd Ts'), // Royal flush possible
      royalFlush: () => this.createCardsFromString('As Ks Qs Js Ts'), // Royal flush in spades
      straightFlush: () => this.createCardsFromString('9s 8s 7s 6s 5s'), // Straight flush
      flush: () => this.createCardsFromString('As Ks 7s 4s 2s'), // Ace high flush
      straight: () => this.createCardsFromString('As Kh Qc Jd Ts'), // Broadway straight

      // Specific scenarios
      setOverSet: () => ({
        flop: this.createCardsFromString('8s 8h 2c'),
        turn: this.createCardsFromString('8s 8h 2c Qd'),
        river: this.createCardsFromString('8s 8h 2c Qd 7s'),
      }),
    };
  }

  // =============================================================================
  // GAME STATE CREATION
  // =============================================================================

  /**
   * Create a basic game state
   */
  static createGameState(options = {}) {
    const defaults = {
      players: this.createPlayerSet(2),
      phase: GAME_PHASES.PREFLOP,
      pot: 0,
      currentBet: 0,
      currentPlayerIndex: 0,
      dealerPosition: 0,
      smallBlind: 25,
      bigBlind: 50,
      communityCards: [],
      handNumber: 1,
    };

    const config = { ...defaults, ...options };
    const gameState = new GameState();

    // Initialize with players
    config.players.forEach((player) => gameState.addPlayer(player));

    // Set other properties
    Object.assign(gameState, config);

    return gameState;
  }

  /**
   * Create game states for specific scenarios
   */
  static createGameScenarios() {
    return {
      // Pre-flop scenarios
      preflop: () =>
        this.createGameState({
          phase: GAME_PHASES.PREFLOP,
          currentBet: 50,
          pot: 75, // SB + BB
        }),

      // Post-flop scenarios
      flop: () =>
        this.createGameState({
          phase: GAME_PHASES.FLOP,
          communityCards: this.createCommunityCards().aceHighDry(),
          pot: 200,
        }),

      turn: () =>
        this.createGameState({
          phase: GAME_PHASES.TURN,
          communityCards: this.createCardsFromString('As 7h 2c Kd'),
          pot: 400,
        }),

      river: () =>
        this.createGameState({
          phase: GAME_PHASES.RIVER,
          communityCards: this.createCardsFromString('As 7h 2c Kd 9s'),
          pot: 800,
        }),

      // Special scenarios
      allIn: () => {
        const players = this.createPlayerSet(2);
        players[0].chips = 0;
        players[0].status = PLAYER_STATUS.ALL_IN;

        return this.createGameState({
          players,
          pot: 2000,
          phase: GAME_PHASES.FLOP,
        });
      },

      multipleAllIns: () => {
        const players = this.createPlayerSet(4);
        players[0].chips = 0;
        players[0].status = PLAYER_STATUS.ALL_IN;
        players[1].chips = 0;
        players[1].status = PLAYER_STATUS.ALL_IN;

        return this.createGameState({
          players,
          pot: 3000,
          phase: GAME_PHASES.TURN,
        });
      },

      headsUp: () =>
        this.createGameState({
          players: this.createPlayerSet(2, { chips: 1500 }),
          dealerPosition: 0, // Dealer posts small blind in heads-up
        }),
    };
  }

  // =============================================================================
  // HAND HISTORY SCENARIOS
  // =============================================================================

  /**
   * Create hand history data for testing analytics
   */
  static createHandHistory() {
    return {
      sampleHand: () => ({
        id: 'hand-123',
        handNumber: 123,
        timestamp: Date.now(),
        gameType: 'texas-holdem',
        heroPosition: 0,
        heroCards: this.createHoleCards().aceKingSuited(),
        communityCards: this.createCardsFromString('As Kh Qc Jd Ts'),
        potSize: 1500,
        handResult: 'won',
        heroWinAmount: 750,
        handDuration: 45000,
        preflopActions: [
          {
            playerId: 'hero',
            action: 'raise',
            amount: 150,
            timestamp: Date.now(),
          },
          {
            playerId: 'villain',
            action: 'call',
            amount: 150,
            timestamp: Date.now(),
          },
        ],
        flopActions: [
          {
            playerId: 'hero',
            action: 'bet',
            amount: 300,
            timestamp: Date.now(),
          },
          {
            playerId: 'villain',
            action: 'call',
            amount: 300,
            timestamp: Date.now(),
          },
        ],
      }),

      multipleHands: (count = 10) => {
        const hands = [];
        const results = ['won', 'lost'];
        const positions = [0, 1, 2, 3, 4, 5];

        for (let i = 0; i < count; i++) {
          hands.push({
            id: `hand-${i}`,
            handNumber: i + 1,
            timestamp: Date.now() - i * 60000, // 1 minute apart
            heroPosition: positions[i % positions.length],
            potSize: 200 + i * 50,
            handResult: results[i % 2],
            heroWinAmount: results[i % 2] === 'won' ? 100 + i * 25 : 0,
          });
        }

        return hands;
      },
    };
  }

  // =============================================================================
  // BETTING SCENARIOS
  // =============================================================================

  /**
   * Create betting action sequences
   */
  static createBettingScenarios() {
    return {
      standardRaise: () => [
        { playerId: 'p1', action: 'raise', amount: 100 },
        { playerId: 'p2', action: 'call', amount: 100 },
      ],

      threebet: () => [
        { playerId: 'p1', action: 'raise', amount: 100 },
        { playerId: 'p2', action: 'raise', amount: 300 },
        { playerId: 'p1', action: 'call', amount: 300 },
      ],

      fourbet: () => [
        { playerId: 'p1', action: 'raise', amount: 100 },
        { playerId: 'p2', action: 'raise', amount: 300 },
        { playerId: 'p1', action: 'raise', amount: 900 },
        { playerId: 'p2', action: 'fold', amount: 0 },
      ],

      allInShove: () => [
        { playerId: 'p1', action: 'raise', amount: 100 },
        { playerId: 'p2', action: 'raise', amount: 2000 }, // All-in
      ],
    };
  }

  // =============================================================================
  // EDGE CASES AND ERROR SCENARIOS
  // =============================================================================

  /**
   * Create edge case scenarios for robust testing
   */
  static createEdgeCases() {
    return {
      emptyDeck: () => new Deck([]),

      singlePlayer: () =>
        this.createGameState({
          players: [this.createPlayer()],
        }),

      maxPlayers: () =>
        this.createGameState({
          players: this.createPlayerSet(10),
        }),

      zeroChipPlayer: () => {
        const player = this.createPlayer({ chips: 0 });
        return this.createGameState({ players: [player] });
      },

      invalidCards: () => ({
        invalidRank: () => new Card('X', 's'),
        invalidSuit: () => new Card('A', 'z'),
        duplicateCard: () => [new Card('A', 's'), new Card('A', 's')],
      }),
    };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Generate random test data
   */
  static random = {
    integer: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,

    chips: () => this.random.integer(100, 10000),

    position: () => this.random.integer(0, 5),

    card: () => {
      const ranks = Object.values(RANKS);
      const suits = Object.values(SUITS);
      return new Card(
        ranks[this.random.integer(0, ranks.length - 1)],
        suits[this.random.integer(0, suits.length - 1)]
      );
    },

    hand: () => [this.random.card(), this.random.card()],
  };

  /**
   * Create realistic tournament scenarios
   */
  static createTournamentScenarios() {
    return {
      earlyStage: () =>
        this.createGameState({
          players: this.createPlayerSet(9, { chips: 10000 }),
          smallBlind: 25,
          bigBlind: 50,
        }),

      middleStage: () =>
        this.createGameState({
          players: this.createPlayerSet(6, { chips: 8000 }),
          smallBlind: 100,
          bigBlind: 200,
        }),

      finalTable: () =>
        this.createGameState({
          players: this.createPlayerSet(3, { chips: 20000 }),
          smallBlind: 500,
          bigBlind: 1000,
        }),

      headsUpFinale: () =>
        this.createGameState({
          players: this.createPlayerSet(2, { chips: 50000 }),
          smallBlind: 1000,
          bigBlind: 2000,
        }),
    };
  }
}

export default TestDataFactory;
