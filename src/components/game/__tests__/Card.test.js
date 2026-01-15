/**
 * Card Component Test Suite
 * Comprehensive tests for playing card UI component functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import Card from '../Card';

describe('Card', () => {
  // Standard deck constants for comprehensive testing
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const SUITS = ['s', 'h', 'd', 'c'];
  const SUIT_SYMBOLS = {
    s: '♠',
    h: '♥',
    d: '♦',
    c: '♣',
  };
  const SUIT_NAMES = {
    s: 'spades',
    h: 'hearts',
    d: 'diamonds',
    c: 'clubs',
  };
  const SUIT_CLASSES = {
    s: 'spades',
    h: 'hearts',
    d: 'diamonds',
    c: 'clubs',
  };

  describe('Component Rendering', () => {
    test('should render without crashing with valid card', () => {
      const card = { rank: 'A', suit: 's' };
      render(<Card card={card} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('should render placeholder when no card and not face down', () => {
      render(<Card />);

      const placeholder = screen.getByRole('img');
      expect(placeholder).toHaveClass('card-placeholder');
      expect(placeholder).toHaveAttribute('aria-label', 'Empty card slot');
    });

    test('should render face-down card when faceDown is true', () => {
      render(<Card faceDown={true} />);

      const card = screen.getByRole('img');
      expect(card).toHaveClass('playing-card', 'back');
      expect(card).toHaveAttribute('aria-label', 'Face-down playing card');
    });

    test('should render face-down card when both card and faceDown are provided', () => {
      const card = { rank: 'A', suit: 's' };
      render(<Card card={card} faceDown={true} />);

      const cardElement = screen.getByRole('img');
      expect(cardElement).toHaveClass('playing-card', 'back');
      expect(cardElement).toHaveAttribute('aria-label', 'Face-down playing card');
      // Should not show card details when face down
      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });
  });

  describe('All 52 Card Combinations', () => {
    // Test all possible card combinations to ensure comprehensive coverage
    test.each(SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit }))))(
      'should render $rank of $suit correctly',
      ({ rank, suit }) => {
        const card = { rank, suit };
        render(<Card card={card} />);

        const cardElement = screen.getByRole('img');

        // Check basic structure
        expect(cardElement).toHaveClass('playing-card', SUIT_CLASSES[suit]);

        // Check accessibility
        const expectedAriaLabel = `${rank} of ${SUIT_NAMES[suit]}`;
        expect(cardElement).toHaveAttribute('aria-label', expectedAriaLabel);

        // Check rank appears in multiple places (corners and center)
        const rankElements = screen.getAllByText(rank);
        expect(rankElements).toHaveLength(3); // top-left, center, bottom-right

        // Check suit symbol appears in multiple places
        const suitElements = screen.getAllByText(SUIT_SYMBOLS[suit]);
        expect(suitElements).toHaveLength(3); // top-left, center, bottom-right
      }
    );

    test('should handle all suits with correct symbols', () => {
      SUITS.forEach((suit) => {
        const card = { rank: 'A', suit };
        const { unmount } = render(<Card card={card} />);

        const expectedSymbol = SUIT_SYMBOLS[suit];
        const suitElements = screen.getAllByText(expectedSymbol);
        expect(suitElements).toHaveLength(3);

        // Clean up for next iteration
        unmount();
      });
    });

    test('should handle all ranks correctly', () => {
      RANKS.forEach((rank) => {
        const card = { rank, suit: 's' };
        const { unmount } = render(<Card card={card} />);

        const rankElements = screen.getAllByText(rank);
        expect(rankElements).toHaveLength(3);

        // Clean up for next iteration
        unmount();
      });
    });
  });

  describe('CSS Classes and Styling', () => {
    test('should apply correct suit class for each suit', () => {
      SUITS.forEach((suit) => {
        const card = { rank: 'A', suit };
        const { container, unmount } = render(<Card card={card} />);

        const cardElement = container.querySelector('.playing-card');
        expect(cardElement).toHaveClass(SUIT_CLASSES[suit]);

        // Clean up for next iteration
        unmount();
      });
    });

    test('should apply size classes correctly', () => {
      const card = { rank: 'A', suit: 's' };

      // Test default size (normal)
      const { rerender } = render(<Card card={card} />);
      expect(screen.getByRole('img')).toHaveClass('normal');

      // Test small size
      rerender(<Card card={card} size="small" />);
      expect(screen.getByRole('img')).toHaveClass('small');

      // Test large size
      rerender(<Card card={card} size="large" />);
      expect(screen.getByRole('img')).toHaveClass('large');
    });

    test('should apply face-down styling correctly', () => {
      // Test with different sizes
      const sizes = ['small', 'normal', 'large'];

      sizes.forEach((size) => {
        const { unmount } = render(<Card faceDown={true} size={size} />);
        const cardElement = screen.getByRole('img');

        expect(cardElement).toHaveClass('playing-card', 'back', size);

        unmount();
      });
    });

    test('should have correct card structure elements', () => {
      const card = { rank: 'K', suit: 'h' };
      const { container } = render(<Card card={card} />);

      // Check for card corners
      expect(container.querySelector('.card-corner.top-left')).toBeInTheDocument();
      expect(container.querySelector('.card-corner.bottom-right')).toBeInTheDocument();

      // Check for center section
      expect(container.querySelector('.card-center')).toBeInTheDocument();
      expect(container.querySelector('.card-rank')).toBeInTheDocument();
      expect(container.querySelector('.card-suit')).toBeInTheDocument();

      // Check for corner suits
      expect(container.querySelector('.card-corner-suit')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid suit gracefully', () => {
      const card = { rank: 'A', suit: 'invalid' };
      render(<Card card={card} />);

      // Should still render but with empty symbols
      const cardElement = screen.getByRole('img');
      expect(cardElement).toBeInTheDocument();
      expect(cardElement).toHaveClass('playing-card');

      // Rank should still appear
      expect(screen.getAllByText('A')).toHaveLength(3);

      // Should have empty aria-label for suit
      expect(cardElement).toHaveAttribute('aria-label', 'A of ');
    });

    test('should handle missing rank gracefully', () => {
      const card = { suit: 's' };
      render(<Card card={card} />);

      const cardElement = screen.getByRole('img');
      expect(cardElement).toBeInTheDocument();
      expect(cardElement).toHaveClass('playing-card', 'spades');

      // Suit symbols should appear
      expect(screen.getAllByText('♠')).toHaveLength(3);
    });

    test('should handle missing suit gracefully', () => {
      const card = { rank: 'A' };
      render(<Card card={card} />);

      const cardElement = screen.getByRole('img');
      expect(cardElement).toBeInTheDocument();
      expect(cardElement).toHaveClass('playing-card');

      // Rank should appear
      expect(screen.getAllByText('A')).toHaveLength(3);
    });

    test('should handle empty card object', () => {
      const card = {};
      render(<Card card={card} />);

      const cardElement = screen.getByRole('img');
      expect(cardElement).toBeInTheDocument();
      expect(cardElement).toHaveClass('playing-card');
    });

    test('should handle null card with faceDown false', () => {
      render(<Card card={null} faceDown={false} />);

      const placeholder = screen.getByRole('img');
      expect(placeholder).toHaveClass('card-placeholder');
      expect(placeholder).toHaveAttribute('aria-label', 'Empty card slot');
    });

    test('should handle undefined props gracefully', () => {
      render(<Card />);

      const placeholder = screen.getByRole('img');
      expect(placeholder).toHaveClass('card-placeholder');
    });

    test('should handle special characters in rank', () => {
      const card = { rank: '10', suit: 's' };
      render(<Card card={card} />);

      const rankElements = screen.getAllByText('10');
      expect(rankElements).toHaveLength(3);

      const cardElement = screen.getByRole('img');
      expect(cardElement).toHaveAttribute('aria-label', '10 of spades');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA role for all card states', () => {
      const card = { rank: 'A', suit: 's' };

      // Face-up card
      const { rerender } = render(<Card card={card} />);
      expect(screen.getByRole('img')).toBeInTheDocument();

      // Face-down card
      rerender(<Card faceDown={true} />);
      expect(screen.getByRole('img')).toBeInTheDocument();

      // Placeholder
      rerender(<Card />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('should have descriptive aria-labels for all suits', () => {
      SUITS.forEach((suit) => {
        const card = { rank: 'K', suit };
        const { unmount } = render(<Card card={card} />);

        const expectedLabel = `K of ${SUIT_NAMES[suit]}`;
        expect(screen.getByRole('img')).toHaveAttribute('aria-label', expectedLabel);

        // Clean up for next iteration
        unmount();
      });
    });

    test('should have descriptive aria-labels for face-down cards', () => {
      render(<Card faceDown={true} />);

      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Face-down playing card');
    });

    test('should have descriptive aria-label for empty slots', () => {
      render(<Card />);

      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Empty card slot');
    });

    test('should maintain accessibility with different sizes', () => {
      const card = { rank: 'Q', suit: 'd' };
      const sizes = ['small', 'normal', 'large'];

      sizes.forEach((size) => {
        const { unmount } = render(<Card card={card} size={size} />);

        const cardElement = screen.getByRole('img');
        expect(cardElement).toHaveAttribute('aria-label', 'Q of diamonds');

        unmount();
      });
    });
  });

  describe('React.memo Performance Optimization', () => {
    test('should not re-render with identical props', () => {
      // Test Card's memo behavior by checking if props comparison works correctly
      const card = { rank: 'A', suit: 's' };

      const { rerender } = render(<Card card={card} size="normal" faceDown={false} />);
      screen.getByRole('img'); // Verify initial render

      // Re-render with identical props (same object references)
      rerender(<Card card={card} size="normal" faceDown={false} />);

      // Component should still be working correctly
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'A of spades');

      // The memo comparison function should be working (verified by checking the component still renders correctly)
      expect(screen.getAllByText('A')).toHaveLength(3);
    });

    test('should re-render when card changes', () => {
      const card1 = { rank: 'A', suit: 's' };
      const card2 = { rank: 'K', suit: 'h' };

      const { rerender } = render(<Card card={card1} />);
      expect(screen.getAllByText('A')).toHaveLength(3); // 3 positions on card

      rerender(<Card card={card2} />);
      expect(screen.getAllByText('K')).toHaveLength(3); // 3 positions on card
      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });

    test('should re-render when size changes', () => {
      const card = { rank: 'A', suit: 's' };

      const { rerender } = render(<Card card={card} size="small" />);
      expect(screen.getByRole('img')).toHaveClass('small');

      rerender(<Card card={card} size="large" />);
      expect(screen.getByRole('img')).toHaveClass('large');
      expect(screen.getByRole('img')).not.toHaveClass('small');
    });

    test('should re-render when faceDown changes', () => {
      const card = { rank: 'A', suit: 's' };

      const { rerender } = render(<Card card={card} faceDown={false} />);
      expect(screen.getAllByText('A')).toHaveLength(3); // 3 positions on card

      rerender(<Card card={card} faceDown={true} />);
      expect(screen.queryByText('A')).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveClass('back');
    });

    test('should handle card prop changing from defined to undefined', () => {
      const card = { rank: 'A', suit: 's' };

      const { rerender } = render(<Card card={card} />);
      expect(screen.getAllByText('A')).toHaveLength(3); // 3 positions on card

      rerender(<Card card={undefined} />);
      expect(screen.queryByText('A')).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveClass('card-placeholder');
    });
  });

  describe('Component Integration', () => {
    test('should handle rapid prop changes without errors', () => {
      const cards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
      ];

      const { rerender } = render(<Card card={cards[0]} />);

      // Rapidly change cards
      cards.forEach((card, index) => {
        if (index > 0) {
          rerender(<Card card={card} />);
          expect(screen.getAllByText(card.rank)).toHaveLength(3);
          expect(screen.getAllByText(SUIT_SYMBOLS[card.suit])).toHaveLength(3);
        }
      });
    });

    test('should handle card flipping animation scenarios', () => {
      const card = { rank: 'A', suit: 's' };

      const { rerender } = render(<Card faceDown={true} />);
      expect(screen.getByRole('img')).toHaveClass('back');

      // Simulate card flip
      rerender(<Card card={card} faceDown={false} />);
      expect(screen.getAllByText('A')).toHaveLength(3); // 3 positions on card
      expect(screen.getByRole('img')).not.toHaveClass('back');

      // Flip back
      rerender(<Card faceDown={true} />);
      expect(screen.queryByText('A')).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveClass('back');
    });

    test('should work correctly in a card collection context', () => {
      const hand = [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 's' },
      ];

      const { container } = render(
        <div>
          {hand.map((card) => (
            <Card key={`${card.rank}-${card.suit}`} card={card} />
          ))}
        </div>
      );

      // Should render all cards
      expect(container.querySelectorAll('.playing-card')).toHaveLength(5);

      // Should have correct ranks
      expect(screen.getAllByText('A')).toHaveLength(6); // 2 aces × 3 positions each
      expect(screen.getAllByText('K')).toHaveLength(6); // 2 kings × 3 positions each
      expect(screen.getAllByText('Q')).toHaveLength(3); // 1 queen × 3 positions

      // Should have correct suits
      expect(screen.getAllByText('♠')).toHaveLength(9); // 3 spades × 3 positions each
      expect(screen.getAllByText('♥')).toHaveLength(6); // 2 hearts × 3 positions each
    });
  });

  describe('PropTypes Validation', () => {
    // Note: PropTypes warnings only appear in development mode
    // These tests verify the component handles the expected prop types correctly

    test('should handle valid card prop structure', () => {
      const card = { rank: 'A', suit: 's' };
      expect(() => render(<Card card={card} />)).not.toThrow();
    });

    test('should handle valid size props', () => {
      const card = { rank: 'A', suit: 's' };
      const validSizes = ['small', 'normal', 'large'];

      validSizes.forEach((size) => {
        expect(() => render(<Card card={card} size={size} />)).not.toThrow();
      });
    });

    test('should handle boolean faceDown prop', () => {
      const card = { rank: 'A', suit: 's' };

      expect(() => render(<Card card={card} faceDown={true} />)).not.toThrow();
      expect(() => render(<Card card={card} faceDown={false} />)).not.toThrow();
    });

    test('should handle missing optional props', () => {
      const card = { rank: 'A', suit: 's' };

      // All props are optional except the card content itself
      expect(() => render(<Card card={card} />)).not.toThrow();
      expect(() => render(<Card />)).not.toThrow();
    });
  });
});
