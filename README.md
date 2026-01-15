# PokerTrainer

A comprehensive poker training application built with React 19, featuring a Texas Hold'em game engine, AI opponents with adaptive strategies, and an interactive learning system.

[![CI](https://github.com/brightlikethelight/PokerTrainer/actions/workflows/ci.yml/badge.svg)](https://github.com/brightlikethelight/PokerTrainer/actions/workflows/ci.yml)
[![Deploy](https://github.com/brightlikethelight/PokerTrainer/actions/workflows/github-pages.yml/badge.svg)](https://github.com/brightlikethelight/PokerTrainer/actions/workflows/github-pages.yml)

**Live Demo**: [https://brightlikethelight.github.io/PokerTrainer](https://brightlikethelight.github.io/PokerTrainer)

## Features

### Game Engine

- Complete Texas Hold'em implementation with all betting rounds
- Accurate hand evaluation and winner determination
- Side pot calculations for all-in scenarios
- Position-based play with proper blind structure

### AI Opponents

- Four distinct AI player types:
  - **TAG** (Tight-Aggressive): Plays few hands but bets aggressively
  - **LAG** (Loose-Aggressive): Plays many hands with high aggression
  - **TP** (Tight-Passive): Plays few hands, prefers calling
  - **LP** (Loose-Passive): Plays many hands, rarely raises
- Position-aware decision making
- Opponent modeling and adaptive strategies

### Learning System

- **Practice Sessions**: Scenario-based training for preflop and postflop decisions
- **Concepts Library**: Educational content on poker fundamentals, intermediate concepts, and advanced strategies
- **Hand History**: Review and analyze your played hands

## Getting Started

### Prerequisites

- Node.js 20.0.0 or higher
- npm 9.0.0 or higher

### Installation

```bash
git clone https://github.com/brightlikethelight/PokerTrainer.git
cd PokerTrainer
npm install
npm start
```

The application will open at `http://localhost:3000`.

### Available Scripts

```bash
npm start          # Start development server
npm test           # Run tests in watch mode
npm run test:ci    # Run tests with coverage
npm run build      # Create production build
npm run lint       # Check code style
npm run lint:fix   # Fix code style issues
```

## Architecture

```
src/
├── components/           # React UI components
│   ├── game/            # Game interface (PokerTable, Card, PlayerSeat)
│   ├── study/           # Learning components (Practice, Concepts, History)
│   └── common/          # Shared components
├── game/                # Core game logic
│   ├── engine/          # Game engine, AI, betting logic
│   │   └── strategies/  # AI strategy implementations
│   ├── entities/        # Game objects (Card, Deck, Player, GameState)
│   └── utils/           # Hand evaluation, position helpers
├── hooks/               # Custom React hooks
├── analytics/           # Hand history tracking
└── constants/           # Game constants and configuration
```

## Testing

The project maintains comprehensive test coverage:

```bash
npm run test:ci          # Run all tests with coverage report
```

**Test Suites**:

- GameEngine: 51 tests
- GameState: 65 tests
- BettingLogic: 48 tests
- PositionStrategy: 30 tests
- OpponentModel: 60 tests
- ScenarioGenerator: 23 tests
- Component tests for Card, PlayerSeat, PokerTable

## Technology Stack

- **Frontend**: React 19.1.0
- **Routing**: React Router 6
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier, Husky
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Make your changes with appropriate tests
4. Run `npm run lint` and `npm test`
5. Commit using conventional commits (`feat:`, `fix:`, `docs:`)
6. Push and create a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Bright Liu** - [brightliu@college.harvard.edu](mailto:brightliu@college.harvard.edu)

---

_This is an educational project demonstrating React development, game logic implementation, and software engineering best practices._
