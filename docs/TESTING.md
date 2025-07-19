# Testing Guide

## Overview

PokerTrainer uses a comprehensive testing strategy to ensure code quality and reliability. We use Jest as our test runner and React Testing Library for component testing.

## Test Structure

```
src/
├── core/
│   ├── game/
│   │   └── __tests__/
│   │       ├── Card.test.js
│   │       ├── Deck.test.js
│   │       ├── HandEvaluator.test.js
│   │       └── ...
│   ├── gto/
│   │   └── __tests__/
│   └── study/
│       └── __tests__/
├── components/
│   └── __tests__/
└── test-utils/
    ├── poker-test-helpers.js
    └── react-test-helpers.js
```

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm test -- --watchAll=false

# Run with coverage
npm run test:coverage

# Run specific test file
npm test Card.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should evaluate royal flush"

# Update snapshots
npm test -- -u

# Debug tests
npm test -- --runInBand --detectOpenHandles
```

## Writing Tests

### Unit Tests

#### Testing Pure Functions

```javascript
// HandEvaluator.test.js
import HandEvaluator from '../HandEvaluator';
import { createCards } from '../../../test-utils';

describe('HandEvaluator', () => {
  describe('evaluate', () => {
    it('should evaluate royal flush correctly', () => {
      // Arrange
      const cards = createCards(['As', 'Ks', 'Qs', 'Js', '10s', '9s', '8s']);

      // Act
      const result = HandEvaluator.evaluate(cards);

      // Assert
      expect(result.rank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
      expect(result.description).toBe('Royal Flush');
      expect(result.cards).toHaveLength(5);
    });
  });
});
```

#### Testing Classes

```javascript
// Player.test.js
describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player('player1', 'John', 1000, 0);
  });

  describe('bet', () => {
    it('should deduct chips and update current bet', () => {
      player.bet(100);

      expect(player.chips).toBe(900);
      expect(player.currentBet).toBe(100);
    });

    it('should throw error when betting more than available chips', () => {
      expect(() => player.bet(1500)).toThrow('Insufficient chips');
    });
  });
});
```

### Component Tests

#### Basic Component Test

```javascript
// Card.test.jsx
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  it('should render card with correct rank and suit', () => {
    render(<Card rank="A" suit="s" />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('♠')).toBeInTheDocument();
  });

  it('should apply correct color class', () => {
    const { container } = render(<Card rank="K" suit="h" />);

    expect(container.firstChild).toHaveClass('card--red');
  });
});
```

#### Testing User Interactions

```javascript
// BettingControls.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BettingControls from '../BettingControls';

describe('BettingControls', () => {
  const mockOnAction = jest.fn();
  const defaultProps = {
    onAction: mockOnAction,
    minBet: 20,
    maxBet: 1000,
    callAmount: 50,
    canCheck: false,
  };

  beforeEach(() => {
    mockOnAction.mockClear();
  });

  it('should call onAction with correct bet amount', async () => {
    const user = userEvent.setup();
    render(<BettingControls {...defaultProps} />);

    const input = screen.getByRole('spinbutton');
    const betButton = screen.getByText('Bet');

    await user.clear(input);
    await user.type(input, '100');
    await user.click(betButton);

    expect(mockOnAction).toHaveBeenCalledWith('bet', 100);
  });
});
```

#### Testing Hooks

```javascript
// usePokerGame.test.js
import { renderHook, act } from '@testing-library/react';
import usePokerGame from '../usePokerGame';

describe('usePokerGame', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePokerGame());

    expect(result.current.gameState).toBe('waiting');
    expect(result.current.players).toHaveLength(6);
    expect(result.current.pot).toBe(0);
  });

  it('should handle player action', () => {
    const { result } = renderHook(() => usePokerGame());

    act(() => {
      result.current.startNewGame();
    });

    act(() => {
      result.current.handleAction('fold');
    });

    expect(result.current.currentPlayer.isFolded).toBe(true);
  });
});
```

### Integration Tests

#### Testing Component Integration

```javascript
// PokerTable.integration.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PokerTable from '../PokerTable';

describe('PokerTable Integration', () => {
  it('should complete a full betting round', async () => {
    const user = userEvent.setup();
    render(<PokerTable />);

    // Start game
    await user.click(screen.getByText('New Game'));

    // Wait for cards to be dealt
    await waitFor(() => {
      expect(screen.getByText(/Your Turn/)).toBeInTheDocument();
    });

    // Make a bet
    await user.click(screen.getByText('Bet'));

    // Verify pot updated
    expect(screen.getByText(/Pot: \$\d+/)).toBeInTheDocument();
  });
});
```

## Test Utilities

### Custom Test Helpers

```javascript
// test-utils/poker-test-helpers.js
export const createTestScenario = (scenario) => {
  const scenarios = {
    headsUp: {
      players: [
        { id: '1', chips: 1000, cards: createCards(['As', 'Kh']) },
        { id: '2', chips: 1000, cards: createCards(['Qd', 'Qc']) },
      ],
      communityCards: createCards(['Ah', '7s', '2d']),
      pot: 100,
    },
  };

  return scenarios[scenario];
};

