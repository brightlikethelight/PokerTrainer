// PlayerActionUseCase
// Handles player actions in the game following Clean Architecture principles

import { PlayerActed } from '../../domain/events';

class PlayerActionUseCase {
  constructor(gameRepository, eventBus, validationService) {
    this.gameRepository = gameRepository;
    this.eventBus = eventBus;
    this.validationService = validationService;
  }

  async execute(command) {
    try {
      // 1. Validate input
      await this._validateCommand(command);

      // 2. Load game state
      const gameState = await this.gameRepository.findById(command.gameId);
      if (!gameState) {
        throw new Error(`Game not found: ${command.gameId}`);
      }

      // 3. Load player
      const player = gameState.getPlayerById(command.playerId);
      if (!player) {
        throw new Error(`Player not found: ${command.playerId}`);
      }

      // 4. Validate action using domain service
      const validation = await this.validationService.validatePlayerAction(
        gameState,
        player,
        command.action,
        command.amount
      );

      if (!validation.isValid) {
        throw new Error(`Invalid action: ${validation.reason}`);
      }

      // 5. Execute action through domain service
      const result = await this.validationService.executePlayerAction(
        gameState,
        player,
        command.action,
        command.amount
      );

      // 6. Save updated game state
      await this.gameRepository.save(gameState);

      // 7. Emit domain event
      const event = new PlayerActed({
        playerId: command.playerId,
        action: command.action,
        amount: command.amount,
        gameState: gameState.serialize(),
      });

      await this.eventBus.publish(event);

      // 8. Return result
      return {
        success: true,
        gameState: gameState.serialize(),
        actionResult: result,
        event: event.toJSON(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code || 'PLAYER_ACTION_FAILED',
      };
    }
  }

  async _validateCommand(command) {
    const errors = [];

    if (!command.gameId) {
      errors.push('Game ID is required');
    }

    if (!command.playerId) {
      errors.push('Player ID is required');
    }

    if (!command.action) {
      errors.push('Action is required');
    }

    const validActions = ['fold', 'check', 'call', 'bet', 'raise', 'all-in'];
    if (!validActions.includes(command.action)) {
      errors.push(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    if (['bet', 'raise', 'call'].includes(command.action)) {
      if (typeof command.amount !== 'number' || command.amount <= 0) {
        errors.push('Amount must be a positive number for bet/raise/call actions');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

export default PlayerActionUseCase;
