/**
 * PracticeSession Component
 * Interactive practice scenarios for poker training
 */

import { useState, useCallback } from 'react';

import ScenarioGenerator from '../../game/engine/ScenarioGenerator';
import './PracticeSession.css';

const PracticeSession = ({ onComplete, onExit: _onExit }) => {
  const [difficulty, setDifficulty] = useState('intermediate');
  const [sessionType, setSessionType] = useState('preflop'); // preflop, postflop, quiz
  const [scenario, setScenario] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
    maxStreak: 0,
  });
  const [sessionStarted, setSessionStarted] = useState(false);

  const startSession = useCallback(() => {
    setSessionStarted(true);
    // Generate scenario inline to avoid dependency issues
    setSelectedAction(null);
    setShowResult(false);

    let newScenario;
    if (sessionType === 'preflop') {
      newScenario = ScenarioGenerator.generatePreflopScenario(difficulty);
    } else if (sessionType === 'postflop') {
      newScenario = ScenarioGenerator.generatePostflopScenario(difficulty);
    } else {
      const concepts = ['position', 'pot_odds', 'hand_ranges', 'bet_sizing'];
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      newScenario = ScenarioGenerator.generateQuizQuestion(concept);
    }
    setScenario(newScenario);
  }, [difficulty, sessionType]);

  const generateNewScenario = useCallback(() => {
    setSelectedAction(null);
    setShowResult(false);

    let newScenario;
    if (sessionType === 'preflop') {
      newScenario = ScenarioGenerator.generatePreflopScenario(difficulty);
    } else if (sessionType === 'postflop') {
      newScenario = ScenarioGenerator.generatePostflopScenario(difficulty);
    } else {
      const concepts = ['position', 'pot_odds', 'hand_ranges', 'bet_sizing'];
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      newScenario = ScenarioGenerator.generateQuizQuestion(concept);
    }

    setScenario(newScenario);
  }, [difficulty, sessionType]);

  const handleActionSelect = (action) => {
    if (showResult) return;
    setSelectedAction(action);
  };

  const handleSubmit = () => {
    if (!selectedAction) return;

    setShowResult(true);

    // Determine if answer was correct
    let isCorrect = false;

    if (scenario.type === 'multiple_choice' || scenario.type === 'calculation') {
      // Quiz question
      isCorrect = selectedAction === scenario.correctAnswer;
    } else {
      // Scenario - check if selected action matches any optimal action
      const optimalActions = scenario.correctActions.filter((a) => a.isOptimal);
      isCorrect = optimalActions.some((a) => a.action === selectedAction);
    }

    setStats((prev) => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
      };
    });
  };

  const handleNext = () => {
    generateNewScenario();
  };

  const handleEndSession = () => {
    if (onComplete) {
      onComplete(stats);
    }
    setSessionStarted(false);
    setScenario(null);
    setStats({ correct: 0, total: 0, streak: 0, maxStreak: 0 });
  };

  const formatCard = (card) => {
    const suitSymbols = { s: '\u2660', h: '\u2665', d: '\u2666', c: '\u2663' };
    const suitColors = { s: '#000', h: '#e74c3c', d: '#3498db', c: '#27ae60' };
    const suit = card.suit;

    return (
      <span className="card" style={{ color: suitColors[suit] }}>
        {card.rank}
        {suitSymbols[suit]}
      </span>
    );
  };

  const renderSetup = () => (
    <div className="session-setup">
      <h2>Configure Practice Session</h2>

      <div className="setup-option">
        <span className="option-label">Difficulty</span>
        <div className="button-group">
          {['beginner', 'intermediate', 'advanced'].map((d) => (
            <button
              key={d}
              className={`option-button ${difficulty === d ? 'active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="setup-option">
        <span className="option-label">Session Type</span>
        <div className="button-group">
          {[
            { key: 'preflop', label: 'Preflop Decisions' },
            { key: 'postflop', label: 'Postflop Play' },
            { key: 'quiz', label: 'Concept Quiz' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`option-button ${sessionType === key ? 'active' : ''}`}
              onClick={() => setSessionType(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="setup-info">
        <h3>Session Preview</h3>
        {sessionType === 'preflop' && (
          <p>
            Practice preflop decisions: opening ranges, calling vs 3-bets, and position awareness.
          </p>
        )}
        {sessionType === 'postflop' && (
          <p>
            Practice postflop decisions: continuation bets, facing bets, bluffing, and value
            betting.
          </p>
        )}
        {sessionType === 'quiz' && (
          <p>
            Test your knowledge of poker concepts: position, pot odds, hand ranges, and bet sizing.
          </p>
        )}
      </div>

      <button className="start-session-button" onClick={startSession}>
        Start Practice Session
      </button>
    </div>
  );

  const renderScenario = () => {
    if (!scenario) return null;

    // Quiz question
    if (scenario.type === 'multiple_choice' || scenario.type === 'calculation') {
      return (
        <div className="quiz-container">
          <div className="quiz-header">
            <span className="concept-tag">{scenario.concept}</span>
          </div>

          <div className="quiz-question">{scenario.question}</div>

          <div className="quiz-options">
            {scenario.options.map((option) => (
              <button
                key={option}
                className={`quiz-option ${selectedAction === option ? 'selected' : ''} ${
                  showResult
                    ? option === scenario.correctAnswer
                      ? 'correct'
                      : selectedAction === option
                        ? 'incorrect'
                        : ''
                    : ''
                }`}
                onClick={() => handleActionSelect(option)}
                disabled={showResult}
              >
                {option}
              </button>
            ))}
          </div>

          {showResult && (
            <div className="result-explanation">
              <h4>{selectedAction === scenario.correctAnswer ? 'Correct!' : 'Incorrect'}</h4>
              <p>{scenario.explanation}</p>
            </div>
          )}
        </div>
      );
    }

    // Poker scenario
    return (
      <div className="scenario-container">
        <div className="scenario-header">
          <span className="phase-tag">{scenario.phase}</span>
          <span className="position-tag">{scenario.heroPosition}</span>
          <span className="difficulty-tag">{difficulty}</span>
        </div>

        <div className="hand-display">
          <h3>Your Hand</h3>
          <div className="cards">
            {scenario.heroHand.map((card, idx) => (
              <span key={idx}>{formatCard(card)}</span>
            ))}
          </div>
        </div>

        {scenario.board && scenario.board.length > 0 && (
          <div className="board-display">
            <h3>Board</h3>
            <div className="cards">
              {scenario.board.map((card, idx) => (
                <span key={idx}>{formatCard(card)}</span>
              ))}
            </div>
          </div>
        )}

        <div className="scenario-description">{scenario.description}</div>

        <div className="pot-info">
          <span>Pot: {scenario.potSize}</span>
          {scenario.toCall > 0 && <span>To Call: {scenario.toCall}</span>}
        </div>

        <div className="action-buttons">
          {['fold', 'check', 'call', 'bet', 'raise'].map((action) => {
            const isAvailable =
              scenario.correctActions.some((a) => a.action === action) ||
              action === 'fold' ||
              (action === 'check' && scenario.toCall === 0) ||
              (action === 'call' && scenario.toCall > 0);

            if (!isAvailable && action !== 'fold') return null;

            return (
              <button
                key={action}
                className={`action-button ${selectedAction === action ? 'selected' : ''} ${
                  showResult
                    ? scenario.correctActions.find((a) => a.action === action && a.isOptimal)
                      ? 'optimal'
                      : selectedAction === action
                        ? 'suboptimal'
                        : ''
                    : ''
                }`}
                onClick={() => handleActionSelect(action)}
                disabled={showResult}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
                {action === 'call' && scenario.toCall > 0 && ` (${scenario.toCall})`}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="result-panel">
            <h4>
              {scenario.correctActions.find((a) => a.action === selectedAction && a.isOptimal)
                ? 'Optimal Play!'
                : 'Not Optimal'}
            </h4>
            <div className="correct-actions">
              {scenario.correctActions.map((action, idx) => (
                <div
                  key={idx}
                  className={`action-explanation ${action.isOptimal ? 'optimal' : 'acceptable'}`}
                >
                  <strong>{action.action.charAt(0).toUpperCase() + action.action.slice(1)}</strong>
                  {action.isOptimal && <span className="optimal-badge">Optimal</span>}
                  <p>{action.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSession = () => (
    <div className="active-session">
      <div className="session-stats">
        <div className="stat">
          <span className="stat-label">Correct</span>
          <span className="stat-value">
            {stats.correct}/{stats.total}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">
            {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Streak</span>
          <span className="stat-value">{stats.streak}</span>
        </div>
      </div>

      {renderScenario()}

      <div className="session-controls">
        {!showResult && (
          <button className="submit-button" onClick={handleSubmit} disabled={!selectedAction}>
            Submit Answer
          </button>
        )}
        {showResult && (
          <button className="next-button" onClick={handleNext}>
            Next Question
          </button>
        )}
        <button className="end-button" onClick={handleEndSession}>
          End Session
        </button>
      </div>
    </div>
  );

  return (
    <div className="practice-session">{!sessionStarted ? renderSetup() : renderSession()}</div>
  );
};

export default PracticeSession;
