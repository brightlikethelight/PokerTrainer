# PokerTrainer Architecture Documentation

## Overview

PokerTrainer is a comprehensive Texas Hold'em poker training application built with React and modern JavaScript. The architecture follows a modular, layered approach with clear separation of concerns between game logic, UI components, and intelligent learning systems.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Game Tables │  │ Study Views  │  │ Analytics Views  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hooks Layer                        │
│  ┌────────────┐  ┌───────────────┐  ┌─────────────────┐   │
│  │usePokerGame│  │useGTOAnalysis │  │useStudySession  │   │
│  └────────────┘  └───────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Core Business Logic                      │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │Game Engine │  │GTO Engine │  │Learning Intelligence │  │
│  └────────────┘  └───────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Services Layer                          │
│  ┌────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐  │
│  │Logger  │  │Performance │  │Validation  │  │Storage  │  │
│  └────────┘  └────────────┘  └────────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Game Engine (`/src/core/game/`)

The game engine implements complete Texas Hold'em rules and manages game state.

**Key Components:**

- `GameEngine.js` - Main game controller
- `GameState.js` - Centralized state management
- `HandEvaluator.js` - 7-card hand evaluation
- `BettingLogic.js` - Betting validation and pot management
- `AIPlayer.js` - AI opponent implementation

**Design Patterns:**

- State Machine for game phases
- Command Pattern for player actions
- Observer Pattern for state updates

### 2. GTO Analysis Engine (`/src/core/gto/`)

Provides Game Theory Optimal analysis and strategic recommendations.

**Key Components:**

- `GTOEngine.js` - Main analysis controller
- `EquityCalculator.js` - Monte Carlo equity simulations
- `RangeAnalyzer.js` - Hand range construction
- `BoardAnalyzer.js` - Board texture analysis
- `StrategyAdvisor.js` - Recommendation engine

**Performance Optimizations:**

- WebWorker for equity calculations
- Caching for repeated calculations
- Lazy evaluation of complex analyses

### 3. Learning Intelligence System (`/src/core/intelligence/`)

Adaptive learning system with 6 integrated intelligence components.

**Intelligence Components:**

1. **WeaknessDetector** - Identifies skill gaps
2. **DynamicHandGenerator** - Creates targeted scenarios
3. **AdaptiveDifficulty** - Adjusts challenge level
4. **PokerSpacedRepetition** - Optimizes review timing
5. **MicroLearningMoment** - Contextual teaching
6. **PerformanceAnalytics** - Comprehensive tracking

**Key Features:**

- Real-time performance monitoring
- Flow theory implementation
- Personalized learning paths
- Multi-dimensional skill tracking

### 4. Study System (`/src/core/study/`)

Structured learning with spaced repetition and concept mastery.

**Key Components:**

- `StudyEngine.js` - Session management
- `QuestionGenerator.js` - Dynamic question creation
- `SpacedRepetition.js` - SRS algorithm
- `ConceptHierarchy.js` - Skill tree structure

## Data Flow

### Game Flow

```
User Action → GameEngine → State Update → UI Update
                ↓
           AI Decision
                ↓
           State Update → UI Update
```

### Learning Flow

```
Hand Result → WeaknessDetector → Intelligence Orchestrator
                                        ↓
                              ┌─────────┴─────────┐
                              │                   │
                        Difficulty          Hand Generation
                        Adjustment               │
                              │                   │
                              └─────────┬─────────┘
                                        ↓
                                 Next Hand/Question
```

## State Management

### Game State

```javascript
{
  players: Player[],
  pot: { main: number, side: SidePot[] },
  board: Card[],
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown',
  currentPlayerIndex: number,
  dealerPosition: number,
  blinds: { small: number, big: number },
  history: Action[]
}
```

### Learning State

```javascript
{
  session: {
    id: string,
    type: string,
    startTime: number,
    progress: object
  },
  performance: {
    accuracy: number[],
    responseTime: number[],
    streak: number
  },
  adaptations: object[]
}
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**
   - Hand evaluation results
   - Board texture calculations
   - Range vs range equities

2. **Lazy Loading**
   - Study content modules
   - Advanced analytics views
   - Historical data

3. **WebWorkers**
   - Equity calculations
   - Hand generation
   - Performance analysis

4. **Caching**
   - Preflop ranges
   - Common board textures
   - User preferences

### Performance Budgets

- Initial load: < 3 seconds
- Hand evaluation: < 10ms
- AI decision: < 500ms
- Equity calculation: < 1 second
- Page transition: < 200ms

## Security Considerations

1. **Input Validation**
   - All user inputs sanitized
   - Bet amounts validated
   - Action validation

2. **State Integrity**
   - Immutable state updates
   - State validation after each action
   - Error boundaries for recovery

3. **Data Privacy**
   - Local storage for user data
   - No sensitive data in logs
   - Secure random number generation

## Testing Strategy

### Test Pyramid

```
         E2E Tests
        /    |    \
       Integration Tests
      /      |      \
    Unit Tests (90%+ coverage)
```

### Test Categories

1. **Unit Tests** - Individual components
2. **Integration Tests** - System interactions
3. **E2E Tests** - User workflows
4. **Performance Tests** - Load and stress testing
5. **Validation Tests** - Error recovery

## Deployment Architecture

### Build Process

```
Source Code → Lint → Test → Build → Optimize → Deploy
                ↓      ↓      ↓        ↓
             ESLint  Jest  Webpack  Terser
```

### Production Optimizations

- Code splitting by route
- Tree shaking for unused code
- Asset optimization (images, fonts)
- Service worker for offline support
- CDN for static assets

## Monitoring and Analytics

### Performance Monitoring

- Core Web Vitals tracking
- Custom performance metrics
- Error tracking and reporting
- User interaction analytics

### Logging Strategy

- Structured logging with levels
- Performance timing logs
- Error aggregation
- Debug mode for development

## Future Architecture Considerations

### Scalability

- Microservices for heavy computations
- Database integration for persistence
- Real-time multiplayer support
- Cloud-based analysis

### Extensibility

- Plugin system for custom AI
- Theme customization
- Additional game variants
- Community content

## Development Guidelines

### Code Organization

```
src/
├── components/     # React components
├── core/          # Business logic
├── hooks/         # Custom React hooks
├── services/      # Utility services
├── utils/         # Helper functions
├── constants/     # App constants
└── data/          # Static data files
```

### Naming Conventions

- Components: PascalCase
- Files: kebab-case or PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### Best Practices

1. Single Responsibility Principle
2. Composition over inheritance
3. Pure functions where possible
4. Comprehensive error handling
5. Performance-first mindset
   EOF < /dev/null
