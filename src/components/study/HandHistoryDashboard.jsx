// Hand History Dashboard Component
// View and analyze captured poker hand data

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

import HandHistoryStorage from '../../storage/HandHistoryStorage';
import { formatCurrency, formatDate, formatDuration } from '../../utils/formatters';
import logger from '../../services/logger';
import './HandHistoryDashboard.css';

const HandHistoryDashboard = () => {
  const [hands, setHands] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedHand, setSelectedHand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'last7days',
    position: 'all',
    result: 'all',
    minPot: 0,
  });
  const [viewMode, setViewMode] = useState('overview'); // overview, hands, analytics, hand-detail

  const calculateAnalytics = useCallback((hands) => {
    if (!hands || hands.length === 0) {
      return {
        totalHands: 0,
        totalProfit: 0,
        winRate: 0,
        avgPot: 0,
        bestHand: null,
        worstHand: null,
        hourlyRate: 0,
      };
    }

    const totalHands = hands.length;
    const handsWon = hands.filter((h) => h.result && h.result.won).length;
    const totalProfit = hands.reduce((sum, h) => sum + (h.result?.profit || 0), 0);
    const totalPots = hands.reduce((sum, h) => sum + (h.pot || 0), 0);

    return {
      totalHands,
      totalProfit,
      winRate: totalHands > 0 ? (handsWon / totalHands) * 100 : 0,
      avgPot: totalHands > 0 ? totalPots / totalHands : 0,
      bestHand: hands.find((h) => h.result && h.result.profit > 0) || null,
      worstHand: hands.find((h) => h.result && h.result.profit < 0) || null,
      hourlyRate: totalProfit / (totalHands * 0.1), // Rough estimate
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load recent hands
      const allHands = await HandHistoryStorage.getAllHands();
      const recentHands = allHands.slice(0, 200); // Get most recent 200 hands
      setHands(recentHands);

      // Calculate analytics from hands data
      const analyticsData = calculateAnalytics(recentHands);
      setAnalytics(analyticsData);
    } catch (error) {
      logger.error('Failed to load hand history data', { error });
    } finally {
      setLoading(false);
    }
  }, [calculateAnalytics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredHands = useMemo(() => {
    return hands.filter((hand) => {
      // Apply result filter
      if (filters.result !== 'all' && hand.handResult !== filters.result) {
        return false;
      }

      // Apply position filter
      if (filters.position !== 'all' && hand.heroPosition !== parseInt(filters.position)) {
        return false;
      }

      // Apply minimum pot filter
      if (hand.potSize < filters.minPot) {
        return false;
      }

      return true;
    });
  }, [hands, filters]);

  const handleHandSelect = (hand) => {
    setSelectedHand(hand);
    setViewMode('hand-detail');
  };

  const exportData = async () => {
    try {
      const allHands = await HandHistoryStorage.getAllHands();
      const exportData = {
        hands: allHands.slice(0, 1000),
        sessions: await HandHistoryStorage.getAllSessions(),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poker-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export data', { error });
    }
  };

  if (loading) {
    return (
      <div className="hand-history-dashboard loading">
        <div className="loading-spinner">Loading hand history...</div>
      </div>
    );
  }

  return (
    <div className="hand-history-dashboard">
      <div className="dashboard-header">
        <h2>Hand History & Analytics</h2>
        <div className="header-controls">
          <button
            className={viewMode === 'overview' ? 'active' : ''}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button
            className={viewMode === 'hands' ? 'active' : ''}
            onClick={() => setViewMode('hands')}
          >
            Hand History
          </button>
          <button
            className={viewMode === 'analytics' ? 'active' : ''}
            onClick={() => setViewMode('analytics')}
          >
            Analytics
          </button>
          <button onClick={exportData} className="export-btn">
            Export Data
          </button>
        </div>
      </div>

      <div className="dashboard-filters">
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
        >
          <option value="today">Today</option>
          <option value="last7days">Last 7 Days</option>
          <option value="last30days">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>

        <select
          value={filters.position}
          onChange={(e) => setFilters((prev) => ({ ...prev, position: e.target.value }))}
        >
          <option value="all">All Positions</option>
          <option value="0">Button</option>
          <option value="1">Cutoff</option>
          <option value="2">Hijack</option>
          <option value="3">Middle</option>
          <option value="4">UTG+1</option>
          <option value="5">UTG</option>
        </select>

        <select
          value={filters.result}
          onChange={(e) => setFilters((prev) => ({ ...prev, result: e.target.value }))}
        >
          <option value="all">All Results</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <input
          type="number"
          placeholder="Min pot size"
          value={filters.minPot}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              minPot: parseInt(e.target.value) || 0,
            }))
          }
        />
      </div>

      <div className="dashboard-content">
        {viewMode === 'overview' && <OverviewTab analytics={analytics} hands={filteredHands} />}

        {viewMode === 'hands' && <HandsTab hands={filteredHands} onHandSelect={handleHandSelect} />}

        {viewMode === 'analytics' && <AnalyticsTab analytics={analytics} hands={filteredHands} />}

        {viewMode === 'hand-detail' && selectedHand && (
          <HandDetailTab hand={selectedHand} onBack={() => setViewMode('hands')} />
        )}
      </div>
    </div>
  );
};

