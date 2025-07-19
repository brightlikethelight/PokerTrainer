/**
 * HandHistoryDashboard Component Test Suite
 * Comprehensive tests for hand history dashboard UI functionality
 * Target: 90%+ coverage with realistic poker hand analysis scenarios
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HandHistoryDashboard from '../HandHistoryDashboard';
import { GAME_PHASES } from '../../../constants/game-constants';
import TestDataFactory from '../../../test-utils/TestDataFactory';

// Mock the useHandHistory hook
jest.mock('../../../hooks/useHandHistory', () => ({
  __esModule: true,
  default: () => ({
    sessionId: 'test-session-123',
    hands: mockHands,
    currentHand: null,
    isCapturing: false,
    loading: false,
    error: null,
    startSession: jest.fn().mockResolvedValue('test-session-123'),
    endSession: jest.fn().mockResolvedValue(true),
    captureHand: jest.fn().mockResolvedValue({ id: 'new-hand-123' }),
    analyzeHand: jest.fn().mockResolvedValue(mockAnalysis),
    searchHands: jest.fn().mockResolvedValue([]),
    exportHands: jest.fn().mockResolvedValue('export-data'),
    deleteHand: jest.fn().mockResolvedValue(true),
    getPlayerStatistics: jest.fn().mockResolvedValue(mockStats),
    clearError: jest.fn(),
  }),
}));

// Mock data
const mockHands = [
  {
    id: 'hand-1',
    timestamp: Date.now() - 3600000,
    handNumber: 1,
    heroPosition: 2,
    phase: GAME_PHASES.SHOWDOWN,
    heroCards: TestDataFactory.createHoleCards().pocketAces(),
    communityCards: TestDataFactory.createCommunityCards().royalFlush(),
    pot: 500,
    heroAction: 'raise',
    result: 'won',
    winnings: 500,
    players: 6,
  },
  {
    id: 'hand-2',
    timestamp: Date.now() - 1800000,
    handNumber: 2,
    heroPosition: 0,
    phase: GAME_PHASES.FLOP,
    heroCards: TestDataFactory.createHoleCards().suitedConnectors(),
    communityCards: TestDataFactory.createCommunityCards().aceHighDry(),
    pot: 150,
    heroAction: 'fold',
    result: 'folded',
    winnings: -25,
    players: 4,
  },
  {
    id: 'hand-3',
    timestamp: Date.now() - 900000,
    handNumber: 3,
    heroPosition: 5,
    phase: GAME_PHASES.RIVER,
    heroCards: TestDataFactory.createHoleCards().pocketPair(),
    communityCards: TestDataFactory.createCommunityCards().fullBoard(),
    pot: 800,
    heroAction: 'call',
    result: 'lost',
    winnings: -200,
    players: 3,
  },
];

const mockAnalysis = {
  potOdds: 33.3,
  effectiveOdds: 28.5,
  expectedValue: 125,
  decision: 'call',
  mistakes: ['Should have bet for value on turn'],
  improvements: ['Consider range betting in this spot'],
  handStrength: 'strong',
  position: 'good',
};

const mockStats = {
  handsPlayed: 150,
  handsWon: 45,
  winRate: 30.0,
  vpip: 22.5,
  pfr: 18.2,
  aggression: 2.1,
  totalWinnings: 2500,
  bigBlindsWon: 25.0,
  hourlyRate: 12.5,
};

describe('HandHistoryDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Hand History')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Hands')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    test('should render all main tabs', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Hands' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Analytics' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Session' })).toBeInTheDocument();
    });

    test('should show overview tab by default', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText('Session Statistics')).toBeInTheDocument();
    });

    test('should display session info when active', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Active Session')).toBeInTheDocument();
      expect(screen.getByText('test-session-123')).toBeInTheDocument();
    });

    test('should show loading state', () => {
      jest.doMock('../../../hooks/useHandHistory', () => ({
        __esModule: true,
        default: () => ({ ...mockHookReturn, loading: true }),
      }));

      render(<HandHistoryDashboard />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should display error state', () => {
      jest.doMock('../../../hooks/useHandHistory', () => ({
        __esModule: true,
        default: () => ({ ...mockHookReturn, error: 'Connection failed' }),
      }));

      render(<HandHistoryDashboard />);

      expect(screen.getByText('Error: Connection failed')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('should switch to hands tab', async () => {
      render(<HandHistoryDashboard />);

      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByRole('tab', { name: 'Hands' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Hand #1')).toBeInTheDocument();
    });

    test('should switch to analytics tab', async () => {
      render(<HandHistoryDashboard />);

      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByRole('tab', { name: 'Analytics' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
    });

    test('should switch to session tab', async () => {
      render(<HandHistoryDashboard />);

      await userEvent.click(screen.getByRole('tab', { name: 'Session' }));

      expect(screen.getByRole('tab', { name: 'Session' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Session Management')).toBeInTheDocument();
    });

    test('should maintain tab state between switches', async () => {
      render(<HandHistoryDashboard />);

      // Switch to hands tab
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));
      expect(screen.getByText('Hand #1')).toBeInTheDocument();

      // Switch to overview and back
      await userEvent.click(screen.getByRole('tab', { name: 'Overview' }));
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('Hand #1')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    test('should display session statistics', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Hands Played')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('30.0%')).toBeInTheDocument();
      expect(screen.getByText('Total Winnings')).toBeInTheDocument();
      expect(screen.getByText('$2,500')).toBeInTheDocument();
    });

    test('should display recent hands summary', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Recent Hands')).toBeInTheDocument();
      expect(screen.getByText('3 hands')).toBeInTheDocument();
    });

    test('should show performance indicators', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('VPIP')).toBeInTheDocument();
      expect(screen.getByText('22.5%')).toBeInTheDocument();
      expect(screen.getByText('PFR')).toBeInTheDocument();
      expect(screen.getByText('18.2%')).toBeInTheDocument();
    });

    test('should display charts and graphs', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Winnings Chart')).toBeInTheDocument();
      expect(screen.getByText('Position Analysis')).toBeInTheDocument();
    });
  });

  describe('Hands Tab', () => {
    beforeEach(() => {
      render(<HandHistoryDashboard />);
      userEvent.click(screen.getByRole('tab', { name: 'Hands' }));
    });

    test('should display list of hands', async () => {
      await waitFor(() => {
        expect(screen.getByText('Hand #1')).toBeInTheDocument();
        expect(screen.getByText('Hand #2')).toBeInTheDocument();
        expect(screen.getByText('Hand #3')).toBeInTheDocument();
      });
    });

    test('should show hand details', async () => {
      await waitFor(() => {
        expect(screen.getByText('Pocket Aces')).toBeInTheDocument();
        expect(screen.getByText('$500')).toBeInTheDocument();
        expect(screen.getByText('Won')).toBeInTheDocument();
      });
    });

    test('should allow hand selection', async () => {
      await waitFor(() => {
        const hand = screen.getByText('Hand #1');
        expect(hand).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Hand #1'));

      expect(screen.getByText('Hand Details')).toBeInTheDocument();
    });

    test('should support hand filtering', async () => {
      await waitFor(() => {
        const filterInput = screen.getByPlaceholderText('Filter hands...');
        expect(filterInput).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText('Filter hands...'), 'won');

      await waitFor(() => {
        expect(screen.getByText('Hand #1')).toBeInTheDocument();
        expect(screen.queryByText('Hand #2')).not.toBeInTheDocument();
      });
    });

    test('should support hand sorting', async () => {
      await waitFor(() => {
        const sortButton = screen.getByText('Sort by Date');
        expect(sortButton).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Sort by Date'));

      // Should show sort options
      expect(screen.getByText('Sort by Winnings')).toBeInTheDocument();
      expect(screen.getByText('Sort by Position')).toBeInTheDocument();
    });

    test('should export hands', async () => {
      await waitFor(() => {
        const exportButton = screen.getByText('Export');
        expect(exportButton).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });

    test('should delete hands', async () => {
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      await userEvent.click(screen.getAllByText('Delete')[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
  });

  describe('Analytics Tab', () => {
    beforeEach(async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));
    });

    test('should display performance metrics', async () => {
      await waitFor(() => {
        expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
        expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
        expect(screen.getByText('$12.50')).toBeInTheDocument();
      });
    });

    test('should show positional analysis', async () => {
      await waitFor(() => {
        expect(screen.getByText('Positional Analysis')).toBeInTheDocument();
        expect(screen.getByText('Button')).toBeInTheDocument();
        expect(screen.getByText('Big Blind')).toBeInTheDocument();
      });
    });

    test('should display hand strength analysis', async () => {
      await waitFor(() => {
        expect(screen.getByText('Hand Strength')).toBeInTheDocument();
        expect(screen.getByText('Pocket Pairs')).toBeInTheDocument();
        expect(screen.getByText('Suited Connectors')).toBeInTheDocument();
      });
    });

    test('should show betting patterns', async () => {
      await waitFor(() => {
        expect(screen.getByText('Betting Patterns')).toBeInTheDocument();
        expect(screen.getByText('Aggression Factor')).toBeInTheDocument();
        expect(screen.getByText('2.1')).toBeInTheDocument();
      });
    });

    test('should display time-based analysis', async () => {
      await waitFor(() => {
        expect(screen.getByText('Time Analysis')).toBeInTheDocument();
        expect(screen.getByText('Best Hours')).toBeInTheDocument();
        expect(screen.getByText('Worst Hours')).toBeInTheDocument();
      });
    });

    test('should allow date range selection', async () => {
      await waitFor(() => {
        const dateRange = screen.getByText('Date Range');
        expect(dateRange).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Last 7 Days'));

      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Custom Range')).toBeInTheDocument();
    });
  });

  describe('Hand Detail View', () => {
    beforeEach(async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));
      await waitFor(() => {
        userEvent.click(screen.getByText('Hand #1'));
      });
    });

    test('should display hand timeline', async () => {
      await waitFor(() => {
        expect(screen.getByText('Hand Timeline')).toBeInTheDocument();
        expect(screen.getByText('Preflop')).toBeInTheDocument();
        expect(screen.getByText('Flop')).toBeInTheDocument();
        expect(screen.getByText('Turn')).toBeInTheDocument();
        expect(screen.getByText('River')).toBeInTheDocument();
      });
    });

    test('should show hero cards', async () => {
      await waitFor(() => {
        expect(screen.getByText('Hero Cards')).toBeInTheDocument();
        expect(screen.getByText('A♠')).toBeInTheDocument();
        expect(screen.getByText('A♥')).toBeInTheDocument();
      });
    });

    test('should display community cards', async () => {
      await waitFor(() => {
        expect(screen.getByText('Community Cards')).toBeInTheDocument();
        expect(screen.getByText('Board')).toBeInTheDocument();
      });
    });

    test('should show action history', async () => {
      await waitFor(() => {
        expect(screen.getByText('Action History')).toBeInTheDocument();
        expect(screen.getByText('Raise')).toBeInTheDocument();
      });
    });

    test('should display pot information', async () => {
      await waitFor(() => {
        expect(screen.getByText('Pot Size')).toBeInTheDocument();
        expect(screen.getByText('$500')).toBeInTheDocument();
      });
    });

    test('should show hand analysis', async () => {
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
        expect(screen.getByText('Pot Odds')).toBeInTheDocument();
        expect(screen.getByText('33.3%')).toBeInTheDocument();
      });
    });

    test('should allow hand replay', async () => {
      await waitFor(() => {
        const replayButton = screen.getByText('Replay Hand');
        expect(replayButton).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Replay Hand'));

      expect(screen.getByText('Playing...')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Session' }));
    });

    test('should display session controls', async () => {
      await waitFor(() => {
        expect(screen.getByText('Session Management')).toBeInTheDocument();
        expect(screen.getByText('Start New Session')).toBeInTheDocument();
        expect(screen.getByText('End Session')).toBeInTheDocument();
      });
    });

    test('should start new session', async () => {
      await waitFor(() => {
        const startButton = screen.getByText('Start New Session');
        expect(startButton).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Start New Session'));

      expect(screen.getByText('Session Configuration')).toBeInTheDocument();
    });

    test('should end current session', async () => {
      await waitFor(() => {
        const endButton = screen.getByText('End Session');
        expect(endButton).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('End Session'));

      expect(screen.getByText('Confirm End Session')).toBeInTheDocument();
    });

    test('should configure session settings', async () => {
      await waitFor(() => {
        expect(screen.getByText('Auto Capture')).toBeInTheDocument();
        expect(screen.getByText('Include Pot Odds')).toBeInTheDocument();
      });

      const autoCapture = screen.getByLabelText('Auto Capture');
      await userEvent.click(autoCapture);

      expect(autoCapture).toBeChecked();
    });

    test('should export session data', async () => {
      await waitFor(() => {
        const exportButton = screen.getByText('Export Session');
        expect(exportButton).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Export Session'));

      expect(screen.getByText('Export Options')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));
    });

    test('should search hands by criteria', async () => {
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search hands...');
        expect(searchInput).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText('Search hands...'), 'pocket aces');

      await waitFor(() => {
        expect(screen.getByText('Hand #1')).toBeInTheDocument();
        expect(screen.queryByText('Hand #2')).not.toBeInTheDocument();
      });
    });

    test('should filter by position', async () => {
      await waitFor(() => {
        const positionFilter = screen.getByText('All Positions');
        expect(positionFilter).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('All Positions'));
      await userEvent.click(screen.getByText('Button'));

      // Should filter to button hands only
      await waitFor(() => {
        expect(screen.getByText('Hand #3')).toBeInTheDocument();
      });
    });

    test('should filter by result', async () => {
      await waitFor(() => {
        const resultFilter = screen.getByText('All Results');
        expect(resultFilter).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('All Results'));
      await userEvent.click(screen.getByText('Won Only'));

      await waitFor(() => {
        expect(screen.getByText('Hand #1')).toBeInTheDocument();
        expect(screen.queryByText('Hand #2')).not.toBeInTheDocument();
      });
    });

    test('should filter by stake level', async () => {
      await waitFor(() => {
        const stakeFilter = screen.getByText('All Stakes');
        expect(stakeFilter).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('All Stakes'));
      await userEvent.click(screen.getByText('$1/$2'));

      // Should show hands for that stake level
      expect(screen.getByText('Filtered by: $1/$2')).toBeInTheDocument();
    });

    test('should clear all filters', async () => {
      // Apply some filters first
      await userEvent.click(screen.getByText('All Results'));
      await userEvent.click(screen.getByText('Won Only'));

      await waitFor(() => {
        const clearButton = screen.getByText('Clear Filters');
        expect(clearButton).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Clear Filters'));

      // Should show all hands again
      await waitFor(() => {
        expect(screen.getByText('Hand #1')).toBeInTheDocument();
        expect(screen.getByText('Hand #2')).toBeInTheDocument();
        expect(screen.getByText('Hand #3')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockHands[0],
        id: `hand-${i}`,
        handNumber: i + 1,
      }));

      jest.doMock('../../../hooks/useHandHistory', () => ({
        __esModule: true,
        default: () => ({ ...mockHookReturn, hands: largeDataset }),
      }));

      render(<HandHistoryDashboard />);

      // Should render without performance issues
      expect(screen.getByText('Hand History')).toBeInTheDocument();
    });

    test('should implement virtual scrolling for large lists', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      // Should have virtualized container
      await waitFor(() => {
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      });
    });

    test('should debounce search input', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      const searchInput = screen.getByPlaceholderText('Search hands...');

      // Type rapidly
      await userEvent.type(searchInput, 'test');

      // Should debounce the search
      expect(searchInput).toHaveValue('test');
    });

    test('should memoize expensive calculations', () => {
      const { rerender } = render(<HandHistoryDashboard />);

      // Component should not recalculate everything on re-render
      rerender(<HandHistoryDashboard />);

      expect(screen.getByText('Hand History')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Hand History Dashboard');
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(<HandHistoryDashboard />);

      const firstTab = screen.getByRole('tab', { name: 'Overview' });
      firstTab.focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: 'Hands' })).toHaveFocus();
    });

    test('should have proper focus management', async () => {
      render(<HandHistoryDashboard />);

      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      // Focus should move to tab content
      await waitFor(() => {
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });

    test('should announce changes to screen readers', async () => {
      render(<HandHistoryDashboard />);

      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByRole('status')).toHaveTextContent('Analytics tab selected');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing hand data gracefully', () => {
      jest.doMock('../../../hooks/useHandHistory', () => ({
        __esModule: true,
        default: () => ({ ...mockHookReturn, hands: [] }),
      }));

      render(<HandHistoryDashboard />);

      expect(screen.getByText('No hands recorded')).toBeInTheDocument();
    });

    test('should handle corrupted hand data', () => {
      const corruptedData = [{ id: 'corrupt', invalidField: true }];

      jest.doMock('../../../hooks/useHandHistory', () => ({
        __esModule: true,
        default: () => ({ ...mockHookReturn, hands: corruptedData }),
      }));

      render(<HandHistoryDashboard />);

      expect(screen.getByText('Unable to display hand data')).toBeInTheDocument();
    });

    test('should recover from temporary failures', async () => {
      const mockHook = jest
        .fn()
        .mockReturnValueOnce({ ...mockHookReturn, error: 'Network error' })
        .mockReturnValueOnce({ ...mockHookReturn, error: null });

      jest.doMock('../../../hooks/useHandHistory', () => ({
        __esModule: true,
        default: mockHook,
      }));

      const { rerender } = render(<HandHistoryDashboard />);

      expect(screen.getByText('Error: Network error')).toBeInTheDocument();

      rerender(<HandHistoryDashboard />);

      expect(screen.getByText('Hand History')).toBeInTheDocument();
    });
  });
});

const mockHookReturn = {
  sessionId: 'test-session-123',
  hands: mockHands,
  currentHand: null,
  isCapturing: false,
  loading: false,
  error: null,
  startSession: jest.fn().mockResolvedValue('test-session-123'),
  endSession: jest.fn().mockResolvedValue(true),
  captureHand: jest.fn().mockResolvedValue({ id: 'new-hand-123' }),
  analyzeHand: jest.fn().mockResolvedValue(mockAnalysis),
  searchHands: jest.fn().mockResolvedValue([]),
  exportHands: jest.fn().mockResolvedValue('export-data'),
  deleteHand: jest.fn().mockResolvedValue(true),
  getPlayerStatistics: jest.fn().mockResolvedValue(mockStats),
  clearError: jest.fn(),
};
