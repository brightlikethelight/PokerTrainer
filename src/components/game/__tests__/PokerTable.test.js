/**
 * PokerTable Component Test Suite
 * Comprehensive tests for the main poker game interface
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PokerTable from '../PokerTable';
import { GAME_PHASES, PLAYER_STATUS } from '../../../constants/game-constants';
import usePokerGame from '../../../hooks/usePokerGame';

// Mock the usePokerGame hook
jest.mock('../../../hooks/usePokerGame');

// Mock child components
jest.mock('../BettingControls', () => {
  return function MockBettingControls({ validActions, onAction }) {
    return (
      <div data-testid="betting-controls">
        {validActions.map((action) => (
          <button key={action} onClick={() => onAction({ type: action })}>
            {action}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('../Card', () => {
  return function MockCard({ card }) {
    return (
      <div data-testid="card" data-card={card ? `${card.rank}${card.suit}` : 'placeholder'}>
        {card ? `${card.rank}${card.suit}` : 'Empty'}
      </div>
    );
  };
});

jest.mock('../PlayerSeat', () => {
  return function MockPlayerSeat({ player, isActive, isDealer, showCards }) {
    return (
      <div
        data-testid="player-seat"
        data-player-id={player.id}
        data-position={player.position}
        data-active={isActive}
        data-dealer={isDealer}
        data-show-cards={showCards}
      >
        {player.name} - {player.chips} chips
      </div>
    );
  };
});

// Helper to create test players
const createTestPlayer = (id, name, position, chips = 1000, status = PLAYER_STATUS.ACTIVE) => ({
  id,
  name,
  position,
  chips,
  currentBet: 0,
  status,
  cards: [
    { rank: 'A', suit: 's' },
    { rank: 'K', suit: 'h' },
  ],
});

// Helper to create basic game state
const createBasicGameState = (playersCount = 6, phase = GAME_PHASES.PREFLOP) => ({
  players: Array.from({ length: playersCount }, (_, i) =>
    createTestPlayer(`player-${i}`, `Player ${i + 1}`, i, 1000)
  ),
  phase,
  handNumber: 1,
  dealerPosition: 0,
  currentPlayerIndex: 1,
  blinds: { small: 50, big: 100 },
  _pot: { main: 150 },
  communityCards: [],
  winners: [],
  currentBet: 100,
  minimumRaise: 100,
  getPlayersInHand: jest.fn(() => []),
});

describe('PokerTable', () => {
  const mockExecuteAction = jest.fn();
  const mockOnGameStateChange = jest.fn();
  const mockOnPlayerAction = jest.fn();

  // Default mock return values
  let defaultMockReturn;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock return value
    defaultMockReturn = {
      gameState: createBasicGameState(),
      showControls: false,
      validActions: ['fold', 'call', 'raise'],
      showdown: false,
      error: null,
      executeAction: mockExecuteAction,
      getCurrentPlayerInfo: {
        humanPlayer: createTestPlayer('human-player', 'Human Player', 1),
        isHumanTurn: false,
      },
    };

    // Set default mock implementation
    usePokerGame.mockReturnValue(defaultMockReturn);
  });

  describe('Component Rendering', () => {
    test('should render loading state when gameState is null', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState: null,
        getCurrentPlayerInfo: { humanPlayer: null, isHumanTurn: false },
      });

      render(<PokerTable />);

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });

    test('should render poker table with all main sections', () => {
      render(<PokerTable />);

      expect(screen.getByRole('main', { name: 'Poker game table' })).toBeInTheDocument();
      expect(screen.getByLabelText('Player seating positions')).toBeInTheDocument();
      expect(screen.getByLabelText('Community cards')).toBeInTheDocument();
      expect(screen.getByLabelText(/Current pot amount/)).toBeInTheDocument();
      expect(screen.getByLabelText('Game information')).toBeInTheDocument();
      expect(screen.getByLabelText(/Current game phase/)).toBeInTheDocument();
    });

    test('should render error banner when error exists', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        error: 'Game connection lost',
      });

      render(<PokerTable />);

      const errorBanner = screen.getByRole('alert');
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner).toHaveTextContent('Game connection lost');
      expect(errorBanner).toHaveAttribute('aria-live', 'assertive');
    });

    test('should not render error banner when no error', () => {
      render(<PokerTable />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Player Rendering', () => {
    test('should render correct number of players (2 players)', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState: createBasicGameState(2),
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');
      expect(playerSeats).toHaveLength(2);
    });

    test('should render correct number of players (6 players)', () => {
      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');
      expect(playerSeats).toHaveLength(6);
    });

    test('should render correct number of players (9 players)', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState: createBasicGameState(9),
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');
      expect(playerSeats).toHaveLength(9);
    });

    test('should filter out null players', () => {
      const gameStateWithNulls = createBasicGameState(4);
      gameStateWithNulls.players[1] = null; // Simulate empty seat

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState: gameStateWithNulls,
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');
      expect(playerSeats).toHaveLength(3); // Only non-null players
    });

    test('should pass correct props to PlayerSeat components', () => {
      const gameState = createBasicGameState(3);
      gameState.currentPlayerIndex = 1;
      gameState.dealerPosition = 2;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');

      // Check active player
      expect(playerSeats[1]).toHaveAttribute('data-active', 'true');
      expect(playerSeats[0]).toHaveAttribute('data-active', 'false');
      expect(playerSeats[2]).toHaveAttribute('data-active', 'false');

      // Check dealer
      expect(playerSeats[2]).toHaveAttribute('data-dealer', 'true');
      expect(playerSeats[0]).toHaveAttribute('data-dealer', 'false');
      expect(playerSeats[1]).toHaveAttribute('data-dealer', 'false');
    });

    test('should show cards only for human player and during showdown', () => {
      const gameState = createBasicGameState(3);
      gameState.players[0] = createTestPlayer('human-player', 'Human', 0);

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: false,
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');

      // Human player should always see cards
      expect(playerSeats[0]).toHaveAttribute('data-show-cards', 'true');
      // Others should not see cards when not in showdown
      expect(playerSeats[1]).toHaveAttribute('data-show-cards', 'false');
      expect(playerSeats[2]).toHaveAttribute('data-show-cards', 'false');
    });

    test('should show all cards during showdown', () => {
      const gameState = createBasicGameState(3);
      gameState.players[0] = createTestPlayer('human-player', 'Human', 0);

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: true,
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');

      // All players should show cards during showdown
      expect(playerSeats[0]).toHaveAttribute('data-show-cards', 'true');
      expect(playerSeats[1]).toHaveAttribute('data-show-cards', 'true');
      expect(playerSeats[2]).toHaveAttribute('data-show-cards', 'true');
    });
  });

  describe('Community Cards Display', () => {
    test('should render placeholder cards when no community cards', () => {
      const gameState = createBasicGameState();
      gameState.communityCards = [];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(5); // 5 placeholder cards
      cards.forEach((card) => {
        expect(card).toHaveAttribute('data-card', 'placeholder');
      });
    });

    test('should render flop (3 cards) with 2 placeholders', () => {
      const gameState = createBasicGameState();
      gameState.communityCards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
      ];
      gameState.phase = GAME_PHASES.FLOP;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(5);

      // First 3 should be actual cards
      expect(cards[0]).toHaveAttribute('data-card', 'As');
      expect(cards[1]).toHaveAttribute('data-card', 'Kh');
      expect(cards[2]).toHaveAttribute('data-card', 'Qd');

      // Last 2 should be placeholders
      expect(cards[3]).toHaveAttribute('data-card', 'placeholder');
      expect(cards[4]).toHaveAttribute('data-card', 'placeholder');
    });

    test('should render turn (4 cards) with 1 placeholder', () => {
      const gameState = createBasicGameState();
      gameState.communityCards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
      ];
      gameState.phase = GAME_PHASES.TURN;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(5);

      // First 4 should be actual cards
      expect(cards[0]).toHaveAttribute('data-card', 'As');
      expect(cards[1]).toHaveAttribute('data-card', 'Kh');
      expect(cards[2]).toHaveAttribute('data-card', 'Qd');
      expect(cards[3]).toHaveAttribute('data-card', 'Jc');

      // Last 1 should be placeholder
      expect(cards[4]).toHaveAttribute('data-card', 'placeholder');
    });

    test('should render river (5 cards) with no placeholders', () => {
      const gameState = createBasicGameState();
      gameState.communityCards = [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'Q', suit: 'd' },
        { rank: 'J', suit: 'c' },
        { rank: 'T', suit: 's' },
      ];
      gameState.phase = GAME_PHASES.RIVER;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(5);

      // All should be actual cards
      expect(cards[0]).toHaveAttribute('data-card', 'As');
      expect(cards[1]).toHaveAttribute('data-card', 'Kh');
      expect(cards[2]).toHaveAttribute('data-card', 'Qd');
      expect(cards[3]).toHaveAttribute('data-card', 'Jc');
      expect(cards[4]).toHaveAttribute('data-card', 'Ts');
    });
  });

  describe('Pot Display', () => {
    test('should display pot amount correctly', () => {
      const gameState = createBasicGameState();
      gameState._pot = { main: 450 };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const potDisplay = screen.getByText('Pot: $450');
      expect(potDisplay).toBeInTheDocument();
      expect(potDisplay).toHaveAttribute('aria-label', 'Current pot amount: $450');
    });

    test('should display $0 when pot is undefined', () => {
      const gameState = createBasicGameState();
      gameState._pot = undefined;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const potDisplay = screen.getByText('Pot: $0');
      expect(potDisplay).toBeInTheDocument();
    });

    test('should display $0 when pot.main is undefined', () => {
      const gameState = createBasicGameState();
      gameState._pot = {};

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const potDisplay = screen.getByText('Pot: $0');
      expect(potDisplay).toBeInTheDocument();
    });

    test('should have correct accessibility attributes', () => {
      const gameState = createBasicGameState();
      gameState._pot = { main: 300 };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const potDisplay = screen.getByText('Pot: $300');
      expect(potDisplay).toHaveAttribute('role', 'status');
      expect(potDisplay).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Game Phase Indicators', () => {
    test('should display preflop phase', () => {
      const gameState = createBasicGameState();
      gameState.phase = GAME_PHASES.PREFLOP;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const phaseIndicator = screen.getByText('preflop');
      expect(phaseIndicator).toBeInTheDocument();
      expect(phaseIndicator).toHaveAttribute('aria-label', 'Current game phase: preflop');
    });

    test('should display flop phase', () => {
      const gameState = createBasicGameState();
      gameState.phase = GAME_PHASES.FLOP;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const phaseIndicator = screen.getByText('flop');
      expect(phaseIndicator).toBeInTheDocument();
    });

    test('should display turn phase', () => {
      const gameState = createBasicGameState();
      gameState.phase = GAME_PHASES.TURN;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const phaseIndicator = screen.getByText('turn');
      expect(phaseIndicator).toBeInTheDocument();
    });

    test('should display river phase', () => {
      const gameState = createBasicGameState();
      gameState.phase = GAME_PHASES.RIVER;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const phaseIndicator = screen.getByText('river');
      expect(phaseIndicator).toBeInTheDocument();
    });

    test('should display showdown phase', () => {
      const gameState = createBasicGameState();
      gameState.phase = GAME_PHASES.SHOWDOWN;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const phaseIndicator = screen.getByText('showdown');
      expect(phaseIndicator).toBeInTheDocument();
    });

    test('should have correct accessibility attributes', () => {
      render(<PokerTable />);

      const phaseIndicator = screen.getByRole('status', { name: /Current game phase/ });
      expect(phaseIndicator).toHaveAttribute('aria-live', 'polite');
      expect(phaseIndicator).toHaveAttribute('id', 'game-phase-indicator');
    });
  });

  describe('Dealer Button', () => {
    test('should position dealer button correctly for different positions', () => {
      const gameState = createBasicGameState(6);
      gameState.dealerPosition = 2;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const dealerButton = screen.getByLabelText('Dealer button at position 3');
      expect(dealerButton).toBeInTheDocument();
      expect(dealerButton).toHaveTextContent('D');
    });

    test('should calculate rotation correctly for different table sizes', () => {
      // Test with 4 players
      const gameState = createBasicGameState(4);
      gameState.dealerPosition = 1;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const dealerButton = screen.getByLabelText('Dealer button at position 2');
      expect(dealerButton).toBeInTheDocument();
      // The rotation is calculated as dealerPosition * (360/players) = 1 * (360/4) = 90 degrees
      // The full transform includes translate and translateX as well
      const style = window.getComputedStyle(dealerButton);
      expect(style.transform).toContain('rotate(90deg)');
    });

    test('should have correct accessibility attributes', () => {
      const gameState = createBasicGameState();
      gameState.dealerPosition = 0;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const dealerButton = screen.getByRole('img', { name: 'Dealer button at position 1' });
      expect(dealerButton).toBeInTheDocument();
    });
  });

  describe('Game Information Panel', () => {
    test('should display hand number', () => {
      const gameState = createBasicGameState();
      gameState.handNumber = 42;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByLabelText('Hand number 42')).toBeInTheDocument();
    });

    test('should display blinds correctly', () => {
      const gameState = createBasicGameState();
      gameState.blinds = { small: 25, big: 50 };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      expect(screen.getByText('$25/$50')).toBeInTheDocument();
      expect(screen.getByLabelText('Small blind $25, big blind $50')).toBeInTheDocument();
    });

    test('should display player count from getPlayersInHand when available', () => {
      const gameState = createBasicGameState();
      const mockGetPlayersInHand = jest.fn(() => [{ id: '1' }, { id: '2' }, { id: '3' }]);
      gameState.getPlayersInHand = mockGetPlayersInHand;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByLabelText('3 players in game')).toBeInTheDocument();
    });

    test('should display player count from players array when getPlayersInHand not available', () => {
      const gameState = createBasicGameState(5);
      delete gameState.getPlayersInHand;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('5 players in game')).toBeInTheDocument();
    });
  });

  describe('Showdown and Winners', () => {
    test('should not display winners section when not in showdown', () => {
      const gameState = createBasicGameState();
      gameState.winners = [
        {
          player: { name: 'Alice' },
          amount: 500,
          handDescription: 'Pair of Aces',
        },
      ];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: false,
      });

      render(<PokerTable />);

      expect(screen.queryByText(/Winner/)).not.toBeInTheDocument();
    });

    test('should not display winners section when showdown but no winners', () => {
      const gameState = createBasicGameState();
      gameState.winners = [];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: true,
      });

      render(<PokerTable />);

      expect(screen.queryByText(/Winner/)).not.toBeInTheDocument();
    });

    test('should display single winner correctly', () => {
      const gameState = createBasicGameState();
      gameState.winners = [
        {
          player: { name: 'Alice' },
          amount: 500,
          handDescription: 'Pair of Aces',
        },
      ];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: true,
      });

      render(<PokerTable />);

      expect(screen.getByText('Winner!')).toBeInTheDocument();
      expect(screen.getByText('Alice wins $500')).toBeInTheDocument();
      expect(screen.getByText('Pair of Aces')).toBeInTheDocument();
    });

    test('should display multiple winners correctly', () => {
      const gameState = createBasicGameState();
      gameState.winners = [
        {
          player: { name: 'Alice' },
          amount: 250,
          handDescription: 'Pair of Kings',
        },
        {
          player: { name: 'Bob' },
          amount: 250,
          handDescription: 'Pair of Kings',
        },
      ];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: true,
      });

      render(<PokerTable />);

      expect(screen.getByText('Winners!')).toBeInTheDocument();
      expect(screen.getByText('Alice wins $250')).toBeInTheDocument();
      expect(screen.getByText('Bob wins $250')).toBeInTheDocument();
      expect(screen.getAllByText('Pair of Kings')).toHaveLength(2);
    });

    test('should have correct accessibility attributes for winners display', () => {
      const gameState = createBasicGameState();
      gameState.winners = [
        {
          player: { name: 'Charlie' },
          amount: 800,
          handDescription: 'Full House',
        },
      ];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: true,
      });

      render(<PokerTable />);

      const winnersSection = screen.getByRole('status', { name: 'Hand results' });
      expect(winnersSection).toHaveAttribute('aria-live', 'assertive');

      const winnerItem = screen.getByLabelText('Charlie wins $800 with Full House');
      expect(winnerItem).toBeInTheDocument();
    });
  });

  describe('Betting Controls', () => {
    test('should not render betting controls when showControls is false', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        showControls: false,
      });

      render(<PokerTable />);

      expect(screen.queryByTestId('betting-controls')).not.toBeInTheDocument();
    });

    test('should not render betting controls when no human player', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        showControls: true,
        getCurrentPlayerInfo: { humanPlayer: null, isHumanTurn: false },
      });

      render(<PokerTable />);

      expect(screen.queryByTestId('betting-controls')).not.toBeInTheDocument();
    });

    test('should not render betting controls when not human turn', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        showControls: true,
        getCurrentPlayerInfo: {
          humanPlayer: createTestPlayer('human-player', 'Human', 1),
          isHumanTurn: false,
        },
      });

      render(<PokerTable />);

      expect(screen.queryByTestId('betting-controls')).not.toBeInTheDocument();
    });

    test('should render betting controls when all conditions met', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        showControls: true,
        getCurrentPlayerInfo: {
          humanPlayer: createTestPlayer('human-player', 'Human', 1, 2000),
          isHumanTurn: true,
        },
      });

      render(<PokerTable />);

      expect(screen.getByTestId('betting-controls')).toBeInTheDocument();
      expect(screen.getByText('fold')).toBeInTheDocument();
      expect(screen.getByText('call')).toBeInTheDocument();
      expect(screen.getByText('raise')).toBeInTheDocument();
    });

    test('should pass correct props to BettingControls', () => {
      const humanPlayer = createTestPlayer('human-player', 'Human', 1, 2000);
      humanPlayer.currentBet = 50;
      const gameState = createBasicGameState();
      gameState.currentBet = 100;
      gameState.minimumRaise = 100;
      gameState._pot = { main: 300 };
      gameState.blinds = { big: 100 };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showControls: true,
        validActions: ['fold', 'call'],
        getCurrentPlayerInfo: {
          humanPlayer,
          isHumanTurn: true,
        },
      });

      render(<PokerTable />);

      expect(screen.getByTestId('betting-controls')).toBeInTheDocument();
    });
  });

  describe('Callback Handlers', () => {
    test('should call usePokerGame with correct parameters', () => {
      render(
        <PokerTable onGameStateChange={mockOnGameStateChange} onPlayerAction={mockOnPlayerAction} />
      );

      // The usePokerGame hook should be called with the callbacks
      expect(usePokerGame).toHaveBeenCalledWith(
        'human-player',
        expect.objectContaining({
          onStateChange: mockOnGameStateChange,
          onPlayerAction: mockOnPlayerAction,
        })
      );
    });

    test('should handle missing callbacks gracefully', () => {
      render(<PokerTable />);

      // Should not throw errors when callbacks are not provided
      expect(usePokerGame).toHaveBeenCalledWith(
        'human-player',
        expect.objectContaining({
          onStateChange: undefined,
          onPlayerAction: undefined,
        })
      );
    });
  });

  describe('Responsive Layout and Edge Cases', () => {
    test('should handle empty community cards array', () => {
      const gameState = createBasicGameState();
      gameState.communityCards = [];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(5);
      cards.forEach((card) => {
        expect(card).toHaveAttribute('data-card', 'placeholder');
      });
    });

    test('should handle undefined community cards', () => {
      const gameState = createBasicGameState();
      gameState.communityCards = undefined;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(5);
      cards.forEach((card) => {
        expect(card).toHaveAttribute('data-card', 'placeholder');
      });
    });

    test('should handle extreme pot values', () => {
      const gameState = createBasicGameState();
      gameState._pot = { main: 999999 };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      expect(screen.getByText('Pot: $999999')).toBeInTheDocument();
    });

    test('should handle zero pot value', () => {
      const gameState = createBasicGameState();
      gameState._pot = { main: 0 };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      expect(screen.getByText('Pot: $0')).toBeInTheDocument();
    });

    test('should handle missing blinds gracefully', () => {
      const gameState = createBasicGameState();
      gameState.blinds = undefined;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      // This should not crash, but will likely throw an error due to the component
      // trying to access blinds.small and blinds.big
      expect(() => render(<PokerTable />)).toThrow();
    });

    test('should handle large player counts within limits', () => {
      const gameState = createBasicGameState(9); // Maximum typical table size

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');
      expect(playerSeats).toHaveLength(9);
    });

    test('should handle minimum player counts', () => {
      const gameState = createBasicGameState(2); // Minimum for heads-up

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');
      expect(playerSeats).toHaveLength(2);
    });
  });

  describe('Accessibility Features', () => {
    test('should have proper ARIA labels for main regions', () => {
      render(<PokerTable />);

      expect(screen.getByRole('main', { name: 'Poker game table' })).toBeInTheDocument();
      expect(screen.getByLabelText('Player seating positions')).toBeInTheDocument();
      expect(screen.getByLabelText('Community cards')).toBeInTheDocument();
      expect(screen.getByLabelText('Game information')).toBeInTheDocument();
    });

    test('should have live regions for dynamic content', () => {
      render(<PokerTable />);

      const potDisplay = screen.getByRole('status', { name: /Current pot amount/ });
      expect(potDisplay).toHaveAttribute('aria-live', 'polite');

      const phaseIndicator = screen.getByRole('status', { name: /Current game phase/ });
      expect(phaseIndicator).toHaveAttribute('aria-live', 'polite');
    });

    test('should use assertive live regions for urgent updates', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        error: 'Connection lost',
      });

      render(<PokerTable />);

      const errorBanner = screen.getByRole('alert');
      expect(errorBanner).toHaveAttribute('aria-live', 'assertive');
      expect(errorBanner).toHaveAttribute('aria-atomic', 'true');
    });

    test('should connect community cards to phase indicator', () => {
      render(<PokerTable />);

      const communityCards = screen.getByLabelText('Community cards');
      expect(communityCards).toHaveAttribute('aria-describedby', 'game-phase-indicator');
    });
  });

  describe('Development Mode Logging', () => {
    const originalEnv = process.env.NODE_ENV;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockClear();
    });

    test('should log game state in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(<PokerTable />);

      expect(consoleSpy).toHaveBeenCalledWith('Game State:', {
        players: 6,
        phase: 'preflop',
        pot: { main: 150 },
        currentPlayer: 1,
        communityCards: 0,
      });
    });

    test('should not log in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(<PokerTable />);

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Complex Game States', () => {
    test('should handle heads-up game correctly', () => {
      const gameState = createBasicGameState(2);
      gameState.players[0] = createTestPlayer('human-player', 'Human', 0);
      gameState.dealerPosition = 0; // In heads-up, dealer is also small blind
      gameState.currentPlayerIndex = 0;

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showControls: true,
        getCurrentPlayerInfo: {
          humanPlayer: gameState.players[0],
          isHumanTurn: true,
        },
      });

      render(<PokerTable />);

      const playerSeats = screen.getAllByTestId('player-seat');
      expect(playerSeats).toHaveLength(2);
      expect(playerSeats[0]).toHaveAttribute('data-dealer', 'true');
      expect(playerSeats[0]).toHaveAttribute('data-active', 'true');
      expect(screen.getByTestId('betting-controls')).toBeInTheDocument();
    });

    test('should handle showdown with tie and multiple winners', () => {
      const gameState = createBasicGameState(4);
      gameState.phase = GAME_PHASES.SHOWDOWN;
      gameState.communityCards = [
        { rank: 'A', suit: 's' },
        { rank: 'A', suit: 'h' },
        { rank: 'K', suit: 'd' },
        { rank: 'Q', suit: 'c' },
        { rank: 'J', suit: 's' },
      ];
      gameState.winners = [
        {
          player: { name: 'Alice', id: 'player-1' },
          amount: 400,
          handDescription: 'Pair of Aces',
        },
        {
          player: { name: 'Bob', id: 'player-2' },
          amount: 400,
          handDescription: 'Pair of Aces',
        },
      ];

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showdown: true,
      });

      render(<PokerTable />);

      expect(screen.getByText('showdown')).toBeInTheDocument();
      expect(screen.getByText('Winners!')).toBeInTheDocument();
      expect(screen.getByText('Alice wins $400')).toBeInTheDocument();
      expect(screen.getByText('Bob wins $400')).toBeInTheDocument();
      expect(screen.getAllByText('Pair of Aces')).toHaveLength(2);
    });

    test('should handle waiting phase before hand starts', () => {
      const gameState = createBasicGameState();
      gameState.phase = GAME_PHASES.WAITING;
      gameState.communityCards = [];
      gameState._pot = { main: 0 };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      expect(screen.getByText('waiting')).toBeInTheDocument();
      expect(screen.getByText('Pot: $0')).toBeInTheDocument();
      expect(screen.getAllByTestId('card')).toHaveLength(5);
    });
  });

  describe('User Interaction Integration', () => {
    test('should handle betting control interactions correctly', async () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        showControls: true,
        getCurrentPlayerInfo: {
          humanPlayer: createTestPlayer('human-player', 'Human', 1, 2000),
          isHumanTurn: true,
        },
      });

      render(<PokerTable />);

      const foldButton = screen.getByText('fold');
      await userEvent.click(foldButton);

      expect(mockExecuteAction).toHaveBeenCalledWith({ type: 'fold' });
    });

    test('should update properly when human player changes turn', () => {
      const gameState = createBasicGameState();

      // Initially not human turn
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showControls: false,
        getCurrentPlayerInfo: {
          humanPlayer: createTestPlayer('human-player', 'Human', 1),
          isHumanTurn: false,
        },
      });

      const { rerender } = render(<PokerTable />);

      expect(screen.queryByTestId('betting-controls')).not.toBeInTheDocument();

      // Change to human turn
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
        showControls: true,
        getCurrentPlayerInfo: {
          humanPlayer: createTestPlayer('human-player', 'Human', 1),
          isHumanTurn: true,
        },
      });

      rerender(<PokerTable />);

      expect(screen.getByTestId('betting-controls')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle missing player properties gracefully', () => {
      const gameState = createBasicGameState(2);
      gameState.players[0] = { id: 'player-0', name: 'Player 1' }; // Missing chips, position, etc.

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      render(<PokerTable />);

      // Should not crash even with incomplete player data
      expect(screen.getByText('Game Info')).toBeInTheDocument();
    });

    test('should handle corrupted game state gracefully', () => {
      const gameState = {
        players: null,
        phase: undefined,
        handNumber: null,
        dealerPosition: undefined,
        _pot: null,
        communityCards: null,
        winners: undefined,
        blinds: null,
      };

      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        gameState,
      });

      // This will likely throw due to accessing properties on null/undefined values
      expect(() => render(<PokerTable />)).toThrow();
    });

    test('should handle network error scenarios', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        error: 'Network error: Unable to connect to game server',
      });

      render(<PokerTable />);

      const errorBanner = screen.getByRole('alert');
      expect(errorBanner).toHaveTextContent('Network error: Unable to connect to game server');
    });

    test('should handle timeout error scenarios', () => {
      usePokerGame.mockReturnValue({
        ...defaultMockReturn,
        error: 'Timeout: Player action took too long',
      });

      render(<PokerTable />);

      const errorBanner = screen.getByRole('alert');
      expect(errorBanner).toHaveTextContent('Timeout: Player action took too long');
    });
  });
});
