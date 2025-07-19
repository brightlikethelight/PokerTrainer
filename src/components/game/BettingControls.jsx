import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './BettingControls.css';

const BettingControls = React.memo(
  ({ validActions, _currentBet, playerChips, playerBet, _pot, onAction, minBet, minRaise }) => {
    const callAmount = Math.max(0, (_currentBet || 0) - (playerBet || 0));
    const [betAmount, setBetAmount] = useState(minBet || minRaise || 0);

    useEffect(() => {
      if (validActions.includes('bet')) {
        setBetAmount(minBet);
      } else if (validActions.includes('raise')) {
        setBetAmount(minRaise);
      }
    }, [validActions, minBet, minRaise]);

    const handleSliderChange = useCallback((e) => {
      setBetAmount(parseInt(e.target.value));
    }, []);

    const handleInputChange = useCallback(
      (e) => {
        const value = parseInt(e.target.value) || 0;
        setBetAmount(Math.min(value, playerChips));
      },
      [playerChips]
    );

    const setPresetBet = useCallback(
      (fraction) => {
        let amount;
        if (fraction === 'all') {
          amount = playerChips || 0;
        } else {
          amount = Math.floor((_pot || 0) * fraction);
        }

        if (validActions.includes('bet')) {
          amount = Math.max(amount, minBet || 0);
        } else if (validActions.includes('raise')) {
          amount = Math.max(amount, minRaise || 0);
        }

        setBetAmount(Math.min(amount, playerChips || 0));
      },
      [_pot, playerChips, minBet, minRaise, validActions]
    );

    const getPotOdds = () => {
      if (callAmount === 0) return null;
      const potAfterCall = (_pot || 0) + callAmount;
      if (potAfterCall === 0) return null;
      const odds = ((callAmount / potAfterCall) * 100).toFixed(1);
      return odds;
    };

    const potOdds = getPotOdds();

    return (
      <div
        className="betting-controls"
        role="region"
        aria-label="Betting controls"
        aria-describedby="betting-info pot-odds"
      >
        <div className="betting-info" id="betting-info" role="group" aria-label="Game information">
          <div className="betting-info-item">
            <span className="betting-info-label">Pot</span>
            <span className="betting-info-value">${_pot || 0}</span>
          </div>
          <div className="betting-info-item">
            <span className="betting-info-label">To Call</span>
            <span className="betting-info-value">${callAmount || 0}</span>
          </div>
          <div className="betting-info-item">
            <span className="betting-info-label">Your Stack</span>
            <span className="betting-info-value">${playerChips || 0}</span>
          </div>
        </div>

        {(validActions.includes('bet') || validActions.includes('raise')) && (
          <div className="betting-slider-container" role="group" aria-label="Bet amount controls">
            <div className="bet-amount-display">
              <label htmlFor="bet-amount-input" className="bet-amount-label">
                {validActions.includes('bet') ? 'Bet Amount:' : 'Raise To:'}
              </label>
              <input
                id="bet-amount-input"
                type="number"
                className="bet-amount-input"
                value={betAmount}
                onChange={handleInputChange}
                min={validActions.includes('bet') ? minBet : minRaise}
                max={playerChips}
                aria-describedby="bet-range-slider"
                aria-label={`${validActions.includes('bet') ? 'Bet' : 'Raise'} amount in dollars`}
              />
            </div>

            <input
              id="bet-range-slider"
              type="range"
              className="betting-slider"
              min={validActions.includes('bet') ? minBet : minRaise}
              max={playerChips}
              value={betAmount}
              onChange={handleSliderChange}
              aria-label={`Adjust ${validActions.includes('bet') ? 'bet' : 'raise'} amount with slider`}
              aria-valuemin={validActions.includes('bet') ? minBet : minRaise}
              aria-valuemax={playerChips}
              aria-valuenow={betAmount}
              aria-valuetext={`$${betAmount}`}
            />

            <div className="preset-buttons" role="group" aria-label="Preset bet amounts">
              <button
                className="preset-button"
                onClick={() => setPresetBet(1 / 3)}
                aria-label={`Set bet to one third of pot: $${Math.floor((_pot || 0) / 3)}`}
              >
                1/3 Pot
              </button>
              <button
                className="preset-button"
                onClick={() => setPresetBet(1 / 2)}
                aria-label={`Set bet to half of pot: $${Math.floor((_pot || 0) / 2)}`}
              >
                1/2 Pot
              </button>
              <button
                className="preset-button"
                onClick={() => setPresetBet(1)}
                aria-label={`Set bet to full pot: $${_pot || 0}`}
              >
                Pot
              </button>
              <button
                className="preset-button"
                onClick={() => setPresetBet('all')}
                aria-label={`Go all in with all chips: $${playerChips}`}
              >
                All In
              </button>
            </div>
          </div>
        )}

        <div className="action-buttons" role="group" aria-label="Poker action buttons">
          {validActions.includes('fold') && (
            <button
              className="action-button fold"
              onClick={() => onAction('fold')}
              aria-label="Fold your hand and forfeit this round"
              aria-describedby="betting-info"
            >
              Fold
            </button>
          )}

          {validActions.includes('check') && (
            <button
              className="action-button check"
              onClick={() => onAction('check')}
              aria-label="Check - no bet required"
              aria-describedby="betting-info"
            >
              Check
            </button>
          )}

          {validActions.includes('call') && (
            <button
              className="action-button call"
              onClick={() => onAction('call', callAmount)}
              aria-label={`Call the current bet of $${callAmount || 0}`}
              aria-describedby="betting-info"
            >
              Call ${callAmount || 0}
            </button>
          )}

          {validActions.includes('bet') && (
            <button
              className="action-button bet"
              onClick={() => onAction('bet', betAmount)}
              disabled={betAmount < minBet || betAmount > playerChips}
              aria-label={`Bet $${betAmount}`}
              aria-describedby="betting-info bet-amount-input"
              aria-disabled={betAmount < minBet || betAmount > playerChips}
            >
              Bet ${betAmount}
            </button>
          )}

          {validActions.includes('raise') && (
            <button
              className="action-button raise"
              onClick={() => onAction('raise', betAmount)}
              disabled={betAmount < minRaise || betAmount > playerChips}
              aria-label={`Raise the bet to $${betAmount}`}
              aria-describedby="betting-info bet-amount-input"
              aria-disabled={betAmount < minRaise || betAmount > playerChips}
            >
              Raise to ${betAmount}
            </button>
          )}

          {validActions.includes('all-in') && (
            <button
              className="action-button all-in"
              onClick={() => onAction('all-in', playerChips)}
              aria-label={`Go all in with all your chips: $${playerChips}`}
              aria-describedby="betting-info"
            >
              All In ${playerChips}
            </button>
          )}
        </div>

        {potOdds && (
          <div
            className="pot-odds-display"
            id="pot-odds"
            role="status"
            aria-live="polite"
            aria-label={`Pot odds: ${potOdds}% ${parseFloat(potOdds) < 30 ? 'This is a good betting opportunity' : ''}`}
          >
            Pot Odds: {potOdds}%
            {parseFloat(potOdds) < 30 && (
              <span className="pot-odds-good" aria-label="Good betting odds">
                {' '}
                (Good)
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance optimization
    return (
      JSON.stringify(prevProps.validActions) === JSON.stringify(nextProps.validActions) &&
      prevProps._currentBet === nextProps._currentBet &&
      prevProps.playerChips === nextProps.playerChips &&
      prevProps.playerBet === nextProps.playerBet &&
      prevProps._pot === nextProps._pot &&
      prevProps.minBet === nextProps.minBet &&
      prevProps.minRaise === nextProps.minRaise &&
      prevProps.onAction === nextProps.onAction
    );
  }
);

BettingControls.displayName = 'BettingControls';

BettingControls.propTypes = {
  validActions: PropTypes.arrayOf(PropTypes.string).isRequired,
  _currentBet: PropTypes.number,
  playerChips: PropTypes.number.isRequired,
  playerBet: PropTypes.number,
  _pot: PropTypes.number,
  onAction: PropTypes.func.isRequired,
  minBet: PropTypes.number,
  minRaise: PropTypes.number,
};

export default BettingControls;