const OverviewTab = ({ analytics, hands }) => {
  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Hands</h3>
          <div className="stat-value">{analytics.totalHands}</div>
        </div>

        <div className="stat-card">
          <h3>Win Rate</h3>
          <div className="stat-value">{analytics.winRate}%</div>
        </div>

        <div className="stat-card">
          <h3>Net Profit</h3>
          <div className={`stat-value ${analytics.netProfit >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(analytics.netProfit)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Biggest Win</h3>
          <div className="stat-value">{formatCurrency(analytics.biggestWin)}</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="position-chart">
          <h3>Performance by Position</h3>
          <div className="position-bars">
            {Object.entries(analytics.positionStats || {}).map(([pos, stats]) => (
              <div key={pos} className="position-bar">
                <div className="position-label">
                  {['BTN', 'CO', 'HJ', 'MP', 'UTG+1', 'UTG'][pos] || `Pos ${pos}`}
                </div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${stats.winRate}%` }}></div>
                </div>
                <div className="position-stats">
                  {stats.totalHands} hands, {stats.winRate.toFixed(1)}% win
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recent-session">
        <h3>Recent Activity</h3>
        {hands.slice(0, 5).map((hand) => (
          <div key={hand.id} className="recent-hand">
            <span className="hand-time">{formatDate(new Date(hand.timestamp))}</span>
            <span className={`hand-result ${hand.handResult}`}>
              {hand.handResult === 'won' ? '+' : ''}
              {formatCurrency(hand.heroWinAmount || -hand.amountLost)}
            </span>
            <span className="hand-position">
              {['BTN', 'CO', 'HJ', 'MP', 'UTG+1', 'UTG'][hand.heroPosition] ||
                `Pos ${hand.heroPosition}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HandsTab = ({ hands, onHandSelect }) => {
  return (
    <div className="hands-tab">
      <div className="hands-list">
        <div className="hands-header">
          <span>Time</span>
          <span>Position</span>
          <span>Cards</span>
          <span>Result</span>
          <span>Pot Size</span>
          <span>Actions</span>
        </div>

        {hands.map((hand) => (
          <div
            key={hand.id}
            className="hand-row"
            onClick={() => onHandSelect(hand)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onHandSelect(hand);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className="hand-time">{formatDate(new Date(hand.timestamp))}</span>
            <span className="hand-position">
              {['BTN', 'CO', 'HJ', 'MP', 'UTG+1', 'UTG'][hand.heroPosition] ||
                `Pos ${hand.heroPosition}`}
            </span>
            <span className="hand-cards">
              {hand.heroCards?.map((card) => `${card.rank}${card.suit}`).join(' ') || 'Hidden'}
            </span>
            <span className={`hand-result ${hand.handResult}`}>
              {hand.handResult === 'won' ? 'Won' : 'Lost'}
            </span>
            <span className="hand-pot">{formatCurrency(hand.potSize)}</span>
            <span className="hand-actions">{hand.analysis?.totalActions || 0} actions</span>
          </div>
        ))}

        {hands.length === 0 && (
          <div className="no-hands">No hands found matching current filters</div>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = ({ analytics: _analytics, hands }) => {
  const calculateStreaks = () => {
    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLoseStreak = 0;

    hands.forEach((hand) => {
      if (hand.handResult === 'won') {
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
        longestWinStreak = Math.max(longestWinStreak, currentStreak);
      } else {
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
        longestLoseStreak = Math.max(longestLoseStreak, Math.abs(currentStreak));
      }
    });

    return { longestWinStreak, longestLoseStreak, currentStreak };
  };

  const streaks = calculateStreaks();

  return (
    <div className="analytics-tab">
      <div className="advanced-stats">
        <h3>Advanced Statistics</h3>

        <div className="stats-section">
          <h4>Streak Analysis</h4>
          <div className="streak-stats">
            <div>Longest Win Streak: {streaks.longestWinStreak}</div>
            <div>Longest Lose Streak: {streaks.longestLoseStreak}</div>
            <div>
              Current Streak: {Math.abs(streaks.currentStreak)}{' '}
              {streaks.currentStreak >= 0 ? 'wins' : 'losses'}
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h4>Pot Size Distribution</h4>
          <div className="pot-distribution">
            {[
              { range: '0-500', min: 0, max: 500 },
              { range: '500-1000', min: 500, max: 1000 },
              { range: '1000-2000', min: 1000, max: 2000 },
              { range: '2000+', min: 2000, max: Infinity },
            ].map((bucket) => {
              const count = hands.filter(
                (hand) => hand.potSize >= bucket.min && hand.potSize < bucket.max
              ).length;
              const percentage = hands.length > 0 ? (count / hands.length) * 100 : 0;

              return (
                <div key={bucket.range} className="pot-bucket">
                  <span>{bucket.range}</span>
                  <div className="bucket-bar">
                    <div className="bucket-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span>
                    {count} hands ({percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stats-section">
          <h4>Play Style Analysis</h4>
          <div className="playstyle-stats">
            <div>
              Average Actions per Hand:{' '}
              {hands.length > 0
                ? (
                    hands.reduce((sum, hand) => sum + (hand.analysis?.totalActions || 0), 0) /
                    hands.length
                  ).toFixed(1)
                : 0}
            </div>
            <div>
              Aggression Factor:{' '}
              {hands.length > 0
                ? (
                    hands.reduce((sum, hand) => sum + (hand.analysis?.aggressionFactor || 0), 0) /
                    hands.length
                  ).toFixed(2)
                : 0}
            </div>
            <div>
              Showdown Rate:{' '}
              {hands.length > 0
                ? ((hands.filter((hand) => hand.showdown).length / hands.length) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HandDetailTab = ({ hand, onBack }) => {
  const renderActions = (actions, phase) => {
    if (!actions || actions.length === 0) {
      return <div className="no-actions">No actions in {phase}</div>;
    }

    return (
      <div className="actions-list">
        {actions.map((action, index) => (
          <div key={index} className="action-item">
            <span className="action-player">Player {action.playerId}</span>
            <span className="action-type">{action.action}</span>
            {action.amount > 0 && (
              <span className="action-amount">{formatCurrency(action.amount)}</span>
            )}
            <span className="action-pot">Pot: {formatCurrency(action.potBefore)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="hand-detail-tab">
      <div className="detail-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Hands
        </button>
        <h3>Hand #{hand.handNumber || hand.id}</h3>
        <span className="hand-date">{formatDate(new Date(hand.timestamp))}</span>
      </div>

      <div className="hand-summary">
        <div className="summary-item">
          <span className="summary-label">Position:</span>
          <span>
            {['BTN', 'CO', 'HJ', 'MP', 'UTG+1', 'UTG'][hand.heroPosition] ||
              `Pos ${hand.heroPosition}`}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Cards:</span>
          <span>
            {hand.heroCards?.map((card) => `${card.rank}${card.suit}`).join(' ') || 'Hidden'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Result:</span>
          <span className={hand.handResult}>{hand.handResult}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Final Pot:</span>
          <span>{formatCurrency(hand.potSize)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Duration:</span>
          <span>{formatDuration(hand.handDuration)}</span>
        </div>
      </div>

      <div className="hand-progression">
        <div className="street-section">
          <h4>Pre-flop</h4>
          {renderActions(hand.preflopActions, 'pre-flop')}
        </div>

        {hand.flopCards && hand.flopCards.length > 0 && (
          <div className="street-section">
            <h4>Flop: {hand.flopCards.map((card) => `${card.rank}${card.suit}`).join(' ')}</h4>
            {renderActions(hand.flopActions, 'flop')}
          </div>
        )}

        {hand.turnCard && (
          <div className="street-section">
            <h4>Turn: {`${hand.turnCard.rank}${hand.turnCard.suit}`}</h4>
            {renderActions(hand.turnActions, 'turn')}
          </div>
        )}

        {hand.riverCard && (
          <div className="street-section">
            <h4>River: {`${hand.riverCard.rank}${hand.riverCard.suit}`}</h4>
            {renderActions(hand.riverActions, 'river')}
          </div>
        )}
      </div>

      {hand.analysis && (
        <div className="hand-analysis">
          <h4>Hand Analysis</h4>
          <div className="analysis-grid">
            <div>Total Actions: {hand.analysis.totalActions}</div>
            <div>Aggressive Actions: {hand.analysis.aggressiveActions}</div>
            <div>Aggression Factor: {hand.analysis.aggressionFactor?.toFixed(2)}</div>
            <div>
              Position Play:{' '}
              {hand.analysis.earlyPosition
                ? 'Early'
                : hand.analysis.latePosition
                  ? 'Late'
                  : 'Middle'}
            </div>
            <div>Went to Showdown: {hand.analysis.wentToShowdown ? 'Yes' : 'No'}</div>
            <div>Value Extracted: {formatCurrency(hand.analysis.valueExtracted)}</div>
          </div>

          {hand.analysis.tags && hand.analysis.tags.length > 0 && (
            <div className="hand-tags">
              <strong>Tags:</strong>
              {hand.analysis.tags.map((tag) => (
                <span key={tag} className="hand-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// PropTypes for internal components
OverviewTab.propTypes = {
  analytics: PropTypes.shape({
    totalHands: PropTypes.number,
    winRate: PropTypes.number,
    netProfit: PropTypes.number,
    biggestWin: PropTypes.number,
    positionStats: PropTypes.object,
  }),
  hands: PropTypes.arrayOf(PropTypes.object).isRequired,
};

HandsTab.propTypes = {
  hands: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      timestamp: PropTypes.number,
      heroPosition: PropTypes.number,
      heroCards: PropTypes.array,
      handResult: PropTypes.string,
      potSize: PropTypes.number,
      handDuration: PropTypes.number,
      preflopActions: PropTypes.array,
      flopCards: PropTypes.array,
      flopActions: PropTypes.array,
      turnCard: PropTypes.object,
      turnActions: PropTypes.array,
      riverCard: PropTypes.object,
      riverActions: PropTypes.array,
      analysis: PropTypes.object,
    })
  ).isRequired,
  onHandSelect: PropTypes.func.isRequired,
};

AnalyticsTab.propTypes = {
  analytics: PropTypes.shape({
    totalHands: PropTypes.number,
    winRate: PropTypes.number,
    netProfit: PropTypes.number,
    biggestWin: PropTypes.number,
    positionStats: PropTypes.object,
  }),
  hands: PropTypes.arrayOf(
    PropTypes.shape({
      handResult: PropTypes.string,
    })
  ).isRequired,
};

HandDetailTab.propTypes = {
  hand: PropTypes.shape({
    id: PropTypes.string,
    handNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    timestamp: PropTypes.number,
    heroPosition: PropTypes.number,
    heroCards: PropTypes.arrayOf(
      PropTypes.shape({
        rank: PropTypes.string,
        suit: PropTypes.string,
      })
    ),
    handResult: PropTypes.string,
    potSize: PropTypes.number,
    handDuration: PropTypes.number,
    preflopActions: PropTypes.array,
    flopCards: PropTypes.arrayOf(
      PropTypes.shape({
        rank: PropTypes.string,
        suit: PropTypes.string,
      })
    ),
    flopActions: PropTypes.array,
    turnCard: PropTypes.shape({
      rank: PropTypes.string,
      suit: PropTypes.string,
    }),
    turnActions: PropTypes.array,
    riverCard: PropTypes.shape({
      rank: PropTypes.string,
      suit: PropTypes.string,
    }),
    riverActions: PropTypes.array,
    analysis: PropTypes.shape({
      totalActions: PropTypes.number,
      aggressiveActions: PropTypes.number,
      aggressionFactor: PropTypes.number,
      earlyPosition: PropTypes.bool,
      latePosition: PropTypes.bool,
      wentToShowdown: PropTypes.bool,
      valueExtracted: PropTypes.number,
      tags: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};

export default HandHistoryDashboard;
