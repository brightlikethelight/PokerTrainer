# PokerTrainer - Educational Poker Training Application

[![CI](https://github.com/brightliu/PokerTrainer/actions/workflows/ci.yml/badge.svg)](https://github.com/brightliu/PokerTrainer/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/brightliu/PokerTrainer/actions/workflows/e2e.yml/badge.svg)](https://github.com/brightliu/PokerTrainer/actions/workflows/e2e.yml)
[![Security](https://github.com/brightliu/PokerTrainer/actions/workflows/security.yml/badge.svg)](https://github.com/brightliu/PokerTrainer/actions/workflows/security.yml)
[![CodeQL](https://github.com/brightliu/PokerTrainer/actions/workflows/codeql.yml/badge.svg)](https://github.com/brightliu/PokerTrainer/actions/workflows/codeql.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green)](https://nodejs.org/)

> ⚠️ **Note**: This is an educational portfolio project currently under active development. CI/CD workflows are being improved, and test coverage is being expanded. See [Current Status](#-current-status) for details.

An educational poker training application built with React, featuring a working Texas Hold'em game engine, AI opponents, and hand history tracking. This is a portfolio project demonstrating modern React development practices and clean architecture.

## 🎯 Project Overview

This project showcases:

- **Working poker game implementation** with proper betting rounds and hand evaluation
- **AI opponent system** with basic playing strategies
- **Clean React architecture** using hooks and functional components
- **Professional development setup** with ESLint, Prettier, and Git hooks
- **Domain-driven design patterns** for maintainable code organization

## 🚧 Current Status

This is an educational portfolio project demonstrating React development skills. Here's the honest current state:

- **Core Game Engine**: ✅ Working Texas Hold'em implementation
- **AI Players**: ✅ Basic AI opponents with different play styles
- **Test Coverage**: 🔧 ~17% (actively being improved)
- **CI/CD Pipeline**: 🔧 Partially working (security checks passing, test suite being fixed)
- **Documentation**: ✅ Comprehensive docs for implemented features
- **Production Ready**: ❌ Not yet - this is a learning/portfolio project

### Active Development Areas:

- Fixing test suite compatibility issues
- Improving test coverage to 50%+
- Stabilizing CI/CD pipeline
- Adding more AI sophistication

## ✨ Features

### 🎮 Texas Hold'em Game Engine

- Complete implementation of preflop, flop, turn, and river betting rounds
- Proper blind structure and betting validation
- Accurate hand evaluation and winner determination
- Side pot calculations for all-in scenarios

### 🤖 AI Opponents

- Basic AI players with different playing tendencies
- Automated decision-making for computer players
- Turn-based gameplay with proper game flow

### 📊 Hand History & Analytics

- Automatic capture of hand data during gameplay
- Basic statistics tracking (win rate, hands played)
- Hand replay functionality
- Export capabilities for further analysis

### 🎨 Modern UI/UX

- Clean, responsive design
- Real-time game state updates
- Intuitive betting controls
- Professional poker table interface

## 🚀 Getting Started

### Prerequisites

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/brightlikethelight/PokerTrainer.git
   cd PokerTrainer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Opens at `http://localhost:3000`

### Available Scripts

```bash
npm start          # Development server
npm test           # Run tests
npm run build      # Production build
npm run lint       # Code linting
npm run format     # Code formatting
```

## 🎮 How to Play

1. Navigate to the game interface via the "Play" button
2. You'll be seated at a table with 5 AI opponents
3. Each player starts with 10,000 chips
4. Use the betting controls at the bottom of the screen:
   - **Check/Call**: Match current bet or check if no bet
   - **Raise**: Increase the betting amount
   - **Fold**: Discard your hand
   - **All-in**: Bet all remaining chips

## 🏗️ Architecture

This project follows clean architecture principles with clear separation of concerns:

```
src/
├── components/              # React UI components
│   ├── game/               # Game-specific components
│   └── common/             # Shared components
├── hooks/                  # Custom React hooks
├── game/                   # Core game logic
│   ├── engine/            # Game engine and rules
│   └── entities/          # Game entities (Player, Card, etc.)
├── analytics/             # Hand history and statistics
├── constants/             # Game constants and enums
└── utils/                 # Utility functions
```

### Key Design Principles

- **Separation of concerns** between UI and business logic
- **Pure functions** for game logic to enable easy testing
- **React best practices** with functional components and hooks
- **Maintainable code** with clear file organization

## 🧪 Testing

The project includes a testing setup with Jest and React Testing Library:

```bash
npm test                    # Run tests in watch mode
npm test -- --coverage     # Generate coverage report
```

**Current Test Coverage**: ~15% (focused on critical game logic)  
**Test Strategy**: Unit tests for core game engine, component tests for UI interactions

## 🛠️ Development

### Code Quality Tools

- **ESLint**: Code linting with React-specific rules
- **Prettier**: Automatic code formatting
- **Husky**: Git hooks for pre-commit validation
- **lint-staged**: Run linters on staged files

### Development Workflow

1. Create feature branch from main
2. Make changes with tests
3. Run `npm run lint` and `npm test`
4. Commit with conventional commit messages
5. Push and create pull request

## 📈 Performance

Current performance characteristics:

- **Bundle size**: ~380KB gzipped
- **Initial load**: Fast development server startup
- **Runtime**: Smooth gameplay on modern browsers

## 🔧 Technical Debt & Future Improvements

**Known Limitations:**

- Test coverage needs improvement (currently ~15%)
- AI strategies are basic and could be more sophisticated
- Missing advanced poker features (tournaments, different variants)
- UI could be enhanced with animations and better responsive design

**Planned Enhancements:**

- Comprehensive test suite with higher coverage
- Advanced AI strategies and player types
- Tournament mode implementation
- Performance optimizations and code splitting
- TypeScript migration for better type safety

## 🤝 Contributing

This is primarily a portfolio/educational project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate tests
4. Ensure code passes linting and formatting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Create React App for rapid development setup
- Inspired by professional poker training applications
- Uses modern React patterns and best practices

## ⚠️ Educational Purpose

This application is designed for educational and portfolio demonstration purposes. It showcases:

- React application development
- Game logic implementation
- Clean code architecture
- Professional development practices

Not intended for real-money gambling or commercial use.

---

**Project Status**: Active Development | **Version**: 0.1.0 | **Purpose**: Educational/Portfolio
