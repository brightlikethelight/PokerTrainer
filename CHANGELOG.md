# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.2.0] - 2025-01-14

### Added
- **Position-Aware AI**: AI opponents now adjust play based on table position
- **Opponent Modeling**: Tracks VPIP, PFR, aggression, and adapts strategy
- **Practice Session System**: Interactive scenarios for preflop/postflop training
- **Concepts Library**: Educational content on poker fundamentals and strategy
- **React Router**: URL-based navigation between Play and Study modes

### Changed
- Simplified CI/CD workflows for reliability
- Updated documentation to reflect current features

### Fixed
- All GameEngine tests now passing (51 tests)
- Created comprehensive GameState tests (65 tests)
- Created BettingLogic tests (48 tests)

### Tests Added
- PositionStrategy: 30 tests
- OpponentModel: 60 tests
- ScenarioGenerator: 23 tests

## [0.1.0] - 2025-07-19

### Added
- Complete Texas Hold'em game engine
- Four AI player types (TAG, LAG, TP, LP)
- Interactive poker table UI
- Hand history tracking
- Hand evaluation for all poker hands
- Betting controls with slider
- Side pot calculations
- Study dashboard
- GitHub Pages deployment
- ESLint and Prettier configuration
- GitHub Actions CI/CD

### Technical
- React 19.1.0
- Jest and React Testing Library
- Husky git hooks
