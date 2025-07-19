# PokerTrainer API Documentation

## Table of Contents

1. [Game Engine API](#game-engine-api)
2. [GTO Analysis API](#gto-analysis-api)
3. [Learning Intelligence API](#learning-intelligence-api)
4. [Study System API](#study-system-api)
5. [Hooks API](#hooks-api)
6. [Services API](#services-api)

## Game Engine API

### GameEngine

The core poker game controller managing game flow and state.

```javascript
import GameEngine from '@/core/game/GameEngine';

const gameEngine = new GameEngine();
```

#### Methods

##### `addPlayer(player)`

Adds a player to the game.

**Parameters:**

- `player` (Player): Player instance to add

**Example:**

```javascript
const player = new Player('player-1', 'John', 10000, 0, false);
gameEngine.addPlayer(player);
```

##### `removePlayer(playerId)`

Removes a player from the game.

**Parameters:**

- `playerId` (string): ID of player to remove

##### `startNewHand()`

Starts a new poker hand. Requires at least 2 players.

**Throws:**

- Error if fewer than 2 players
- Error if deck has insufficient cards

##### `handlePlayerAction(playerId, action, amount?)`

Processes a player action.

**Parameters:**

- `playerId` (string): ID of acting player
- `action` (string): One of 'check', 'call', 'bet', 'raise', 'fold', 'all-in'
- `amount` (number, optional): Bet/raise amount

**Returns:**

- Object with action result and validation

##### `setBlinds(small, big)`

Sets the blind amounts.

**Parameters:**

- `small` (number): Small blind amount
- `big` (number): Big blind amount

##### `setCallback(event, callback)`

Sets event callbacks.

**Events:**

- `onStateChange`: Game state updated
- `onHandComplete`: Hand finished
- `onPlayerAction`: Player acted
- `onPhaseChange`: Betting round changed
- `onShowdown`: Showdown occurred

### HandEvaluator

Evaluates poker hands and determines winners.

```javascript
import HandEvaluator from '@/core/game/HandEvaluator';

const evaluator = new HandEvaluator();
```

#### Methods

##### `evaluateHand(cards)`

Evaluates a 7-card poker hand.

**Parameters:**

- `cards` (Card[]): Array of 7 cards (hole + community)

**Returns:**

```javascript
{
  rank: number,        // 1-9 (high card to straight flush)
  name: string,        // e.g., "Full House"
  cards: Card[],       // Best 5 cards
  kickers: Card[]      // Kicker cards for tiebreakers
}
```

##### `compareHands(hand1, hand2)`

Compares two evaluated hands.

**Returns:**

- 1 if hand1 wins
- -1 if hand2 wins
- 0 if tie

## GTO Analysis API

### GTOEngine

Main GTO controller coordinating all analysis components.

```javascript
import GTOEngine from '@/core/gto/GTOEngine';

const gtoEngine = new GTOEngine();
```

#### Methods

##### `analyzeHand(handContext)`

Analyzes current hand and provides recommendations.

**Parameters:**

```javascript
{
  heroCards: ['As', 'Ks'],
  board: ['Qh', 'Jh', 'Th'],
  pot: 1000,
  toCall: 500,
  position: 'BTN',
  phase: 'flop',
  villainRange: 'default' // or custom range
}
```

**Returns:**

```javascript
{
  recommendation: {
    action: 'raise',
    sizingOptions: [2.5, 3, 3.5],
    frequency: 0.75,
    reasoning: string
  },
  equity: 0.65,
  potOdds: 0.33,
  alternatives: [...]
}
```

##### `setDifficulty(mode)`

Sets analysis difficulty mode.

**Parameters:**

- `mode` (string): 'beginner', 'intermediate', or 'advanced'

### EquityCalculator

Calculates hand vs range equity using Monte Carlo simulation.

```javascript
import EquityCalculator from '@/core/gto/EquityCalculator';

const calculator = new EquityCalculator();
```

#### Methods

##### `calculateEquity(heroCards, villainRange, board, iterations)`

Calculates equity against a range.

**Parameters:**

- `heroCards` (string[]): Hero's hole cards
- `villainRange` (string[]): Villain's range
- `board` (string[]): Community cards
- `iterations` (number): Simulation iterations (default: 10000)

**Returns:**

```javascript
{
  equity: 0.65,
  wins: 6500,
  ties: 500,
  iterations: 10000
}
```

EOF < /dev/null
