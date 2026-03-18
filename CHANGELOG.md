# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-03-18

### Changed
- **Build system**: Migrated from Create React App (react-scripts 5.0.1) to Vite 6
- **Test runner**: Tests now use Jest directly instead of react-scripts test
- **UI**: Pot display now shows total pot (main + side pots) instead of main pot only
- **Integration tests**: AI decision calls use AIPlayer.getAction directly
- **Code quality**: Extracted AI strategy thresholds into named constants (TAG/LAG/TP/LP)
- **Code quality**: Extracted timeout values into TIMING constant in usePokerGame
- **Hand history**: Normalized entry format — all entries now flow through `GameState.addToHistory()`

### Fixed
- Action indicator colors (fold/check/call/bet/raise/all-in) never rendered due to `player-_action` CSS class typo
- Pot display and bet-sizing buttons showed only the main pot, ignoring side pots
- Memory leak from untracked setTimeout in usePokerGame onShowdown callback
- Test environment: localStorage mocks now configurable, preventing cross-test state leaks
- Replaced 5 deprecated `.substr()` calls with `.slice()`
- Renamed misleading `_`-prefixed active variables (`_action` → `action`, `_potOdds` → `potOdds`, `_currentBet` → `currentBet` prop, `_error` → `error`)

### Removed
- react-scripts dependency (eliminated 15 high/moderate npm vulnerabilities)
- Dead code: Deck.deal/dealOne/getRemainingCards, Card.createDeck, Player.updateStats
- Player.decideAction (circular dependency via dynamic require)

### Security
- Reduced npm vulnerabilities from 19 (9 high) to 4 (all low, transitive via jest-environment-jsdom)
- Fixed `actions/download-artifact@v6` → `@v4` in release workflow (v6 doesn't exist)
- Updated deprecated `returntocorp/semgrep-action` → `semgrep/semgrep-action`
- Removed stale `develop` branch references from CI triggers

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
