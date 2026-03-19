import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PracticeSession from '../PracticeSession';
import ScenarioGenerator from '../../../game/engine/ScenarioGenerator';

// Mock ScenarioGenerator to return deterministic scenarios
vi.mock('../../../game/engine/ScenarioGenerator');

const mockPreflopScenario = {
  phase: 'preflop',
  heroPosition: 'BTN',
  heroHand: [
    { rank: 'A', suit: 's' },
    { rank: 'K', suit: 'h' },
  ],
  board: [],
  description: 'You are on the button with AKo. Action folds to you.',
  potSize: 30,
  toCall: 0,
  correctActions: [
    { action: 'raise', isOptimal: true, explanation: 'Standard open raise with AKo on button.' },
    {
      action: 'call',
      isOptimal: false,
      explanation: 'Calling is suboptimal with such a strong hand.',
    },
  ],
};

const mockQuizScenario = {
  type: 'multiple_choice',
  concept: 'position',
  question: 'Which position acts last postflop?',
  options: ['UTG', 'Button', 'Big Blind', 'Small Blind'],
  correctAnswer: 'Button',
  explanation: 'The button always acts last postflop.',
};

describe('PracticeSession', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    ScenarioGenerator.generatePreflopScenario.mockReturnValue(mockPreflopScenario);
    ScenarioGenerator.generatePostflopScenario.mockReturnValue(mockPreflopScenario);
    ScenarioGenerator.generateQuizQuestion.mockReturnValue(mockQuizScenario);
  });

  describe('Setup Screen', () => {
    test('should render setup screen initially', () => {
      render(<PracticeSession onComplete={mockOnComplete} />);

      expect(screen.getByText('Configure Practice Session')).toBeInTheDocument();
      expect(screen.getByText('Start Practice Session')).toBeInTheDocument();
    });

    test('should show difficulty options', () => {
      render(<PracticeSession onComplete={mockOnComplete} />);

      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    test('should show session type options', () => {
      render(<PracticeSession onComplete={mockOnComplete} />);

      expect(screen.getByText('Preflop Decisions')).toBeInTheDocument();
      expect(screen.getByText('Postflop Play')).toBeInTheDocument();
      expect(screen.getByText('Concept Quiz')).toBeInTheDocument();
    });

    test('should show session preview for selected type', () => {
      render(<PracticeSession onComplete={mockOnComplete} />);

      expect(screen.getByText(/Practice preflop decisions/)).toBeInTheDocument();
    });

    test('should switch difficulty', async () => {
      render(<PracticeSession onComplete={mockOnComplete} />);

      await userEvent.click(screen.getByText('Advanced'));

      // The button should have active class
      expect(screen.getByText('Advanced').className).toContain('active');
    });

    test('should switch session type', async () => {
      render(<PracticeSession onComplete={mockOnComplete} />);

      await userEvent.click(screen.getByText('Concept Quiz'));

      expect(screen.getByText(/Test your knowledge of poker concepts/)).toBeInTheDocument();
    });
  });

  describe('Active Session — Preflop Scenario', () => {
    const startSession = async () => {
      render(<PracticeSession onComplete={mockOnComplete} />);
      await userEvent.click(screen.getByText('Start Practice Session'));
    };

    test('should start session and show scenario', async () => {
      await startSession();

      expect(screen.getByText('Your Hand')).toBeInTheDocument();
      expect(screen.getByText(/You are on the button/)).toBeInTheDocument();
    });

    test('should display session stats', async () => {
      await startSession();

      expect(screen.getByText('Correct')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Streak')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    test('should allow action selection', async () => {
      await startSession();

      const raiseButton = screen.getByText('Raise');
      await userEvent.click(raiseButton);

      expect(raiseButton.className).toContain('selected');
    });

    test('should show submit button that is disabled without selection', async () => {
      await startSession();

      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).toBeDisabled();
    });

    test('should enable submit after action selection', async () => {
      await startSession();

      await userEvent.click(screen.getByText('Fold'));

      expect(screen.getByText('Submit Answer')).not.toBeDisabled();
    });

    test('should show result after submission', async () => {
      await startSession();

      await userEvent.click(screen.getByText('Raise'));
      await userEvent.click(screen.getByText('Submit Answer'));

      expect(screen.getByText('Optimal Play!')).toBeInTheDocument();
      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    test('should update stats on correct answer', async () => {
      await startSession();

      await userEvent.click(screen.getByText('Raise'));
      await userEvent.click(screen.getByText('Submit Answer'));

      expect(screen.getByText('1/1')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('should advance to next question', async () => {
      await startSession();

      await userEvent.click(screen.getByText('Raise'));
      await userEvent.click(screen.getByText('Submit Answer'));
      await userEvent.click(screen.getByText('Next Question'));

      // Should generate a new scenario
      expect(ScenarioGenerator.generatePreflopScenario).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Submit Answer')).toBeInTheDocument();
    });
  });

  describe('End Session', () => {
    test('should call onComplete with stats and reset', async () => {
      render(<PracticeSession onComplete={mockOnComplete} />);
      await userEvent.click(screen.getByText('Start Practice Session'));

      await userEvent.click(screen.getByText('Raise'));
      await userEvent.click(screen.getByText('Submit Answer'));

      await userEvent.click(screen.getByText('End Session'));

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          correct: 1,
          total: 1,
        })
      );

      // Should return to setup
      expect(screen.getByText('Configure Practice Session')).toBeInTheDocument();
    });
  });

  describe('Quiz Mode', () => {
    test('should render quiz question for quiz session type', async () => {
      render(<PracticeSession onComplete={mockOnComplete} />);
      await userEvent.click(screen.getByText('Concept Quiz'));
      await userEvent.click(screen.getByText('Start Practice Session'));

      expect(screen.getByText('Which position acts last postflop?')).toBeInTheDocument();
      expect(screen.getByText('UTG')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    test('should mark correct answer in quiz mode', async () => {
      render(<PracticeSession onComplete={mockOnComplete} />);
      await userEvent.click(screen.getByText('Concept Quiz'));
      await userEvent.click(screen.getByText('Start Practice Session'));

      await userEvent.click(screen.getByText('Button'));
      await userEvent.click(screen.getByText('Submit Answer'));

      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText('The button always acts last postflop.')).toBeInTheDocument();
    });
  });
});
