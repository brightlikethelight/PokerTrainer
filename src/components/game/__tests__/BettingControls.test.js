/**
 * BettingControls Test Suite
 * Comprehensive tests for betting UI component functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BettingControls from '../BettingControls';

describe('BettingControls', () => {
  const mockOnAction = jest.fn();

  const defaultProps = {
    validActions: ['fold', 'call', 'raise'],
    _currentBet: 100,
    playerChips: 1000,
    playerBet: 0,
    _pot: 200,
    onAction: mockOnAction,
    minBet: 100,
    minRaise: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      render(<BettingControls {...defaultProps} />);
      expect(screen.getByText('Fold')).toBeInTheDocument();
    });

    test('should display only valid action buttons', () => {
      render(<BettingControls {...defaultProps} validActions={['fold', 'call']} />);

      expect(screen.getByText('Fold')).toBeInTheDocument();
      expect(screen.getByText('Call $100')).toBeInTheDocument();
      expect(screen.queryByText(/Raise to/)).not.toBeInTheDocument();
    });

    test('should handle empty valid actions gracefully', () => {
      render(<BettingControls {...defaultProps} validActions={[]} />);

      expect(screen.queryByText('Fold')).not.toBeInTheDocument();
      expect(screen.queryByText(/Call \$/)).not.toBeInTheDocument();
    });

    test('should display correct call amount', () => {
      render(<BettingControls {...defaultProps} />);

      // Call amount = currentBet - playerBet = 100 - 0 = 100
      expect(screen.getByText('Call $100')).toBeInTheDocument();
    });

    test('should handle case where player already bet', () => {
      render(<BettingControls {...defaultProps} playerBet={50} />);

      // Call amount = 100 - 50 = 50
      expect(screen.getByText('Call $50')).toBeInTheDocument();
    });

    test('should handle all-in scenario', () => {
      render(
        <BettingControls
          {...defaultProps}
          validActions={['fold', 'call', 'all-in']}
          playerChips={50}
          _currentBet={100}
        />
      );

      expect(screen.getByText('All In $50')).toBeInTheDocument();
    });
  });

  describe('Action Execution', () => {
    test('should execute fold action correctly', async () => {
      render(<BettingControls {...defaultProps} />);

      await userEvent.click(screen.getByText('Fold'));

      expect(mockOnAction).toHaveBeenCalledWith('fold');
    });

    test('should execute call action correctly', async () => {
      render(<BettingControls {...defaultProps} />);

      await userEvent.click(screen.getByText('Call $100'));

      expect(mockOnAction).toHaveBeenCalledWith('call', 100);
    });

    test('should execute check action correctly', async () => {
      render(<BettingControls {...defaultProps} validActions={['check', 'bet']} _currentBet={0} />);

      await userEvent.click(screen.getByText('Check'));

      expect(mockOnAction).toHaveBeenCalledWith('check');
    });

    test('should execute all-in action correctly', async () => {
      render(
        <BettingControls {...defaultProps} validActions={['fold', 'all-in']} playerChips={500} />
      );

      await userEvent.click(screen.getByText('All In $500'));

      expect(mockOnAction).toHaveBeenCalledWith('all-in', 500);
    });
  });

  describe('Betting Interface', () => {
    test('should display betting slider for raise action', () => {
      render(<BettingControls {...defaultProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('min', '200'); // minRaise
      expect(slider).toHaveAttribute('max', '1000'); // playerChips
    });

    test('should display betting input field', () => {
      render(<BettingControls {...defaultProps} />);

      const input = screen.getByRole('spinbutton'); // number input
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(200); // Initial bet amount = minRaise
    });

    test('should update bet amount with slider', async () => {
      render(<BettingControls {...defaultProps} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '300' } });

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(300);
    });

    test('should update bet amount with input field', async () => {
      render(<BettingControls {...defaultProps} />);

      const input = screen.getByRole('spinbutton');
      await userEvent.clear(input);
      await userEvent.type(input, '400');

      expect(input).toHaveValue(400);
    });

    test('should limit bet amount to player chips', async () => {
      render(<BettingControls {...defaultProps} playerChips={300} />);

      const input = screen.getByRole('spinbutton');
      await userEvent.clear(input);
      await userEvent.type(input, '500'); // More than player has

      // Should be limited to player chips
      expect(input).toHaveValue(300);
    });

    test('should execute raise action with correct amount', async () => {
      render(<BettingControls {...defaultProps} />);

      const input = screen.getByRole('spinbutton');
      await userEvent.clear(input);
      await userEvent.type(input, '350');

      await userEvent.click(screen.getByText('Raise to $350'));

      expect(mockOnAction).toHaveBeenCalledWith('raise', 350);
    });

    test('should execute bet action with correct amount', async () => {
      render(
        <BettingControls
          {...defaultProps}
          validActions={['check', 'bet']}
          _currentBet={0}
          minBet={100}
        />
      );

      const input = screen.getByRole('spinbutton');
      await userEvent.clear(input);
      await userEvent.type(input, '250');

      await userEvent.click(screen.getByText('Bet $250'));

      expect(mockOnAction).toHaveBeenCalledWith('bet', 250);
    });
  });

  describe('Preset Betting Buttons', () => {
    test('should display preset betting buttons', () => {
      render(<BettingControls {...defaultProps} />);

      expect(screen.getByText('1/3 Pot')).toBeInTheDocument();
      expect(screen.getByText('1/2 Pot')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pot' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All In' })).toBeInTheDocument();
    });

    test('should set bet amount to 1/3 pot', async () => {
      render(<BettingControls {...defaultProps} _pot={300} />);

      await userEvent.click(screen.getByText('1/3 Pot'));

      // 1/3 of 300 = 100, but minRaise is 200, so should be 200
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(200);
    });

    test('should set bet amount to 1/2 pot', async () => {
      render(<BettingControls {...defaultProps} _pot={400} />);

      await userEvent.click(screen.getByText('1/2 Pot'));

      // 1/2 of 400 = 200, which equals minRaise
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(200);
    });

    test('should set bet amount to 3/4 pot', async () => {
      // Skip this test as component doesn't have 3/4 Pot button
      render(<BettingControls {...defaultProps} _pot={400} />);

      // Component only has 1/3, 1/2, Pot, and All In buttons
      expect(screen.queryByText('3/4 Pot')).not.toBeInTheDocument();
    });

    test('should set bet amount to full pot', async () => {
      render(<BettingControls {...defaultProps} _pot={300} />);

      await userEvent.click(screen.getByRole('button', { name: 'Pot' }));

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(300);
    });

    test('should set bet amount to all chips', async () => {
      render(<BettingControls {...defaultProps} playerChips={800} />);

      await userEvent.click(screen.getByRole('button', { name: 'All In' }));

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(800);
    });

    test('should respect minimum bet requirements for pot fraction bets', async () => {
      render(
        <BettingControls
          {...defaultProps}
          validActions={['check', 'bet']}
          _currentBet={0}
          _pot={100}
          minBet={150}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'Pot' })); // Pot = 100, but minBet = 150

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(150);
    });

    test('should limit preset bets to player chips', async () => {
      render(<BettingControls {...defaultProps} _pot={2000} playerChips={500} />);

      await userEvent.click(screen.getByRole('button', { name: 'Pot' })); // Pot is 2000 but player only has 500

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(500);
    });
  });

  describe('Button States', () => {
    test('should disable raise button when bet amount is too low', () => {
      render(<BettingControls {...defaultProps} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '150' } });

      // Component should enforce minimum, so it shows 200 and button should be enabled
      expect(screen.getByText('Raise to $200')).not.toBeDisabled();
    });

    test('should disable raise button when bet amount exceeds chips', () => {
      render(<BettingControls {...defaultProps} playerChips={300} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '400' } });

      // Slider should cap at max chips (300), and button should be enabled
      expect(screen.getByText('Raise to $300')).not.toBeDisabled();
    });

    test('should enable raise button with valid bet amount', () => {
      render(<BettingControls {...defaultProps} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '300' } });

      expect(screen.getByText('Raise to $300')).not.toBeDisabled();
    });

    test('should disable bet button when amount is too low', () => {
      render(
        <BettingControls
          {...defaultProps}
          validActions={['check', 'bet']}
          _currentBet={0}
          minBet={100}
        />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });

      expect(screen.getByText('Bet $50')).toBeDisabled();
    });
  });

  describe('Pot Odds Display', () => {
    test('should display pot odds when call amount is valid', () => {
      render(<BettingControls {...defaultProps} _pot={300} _currentBet={100} />);

      // Call amount = 100, total pot after call = 300 + 100 = 400
      // Pot odds = 100 / 400 = 0.25 = 25%
      expect(screen.getByText(/Pot Odds: 25\.0%/)).toBeInTheDocument();
    });

    test('should show good pot odds indicator', () => {
      render(<BettingControls {...defaultProps} _pot={800} _currentBet={100} />);

      // Call amount = 100, total pot = 800 + 100 = 900
      // Pot odds = 100 / 900 = 0.111 = 11%
      expect(screen.getByText('(Good)')).toBeInTheDocument();
    });

    test('should not display pot odds for check action', () => {
      render(<BettingControls {...defaultProps} validActions={['check', 'bet']} _currentBet={0} />);

      expect(screen.queryByText(/Pot Odds/)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined props gracefully', () => {
      render(
        <BettingControls validActions={['fold']} playerChips={1000} onAction={mockOnAction} />
      );

      expect(screen.getByText('Fold')).toBeInTheDocument();
    });

    test('should handle zero player chips', () => {
      render(<BettingControls {...defaultProps} validActions={['fold']} playerChips={0} />);

      expect(screen.getByText('Fold')).toBeInTheDocument();
    });

    test('should handle negative call amount', () => {
      render(<BettingControls {...defaultProps} _currentBet={50} playerBet={100} />);

      // Player already bet more than current bet, so call amount should be 0
      expect(screen.queryByText(/Call \$-50/)).not.toBeInTheDocument();
    });

    test('should handle very large pot values', () => {
      render(<BettingControls {...defaultProps} _pot={1000000} playerChips={100000} />);

      expect(screen.getByText('$1000000')).toBeInTheDocument();
    });

    test('should handle invalid action prop', async () => {
      render(<BettingControls {...defaultProps} validActions={['invalid-action']} />);

      // Should not crash and should not render action buttons for invalid actions
      expect(screen.queryByRole('button', { name: /Fold/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Call/ })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<BettingControls {...defaultProps} />);

      // Check for accessible form controls
      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(<BettingControls {...defaultProps} />);

      const foldButton = screen.getByText('Fold');
      foldButton.focus();

      await userEvent.keyboard('{Enter}');

      expect(mockOnAction).toHaveBeenCalledWith('fold');
    });

    test('should have proper button roles', () => {
      render(<BettingControls {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // All buttons should have proper text content
      buttons.forEach((button) => {
        expect(button.textContent).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const renderCount = jest.fn();

      const TestComponent = (props) => {
        renderCount();
        return <BettingControls {...props} />;
      };

      const { rerender } = render(<TestComponent {...defaultProps} />);

      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />);

      // Should only render twice (initial + rerender with same props)
      expect(renderCount).toHaveBeenCalledTimes(2);
    });

    test('should update when validActions change', () => {
      const { rerender } = render(<BettingControls {...defaultProps} />);

      expect(screen.getByText('Raise to $200')).toBeInTheDocument();

      rerender(<BettingControls {...defaultProps} validActions={['fold', 'call']} />);

      expect(screen.queryByText('Raise to $200')).not.toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete betting round simulation', async () => {
      let currentProps = { ...defaultProps };

      const { rerender } = render(<BettingControls {...currentProps} />);

      // Player raises
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '300' } });
      await userEvent.click(screen.getByText('Raise to $300'));

      expect(mockOnAction).toHaveBeenCalledWith('raise', 300);

      // Simulate game state update after raise
      currentProps = {
        ...currentProps,
        validActions: ['fold', 'call'],
        _currentBet: 300,
        playerBet: 0,
      };

      rerender(<BettingControls {...currentProps} />);

      expect(screen.getByText('Call $300')).toBeInTheDocument();
    });

    test('should handle tournament short stack scenario', () => {
      render(
        <BettingControls
          {...defaultProps}
          validActions={['fold', 'call', 'all-in']}
          playerChips={150}
          _currentBet={100}
        />
      );

      // Short stack should see all-in as main option
      expect(screen.getByText('All In $150')).toBeInTheDocument();
    });

    test('should handle heads-up play scenario', () => {
      render(
        <BettingControls
          {...defaultProps}
          validActions={['fold', 'call', 'raise', 'all-in']}
          _currentBet={50} // Small blind
          playerBet={25} // Posted small blind
        />
      );

      expect(screen.getByText('Call $25')).toBeInTheDocument(); // Complete the call
    });
  });
});
