# Contributing to PokerTrainer

Thank you for your interest in contributing to PokerTrainer! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing Requirements](#testing-requirements)
6. [Documentation](#documentation)
7. [Pull Request Process](#pull-request-process)
8. [Issue Guidelines](#issue-guidelines)
9. [Development Environment](#development-environment)
10. [Architecture Overview](#architecture-overview)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**

- Harassment of any kind
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Git**: Latest version
- **VS Code**: Recommended (with suggested extensions)

### Setup Instructions

1. **Fork the repository**

   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/PokerTrainer.git
   cd PokerTrainer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install recommended VS Code extensions**
   - ESLint
   - Prettier
   - Jest
   - GitLens
   - React snippets

4. **Start development server**

   ```bash
   npm start
   ```

5. **Run tests to ensure everything works**
   ```bash
   npm test
   npm run test:coverage
   ```

## Development Workflow

### Branch Strategy

We use **Git Flow** with the following branches:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Creating a Feature

1. **Create and switch to feature branch**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Work on your feature**
   - Write tests first (TDD approach)
   - Implement feature
   - Ensure all tests pass
   - Follow code standards

3. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub targeting 'develop' branch
   ```

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `perf` - Performance improvements
- `build` - Build system changes
- `ci` - CI configuration changes
- `chore` - Other changes

**Examples:**

```bash
feat(game): add side pot calculation for all-in scenarios
fix(ui): resolve betting controls disabled state issue
docs(api): update GameEngine documentation
test(integration): add end-to-end game flow tests
```

## Code Standards

### Code Style

We use **ESLint** and **Prettier** for consistent code style:

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### JavaScript Standards

1. **Use modern ES6+ features**

   ```javascript
   // Good
   const players = [...existingPlayers, newPlayer];
   const { name, chips } = player;

   // Avoid
   var players = existingPlayers.concat(newPlayer);
   var name = player.name;
   var chips = player.chips;
   ```

2. **Use descriptive variable names**

   ```javascript
   // Good
   const calculatePotOdds = (betAmount, potSize) => {
     return betAmount / (potSize + betAmount);
   };

   // Avoid
   const calc = (a, b) => a / (b + a);
   ```

3. **Prefer pure functions**

   ```javascript
   // Good
   const evaluateHand = (cards) => {
     // No side effects, deterministic output
     return handRank;
   };

   // Avoid
   const evaluateHand = (cards) => {
     // Modifies global state
     globalStats.handsEvaluated++;
     return handRank;
   };
   ```

### React Standards

1. **Use functional components with hooks**

   ```javascript
   // Good
   const PlayerSeat = ({ player, onAction }) => {
     const [isAnimating, setIsAnimating] = useState(false);
     // Component logic
   };

   // Avoid class components for new code
   ```

2. **Proper prop validation**

   ```javascript
   import PropTypes from 'prop-types';

   PlayerSeat.propTypes = {
     player: PropTypes.shape({
       id: PropTypes.string.isRequired,
       name: PropTypes.string.isRequired,
       chips: PropTypes.number.isRequired,
     }).isRequired,
     onAction: PropTypes.func.isRequired,
   };
   ```

3. **Use meaningful component names**

   ```javascript
   // Good
   <BettingControls />
   <HandHistoryDashboard />
   <PokerTable />

   // Avoid
   <Controls />
   <Dashboard />
   <Table />
   ```

### Domain-Driven Design

1. **Keep domain logic pure**

   ```javascript
   // Domain layer - no UI dependencies
   class GameEngine {
     executePlayerAction(playerId, action, amount) {
       // Pure business logic
     }
   }
   ```

2. **Separate concerns by layer**
   ```
   presentation/ - React components
   application/ - Use cases, orchestration
   domain/      - Business logic, entities
   infrastructure/ - External services, persistence
   ```

## Testing Requirements

### Test Coverage Targets

All contributions must maintain our coverage standards:

| Component Type    | Minimum Coverage |
| ----------------- | ---------------- |
| GameEngine        | 95%              |
| React Components  | 90%              |
| Custom Hooks      | 90%              |
| Utility Functions | 88%              |
| Overall           | 92%              |

### Writing Tests

1. **Follow TDD approach**

   ```javascript
   // Write failing test first
   it('should calculate side pots correctly', () => {
     expect(gameEngine.calculateSidePots()).toEqual(expectedPots);
   });

   // Then implement feature to make test pass
   ```

2. **Use descriptive test names**

   ```javascript
   // Good
   it('should handle all-in scenario with three players having different chip stacks');

   // Avoid
   it('should work with all-in');
   ```

3. **Test edge cases**

   ```javascript
   describe('Betting Logic', () => {
     it('should handle player with exactly big blind amount');
     it('should handle all players folding except one');
     it('should handle invalid bet amounts gracefully');
   });
   ```

4. **Use realistic test data**

   ```javascript
   // Good - realistic poker scenario
   const players = [
     createPlayer({ name: 'Alice', chips: 1000, cards: ['As', 'Ks'] }),
     createPlayer({ name: 'Bob', chips: 500, cards: ['Qd', 'Qc'] }),
   ];

   // Avoid - artificial data
   const players = [{ a: 1 }, { b: 2 }];
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=GameEngine

# Run in watch mode
npm test -- --watch
```

## Documentation

### Code Documentation

1. **Add JSDoc comments for public APIs**

   ```javascript
   /**
    * Evaluates a poker hand and returns its rank
    * @param {Card[]} cards - Array of 7 cards (2 hole + 5 community)
    * @returns {HandResult} Hand evaluation result
    * @throws {Error} When invalid cards provided
    */
   evaluateHand(cards) {
     // Implementation
   }
   ```

2. **Update README when adding features**
   - Add new features to feature list
   - Update setup instructions if needed
   - Include usage examples

3. **Create architectural decision records (ADRs)**

   ```markdown
   # ADR-XXX: Decision Title

   ## Status

   Proposed/Accepted/Deprecated

   ## Context

   What is the issue we're addressing?

   ## Decision

   What have we decided to do?

   ## Consequences

   What are the results of this decision?
   ```

## Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass**

   ```bash
   npm run test:all
   npm run lint
   npm run typecheck
   ```

2. **Update documentation**
   - Add/update JSDoc comments
   - Update README if needed
   - Add tests for new features

3. **Check performance impact**
   ```bash
   npm run performance:test
   ```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
```

### Review Process

1. **Automated checks must pass**
   - All tests
   - Linting
   - Coverage thresholds
   - Performance budgets

2. **Code review requirements**
   - At least one approved review
   - No unresolved comments
   - Maintainer approval for breaking changes

3. **Merge requirements**
   - Squash and merge for feature branches
   - Use conventional commit message
   - Delete feature branch after merge

## Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**

- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Safari]
- Version: [e.g. 1.0.0]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Alternative solutions you've considered

**Additional context**
Any other context or screenshots
```

## Development Environment

### Recommended VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["."],
  "jest.autoRun": "off"
}
```

### Git Hooks

Pre-commit hooks automatically run:

- ESLint with auto-fix
- Prettier formatting
- Type checking
- Unit tests

Commit message hook validates conventional commit format.

### Debugging

#### VS Code Debug Configuration

```json
{
  "name": "Debug React App",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/src"
}
```

#### Jest Debugging

```json
{
  "name": "Debug Jest Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/react-scripts",
  "args": ["test", "--runInBand", "--no-cache"]
}
```

## Architecture Overview

### Key Principles

1. **Domain-Driven Design**
   - Business logic in domain layer
   - Clear bounded contexts
   - Ubiquitous language

2. **Separation of Concerns**
   - UI components separate from business logic
   - Infrastructure concerns isolated
   - Testable architecture

3. **Performance First**
   - Memoization for expensive calculations
   - Code splitting for better load times
   - Performance budgets enforced

### Project Structure

```
src/
├── domains/           # Business domains
│   ├── game/         # Poker game logic
│   └── analytics/    # Hand history & stats
├── components/       # React UI components
├── hooks/           # Custom React hooks
├── services/        # Cross-cutting services
├── utils/           # Utility functions
└── constants/       # Application constants
```

## Performance Guidelines

### Performance Budgets

- Bundle size: < 500KB gzipped
- Initial load: < 3 seconds
- Time to interactive: < 3.5 seconds
- Hand evaluation: < 10ms
- AI decision: < 500ms

### Optimization Techniques

1. **React Optimization**

   ```javascript
   // Use React.memo for expensive components
   const ExpensiveComponent = React.memo(({ data }) => {
     // Component logic
   });

   // Use useMemo for expensive calculations
   const expensiveValue = useMemo(() => {
     return expensiveCalculation(data);
   }, [data]);
   ```

2. **Bundle Optimization**
   ```javascript
   // Use dynamic imports for code splitting
   const AnalyticsPage = lazy(() => import('./AnalyticsPage'));
   ```

## Security Guidelines

### Client-Side Security

1. **Input Validation**

   ```javascript
   const validateBetAmount = (amount, minBet, maxBet) => {
     if (typeof amount !== 'number' || amount < minBet || amount > maxBet) {
       throw new Error('Invalid bet amount');
     }
   };
   ```

2. **Secure Random Generation**
   ```javascript
   // Use crypto.getRandomValues for card shuffling
   const shuffleDeck = (deck) => {
     const array = [...deck];
     for (let i = array.length - 1; i > 0; i--) {
       const j = Math.floor(
         (crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) * (i + 1)
       );
       [array[i], array[j]] = [array[j], array[i]];
     }
     return array;
   };
   ```

## Getting Help

### Documentation

- [README.md](../README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [TESTING.md](TESTING.md) - Testing guidelines
- [API.md](API.md) - API documentation

### Communication

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Requests** - Code review and collaboration

### Maintainers

Current maintainers:

- @brightliu - Project lead and architecture

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Special recognition for long-term contributors

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PokerTrainer! Your efforts help make this project better for everyone. 🎲♠️♥️♦️♣️
