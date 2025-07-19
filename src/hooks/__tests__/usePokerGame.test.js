/**
 * usePokerGame Hook Test Suite
 * Comprehensive tests for poker game state management hook
 * Target: 90%+ coverage with realistic poker scenarios
 */

import { renderHook, act } from '@testing-library/react';

import usePokerGame from '../usePokerGame';
import { GAME_PHASES, PLAYER_STATUS } from '../../constants/game-constants';
import TestDataFactory from '../../test-utils/TestDataFactory';

describe('usePokerGame', () => {
  let mockOnStateChange;
  let mockOnHandComplete;
  let mockOnPhaseChange;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnStateChange = jest.fn();
    mockOnHandComplete = jest.fn();
    mockOnPhaseChange = jest.fn();
  });

  describe('Hook Initialization', () => {
    test('should initialize with default game state', () => {
      const { result } = renderHook(() => usePokerGame());

      expect(result.current.gameState).toBeDefined();
      expect(result.current.gameState.phase).toBe(GAME_PHASES.WAITING);
      expect(result.current.gameState.players).toHaveLength(0);
      expect(result.current.gameState.handNumber).toBe(0);
      expect(result.current.gameState.currentPlayerIndex).toBe(0);
    });

    test('should initialize with custom configuration', () => {
      const config = {
        smallBlind: 25,
        bigBlind: 50,
        maxPlayers: 8,
      };

      const { result } = renderHook(() => usePokerGame(config));

      expect(result.current.gameState.blinds.small).toBe(25);
      expect(result.current.gameState.blinds.big).toBe(50);
      expect(result.current.gameState.maxPlayers).toBe(8);
    });

    test('should register callbacks correctly', () => {
      const { result } = renderHook(() =>
        usePokerGame(
          {},
          {
            onStateChange: mockOnStateChange,
            onHandComplete: mockOnHandComplete,
            onPhaseChange: mockOnPhaseChange,
          }
        )
      );

      expect(result.current).toBeDefined();
      // Callbacks are internal, but we'll test they work in action tests
    });
  });

  describe('Player Management', () => {
    test('should add players correctly', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
      });

      expect(result.current.gameState.players).toHaveLength(1);
      expect(result.current.gameState.players[0].id).toBe('player1');
      expect(result.current.gameState.players[0].name).toBe('Alice');
      expect(result.current.gameState.players[0].chips).toBe(1000);
    });

    test('should add multiple players with correct positions', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
        result.current.addPlayer('player2', 'Bob', 1500);
        result.current.addPlayer('player3', 'Charlie', 2000);
      });

      expect(result.current.gameState.players).toHaveLength(3);
      expect(result.current.gameState.players[0].position).toBe(0);
      expect(result.current.gameState.players[1].position).toBe(1);
      expect(result.current.gameState.players[2].position).toBe(2);
    });

    test('should add AI players correctly', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('ai1', 'AI Bot', 1000, true, 'aggressive');
      });

      const aiPlayer = result.current.gameState.players[0];
      expect(aiPlayer.isAI).toBe(true);
      expect(aiPlayer.aiType).toBe('aggressive');
    });

    test('should remove players correctly', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
        result.current.addPlayer('player2', 'Bob', 1500);
      });

      act(() => {
        result.current.removePlayer('player1');
      });

      expect(result.current.gameState.players).toHaveLength(1);
      expect(result.current.gameState.players[0].id).toBe('player2');
    });

    test('should prevent adding more than max players', () => {
      const { result } = renderHook(() => usePokerGame({ maxPlayers: 2 }));

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
        result.current.addPlayer('player2', 'Bob', 1500);
      });

      expect(() => {
        act(() => {
          result.current.addPlayer('player3', 'Charlie', 2000);
        });
      }).toThrow('Maximum number of players reached');
    });

    test('should prevent duplicate player IDs', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
      });

      expect(() => {
        act(() => {
          result.current.addPlayer('player1', 'Bob', 1500);
        });
      }).toThrow('Player with ID player1 already exists');
    });
  });

  describe('Hand Management', () => {
    let hookResult;

    beforeEach(() => {
      const { result } = renderHook(() => usePokerGame({}, { onStateChange: mockOnStateChange }));
      hookResult = result;

      // Add players for testing
      act(() => {
        hookResult.current.addPlayer('player1', 'Alice', 1000);
        hookResult.current.addPlayer('player2', 'Bob', 1500);
        hookResult.current.addPlayer('player3', 'Charlie', 2000);
      });
    });

    test('should start new hand successfully', () => {
      act(() => {
        hookResult.current.startHand();
      });

      expect(hookResult.current.gameState.phase).toBe(GAME_PHASES.PREFLOP);
      expect(hookResult.current.gameState.handNumber).toBe(1);
      expect(hookResult.current.gameState.currentPlayerIndex).toBeGreaterThanOrEqual(0);
      expect(mockOnStateChange).toHaveBeenCalled();
    });

    test('should prevent starting hand with insufficient players', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
      });

      expect(() => {
        act(() => {
          result.current.startHand();
        });
      }).toThrow('At least 2 players required to start hand');
    });

    test('should deal hole cards to all players', () => {
      act(() => {
        hookResult.current.startHand();
      });

      const gameState = hookResult.current.gameState;
      gameState.players.forEach((player) => {
        if (player.status === PLAYER_STATUS.ACTIVE) {
          expect(player.holeCards).toHaveLength(2);
        }
      });
    });

    test('should post blinds correctly', () => {
      act(() => {
        hookResult.current.startHand();
      });

      const gameState = hookResult.current.gameState;
      expect(gameState.currentBet).toBe(gameState.blinds.big);

      // At least one player should have posted a blind
      const playersWithBets = gameState.players.filter((p) => p.currentBet > 0);
      expect(playersWithBets.length).toBeGreaterThanOrEqual(1);
    });

    test('should progress dealer button between hands', () => {
      act(() => {
        hookResult.current.startHand();
      });

      const initialDealerIndex = hookResult.current.gameState.dealerIndex;

      act(() => {
        hookResult.current.completeHand();
      });

      // Manually start next hand to test dealer progression
      act(() => {
        hookResult.current.startHand();
      });

      const newDealerIndex = hookResult.current.gameState.dealerIndex;
      expect(newDealerIndex).toBe((initialDealerIndex + 1) % 3);
    });
  });

  describe('Player Actions', () => {
    let hookResult;

    beforeEach(() => {
      const { result } = renderHook(() => usePokerGame({}, { onStateChange: mockOnStateChange }));
      hookResult = result;

      act(() => {
        hookResult.current.addPlayer('player1', 'Alice', 1000);
        hookResult.current.addPlayer('player2', 'Bob', 1500);
        hookResult.current.addPlayer('player3', 'Charlie', 2000);
        hookResult.current.startHand();
      });
    });

    test('should execute fold action correctly', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();

      act(() => {
        hookResult.current.executeAction(currentPlayer.id, 'fold');
      });

      expect(currentPlayer.status).toBe(PLAYER_STATUS.FOLDED);
      expect(mockOnStateChange).toHaveBeenCalled();
    });

    test('should execute call action correctly', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const initialChips = currentPlayer.chips;
      const callAmount = hookResult.current.gameState.currentBet - currentPlayer.currentBet;

      act(() => {
        hookResult.current.executeAction(currentPlayer.id, 'call', callAmount);
      });

      expect(currentPlayer.chips).toBe(initialChips - callAmount);
      expect(currentPlayer.currentBet).toBe(hookResult.current.gameState.currentBet);
    });

    test('should execute raise action correctly', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const initialChips = currentPlayer.chips;
      const raiseAmount =
        hookResult.current.gameState.currentBet + hookResult.current.gameState.minimumRaise;

      act(() => {
        hookResult.current.executeAction(currentPlayer.id, 'raise', raiseAmount);
      });

      expect(currentPlayer.chips).toBe(initialChips - raiseAmount);
      expect(hookResult.current.gameState.currentBet).toBe(raiseAmount);
      expect(currentPlayer.status).toBe(PLAYER_STATUS.RAISED);
    });

    test('should execute all-in action correctly', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const allInAmount = currentPlayer.chips;

      act(() => {
        hookResult.current.executeAction(currentPlayer.id, 'all-in', allInAmount);
      });

      expect(currentPlayer.chips).toBe(0);
      expect(currentPlayer.status).toBe(PLAYER_STATUS.ALL_IN);
    });

    test('should prevent invalid actions', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();

      expect(() => {
        act(() => {
          hookResult.current.executeAction(currentPlayer.id, 'invalid-action');
        });
      }).toThrow();
    });

    test('should prevent actions from non-current player', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const otherPlayer = hookResult.current.gameState.players.find(
        (p) => p.id !== currentPlayer.id
      );

      expect(() => {
        act(() => {
          hookResult.current.executeAction(otherPlayer.id, 'fold');
        });
      }).toThrow();
    });

    test('should advance to next player after action', () => {
      const initialPlayer = hookResult.current.getCurrentPlayer();

      act(() => {
        hookResult.current.executeAction(initialPlayer.id, 'fold');
      });

      const newPlayer = hookResult.current.getCurrentPlayer();
      expect(newPlayer.id).not.toBe(initialPlayer.id);
    });
  });

  describe('Game Phase Progression', () => {
    let hookResult;

    beforeEach(() => {
      const { result } = renderHook(() =>
        usePokerGame(
          {},
          {
            onStateChange: mockOnStateChange,
            onPhaseChange: mockOnPhaseChange,
          }
        )
      );
      hookResult = result;

      act(() => {
        hookResult.current.addPlayer('player1', 'Alice', 1000);
        hookResult.current.addPlayer('player2', 'Bob', 1500);
        hookResult.current.startHand();
      });
    });

    test('should progress from preflop to flop', () => {
      // Complete preflop betting
      act(() => {
        const players = hookResult.current.gameState.players;
        players.forEach((player) => {
          if (player.canAct()) {
            player.currentBet = hookResult.current.gameState.currentBet;
            player.lastAction = 'call';
          }
        });
        hookResult.current.checkAndAdvanceGame();
      });

      expect(hookResult.current.gameState.phase).toBe(GAME_PHASES.FLOP);
      expect(hookResult.current.gameState.communityCards).toHaveLength(3);
      expect(mockOnPhaseChange).toHaveBeenCalled();
    });

    test('should progress through all phases', () => {
      const phases = [GAME_PHASES.FLOP, GAME_PHASES.TURN, GAME_PHASES.RIVER];

      phases.forEach((expectedPhase) => {
        // Complete current betting round
        act(() => {
          const players = hookResult.current.gameState.players;
          players.forEach((player) => {
            if (player.canAct()) {
              player.currentBet = hookResult.current.gameState.currentBet;
              player.lastAction = 'call';
            }
          });
          hookResult.current.checkAndAdvanceGame();
        });

        expect(hookResult.current.gameState.phase).toBe(expectedPhase);
      });
    });

    test('should deal correct number of community cards each phase', () => {
      const expectedCards = {
        [GAME_PHASES.FLOP]: 3,
        [GAME_PHASES.TURN]: 4,
        [GAME_PHASES.RIVER]: 5,
      };

      Object.entries(expectedCards).forEach(([_phase, cardCount]) => {
        act(() => {
          const players = hookResult.current.gameState.players;
          players.forEach((player) => {
            if (player.canAct()) {
              player.currentBet = hookResult.current.gameState.currentBet;
              player.lastAction = 'call';
            }
          });
          hookResult.current.checkAndAdvanceGame();
        });

        expect(hookResult.current.gameState.communityCards).toHaveLength(cardCount);
      });
    });
  });

  describe('Valid Actions', () => {
    let hookResult;

    beforeEach(() => {
      const { result } = renderHook(() => usePokerGame());
      hookResult = result;

      act(() => {
        hookResult.current.addPlayer('player1', 'Alice', 1000);
        hookResult.current.addPlayer('player2', 'Bob', 1500);
        hookResult.current.startHand();
      });
    });

    test('should return correct valid actions for current player', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const validActions = hookResult.current.getValidActions(currentPlayer.id);

      expect(validActions).toContain('fold');
      expect(validActions.length).toBeGreaterThan(1);
    });

    test('should return empty array for non-current player', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const otherPlayer = hookResult.current.gameState.players.find(
        (p) => p.id !== currentPlayer.id
      );
      const validActions = hookResult.current.getValidActions(otherPlayer.id);

      expect(validActions).toHaveLength(0);
    });

    test('should return empty array for folded player', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();

      act(() => {
        hookResult.current.executeAction(currentPlayer.id, 'fold');
      });

      const validActions = hookResult.current.getValidActions(currentPlayer.id);
      expect(validActions).toHaveLength(0);
    });

    test('should include call action when bet to call', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const gameState = hookResult.current.gameState;

      if (gameState.currentBet > currentPlayer.currentBet) {
        const validActions = hookResult.current.getValidActions(currentPlayer.id);
        expect(validActions).toContain('call');
      }
    });

    test('should include check action when no bet to call', () => {
      // Set up scenario with no bet to call
      act(() => {
        hookResult.current.gameState.currentBet = 0;
      });

      const currentPlayer = hookResult.current.getCurrentPlayer();
      const validActions = hookResult.current.getValidActions(currentPlayer.id);

      expect(validActions).toContain('check');
    });
  });

  describe('Showdown and Hand Completion', () => {
    let hookResult;

    beforeEach(() => {
      const { result } = renderHook(() => usePokerGame({}, { onHandComplete: mockOnHandComplete }));
      hookResult = result;

      act(() => {
        hookResult.current.addPlayer('player1', 'Alice', 1000);
        hookResult.current.addPlayer('player2', 'Bob', 1500);
        hookResult.current.startHand();
      });
    });

    test('should handle single player win', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const otherPlayer = hookResult.current.gameState.players.find(
        (p) => p.id !== currentPlayer.id
      );

      // Make other player fold
      act(() => {
        otherPlayer.status = PLAYER_STATUS.FOLDED;
        hookResult.current.handleSinglePlayerWin();
      });

      expect(hookResult.current.gameState.winners).toHaveLength(1);
      expect(hookResult.current.gameState.winners[0].player.id).toBe(currentPlayer.id);
      expect(mockOnHandComplete).toHaveBeenCalled();
    });

    test('should handle showdown with multiple players', () => {
      // Simulate reaching showdown
      act(() => {
        hookResult.current.gameState.phase = GAME_PHASES.SHOWDOWN;
        hookResult.current.gameState.communityCards =
          TestDataFactory.createCommunityCards().royalFlush();

        hookResult.current.gameState.players.forEach((player) => {
          if (player.status === PLAYER_STATUS.ACTIVE) {
            player.holeCards = TestDataFactory.createHoleCards().pocketAces();
          }
        });

        hookResult.current.handleShowdown();
      });

      expect(hookResult.current.gameState.winners.length).toBeGreaterThan(0);
    });

    test('should complete hand and reset for next hand', () => {
      act(() => {
        hookResult.current.completeHand();
      });

      expect(hookResult.current.gameState.phase).toBe(GAME_PHASES.WAITING);
      expect(mockOnHandComplete).toHaveBeenCalled();
    });
  });

  describe('Pot Management', () => {
    let hookResult;

    beforeEach(() => {
      const { result } = renderHook(() => usePokerGame());
      hookResult = result;

      act(() => {
        hookResult.current.addPlayer('player1', 'Alice', 1000);
        hookResult.current.addPlayer('player2', 'Bob', 1500);
        hookResult.current.startHand();
      });
    });

    test('should track pot correctly', () => {
      const initialPot = hookResult.current.gameState.getTotalPot();

      expect(initialPot).toBeGreaterThan(0); // Should include blinds
    });

    test('should update pot after player actions', () => {
      const initialPot = hookResult.current.gameState.getTotalPot();
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const callAmount = hookResult.current.gameState.currentBet - currentPlayer.currentBet;

      act(() => {
        hookResult.current.executeAction(currentPlayer.id, 'call', callAmount);
      });

      const newPot = hookResult.current.gameState.getTotalPot();
      expect(newPot).toBeGreaterThan(initialPot);
    });

    test('should calculate pot odds correctly', () => {
      const currentPlayer = hookResult.current.getCurrentPlayer();
      const potOdds = hookResult.current.getPotOdds(currentPlayer.id);

      expect(typeof potOdds).toBe('number');
      expect(potOdds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid player ID gracefully', () => {
      const { result } = renderHook(() => usePokerGame());

      expect(() => {
        act(() => {
          result.current.executeAction('invalid-id', 'fold');
        });
      }).toThrow();
    });

    test('should handle insufficient chips gracefully', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 10); // Very low chips
        result.current.addPlayer('player2', 'Bob', 1500);
        result.current.startHand();
      });

      const poorPlayer = result.current.gameState.players.find((p) => p.chips < 100);

      expect(() => {
        act(() => {
          result.current.executeAction(poorPlayer.id, 'raise', 1000);
        });
      }).toThrow();
    });

    test('should handle game state corruption gracefully', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
        result.current.addPlayer('player2', 'Bob', 1500);
      });

      // Corrupt game state
      act(() => {
        result.current.gameState.currentPlayerIndex = -1;
      });

      expect(() => {
        result.current.getCurrentPlayer();
      }).not.toThrow(); // Should handle gracefully
    });
  });

  describe('Performance and Memory', () => {
    test('should not cause memory leaks with rapid state changes', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
        result.current.addPlayer('player2', 'Bob', 1500);
      });

      // Simulate rapid state changes
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.startHand();
          result.current.completeHand();
        });
      }

      expect(result.current.gameState.handNumber).toBe(100);
    });

    test('should maintain referential stability for functions', () => {
      const { result, rerender } = renderHook(() => usePokerGame());

      const initialAddPlayer = result.current.addPlayer;
      const initialExecuteAction = result.current.executeAction;

      rerender();

      expect(result.current.addPlayer).toBe(initialAddPlayer);
      expect(result.current.executeAction).toBe(initialExecuteAction);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete tournament scenario', () => {
      const { result } = renderHook(() =>
        usePokerGame({
          smallBlind: 25,
          bigBlind: 50,
        })
      );

      // Add tournament players
      act(() => {
        result.current.addPlayer('player1', 'Alice', 1500);
        result.current.addPlayer('player2', 'Bob', 1500);
        result.current.addPlayer('player3', 'Charlie', 1500);
        result.current.addPlayer('player4', 'David', 1500);
      });

      // Play multiple hands
      for (let hand = 0; hand < 5; hand++) {
        act(() => {
          result.current.startHand();
        });

        // Each player acts once
        const players = [...result.current.gameState.players];
        players.forEach(() => {
          const currentPlayer = result.current.getCurrentPlayer();
          if (currentPlayer && currentPlayer.canAct()) {
            act(() => {
              result.current.executeAction(
                currentPlayer.id,
                'call',
                result.current.gameState.currentBet - currentPlayer.currentBet
              );
            });
          }
        });

        act(() => {
          result.current.completeHand();
        });
      }

      expect(result.current.gameState.handNumber).toBe(5);
    });

    test('should handle heads-up play correctly', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 1000);
        result.current.addPlayer('player2', 'Bob', 1000);
        result.current.startHand();
      });

      expect(result.current.gameState.players).toHaveLength(2);
      expect(result.current.gameState.phase).toBe(GAME_PHASES.PREFLOP);
    });

    test('should handle player elimination correctly', () => {
      const { result } = renderHook(() => usePokerGame());

      act(() => {
        result.current.addPlayer('player1', 'Alice', 100); // Short stack
        result.current.addPlayer('player2', 'Bob', 2000);
        result.current.startHand();
      });

      const shortStack = result.current.gameState.players.find((p) => p.chips === 100);

      act(() => {
        result.current.executeAction(shortStack.id, 'all-in', shortStack.chips);
      });

      expect(shortStack.chips).toBe(0);
      expect(shortStack.status).toBe(PLAYER_STATUS.ALL_IN);
    });
  });
});
