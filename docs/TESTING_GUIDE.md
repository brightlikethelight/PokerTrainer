# PokerTrainer Testing Guide

## Overview

This guide provides comprehensive information about testing strategies, tools, and best practices for the PokerTrainer application.

## Testing Philosophy

Our testing approach follows these principles:

1. **Test Behavior, Not Implementation** - Focus on what the code does, not how
2. **Fast Feedback** - Tests should run quickly to encourage frequent execution
3. **Reliable Tests** - No flaky tests; deterministic outcomes
4. **Meaningful Coverage** - Quality over quantity
5. **Living Documentation** - Tests serve as usage examples

## Test Structure

### Test Pyramid

```
        ┌─────┐
        │ E2E │        5%  - Critical user journeys
       ┌┴─────┴┐
       │ Integ │      15%  - System interactions
      ┌┴───────┴┐
      │  Unit   │     80%  - Individual components
     └───────────┘
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test HandEvaluator.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should evaluate royal flush"
```

### Integration Tests

```bash
# Run integration tests
npm test -- tests/integration

# Run specific integration suite
npm test LearningOrchestrator.integration.test.js
```

### E2E Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests (headed - see browser)
npm run test:e2e:headed

# Run specific E2E suite
npm run test:e2e -- poker-game.e2e.test.js
```

### Performance Tests

```bash
# Run performance tests
npm test -- tests/performance

