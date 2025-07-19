import PropTypes from 'prop-types';

import usePokerGame from '../../hooks/usePokerGame';

import BettingControls from './BettingControls';
import Card from './Card';
import PlayerSeat from './PlayerSeat';
import './PokerTable.css';

/**
 * Poker Table Component
 * Main poker table component that handles game display and interaction
 */
const PokerTable = ({ onGameStateChange, onPlayerAction } = {}) => {
  const humanPlayerId = 'human-player';

  const {
    gameState,
    showControls,
    validActions,
    showdown,
    error,
    executeAction,
    getCurrentPlayerInfo,
  } = usePokerGame(humanPlayerId, {
    onStateChange: onGameStateChange,
    onPlayerAction,
  });

  if (!gameState) {
    return (
      <div className="poker-table-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Game State:', {
      players: gameState.players?.length,
      phase: gameState.phase,
      pot: gameState._pot,
      currentPlayer: gameState.currentPlayerIndex,
      communityCards: gameState.communityCards?.length,
    });
  }

  const { humanPlayer, isHumanTurn } = getCurrentPlayerInfo;

  return (
    <div className="poker-table-container">
      {error && (
        <div className="error-banner" role="alert" aria-live="assertive" aria-atomic="true">
          {error}
        </div>
      )}

      <main className="poker-table" role="main" aria-label="Poker game table">
        <div className="table-rail" />

        <section className="player-seats" aria-label="Player seating positions">
          {gameState.players &&
            gameState.players
              .filter((player) => player != null)
              .map((player) => (
                <PlayerSeat
                  key={player.id}
                  player={player}
                  isActive={gameState.currentPlayerIndex === player.position}
                  isDealer={gameState.dealerPosition === player.position}
                  showCards={player.id === humanPlayerId || showdown}
                />
              ))}
        </section>

        <section
          className="community-cards"
          aria-label="Community cards"
          aria-describedby="game-phase-indicator"
        >
          {gameState.communityCards &&
            gameState.communityCards.map((card, index) => (
              <Card key={`card-${card.rank}-${card.suit}-${index}`} card={card} />
            ))}
          {(() => {
            const communityCardCount = gameState.communityCards
              ? gameState.communityCards.length
              : 0;
            const placeholderCount = Math.max(0, 5 - communityCardCount);
            return [...Array(placeholderCount)].map((_, index) => (
              <Card key={`placeholder-${index}`} />
            ));
          })()}
        </section>

        <div
          className="pot-display"
          role="status"
          aria-live="polite"
          aria-label={`Current pot amount: $${gameState._pot?.main || 0}`}
        >
          Pot: ${gameState._pot?.main || 0}
        </div>

        <aside className="game-info" aria-label="Game information">
          <h3>Game Info</h3>
          <div className="game-info-item">
            <span>Hand #</span>
            <span aria-label={`Hand number ${gameState.handNumber}`}>{gameState.handNumber}</span>
          </div>
          <div className="game-info-item">
            <span>Blinds</span>
            <span
              aria-label={`Small blind $${gameState.blinds.small}, big blind $${gameState.blinds.big}`}
            >
              ${gameState.blinds.small}/${gameState.blinds.big}
            </span>
          </div>
          <div className="game-info-item">
            <span>Players</span>
            <span
              aria-label={`${gameState.getPlayersInHand ? gameState.getPlayersInHand().length : gameState.players.length} players in game`}
            >
              {gameState.getPlayersInHand
                ? gameState.getPlayersInHand().length
                : gameState.players.length}
            </span>
          </div>
        </aside>

        <div
          id="game-phase-indicator"
          className="phase-indicator"
          role="status"
          aria-live="polite"
          aria-label={`Current game phase: ${gameState.phase}`}
        >
          {gameState.phase}
        </div>

        {showdown && gameState.winners.length > 0 && (
          <section
            className="winners-display"
            role="status"
            aria-live="assertive"
            aria-label="Hand results"
          >
            <h2>Winner{gameState.winners.length > 1 ? 's' : ''}!</h2>
            {gameState.winners.map((winner, _index) => (
              <div
                key={_index}
                className="winner-item"
                aria-label={`${winner.player.name} wins $${winner.amount} with ${winner.handDescription}`}
              >
                <div>
                  {winner.player.name} wins ${winner.amount}
                </div>
                <div className="winner-hand">{winner.handDescription}</div>
              </div>
            ))}
          </section>
        )}

        <div
          className="dealer-button"
          style={{
            transform: `translate(-50%, -50%) 
                     rotate(${gameState.dealerPosition * (360 / gameState.players.length)}deg) 
                     translateX(200px)`,
          }}
          role="img"
          aria-label={`Dealer button at position ${gameState.dealerPosition + 1}`}
        >
          D
        </div>
      </main>

      {/* Betting Controls */}
      {showControls && humanPlayer && isHumanTurn && (
        <BettingControls
          validActions={validActions}
          _currentBet={gameState.currentBet}
          playerChips={humanPlayer.chips}
          playerBet={humanPlayer.currentBet}
          _pot={gameState._pot?.main || 0}
          minBet={gameState.blinds.big}
          minRaise={gameState.currentBet + gameState.minimumRaise}
          onAction={executeAction}
        />
      )}
    </div>
  );
};

PokerTable.propTypes = {
  onGameStateChange: PropTypes.func,
  onPlayerAction: PropTypes.func,
};

export default PokerTable;
