import React from 'react';
import PropTypes from 'prop-types';

import Card from './Card';
import './PlayerSeat.css';

const PlayerSeat = React.memo(
  ({ player, isActive, isDealer, position, showCards }) => {
    if (!player) {
      return null;
    }

    const getPositionLabel = () => {
      if (isDealer) return 'BTN';

      const labels = {
        'small-blind': 'SB',
        'big-blind': 'BB',
        'under-the-gun': 'UTG',
        'middle-position': 'MP',
        'cut-off': 'CO',
      };

      return labels[position] || '';
    };

    const formatChips = (amount) => {
      if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
      }
      return amount.toString();
    };

    const positionLabel = getPositionLabel();
    const seatClasses = [
      'player-seat',
      `position-${player.position}`,
      isActive ? 'active' : '',
      player.status === 'folded' ? 'folded' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={seatClasses}>
        {positionLabel && <div className="position-label">{positionLabel}</div>}

        {player.status === 'all-in' && <div className="player-status-icon">AI</div>}

        <div className="player-info">
          <span className="player-name">{player.name}</span>
          <span className="player-chips">${formatChips(player.chips)}</span>
        </div>

        <div className="player-cards">
          {player.holeCards && player.holeCards.length > 0 && player.status !== 'folded' ? (
            <>
              {showCards && player.holeCards ? (
                player.holeCards.map((card, _index) => (
                  <Card key={_index} card={card} size="small" />
                ))
              ) : (
                <>
                  <Card faceDown size="small" />
                  <Card faceDown size="small" />
                </>
              )}
            </>
          ) : null}
        </div>

        {player.currentBet > 0 && <div className="player-bet">${player.currentBet}</div>}

        {player.lastAction && (
          <div className={`player-_action ${player.lastAction}`}>{player.lastAction}</div>
        )}

        {isActive && (
          <div className="player-timer">
            <div className="player-timer-bar" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    const prevPlayer = prevProps.player;
    const nextPlayer = nextProps.player;

    if (!prevPlayer && !nextPlayer) return true;
    if (!prevPlayer || !nextPlayer) return false;

    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.isDealer === nextProps.isDealer &&
      prevProps.position === nextProps.position &&
      prevProps.showCards === nextProps.showCards &&
      prevPlayer.id === nextPlayer.id &&
      prevPlayer.name === nextPlayer.name &&
      prevPlayer.chips === nextPlayer.chips &&
      prevPlayer.status === nextPlayer.status &&
      prevPlayer.currentBet === nextPlayer.currentBet &&
      prevPlayer.lastAction === nextPlayer.lastAction &&
      prevPlayer.hasCards === nextPlayer.hasCards &&
      JSON.stringify(prevPlayer.holeCards) === JSON.stringify(nextPlayer.holeCards)
    );
  }
);

PlayerSeat.displayName = 'PlayerSeat';

PlayerSeat.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    chips: PropTypes.number.isRequired,
    position: PropTypes.number,
    status: PropTypes.string,
    currentBet: PropTypes.number,
    lastAction: PropTypes.string,
    holeCards: PropTypes.arrayOf(
      PropTypes.shape({
        rank: PropTypes.string,
        suit: PropTypes.string,
      })
    ),
    hasCards: PropTypes.bool,
  }),
  isActive: PropTypes.bool,
  isDealer: PropTypes.bool,
  position: PropTypes.string,
  showCards: PropTypes.bool,
};

export default PlayerSeat;
