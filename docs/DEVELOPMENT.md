# Development Guidelines

## Getting Started

### Prerequisites

- Node.js 16+
- npm 7+
- Git

### Initial Setup

```bash
# Clone the repository
git clone [repository-url]
cd PokerTrainer

# Install dependencies
npm install

# Start development server
npm start
```

### Available Scripts

- `npm start` - Start development server
- `npm test` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run validate` - Run all checks (lint, format, tests)

## Code Style Guide

### General Principles

1. **Clarity over cleverness** - Write code that is easy to understand
2. **Consistency** - Follow existing patterns in the codebase
3. **Self-documenting** - Use descriptive names and clear structure
4. **DRY** - Don't Repeat Yourself, but don't over-abstract

### JavaScript/React Guidelines

#### Naming Conventions

```javascript
// Components - PascalCase
const PokerTable = () => {};

// Functions - camelCase
const calculateEquity = () => {};

// Constants - UPPER_SNAKE_CASE
const MAX_PLAYERS = 6;

// Files
// - Components: PascalCase.jsx
// - Utilities: camelCase.js
// - Tests: *.test.js
```

#### Component Structure

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// 2. Component definition
const MyComponent = ({ prop1, prop2 }) => {
  // 3. State
  const [state, setState] = useState(initialValue);

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 5. Handlers
  const handleClick = () => {
    // Handler logic
  };

  // 6. Render helpers
  const renderContent = () => {
    // Render logic
  };

  // 7. Main render
  return <div>{/* JSX */}</div>;
};

// 8. PropTypes
MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

// 9. Export
export default MyComponent;
```

#### State Management

```javascript
// Prefer functional updates for state that depends on previous state
setState((prevState) => prevState + 1);

// Use object spreading for immutable updates
setState((prevState) => ({
  ...prevState,
  newProperty: value,
}));
```

#### Error Handling

```javascript
// Use try-catch for async operations
try {
  const result = await asyncOperation();
  handleSuccess(result);
} catch (error) {
  errorHandler.handleError(error, { context: 'asyncOperation' });
}

// Validate inputs
if (!isValidInput(input)) {
  throw createValidationError('input', 'Invalid input', input);
}
```

### CSS Guidelines

#### Naming Convention

```css
/* BEM-style naming */
.component-name {
}
.component-name__element {
}
.component-name--modifier {
}

/* Example */
.poker-table {
}
.poker-table__community-cards {
}
.poker-table--showdown {
}
```

#### Organization

```css
/* 1. Layout */
.component {
  display: flex;
  position: relative;

  /* 2. Sizing */
  width: 100%;
  height: 400px;

  /* 3. Spacing */
  margin: 20px;
  padding: 10px;

  /* 4. Typography */
  font-size: 16px;
  line-height: 1.5;

  /* 5. Visual */
  background-color: #fff;
  border: 1px solid #ccc;

  /* 6. Animation */
  transition: all 0.3s ease;
}
```

## Testing Guidelines

### Test Structure

```javascript
describe('ComponentName', () => {
  // Setup
  let mockData;

  beforeEach(() => {
    mockData = createMockData();
  });

  describe('feature/method', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### What to Test

1. **Unit Tests**
   - Pure functions
   - Component rendering
   - State changes
   - Event handlers

2. **Integration Tests**
   - Component interactions
   - Hook behavior
   - API interactions

3. **Coverage Goals**
   - Core game logic: 100%
   - UI components: 80%
   - Utilities: 100%

### Testing Best Practices

```javascript
// Use descriptive test names
it('should calculate correct pot odds when facing a river bet', () => {});

// Test edge cases
it('should handle all-in scenarios with multiple side pots', () => {});

// Use test utilities
import { createCard, createPokerHand } from '../test-utils';

// Mock external dependencies
jest.mock('../services/logger');
```

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/what-is-refactored` - Code refactoring
- `docs/what-docs` - Documentation updates

### Commit Messages

```
type(scope): subject

body

footer
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```
feat(gto): add range visualization component

- Implement 13x13 hand grid
- Add range preset selections
- Include hover tooltips

Closes #123
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes following guidelines
3. Run `npm run validate`
4. Create PR with description
5. Address review feedback
6. Merge after approval

## Performance Guidelines

### React Optimization

```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Render */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Use useCallback for stable references
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Code Splitting

```javascript
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>;
```

### Performance Monitoring

```javascript
// Use the performance timer
const timer = logger.startTimer('expensive-operation');
performExpensiveOperation();
timer.end();
```

## Debugging

### Debug Tools

1. **React DevTools** - Component inspection
2. **Redux DevTools** - State debugging (if using Redux)
3. **Chrome DevTools** - Performance profiling

### Debug Utilities

```javascript
// Add debug logging
logger.debug(LogCategory.GAME, 'Game state updated', { gameState });

// Conditional debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

### Common Issues

#### State Not Updating

```javascript
// Wrong - mutating state
state.property = newValue;

// Correct - creating new state
setState((prevState) => ({
  ...prevState,
  property: newValue,
}));
```

#### Effect Running Too Often

```javascript
// Check dependencies
useEffect(() => {
  // Effect
}, [dependency]); // Ensure correct dependencies
```

## Deployment

### Production Build

```bash
# Create optimized build
npm run build

# Test production build locally
npx serve -s build
```

### Environment Variables

```bash
# .env.local
REACT_APP_API_URL=http://localhost:3001
REACT_APP_VERSION=$npm_package_version
```

### Pre-deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility checked
- [ ] Cross-browser tested
- [ ] Mobile responsive
- [ ] Error tracking configured
- [ ] Analytics configured

## Troubleshooting

### Common Problems

#### Dependencies Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Failures

```bash
# Clear build cache
rm -rf build
npm run build
```

#### Test Failures

```bash
# Run single test file
npm test -- Card.test.js

# Update snapshots
npm test -- -u
```

## Resources

### Documentation

- [React Documentation](https://react.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

### Poker Resources

- [Poker Hand Rankings](https://www.pokerstars.com/poker/games/rules/hand-rankings/)
- [GTO Concepts](https://www.pokercoaching.com/gto)
- [Pot Odds Calculator](https://www.pokernews.com/poker-tools/poker-odds-calculator.htm)

### Tools

- [VS Code Extensions](https://marketplace.visualstudio.com/)
  - ESLint
  - Prettier
  - GitLens
  - React snippets
