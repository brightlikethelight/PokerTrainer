# Architecture

## Overview

PokerTrainer is a React-based poker training application with a modular architecture separating game logic from UI components.

## Project Structure

```
src/
├── components/              # React UI components
│   ├── game/               # Game interface
│   │   ├── PokerTable.jsx  # Main game table
│   │   ├── Card.jsx        # Card display
│   │   ├── PlayerSeat.jsx  # Player seat
│   │   └── BettingControls.jsx
│   ├── study/              # Learning system
│   │   ├── StudyDashboard.jsx
│   │   ├── PracticeSession.jsx
│   │   ├── ConceptsLibrary.jsx
│   │   └── HandHistoryDashboard.js
│   └── common/             # Shared components
│       └── ErrorBoundary.jsx
│
├── game/                   # Core game logic (no React)
│   ├── engine/             # Game mechanics
│   │   ├── GameEngine.js   # Main game controller
│   │   ├── BettingLogic.js # Betting rules
│   │   ├── AIPlayer.js     # AI decision making
│   │   ├── OpponentModel.js # Opponent tracking
│   │   ├── ScenarioGenerator.js # Practice scenarios
│   │   └── strategies/
│   │       └── PositionStrategy.js
│   ├── entities/           # Game objects
│   │   ├── Card.js
│   │   ├── Deck.js
│   │   ├── Player.js
│   │   └── GameState.js
│   └── utils/              # Utilities
│       ├── HandEvaluator.js
│       └── positionHelpers.js
│
├── hooks/                  # Custom React hooks
│   ├── usePokerGame.js     # Game state management
│   └── useHandHistory.js   # Hand history tracking
│
├── analytics/              # Analytics services
│   └── HandHistoryService.js
│
└── constants/              # Configuration
    └── game-constants.js
```

## Core Components

### Game Engine

The `GameEngine` class manages game flow:

- Deals cards and manages deck
- Controls betting rounds (preflop, flop, turn, river)
- Validates player actions
- Determines winners

### GameState

Centralized state management:

- Player positions and chip counts
- Current bet and pot
- Community cards
- Game phase

### AI System

AI decision making with four player types:

| Type | VPIP | Aggression | Strategy                         |
| ---- | ---- | ---------- | -------------------------------- |
| TAG  | Low  | High       | Tight ranges, aggressive bets    |
| LAG  | High | High       | Wide ranges, frequent aggression |
| TP   | Low  | Low        | Tight ranges, passive play       |
| LP   | High | Low        | Wide ranges, calling station     |

**Position Strategy**: Adjusts ranges based on table position (UTG tight, BTN wide).

**Opponent Modeling**: Tracks opponent statistics (VPIP, PFR, 3-bet%, C-bet%) for adaptive play.

### Hand Evaluation

7-card hand evaluation using standard poker rankings. Returns hand rank, high cards, and kickers for tie-breaking.

## Data Flow

```
User Input → Hook (usePokerGame) → GameEngine → State Update → UI Render
                                      ↓
                                  AI Decision
                                      ↓
                                  State Update → UI Render
```

## State Management

Uses React hooks for state management:

- `useState` for local component state
- `useCallback` for memoized functions
- Custom hooks for game logic integration

No external state library required due to the relatively simple state structure.

## Testing Strategy

**Unit Tests**: Core game logic (GameEngine, HandEvaluator, BettingLogic)

**Component Tests**: React components with React Testing Library

**Integration Tests**: Game flow and state transitions

## Performance

- Lazy loading for Study components
- Memoization for expensive calculations
- Efficient hand evaluation algorithm

## Future Considerations

- TypeScript migration for type safety
- WebWorker for equity calculations
- IndexedDB for persistent hand history
- Multiplayer support via WebSockets