// Usage in tests
const { players, communityCards } = createTestScenario('headsUp');
```

### Custom Matchers

```javascript
// test-utils/custom-matchers.js
expect.extend({
  toBeValidCard(received) {
    const pass =
      received &&
      typeof received.rank === 'string' &&
      typeof received.suit === 'string' &&
      RANKS.includes(received.rank) &&
      SUITS.includes(received.suit);

    return {
      pass,
      message: () => `expected ${received} to ${pass ? 'not ' : ''}be a valid card`,
    };
  },
});

// Usage
expect(card).toBeValidCard();
```

### Mock Factories

```javascript
// test-utils/mocks.js
export const createMockGameEngine = (overrides = {}) => ({
  startNewGame: jest.fn(),
  dealCards: jest.fn(),
  handlePlayerAction: jest.fn(),
  getValidActions: jest.fn(() => ['fold', 'call', 'raise']),
  ...overrides,
});
```

## Testing Best Practices

### 1. Test Structure

```javascript
// Follow AAA pattern
it('should do something', () => {
  // Arrange - setup test data
  const input = 'test';

  // Act - perform the action
  const result = functionUnderTest(input);

  // Assert - verify the result
  expect(result).toBe('expected');
});
```

### 2. Descriptive Test Names

```javascript
// Bad
it('should work', () => {});

// Good
it('should calculate pot odds correctly when facing a river bet', () => {});
```

### 3. Test Isolation

```javascript
// Reset state between tests
beforeEach(() => {
  jest.clearAllMocks();
  cleanup(); // RTL cleanup
});

// Use test data factories
const player = createMockPlayer({ chips: 500 });
```

### 4. Avoid Implementation Details

```javascript
// Bad - testing implementation
expect(component.state.isOpen).toBe(true);

// Good - testing behavior
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

### 5. Use Data Test IDs Sparingly

```javascript
// Prefer accessible queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');

// Use data-testid only when necessary
<div data-testid="complex-component" />;
```

## Testing Async Code

### Testing Promises

```javascript
it('should load data', async () => {
  render(<DataComponent />);

  // Wait for async operation
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Testing Timers

```javascript
it('should show notification temporarily', () => {
  jest.useFakeTimers();
  render(<Notification />);

  expect(screen.getByText('Success!')).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(3000);
  });

  expect(screen.queryByText('Success!')).not.toBeInTheDocument();

  jest.useRealTimers();
});
```

## Performance Testing

### Rendering Performance

```javascript
it('should render large list efficiently', () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));

  const { rerender } = render(<LargeList items={items} />);

  // Measure re-render time
  const start = performance.now();
  rerender(<LargeList items={items} />);
  const end = performance.now();

  expect(end - start).toBeLessThan(16); // 60fps
});
```

### Memory Leak Detection

```javascript
it('should cleanup subscriptions on unmount', () => {
  const unsubscribe = jest.fn();
  const subscribe = jest.fn(() => unsubscribe);

  const { unmount } = render(<Component onSubscribe={subscribe} />);

  expect(subscribe).toHaveBeenCalled();

  unmount();

  expect(unsubscribe).toHaveBeenCalled();
});
```

## Debugging Tests

### Visual Debugging

```javascript
import { screen, prettyDOM } from '@testing-library/react';

it('should debug component', () => {
  render(<ComplexComponent />);

  // Print specific element
  console.log(prettyDOM(screen.getByRole('button')));

  // Print entire document
  screen.debug();

  // Print with depth limit
  screen.debug(undefined, 300000);
});
```

### Debugging State

```javascript
it('should debug hook state', () => {
  const { result } = renderHook(() => useCustomHook());

  console.log('Current state:', result.current);

  act(() => {
    result.current.updateState('new value');
  });

  console.log('Updated state:', result.current);
});
```

## Coverage Reports

### Understanding Coverage

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.5  |    78.2  |   88.3  |   85.5  |
 Card.js            |   100   |    100   |   100   |   100   |
 Deck.js            |   95.5  |    90    |   100   |   95.5  | 45-47
 HandEvaluator.js   |   88.2  |    82.5  |   90    |   88.2  | 125,145-150
--------------------|---------|----------|---------|---------|-------------------
```

### Improving Coverage

1. **Identify uncovered lines**: Check coverage report
2. **Test edge cases**: Error conditions, boundaries
3. **Test all branches**: If/else, switch statements
4. **Test error paths**: Try/catch blocks

### Coverage Goals

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+
- Critical paths: 100%

## Continuous Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

## Common Testing Patterns

### Testing Error States

```javascript
it('should handle errors gracefully', async () => {
  const mockError = new Error('API Error');
  mockFetch.mockRejectedValueOnce(mockError);

  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```javascript
it('should show loading state', async () => {
  render(<AsyncComponent />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

### Testing Form Validation

```javascript
it('should validate required fields', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```
