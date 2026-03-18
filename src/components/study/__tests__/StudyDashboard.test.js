import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StudyDashboard from '../StudyDashboard';

// Mock child components to avoid cascading dependencies
jest.mock('../PracticeSession', () => {
  return function MockPracticeSession({ onComplete, onExit }) {
    return (
      <div data-testid="practice-session">
        <button onClick={() => onComplete({ correct: 5, total: 8, streak: 3, maxStreak: 4 })}>
          Complete Session
        </button>
        <button onClick={onExit}>Exit</button>
      </div>
    );
  };
});

jest.mock('../ConceptsLibrary', () => {
  return function MockConceptsLibrary() {
    return <div data-testid="concepts-library">Concepts Library</div>;
  };
});

jest.mock('../HandHistoryDashboard', () => {
  return function MockHandHistoryDashboard() {
    return <div data-testid="hand-history-dashboard">Hand History</div>;
  };
});

describe('StudyDashboard', () => {
  describe('Tab Navigation', () => {
    test('should render overview tab by default', () => {
      render(<StudyDashboard />);

      expect(screen.getByText('Study Overview')).toBeInTheDocument();
    });

    test('should render all navigation tabs', () => {
      render(<StudyDashboard />);

      expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Practice' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Progress' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Concepts' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hand History' })).toBeInTheDocument();
    });

    test('should switch to practice tab', async () => {
      render(<StudyDashboard />);

      await userEvent.click(screen.getByRole('button', { name: 'Practice' }));

      expect(screen.getByTestId('practice-session')).toBeInTheDocument();
    });

    test('should switch to concepts tab', async () => {
      render(<StudyDashboard />);

      await userEvent.click(screen.getByRole('button', { name: 'Concepts' }));

      expect(screen.getByTestId('concepts-library')).toBeInTheDocument();
    });

    test('should switch to hand history tab', async () => {
      render(<StudyDashboard />);

      await userEvent.click(screen.getByRole('button', { name: 'Hand History' }));

      expect(screen.getByTestId('hand-history-dashboard')).toBeInTheDocument();
    });

    test('should show progress placeholder', async () => {
      render(<StudyDashboard />);

      await userEvent.click(screen.getByRole('button', { name: 'Progress' }));

      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
    });
  });

  describe('Overview Stats', () => {
    test('should display initial zero stats', () => {
      render(<StudyDashboard />);

      expect(screen.getByText('Study Sessions')).toBeInTheDocument();
      expect(screen.getByText('Overall Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Best Streak')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('should have quick start button that opens practice', async () => {
      render(<StudyDashboard />);

      await userEvent.click(screen.getByText('Start Practice Session'));

      expect(screen.getByTestId('practice-session')).toBeInTheDocument();
    });
  });

  describe('Session Completion', () => {
    test('should update stats when session completes', async () => {
      render(<StudyDashboard />);

      // Navigate to practice
      await userEvent.click(screen.getByRole('button', { name: 'Practice' }));

      // Complete session (mock fires stats: 5 correct, 8 total, maxStreak 4)
      await userEvent.click(screen.getByText('Complete Session'));

      // Should return to overview with updated stats
      expect(screen.getByText('Study Overview')).toBeInTheDocument();
      expect(screen.getByText('63%')).toBeInTheDocument(); // 5/8 = 62.5% rounded
      expect(screen.getByText('Sessions completed')).toBeInTheDocument();
    });

    test('should track best streak across sessions', async () => {
      render(<StudyDashboard />);

      // First session
      await userEvent.click(screen.getByRole('button', { name: 'Practice' }));
      await userEvent.click(screen.getByText('Complete Session'));

      // Best streak should be 4 (from mock)
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });
});
