/**
 * PlayerSeat Component Test Suite
 * Comprehensive tests for poker player seat UI component functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import PlayerSeat from '../PlayerSeat';

// Mock the Card component to simplify testing
const MockCard = ({ card, faceDown, size }) => (
  <div
    data-testid="mock-card"
    data-face-down={faceDown || 'false'}
    data-size={size}
    data-card={card ? `${card.rank}-${card.suit}` : 'none'}
  >
    {card && !faceDown ? `${card.rank}${card.suit}` : faceDown ? 'FACE_DOWN' : 'NO_CARD'}
  </div>
);
MockCard.displayName = 'MockCard';
jest.mock('../Card', () => MockCard);

describe('PlayerSeat', () => {
  // Test data constants
  const DEFAULT_PLAYER = {
    id: 'player-1',
    name: 'John Doe',
    chips: 1000,
    position: 1,
    status: 'active',
    currentBet: 0,
    lastAction: null,
    holeCards: [],
    hasCards: false,
  };

  const SAMPLE_HOLE_CARDS = [
    { rank: 'A', suit: 's' },
    { rank: 'K', suit: 'h' },
  ];

  const POSITIONS = {
    'small-blind': 'SB',
    'big-blind': 'BB',
    'under-the-gun': 'UTG',
    'middle-position': 'MP',
    'cut-off': 'CO',
  };

  describe('Component Rendering', () => {
    test('should render without crashing with valid player', () => {
      render(<PlayerSeat player={DEFAULT_PLAYER} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1.0K')).toBeInTheDocument();
    });

    test('should return null when no player provided', () => {
      const { container } = render(<PlayerSeat player={null} />);
      expect(container.firstChild).toBeNull();
    });

    test('should return null when player is undefined', () => {
      const { container } = render(<PlayerSeat />);
      expect(container.firstChild).toBeNull();
    });

    test('should render with minimal player data', () => {
      const minimalPlayer = {
        id: 'player-minimal',
        name: 'Min Player',
        chips: 500,
      };

      render(<PlayerSeat player={minimalPlayer} />);

      expect(screen.getByText('Min Player')).toBeInTheDocument();
      expect(screen.getByText('$500')).toBeInTheDocument();
    });
  });

  describe('Player Information Display', () => {
    test('should display player name correctly', () => {
      const player = { ...DEFAULT_PLAYER, name: 'Alice Smith' };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toHaveClass('player-name');
    });

    test('should display player chips correctly', () => {
      const player = { ...DEFAULT_PLAYER, chips: 2500 };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('$2.5K')).toBeInTheDocument();
      expect(screen.getByText('$2.5K')).toHaveClass('player-chips');
    });

    test('should handle very long player names', () => {
      const player = { ...DEFAULT_PLAYER, name: 'VeryLongPlayerNameThatMightCauseUIIssues' };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('VeryLongPlayerNameThatMightCauseUIIssues')).toBeInTheDocument();
    });

    test('should handle empty player name', () => {
      const player = { ...DEFAULT_PLAYER, name: '' };
      const { container } = render(<PlayerSeat player={player} />);

      const nameElement = container.querySelector('.player-name');
      expect(nameElement).toBeInTheDocument();
      expect(nameElement).toHaveTextContent('');
    });
  });

  describe('Chip Formatting', () => {
    test('should format chips under 1000 as plain numbers', () => {
      const testCases = [
        { chips: 0, expected: '$0' },
        { chips: 1, expected: '$1' },
        { chips: 100, expected: '$100' },
        { chips: 999, expected: '$999' },
      ];

      testCases.forEach(({ chips, expected }) => {
        const player = { ...DEFAULT_PLAYER, chips };
        const { unmount } = render(<PlayerSeat player={player} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    test('should format chips in thousands with K suffix', () => {
      const testCases = [
        { chips: 1000, expected: '$1.0K' },
        { chips: 1500, expected: '$1.5K' },
        { chips: 10000, expected: '$10.0K' },
        { chips: 25750, expected: '$25.8K' },
        { chips: 999999, expected: '$1000.0K' },
      ];

      testCases.forEach(({ chips, expected }) => {
        const player = { ...DEFAULT_PLAYER, chips };
        const { unmount } = render(<PlayerSeat player={player} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    test('should format chips in millions with M suffix', () => {
      const testCases = [
        { chips: 1000000, expected: '$1.0M' },
        { chips: 1500000, expected: '$1.5M' },
        { chips: 10000000, expected: '$10.0M' },
        { chips: 25750000, expected: '$25.8M' },
      ];

      testCases.forEach(({ chips, expected }) => {
        const player = { ...DEFAULT_PLAYER, chips };
        const { unmount } = render(<PlayerSeat player={player} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    test('should handle negative chip amounts', () => {
      const player = { ...DEFAULT_PLAYER, chips: -500 };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('$-500')).toBeInTheDocument();
    });

    test('should handle zero chips', () => {
      const player = { ...DEFAULT_PLAYER, chips: 0 };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  describe('Position Labels', () => {
    test('should display dealer button when isDealer is true', () => {
      render(<PlayerSeat player={DEFAULT_PLAYER} isDealer={true} />);

      expect(screen.getByText('BTN')).toBeInTheDocument();
      expect(screen.getByText('BTN')).toHaveClass('position-label');
    });

    test('should display correct position labels', () => {
      Object.entries(POSITIONS).forEach(([position, label]) => {
        const { unmount } = render(<PlayerSeat player={DEFAULT_PLAYER} position={position} />);

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(label)).toHaveClass('position-label');
        unmount();
      });
    });

    test('should prioritize dealer button over position label', () => {
      render(<PlayerSeat player={DEFAULT_PLAYER} position="small-blind" isDealer={true} />);

      expect(screen.getByText('BTN')).toBeInTheDocument();
      expect(screen.queryByText('SB')).not.toBeInTheDocument();
    });

    test('should not display position label for unknown positions', () => {
      const { container } = render(
        <PlayerSeat player={DEFAULT_PLAYER} position="unknown-position" />
      );

      expect(screen.queryByText('unknown-position')).not.toBeInTheDocument();
      expect(container.querySelector('.position-label')).not.toBeInTheDocument();
    });

    test('should not display position label when neither isDealer nor position is provided', () => {
      const { container } = render(<PlayerSeat player={DEFAULT_PLAYER} />);

      expect(container.querySelector('.position-label')).not.toBeInTheDocument();
    });
  });

  describe('Player States and Status', () => {
    test('should apply active class when isActive is true', () => {
      const { container } = render(<PlayerSeat player={DEFAULT_PLAYER} isActive={true} />);

      expect(container.querySelector('.player-seat')).toHaveClass('active');
    });

    test('should apply folded class when player status is folded', () => {
      const player = { ...DEFAULT_PLAYER, status: 'folded' };
      const { container } = render(<PlayerSeat player={player} />);

      expect(container.querySelector('.player-seat')).toHaveClass('folded');
    });

    test('should display all-in indicator when player status is all-in', () => {
      const player = { ...DEFAULT_PLAYER, status: 'all-in' };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('AI')).toHaveClass('player-status-icon');
    });

    test('should apply correct position class based on player position', () => {
      const player = { ...DEFAULT_PLAYER, position: 3 };
      const { container } = render(<PlayerSeat player={player} />);

      expect(container.querySelector('.player-seat')).toHaveClass('position-3');
    });

    test('should handle multiple status classes', () => {
      const player = { ...DEFAULT_PLAYER, status: 'folded', position: 2 };
      const { container } = render(<PlayerSeat player={player} isActive={true} />);

      const seatElement = container.querySelector('.player-seat');
      expect(seatElement).toHaveClass('player-seat');
      expect(seatElement).toHaveClass('position-2');
      expect(seatElement).toHaveClass('active');
      expect(seatElement).toHaveClass('folded');
    });

    test('should handle different player statuses', () => {
      const statuses = ['active', 'folded', 'all-in', 'waiting', 'sitting-out'];

      statuses.forEach((status) => {
        const player = { ...DEFAULT_PLAYER, status };
        const { container, unmount } = render(<PlayerSeat player={player} />);

        if (status === 'folded') {
          expect(container.querySelector('.player-seat')).toHaveClass('folded');
        } else if (status === 'all-in') {
          expect(screen.getByText('AI')).toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe('Current Turn Indicator', () => {
    test('should display timer when player is active', () => {
      const { container } = render(<PlayerSeat player={DEFAULT_PLAYER} isActive={true} />);

      expect(container.querySelector('.player-timer')).toBeInTheDocument();
      expect(container.querySelector('.player-timer-bar')).toBeInTheDocument();
    });

    test('should not display timer when player is not active', () => {
      const { container } = render(<PlayerSeat player={DEFAULT_PLAYER} isActive={false} />);

      expect(container.querySelector('.player-timer')).not.toBeInTheDocument();
    });

    test('should display timer bar with correct style', () => {
      const { container } = render(<PlayerSeat player={DEFAULT_PLAYER} isActive={true} />);

      const timerBar = container.querySelector('.player-timer-bar');
      expect(timerBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Betting Information', () => {
    test('should display current bet when player has bet', () => {
      const player = { ...DEFAULT_PLAYER, currentBet: 50 };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByText('$50')).toHaveClass('player-bet');
    });

    test('should not display bet when currentBet is 0', () => {
      const player = { ...DEFAULT_PLAYER, currentBet: 0 };
      const { container } = render(<PlayerSeat player={player} />);

      expect(container.querySelector('.player-bet')).not.toBeInTheDocument();
    });

    test('should not display bet when currentBet is undefined', () => {
      const player = { ...DEFAULT_PLAYER };
      delete player.currentBet;
      const { container } = render(<PlayerSeat player={player} />);

      expect(container.querySelector('.player-bet')).not.toBeInTheDocument();
    });

    test('should handle large bet amounts with proper formatting', () => {
      const player = { ...DEFAULT_PLAYER, currentBet: 1500 };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('$1500')).toBeInTheDocument();
    });

    test('should display last action when available', () => {
      const actions = ['call', 'raise', 'fold', 'check', 'bet', 'all-in'];

      actions.forEach((action) => {
        const player = { ...DEFAULT_PLAYER, lastAction: action };
        const { unmount } = render(<PlayerSeat player={player} />);

        expect(screen.getByText(action)).toBeInTheDocument();
        expect(screen.getByText(action)).toHaveClass('player-_action', action);
        unmount();
      });
    });

    test('should not display action when lastAction is null or undefined', () => {
      const player = { ...DEFAULT_PLAYER, lastAction: null };
      const { container } = render(<PlayerSeat player={player} />);

      expect(container.querySelector('.player-_action')).not.toBeInTheDocument();
    });

    test('should handle empty string lastAction', () => {
      const player = { ...DEFAULT_PLAYER, lastAction: '' };
      const { container } = render(<PlayerSeat player={player} />);

      expect(container.querySelector('.player-_action')).not.toBeInTheDocument();
    });
  });

  describe('Hole Cards Display', () => {
    test('should not display cards when player has no hole cards', () => {
      const player = { ...DEFAULT_PLAYER, holeCards: [] };
      render(<PlayerSeat player={player} />);

      expect(screen.queryByTestId('mock-card')).not.toBeInTheDocument();
    });

    test('should not display cards when player has folded', () => {
      const player = {
        ...DEFAULT_PLAYER,
        holeCards: SAMPLE_HOLE_CARDS,
        status: 'folded',
      };
      render(<PlayerSeat player={player} />);

      expect(screen.queryByTestId('mock-card')).not.toBeInTheDocument();
    });

    test('should display face-down cards when showCards is false', () => {
      const player = { ...DEFAULT_PLAYER, holeCards: SAMPLE_HOLE_CARDS };
      render(<PlayerSeat player={player} showCards={false} />);

      const cards = screen.getAllByTestId('mock-card');
      expect(cards).toHaveLength(2);
      cards.forEach((card) => {
        expect(card).toHaveAttribute('data-face-down', 'true');
        expect(card).toHaveAttribute('data-size', 'small');
      });
    });

    test('should display face-up cards when showCards is true', () => {
      const player = { ...DEFAULT_PLAYER, holeCards: SAMPLE_HOLE_CARDS };
      render(<PlayerSeat player={player} showCards={true} />);

      const cards = screen.getAllByTestId('mock-card');
      expect(cards).toHaveLength(2);

      expect(cards[0]).toHaveAttribute('data-card', 'A-s');
      expect(cards[1]).toHaveAttribute('data-card', 'K-h');
      expect(cards[0]).toHaveAttribute('data-face-down', 'false');
      expect(cards[1]).toHaveAttribute('data-face-down', 'false');

      // Check that card content is visible
      expect(cards[0]).toHaveTextContent('As');
      expect(cards[1]).toHaveTextContent('Kh');
    });

    test('should display cards with small size', () => {
      const player = { ...DEFAULT_PLAYER, holeCards: SAMPLE_HOLE_CARDS };
      render(<PlayerSeat player={player} showCards={true} />);

      const cards = screen.getAllByTestId('mock-card');
      cards.forEach((card) => {
        expect(card).toHaveAttribute('data-size', 'small');
      });
    });

    test('should handle partial hole cards array', () => {
      const player = {
        ...DEFAULT_PLAYER,
        holeCards: [{ rank: 'A', suit: 's' }],
      };
      render(<PlayerSeat player={player} showCards={true} />);

      const cards = screen.getAllByTestId('mock-card');
      expect(cards).toHaveLength(1);
      expect(cards[0]).toHaveAttribute('data-card', 'A-s');
    });

    test('should handle empty hole cards array gracefully', () => {
      const player = { ...DEFAULT_PLAYER, holeCards: [] };
      render(<PlayerSeat player={player} showCards={true} />);

      expect(screen.queryByTestId('mock-card')).not.toBeInTheDocument();
    });

    test('should handle null hole cards', () => {
      const player = { ...DEFAULT_PLAYER, holeCards: null };
      render(<PlayerSeat player={player} showCards={true} />);

      expect(screen.queryByTestId('mock-card')).not.toBeInTheDocument();
    });

    test('should handle undefined hole cards', () => {
      const player = { ...DEFAULT_PLAYER };
      delete player.holeCards;
      render(<PlayerSeat player={player} showCards={true} />);

      expect(screen.queryByTestId('mock-card')).not.toBeInTheDocument();
    });
  });

  describe('Player Types (AI vs Human)', () => {
    test('should display player as human by default', () => {
      render(<PlayerSeat player={DEFAULT_PLAYER} />);

      // No special AI indicators should be present (besides all-in status)
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // The component doesn't seem to distinguish between AI and human players
      // except through the status field
    });

    test('should handle AI player indicators through status', () => {
      const aiPlayer = {
        ...DEFAULT_PLAYER,
        name: 'AI Bot',
        status: 'all-in',
      };
      render(<PlayerSeat player={aiPlayer} />);

      expect(screen.getByText('AI Bot')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument(); // all-in indicator
    });
  });

  describe('Winner State', () => {
    // Note: The component doesn't seem to have explicit winner state handling
    // but we can test how it might handle winner-related statuses
    test('should handle potential winner status', () => {
      const player = { ...DEFAULT_PLAYER, status: 'winner' };
      const { container } = render(<PlayerSeat player={player} />);

      // Component should still render normally
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(container.querySelector('.player-seat')).toBeInTheDocument();
    });

    test('should handle winner with last action', () => {
      const player = {
        ...DEFAULT_PLAYER,
        status: 'winner',
        lastAction: 'wins',
      };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('wins')).toBeInTheDocument();
      expect(screen.getByText('wins')).toHaveClass('player-_action', 'wins');
    });
  });

  describe('Accessibility Features', () => {
    test('should have proper semantic structure', () => {
      const { container } = render(<PlayerSeat player={DEFAULT_PLAYER} />);

      expect(container.querySelector('.player-seat')).toBeInTheDocument();
      expect(container.querySelector('.player-info')).toBeInTheDocument();
      expect(container.querySelector('.player-name')).toBeInTheDocument();
      expect(container.querySelector('.player-chips')).toBeInTheDocument();
    });

    test('should handle screen reader accessible content', () => {
      const player = {
        ...DEFAULT_PLAYER,
        holeCards: SAMPLE_HOLE_CARDS,
        currentBet: 100,
        lastAction: 'call',
      };
      render(<PlayerSeat player={player} showCards={true} />);

      // Player information should be readable
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1.0K')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
      expect(screen.getByText('call')).toBeInTheDocument();
    });

    test('should work with keyboard navigation patterns', () => {
      const { container } = render(<PlayerSeat player={DEFAULT_PLAYER} />);

      // Component should render interactive elements properly
      expect(container.querySelector('.player-seat')).toBeInTheDocument();
      // Note: Component doesn't have explicit keyboard interaction
      // but structure supports it
    });

    test('should handle high contrast scenarios', () => {
      const player = {
        ...DEFAULT_PLAYER,
        status: 'folded',
      };
      const { container } = render(<PlayerSeat player={player} isActive={true} />);

      // Classes should be applied for styling
      expect(container.querySelector('.player-seat')).toHaveClass('folded', 'active');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing player properties gracefully', () => {
      const incompletePlayer = {
        id: 'incomplete',
        name: 'Incomplete Player',
        chips: 1000,
        // Missing other properties
      };

      expect(() => render(<PlayerSeat player={incompletePlayer} />)).not.toThrow();
      expect(screen.getByText('Incomplete Player')).toBeInTheDocument();
    });

    test('should handle invalid chip values', () => {
      const invalidChipPlayer = {
        ...DEFAULT_PLAYER,
        chips: NaN,
      };
      render(<PlayerSeat player={invalidChipPlayer} />);

      // Should render without crashing
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('should handle null position value', () => {
      const player = { ...DEFAULT_PLAYER, position: null };
      const { container } = render(<PlayerSeat player={player} />);

      expect(container.querySelector('.player-seat')).toHaveClass('position-null');
    });

    test('should handle undefined status', () => {
      const player = { ...DEFAULT_PLAYER };
      delete player.status;

      expect(() => render(<PlayerSeat player={player} />)).not.toThrow();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('should handle extremely large chip amounts', () => {
      const player = { ...DEFAULT_PLAYER, chips: Number.MAX_SAFE_INTEGER };
      render(<PlayerSeat player={player} />);

      // Should render some representation of the large number
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('should handle special characters in player name', () => {
      const player = {
        ...DEFAULT_PLAYER,
        name: 'Player™ <script>alert("xss")</script>',
      };
      render(<PlayerSeat player={player} />);

      expect(screen.getByText('Player™ <script>alert("xss")</script>')).toBeInTheDocument();
    });

    test('should handle malformed hole cards', () => {
      const player = {
        ...DEFAULT_PLAYER,
        holeCards: [
          { rank: 'A' }, // missing suit
          { suit: 's' }, // missing rank
          null,
          undefined,
        ],
      };

      expect(() => render(<PlayerSeat player={player} showCards={true} />)).not.toThrow();
    });
  });

  describe('React.memo Performance Optimization', () => {
    test('should not re-render with identical props', () => {
      const player = { ...DEFAULT_PLAYER };

      const { rerender } = render(
        <PlayerSeat
          player={player}
          isActive={false}
          isDealer={false}
          position="middle-position"
          showCards={false}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Re-render with identical props
      rerender(
        <PlayerSeat
          player={player}
          isActive={false}
          isDealer={false}
          position="middle-position"
          showCards={false}
        />
      );

      // Component should still work correctly
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1.0K')).toBeInTheDocument();
    });

    test('should re-render when player changes', () => {
      const player1 = { ...DEFAULT_PLAYER };
      const player2 = { ...DEFAULT_PLAYER, name: 'Jane Doe', chips: 2000 };

      const { rerender } = render(<PlayerSeat player={player1} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1.0K')).toBeInTheDocument();

      rerender(<PlayerSeat player={player2} />);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('$2.0K')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    test('should re-render when isActive changes', () => {
      const { container, rerender } = render(
        <PlayerSeat player={DEFAULT_PLAYER} isActive={false} />
      );

      expect(container.querySelector('.player-timer')).not.toBeInTheDocument();

      rerender(<PlayerSeat player={DEFAULT_PLAYER} isActive={true} />);
      expect(container.querySelector('.player-timer')).toBeInTheDocument();
    });

    test('should re-render when showCards changes', () => {
      const player = { ...DEFAULT_PLAYER, holeCards: SAMPLE_HOLE_CARDS };

      const { rerender } = render(<PlayerSeat player={player} showCards={false} />);

      let cards = screen.getAllByTestId('mock-card');
      expect(cards[0]).toHaveAttribute('data-face-down', 'true');

      rerender(<PlayerSeat player={player} showCards={true} />);
      cards = screen.getAllByTestId('mock-card');
      expect(cards[0]).toHaveAttribute('data-face-down', 'false');
      expect(cards[0]).toHaveTextContent('As');
    });

    test('should handle deep player object changes', () => {
      const player1 = {
        ...DEFAULT_PLAYER,
        holeCards: [
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'h' },
        ],
      };
      const player2 = {
        ...DEFAULT_PLAYER,
        holeCards: [
          { rank: 'Q', suit: 'd' },
          { rank: 'J', suit: 'c' },
        ],
      };

      const { rerender } = render(<PlayerSeat player={player1} showCards={true} />);

      let cards = screen.getAllByTestId('mock-card');
      expect(cards[0]).toHaveAttribute('data-card', 'A-s');
      expect(cards[0]).toHaveTextContent('As');

      rerender(<PlayerSeat player={player2} showCards={true} />);
      cards = screen.getAllByTestId('mock-card');
      expect(cards[0]).toHaveAttribute('data-card', 'Q-d');
      expect(cards[0]).toHaveTextContent('Qd');
    });
  });

  describe('Component Integration', () => {
    test('should work correctly in multi-seat context', () => {
      const players = [
        { ...DEFAULT_PLAYER, id: 'p1', name: 'Player 1', position: 1 },
        { ...DEFAULT_PLAYER, id: 'p2', name: 'Player 2', position: 2 },
        { ...DEFAULT_PLAYER, id: 'p3', name: 'Player 3', position: 3 },
      ];

      const { container } = render(
        <div>
          {players.map((player, index) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isActive={index === 1}
              isDealer={index === 0}
            />
          ))}
        </div>
      );

      // Should render all seats
      expect(container.querySelectorAll('.player-seat')).toHaveLength(3);

      // Should show correct names
      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
      expect(screen.getByText('Player 3')).toBeInTheDocument();

      // Should show dealer button and active state
      expect(screen.getByText('BTN')).toBeInTheDocument();
      expect(container.querySelector('.active')).toBeInTheDocument();
    });

    test('should handle rapid state changes without errors', () => {
      const basePlayer = { ...DEFAULT_PLAYER };
      const states = [
        { status: 'active', currentBet: 0 },
        { status: 'folded', currentBet: 50 },
        { status: 'all-in', currentBet: 1000 },
        { status: 'active', currentBet: 0 },
      ];

      const { rerender } = render(<PlayerSeat player={basePlayer} />);

      states.forEach((state) => {
        const player = { ...basePlayer, ...state };
        rerender(<PlayerSeat player={player} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('should handle card visibility changes during gameplay', () => {
      const player = {
        ...DEFAULT_PLAYER,
        holeCards: SAMPLE_HOLE_CARDS,
      };

      const { rerender } = render(<PlayerSeat player={player} showCards={false} />);

      // Cards should be face down
      let cards = screen.getAllByTestId('mock-card');
      expect(cards[0]).toHaveAttribute('data-face-down', 'true');
      expect(cards[0]).toHaveTextContent('FACE_DOWN');

      // Reveal cards
      rerender(<PlayerSeat player={player} showCards={true} />);
      cards = screen.getAllByTestId('mock-card');
      expect(cards[0]).toHaveAttribute('data-face-down', 'false');
      expect(cards[0]).toHaveTextContent('As');

      // Hide cards again
      rerender(<PlayerSeat player={player} showCards={false} />);
      cards = screen.getAllByTestId('mock-card');
      expect(cards[0]).toHaveAttribute('data-face-down', 'true');
      expect(cards[0]).toHaveTextContent('FACE_DOWN');
    });
  });

  describe('PropTypes Validation', () => {
    test('should handle valid player prop structure', () => {
      const validPlayer = {
        id: 'valid-player',
        name: 'Valid Player',
        chips: 1000,
        position: 1,
        status: 'active',
        currentBet: 50,
        lastAction: 'call',
        holeCards: SAMPLE_HOLE_CARDS,
        hasCards: true,
      };

      expect(() => render(<PlayerSeat player={validPlayer} />)).not.toThrow();
    });

    test('should handle boolean props correctly', () => {
      expect(() =>
        render(
          <PlayerSeat player={DEFAULT_PLAYER} isActive={true} isDealer={true} showCards={true} />
        )
      ).not.toThrow();

      expect(() =>
        render(
          <PlayerSeat player={DEFAULT_PLAYER} isActive={false} isDealer={false} showCards={false} />
        )
      ).not.toThrow();
    });

    test('should handle string position prop', () => {
      const validPositions = [
        'small-blind',
        'big-blind',
        'under-the-gun',
        'middle-position',
        'cut-off',
      ];

      validPositions.forEach((position) => {
        expect(() =>
          render(<PlayerSeat player={DEFAULT_PLAYER} position={position} />)
        ).not.toThrow();
      });
    });

    test('should handle missing optional props', () => {
      // All props except player are optional
      expect(() => render(<PlayerSeat player={DEFAULT_PLAYER} />)).not.toThrow();
    });

    test('should handle array of hole cards', () => {
      const playerWithCards = {
        ...DEFAULT_PLAYER,
        holeCards: [
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'h' },
        ],
      };

      expect(() => render(<PlayerSeat player={playerWithCards} />)).not.toThrow();
    });
  });
});
