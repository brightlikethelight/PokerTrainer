/**
 * HandHistoryDashboard Component Test Suite
 * Tests for hand history dashboard UI functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HandHistoryDashboard from '../HandHistoryDashboard';
import { GAME_PHASES } from '../../../constants/game-constants';

// Create a mutable mock hook return value
let mockUseHandHistoryReturn;

// Mock the useHandHistory hook
jest.mock('../../../hooks/useHandHistory', () => ({
  __esModule: true,
  default: () => mockUseHandHistoryReturn,
}));

// Mock data
const mockHands = [
  {
    id: 'hand-1',
    timestamp: Date.now() - 3600000,
    handNumber: 1,
    heroPosition: 2,
    phase: GAME_PHASES.SHOWDOWN,
    heroCards: [
      { rank: 'A', suit: 'spades' },
      { rank: 'A', suit: 'hearts' },
    ],
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
    heroCards: [
      { rank: '9', suit: 'hearts' },
      { rank: '8', suit: 'hearts' },
    ],
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
    heroCards: [
      { rank: 'J', suit: 'diamonds' },
      { rank: 'J', suit: 'clubs' },
    ],
    pot: 800,
    heroAction: 'call',
    result: 'lost',
    winnings: -200,
    players: 3,
  },
];

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
    // Set default mock return value
    mockUseHandHistoryReturn = {
      sessionId: 'test-session-123',
      hands: mockHands,
      currentHand: null,
      isCapturing: false,
      loading: false,
      error: null,
      startSession: jest.fn().mockResolvedValue('test-session-123'),
      endSession: jest.fn().mockResolvedValue(true),
      captureHand: jest.fn().mockResolvedValue({ id: 'new-hand-123' }),
      analyzeHand: jest.fn().mockResolvedValue({}),
      searchHands: jest.fn().mockResolvedValue([]),
      exportHands: jest.fn().mockResolvedValue('export-data'),
      deleteHand: jest.fn().mockResolvedValue(true),
      getPlayerStatistics: jest.fn().mockReturnValue(mockStats),
      clearError: jest.fn(),
      loadHands: jest.fn(),
    };
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Hand History')).toBeInTheDocument();
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
      mockUseHandHistoryReturn = { ...mockUseHandHistoryReturn, loading: true };

      render(<HandHistoryDashboard />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should display error state', () => {
      mockUseHandHistoryReturn = { ...mockUseHandHistoryReturn, error: 'Connection failed' };

      render(<HandHistoryDashboard />);

      expect(screen.getByText('Error: Connection failed')).toBeInTheDocument();
    });

    test('should not show session info when no active session', () => {
      mockUseHandHistoryReturn = { ...mockUseHandHistoryReturn, sessionId: null };

      render(<HandHistoryDashboard />);

      expect(screen.queryByText('Active Session')).not.toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('should switch to hands tab', async () => {
      render(<HandHistoryDashboard />);

      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByRole('tab', { name: 'Hands' })).toHaveAttribute('aria-selected', 'true');
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
  });

  describe('Overview Tab', () => {
    test('should display session statistics', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Hands Played')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    test('should display total winnings', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Total Winnings')).toBeInTheDocument();
      expect(screen.getByText('$2,500')).toBeInTheDocument();
    });

    test('should show performance indicators', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('VPIP')).toBeInTheDocument();
      expect(screen.getByText('22.5%')).toBeInTheDocument();
      expect(screen.getByText('PFR')).toBeInTheDocument();
      expect(screen.getByText('18.2%')).toBeInTheDocument();
    });

    test('should display recent hands summary', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Recent Hands')).toBeInTheDocument();
      expect(screen.getByText('3 hands')).toBeInTheDocument();
    });

    test('should display charts section', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByText('Winnings Chart')).toBeInTheDocument();
      expect(screen.getByText('Position Analysis')).toBeInTheDocument();
    });
  });

  describe('Hands Tab', () => {
    test('should display list of hands', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('Hand #1')).toBeInTheDocument();
      expect(screen.getByText('Hand #2')).toBeInTheDocument();
      expect(screen.getByText('Hand #3')).toBeInTheDocument();
    });

    test('should show hand results', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('Won')).toBeInTheDocument();
      expect(screen.getByText('Folded')).toBeInTheDocument();
      expect(screen.getByText('Lost')).toBeInTheDocument();
    });

    test('should show pocket aces label', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('Pocket Aces')).toBeInTheDocument();
    });

    test('should have filter input', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByPlaceholderText('Filter hands...')).toBeInTheDocument();
    });

    test('should have search input', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByPlaceholderText('Search hands...')).toBeInTheDocument();
    });

    test('should have sort button', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('Sort by Date')).toBeInTheDocument();
    });

    test('should have export button', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    test('should show no hands message when empty', async () => {
      mockUseHandHistoryReturn = { ...mockUseHandHistoryReturn, hands: [] };

      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('No hands recorded')).toBeInTheDocument();
    });

    test('should have virtualized list container', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    test('should filter hands by search text', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      const filterInput = screen.getByPlaceholderText('Filter hands...');
      await userEvent.type(filterInput, 'won');

      await waitFor(() => {
        expect(screen.getByText('Hand #1')).toBeInTheDocument();
        expect(screen.queryByText('Hand #2')).not.toBeInTheDocument();
      });
    });

    test('should select hand and show details', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      await userEvent.click(screen.getByText('Hand #1'));

      expect(screen.getByText('Hand Details')).toBeInTheDocument();
    });

    test('should close hand details', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      await userEvent.click(screen.getByText('Hand #1'));
      expect(screen.getByText('Hand Details')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Close'));
      expect(screen.queryByText('Hand Details')).not.toBeInTheDocument();
    });
  });

  describe('Analytics Tab', () => {
    test('should display performance metrics', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
      expect(screen.getByText('Hourly Rate')).toBeInTheDocument();
    });

    test('should show aggression factor', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByText('Aggression Factor')).toBeInTheDocument();
      expect(screen.getByText('2.1')).toBeInTheDocument();
    });

    test('should show positional analysis section', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByText('Positional Analysis')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(screen.getByText('Big Blind')).toBeInTheDocument();
    });

    test('should display hand strength section', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByText('Hand Strength')).toBeInTheDocument();
      expect(screen.getByText('Pocket Pairs')).toBeInTheDocument();
      expect(screen.getByText('Suited Connectors')).toBeInTheDocument();
    });

    test('should show betting patterns section', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByText('Betting Patterns')).toBeInTheDocument();
    });

    test('should display time analysis section', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByText('Time Analysis')).toBeInTheDocument();
      expect(screen.getByText('Best Hours')).toBeInTheDocument();
      expect(screen.getByText('Worst Hours')).toBeInTheDocument();
    });

    test('should have date range selector', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Analytics' }));

      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    });
  });

  describe('Session Tab', () => {
    test('should display session controls', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Session' }));

      expect(screen.getByText('Session Management')).toBeInTheDocument();
      expect(screen.getByText('Start New Session')).toBeInTheDocument();
      expect(screen.getByText('End Session')).toBeInTheDocument();
    });

    test('should have export session button', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Session' }));

      expect(screen.getByText('Export Session')).toBeInTheDocument();
    });

    test('should have auto capture checkbox', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Session' }));

      expect(screen.getByText('Auto Capture')).toBeInTheDocument();
    });

    test('should have pot odds checkbox', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Session' }));

      expect(screen.getByText('Include Pot Odds')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('should have position filter', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByLabelText('Filter by position')).toBeInTheDocument();
    });

    test('should have result filter', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByLabelText('Filter by result')).toBeInTheDocument();
    });

    test('should have stakes filter', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByLabelText('Filter by stakes')).toBeInTheDocument();
    });

    test('should show clear filters button when filters applied', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      const positionSelect = screen.getByLabelText('Filter by position');
      await userEvent.selectOptions(positionSelect, '0');

      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    test('should clear filters when button clicked', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      const positionSelect = screen.getByLabelText('Filter by position');
      await userEvent.selectOptions(positionSelect, '0');

      await userEvent.click(screen.getByText('Clear Filters'));

      expect(positionSelect).toHaveValue('all');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Hand History Dashboard');
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('should have proper tabpanel role', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    test('should have status element for announcements', () => {
      render(<HandHistoryDashboard />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should have proper focus management on hand items', async () => {
      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      const handItem = screen.getByText('Hand #1').closest('[role="button"]');
      expect(handItem).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty hands array', () => {
      mockUseHandHistoryReturn = { ...mockUseHandHistoryReturn, hands: [] };

      render(<HandHistoryDashboard />);

      // Should still render without crashing
      expect(screen.getByText('Hand History')).toBeInTheDocument();
    });

    test('should handle null hands', () => {
      mockUseHandHistoryReturn = { ...mockUseHandHistoryReturn, hands: null };

      render(<HandHistoryDashboard />);

      expect(screen.getByText('Hand History')).toBeInTheDocument();
    });

    test('should handle missing heroCards gracefully', async () => {
      mockUseHandHistoryReturn = {
        ...mockUseHandHistoryReturn,
        hands: [{ id: 'hand-1', handNumber: 1, result: 'won' }],
      };

      render(<HandHistoryDashboard />);
      await userEvent.click(screen.getByRole('tab', { name: 'Hands' }));

      expect(screen.getByText('Hand #1')).toBeInTheDocument();
    });
  });
});