# Run with performance profiling
npm test -- --detectLeaks tests/performance
```

## Unit Testing

### Game Engine Tests

**Example: Testing HandEvaluator**

```javascript
describe('HandEvaluator', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new HandEvaluator();
  });

  describe('Hand Rankings', () => {
    test('should evaluate royal flush correctly', () => {
      const cards = [
        new Card('A', 'hearts'),
        new Card('K', 'hearts'),
        new Card('Q', 'hearts'),
        new Card('J', 'hearts'),
        new Card('10', 'hearts'),
        new Card('9', 'hearts'),
        new Card('8', 'hearts'),
      ];

      const result = evaluator.evaluateHand(cards);

      expect(result.rank).toBe(9); // Royal flush
      expect(result.name).toBe('Royal Flush');
      expect(result.cards).toHaveLength(5);
      expect(result.cards[0].rank).toBe('A');
    });
  });
});
```

### Intelligence System Tests

**Example: Testing WeaknessDetector**

```javascript
describe('WeaknessDetector', () => {
  let detector;
  let testData;

  beforeEach(() => {
    detector = new WeaknessDetector();
    testData = TestDataFactory.createUserHistory('intermediate');
  });

  test('should identify position-based weaknesses', () => {
    const hands = testData.hands.map((hand) => ({
      ...hand,
      position: 'UTG',
      action: 'call',
      isCorrect: false,
    }));

    const analysis = detector.analyzeHands(hands);

    expect(analysis.primary.skill).toBe('position-awareness');
    expect(analysis.primary.confidence).toBeGreaterThan(0.7);
  });
});
```

### Component Tests

**Example: Testing React Components**

```javascript
describe('BettingControls', () => {
  test('should disable buttons when not player turn', () => {
    const mockOnAction = jest.fn();

    render(
      <BettingControls
        isPlayerTurn={false}
        validActions={['fold', 'call', 'raise']}
        onAction={mockOnAction}
        pot={1000}
        toCall={200}
      />
    );

    const foldButton = screen.getByRole('button', { name: /fold/i });
    expect(foldButton).toBeDisabled();

    fireEvent.click(foldButton);
    expect(mockOnAction).not.toHaveBeenCalled();
  });
});
```

## Integration Testing

### System Integration Tests

**Example: Testing Intelligence Orchestration**

```javascript
describe('Learning Intelligence Orchestration', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new LearningIntelligenceOrchestrator();
  });

  test('should coordinate all systems during session', async () => {
    // Initialize session
    const session = await orchestrator.initializeSession('test-user', 'practice');

    expect(session.success).toBe(true);
    expect(session.session.plan).toBeDefined();

    // Process multiple hands
    for (let i = 0; i < 5; i++) {
      const handResult = TestDataFactory.createHandResult({
        isCorrect: Math.random() > 0.5,
      });

      const result = await orchestrator.processHandCompletion(handResult);

      expect(result.handProcessed).toBe(true);
      expect(result.difficultyAdjustment).toBeDefined();
      expect(result.performance).toBeDefined();
    }

    // Verify all systems updated
    const analytics = orchestrator.performanceAnalytics.getSessionAnalytics();
    expect(analytics.totalDecisions).toBe(5);
  });
});
```

### API Integration Tests

**Example: Testing Service Integration**

```javascript
describe('GTO Engine Integration', () => {
  let gtoEngine;
  let gameEngine;

  beforeEach(() => {
    gtoEngine = new GTOEngine();
    gameEngine = new GameEngine();
    setupTestGame(gameEngine);
  });

  test('should provide accurate recommendations', async () => {
    const gameState = gameEngine.getState();
    const handContext = {
      heroCards: ['As', 'Ks'],
      board: gameState.board,
      pot: gameState.pot.total,
      toCall: 200,
      position: 'BTN',
      phase: gameState.phase,
    };

    const analysis = await gtoEngine.analyzeHand(handContext);

    expect(analysis.recommendation).toBeDefined();
    expect(analysis.equity).toBeGreaterThanOrEqual(0);
    expect(analysis.equity).toBeLessThanOrEqual(1);
    expect(analysis.recommendation.action).toMatch(/fold|call|raise/);
  });
});
```

## E2E Testing

### User Journey Tests

**Example: Complete Game Flow**

```javascript
describe('Complete Poker Game E2E', () => {
  test('should play full game from start to finish', async () => {
    // Navigate to app
    await page.goto(BASE_URL);
    await page.waitForSelector('.poker-table');

    // Verify initial state
    const players = await page.$$('.player-seat');
    expect(players).toHaveLength(6);

    // Play through multiple hands
    for (let hand = 0; hand < 3; hand++) {
      // Wait for cards
      await page.waitForSelector('.player-cards .card');

      // Make decisions
      while (await page.$('.betting-controls button')) {
        const checkButton = await page.$('button[aria-label="Check"]');
        if (checkButton) {
          await checkButton.click();
        } else {
          const callButton = await page.$('button[aria-label="Call"]');
          await callButton.click();
        }

        await page.waitForTimeout(500);
      }

      // Wait for hand completion
      await page.waitForSelector('.hand-winner', { timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    // Verify game still running
    const gameActive = await page.$('.poker-table');
    expect(gameActive).toBeTruthy();
  });
});
```

### Performance E2E Tests

**Example: Load Testing**

```javascript
describe('Performance Under Load', () => {
  test('should handle rapid actions', async () => {
    await page.goto(BASE_URL);

    const metrics = [];

    // Perform rapid actions
    for (let i = 0; i < 20; i++) {
      const startTime = Date.now();

      // Click first available button
      const button = await page.$('.betting-controls button:enabled');
      if (button) {
        await button.click();
      }

      const responseTime = Date.now() - startTime;
      metrics.push(responseTime);

      await page.waitForTimeout(100);
    }

    // Analyze performance
    const avgResponseTime = metrics.reduce((a, b) => a + b) / metrics.length;
    const maxResponseTime = Math.max(...metrics);

    expect(avgResponseTime).toBeLessThan(200);
    expect(maxResponseTime).toBeLessThan(500);
  });
});
```

## Test Data Management

### Using TestDataFactory

```javascript
// Create test users
const beginner = TestDataFactory.createUserHistory('beginner');
const expert = TestDataFactory.createUserHistory('expert');

// Create specific scenarios
const allInScenario = TestDataFactory.createHandResult({
  action: 'all-in',
  pot: 10000,
  heroCards: ['As', 'Ac'],
});

// Create session data
const sessionData = TestDataFactory.createSessionData('marathon', {
  duration: 7200000, // 2 hours
  handsPlayed: 150,
});
```

### Mock Data Patterns

```javascript
// Mock AI decisions
jest.mock('@/core/game/AIPlayer', () => ({
  makeDecision: jest.fn().mockReturnValue({
    action: 'call',
    amount: 100,
  }),
}));

// Mock time-based operations
jest.useFakeTimers();
// ... perform time-sensitive operations
jest.advanceTimersByTime(5000);
jest.useRealTimers();

// Mock random outcomes
jest.spyOn(Math, 'random').mockReturnValue(0.5);
```

## Performance Testing

### Memory Leak Detection

```javascript
describe('Memory Leak Tests', () => {
  test('should not leak memory during extended play', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Simulate extended session
    for (let i = 0; i < 1000; i++) {
      const engine = new GameEngine();
      // ... play hands
      // Clean up
      engine.destroy();
    }

    global.gc(); // Force garbage collection
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;

    // Should not grow more than 10MB
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
  });
});
```

### Load Testing

```javascript
describe('Load Tests', () => {
  test('should handle concurrent sessions', async () => {
    const orchestrator = new LearningIntelligenceOrchestrator();

    // Create many concurrent sessions
    const sessionPromises = Array(50)
      .fill(null)
      .map((_, i) => orchestrator.initializeSession(`user-${i}`, 'practice'));

    const startTime = Date.now();
    const results = await Promise.allSettled(sessionPromises);
    const duration = Date.now() - startTime;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(5000);

    // Most should succeed
    const successful = results.filter((r) => r.status === 'fulfilled');
    expect(successful.length).toBeGreaterThan(45);
  });
});
```

## Debugging Tests

### Debug Utilities

```javascript
// Visual debugging in E2E tests
await page.screenshot({ path: 'debug-screenshot.png' });
await page.evaluate(() => debugger);

// Console logging in tests
console.log('Current state:', JSON.stringify(gameState, null, 2));

// Pause execution
await page.waitForTimeout(999999); // Pause indefinitely

// Interactive debugging
await page.evaluate(() => {
  window.DEBUG = true;
  console.log('Debug mode enabled');
});
```

### Common Issues and Solutions

1. **Flaky Tests**
   - Use explicit waits instead of arbitrary timeouts
   - Mock external dependencies
   - Ensure proper test isolation

2. **Slow Tests**
   - Use test data factories
   - Minimize DOM operations
   - Parallelize independent tests

3. **False Positives**
   - Verify actual behavior, not implementation
   - Use specific assertions
   - Test edge cases

## Continuous Integration

### CI Configuration

```yaml
# GitHub Actions example
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
    - run: npm ci
    - run: npm run lint
    - run: npm run test:coverage
    - run: npm run test:e2e
    - uses: codecov/codecov-action@v2
```

### Pre-commit Hooks

```json
// package.json
"husky": {
  "hooks": {
    "pre-commit": "npm run lint && npm test -- --bail"
  }
}
```

## Best Practices

### Do's

- ✅ Write tests first (TDD)
- ✅ Keep tests simple and focused
- ✅ Use descriptive test names
- ✅ Test edge cases
- ✅ Mock external dependencies
- ✅ Clean up after tests

### Don'ts

- ❌ Test implementation details
- ❌ Write brittle tests
- ❌ Ignore failing tests
- ❌ Over-mock
- ❌ Share state between tests
- ❌ Use arbitrary waits

## Coverage Goals

### Target Coverage

- Overall: 85%+
- Core game logic: 95%+
- Intelligence systems: 90%+
- UI components: 80%+
- Utilities: 90%+

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## Testing Checklist

Before committing:

- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Coverage hasn't decreased
- [ ] No console.log in tests
- [ ] Tests are deterministic
- [ ] Performance benchmarks pass
      EOF < /dev/null
