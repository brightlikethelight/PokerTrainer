/**
 * Debug Integration Test
 * Simple test to debug the player issue
 */

import '../integration/setupIntegrationTests';

import GameEngine from '../../game/engine/GameEngine';
import Player from '../../game/entities/Player';
import { AI_PLAYER_TYPES } from '../../constants/game-constants';

describe('Debug Integration', () => {
  test('should debug player setup', () => {
    const humanPlayer = new Player('human', 'Human Player', 1000, 0);
    const aiPlayer = new Player('ai', 'AI Player', 1000, 1, true, AI_PLAYER_TYPES.TAG);

    console.log('Human Player:', {
      id: humanPlayer.id,
      isActive: humanPlayer.isActive,
      isFolded: humanPlayer.isFolded,
      chips: humanPlayer.chips,
    });

    console.log('AI Player:', {
      id: aiPlayer.id,
      isActive: aiPlayer.isActive,
      isFolded: aiPlayer.isFolded,
      chips: aiPlayer.chips,
    });

    const gameEngine = new GameEngine();
    console.log('Initial game state players:', gameEngine.gameState.players.length);

    gameEngine.addPlayer(humanPlayer);
    console.log('After adding human:', {
      totalPlayers: gameEngine.gameState.players.length,
      activePlayers: gameEngine.gameState.getActivePlayers().length,
    });

    gameEngine.addPlayer(aiPlayer);
    console.log('After adding AI:', {
      totalPlayers: gameEngine.gameState.players.length,
      activePlayers: gameEngine.gameState.getActivePlayers().length,
    });

    const activePlayers = gameEngine.gameState.getActivePlayers();
    console.log(
      'Active players:',
      activePlayers.map((p) => ({
        id: p.id,
        isActive: p.isActive,
        isFolded: p.isFolded,
      }))
    );

    // This should work
    expect(() => {
      gameEngine.startNewHand();
    }).not.toThrow();
  });
});
