# PokerTrainer Learning System Documentation

## Overview

The PokerTrainer Learning System is a comprehensive, session-based poker education framework that transforms passive gameplay into active skill development. Built on educational psychology principles, it provides structured practice with immediate feedback, adaptive difficulty, and personalized learning paths.

## Architecture

### Core Components

```
src/core/learning/
├── LearningSession.js      # Session state and progress tracking
├── HandCurator.js          # Curated scenario generation
└── SessionManager.js       # Session orchestration and persistence

src/components/learning/
├── LearningSessionView.jsx    # Active session interface
├── SessionSelectionView.jsx   # Session browser with progress
└── StudyDashboardEnhanced.jsx # Main learning hub
```

## Key Features

### 1. Session-Based Learning

Each learning session focuses on a specific poker skill:

- **Pot Odds Mastery** - Mathematical decision making with drawing hands
- **Position Power** - Leveraging table position for profit
- **Preflop Fundamentals** - Opening ranges and hand selection
- **Bluff Catching** - Making tough river decisions
- **Bet Sizing Mastery** - Optimal betting for value and bluffs

### 2. Curated Hand Selection

Instead of random hands, the system presents carefully designed scenarios:

```javascript
{
  name: "Flush Draw Decision",
  holeCards: ['Ah', 'Kh'],
  board: ['Qh', '7h', '2c'],
  pot: 200,
  bet: 50,
  correctAction: 'call',
  explanation: "With 9 outs, you need ~18% equity. Pot odds: 20%. Clear call.",
  learningObjective: "Basic flush draw pot odds"
}
```

### 3. Immediate Feedback System

Every decision receives detailed feedback:

- **Correctness** - Was your decision optimal?
- **Explanation** - Why the correct play is best
- **Strategic Insight** - Deeper poker theory
- **Improvement Tips** - Personalized advice

### 4. Progress Tracking

Comprehensive analytics track improvement:

- Session accuracy and streaks
- Skill level progression
- Common mistake patterns
- Time-based performance trends

## Usage Guide

### Starting a Learning Session

1. Navigate to the Study tab
2. Click "Start Learning Session"
3. Choose a session type based on your needs
4. Select difficulty level (Beginner/Intermediate/Advanced)
5. Complete 15-25 curated hands with feedback

### Understanding Feedback

After each decision, you'll see:

```
✅ Excellent decision!

Your play: Call
Optimal: Call

Explanation: With a flush draw getting 20% pot odds and needing
only 18% equity, calling is profitable long-term.

Strategic Insight: Always compare your equity to the pot odds.
If equity > pot odds, calling is +EV.

💡 Tip: Quick math - with 9 outs on the flop, you have ~36%
chance to hit by the river (9 × 4).
```

### Tracking Progress

The system tracks:

- **Accuracy** - Percentage of correct decisions
- **Streaks** - Consecutive correct answers
- **Skill Levels** - Progress in each category
- **Session History** - Past performance data

## API Reference

### LearningSession

```javascript
class LearningSession {
  constructor(sessionType, userProfile = {})

  // Record a user decision
  recordDecision(userAction, correctAction, handData)

  // Get current accuracy
  getCurrentAccuracy()

  // Check if meeting target
  isOnTrack()

  // Complete session and get results
  completeSession()
}
```

### HandCurator

```javascript
class HandCurator {
  // Generate curated hands for a session
  curateSession(sessionType, difficulty, count)

  // Get next session recommendation
  getNextRecommendation(currentSession, accuracy, mistakes)

  // Analyze mistake patterns
  analyzeMistakes(mistakes)

  // Get session metadata
  getSessionMetadata(sessionType)
}
```

### SessionManager

```javascript
class SessionManager {
  // Start a new learning session
  startSession(sessionType, difficulty, customOptions)

  // Process user decision
  processDecision(userAction, betAmount)

  // Get current hand
  getCurrentHand()

  // Get user statistics
  getUserStats()
}
```

## Configuration

### Session Types Configuration

Sessions are defined in `HandCurator.js`:

```javascript
pot_odds_mastery: {
  title: 'Pot Odds Mastery',
  description: 'Recognize profitable calls with drawing hands',
  targetAccuracy: 0.80,
  handsToPlay: 15,
  timeEstimate: '10-15 minutes',
  difficulty: 'Beginner'
}
```

### Difficulty Levels

Each difficulty adjusts:

- **Beginner** - Clear decisions, simple math, helpful hints
- **Intermediate** - Closer decisions, complex scenarios
- **Advanced** - Marginal spots, multiple considerations

## Best Practices

### For Learners

1. **Start with fundamentals** - Complete pot odds and position sessions first
2. **Focus on accuracy over speed** - Take time to calculate
3. **Review mistakes** - Learn from incorrect decisions
4. **Practice regularly** - Short daily sessions beat long weekly ones

### For Developers

1. **Adding New Sessions**

   ```javascript
   // In HandCurator.js scenarios
   new_skill_type: {
     beginner: [...scenarios],
     intermediate: [...scenarios],
     advanced: [...scenarios]
   }
   ```

2. **Customizing Feedback**

   ```javascript
   // In SessionManager.js
   generateStrategicInsight(handData, isCorrect) {
     // Add skill-specific insights
   }
   ```

3. **Extending Analytics**
   ```javascript
   // Track custom metrics
   session.customMetrics = {
     responseTime: [],
     confidenceRating: [],
   };
   ```

## Troubleshooting

### Common Issues

1. **Session not loading**
   - Check browser console for errors
   - Verify localStorage is enabled
   - Clear cache and reload

2. **Progress not saving**
   - Ensure cookies/localStorage enabled
   - Check browser privacy settings
   - Try different browser

3. **Incorrect feedback**
   - Report specific scenario
   - Include hand details and decision
   - Check explanation logic

## Future Enhancements

### Phase 2 Features (Coming Soon)

- **Weakness Detection** - Automatic identification of skill gaps
- **Dynamic Hand Generation** - Infinite scenario variations
- **Adaptive Difficulty** - Real-time challenge adjustment
- **Spaced Repetition** - Long-term skill retention
- **Micro-Learning** - Quick lessons between hands

### Phase 3 Features (Planned)

- **Multiplayer Practice** - Learn with friends
- **Tournament Scenarios** - ICM and bubble play
- **Video Integration** - Watch pros in similar spots
- **Custom Scenarios** - Create your own practice hands

## Contributing

To add new learning content:

1. Define scenarios in `HandCurator.js`
2. Add session metadata
3. Create feedback logic
4. Test with various user paths
5. Document new features

## Performance Considerations

- Scenarios are loaded on-demand
- Progress saves every 5 decisions
- Analytics calculate async
- Hand curation uses memoization

## Conclusion

The PokerTrainer Learning System transforms poker education from passive observation to active skill building. By focusing on deliberate practice with immediate feedback, it accelerates the journey from beginner to expert.

For questions or support, please refer to the main README or submit an issue on GitHub.
