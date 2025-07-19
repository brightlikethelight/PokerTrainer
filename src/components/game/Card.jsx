import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

const Card = React.memo(
  ({ card, size = 'normal', faceDown = false }) => {
    if (!card && !faceDown) {
      return <div className="card-placeholder" aria-label="Empty card slot" role="img" />;
    }

    const getSuitSymbol = (suit) => {
      const symbols = {
        s: '♠',
        h: '♥',
        d: '♦',
        c: '♣',
      };
      return symbols[suit] || '';
    };

    const getSuitClass = (suit) => {
      const classes = {
        s: 'spades',
        h: 'hearts',
        d: 'diamonds',
        c: 'clubs',
      };
      return classes[suit] || '';
    };

    if (faceDown) {
      return (
        <div
          className={`playing-card back ${size}`}
          role="img"
          aria-label="Face-down playing card"
        />
      );
    }

    const suitClass = getSuitClass(card.suit);
    const suitSymbol = getSuitSymbol(card.suit);

    const getSuitName = (suit) => {
      const names = {
        s: 'spades',
        h: 'hearts',
        d: 'diamonds',
        c: 'clubs',
      };
      return names[suit] || '';
    };

    const getCardDescription = () => {
      const suitName = getSuitName(card.suit);
      return `${card.rank} of ${suitName}`;
    };

    return (
      <div
        className={`playing-card ${suitClass} ${size}`}
        role="img"
        aria-label={getCardDescription()}
      >
        <div className="card-corner top-left">
          <span>{card.rank}</span>
          <span className="card-corner-suit">{suitSymbol}</span>
        </div>

        <div className="card-center">
          <div className="card-rank">{card.rank}</div>
          <div className="card-suit">{suitSymbol}</div>
        </div>

        <div className="card-corner bottom-right">
          <span>{card.rank}</span>
          <span className="card-corner-suit">{suitSymbol}</span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    // Custom comparison function for better performance
    prevProps.size === nextProps.size &&
    prevProps.faceDown === nextProps.faceDown &&
    prevProps.card?.rank === nextProps.card?.rank &&
    prevProps.card?.suit === nextProps.card?.suit
);

Card.displayName = 'Card';

Card.propTypes = {
  card: PropTypes.shape({
    rank: PropTypes.string.isRequired,
    suit: PropTypes.string.isRequired,
  }),
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  faceDown: PropTypes.bool,
};

export default Card;
