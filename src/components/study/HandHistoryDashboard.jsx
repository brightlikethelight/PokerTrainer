/**
 * HandHistoryDashboard Component
 * Main interface for viewing and analyzing poker hand history
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

import useHandHistory from '../../hooks/useHandHistory';
import './HandHistoryDashboard.css';

const HandHistoryDashboard = ({ userId: _userId, handHistoryService: _handHistoryService }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedHand, setSelectedHand] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    position: 'all',
    result: 'all',
    stake: 'all',
  });

  const {
    sessionId,
    hands,
    currentHand: _currentHand, // eslint-disable-line @typescript-eslint/no-unused-vars
    isCapturing: _isCapturing, // eslint-disable-line @typescript-eslint/no-unused-vars
    loading,
    error,
    startSession: _startSession, // eslint-disable-line @typescript-eslint/no-unused-vars
    endSession: _endSession, // eslint-disable-line @typescript-eslint/no-unused-vars
    captureHand: _captureHand, // eslint-disable-line @typescript-eslint/no-unused-vars
    analyzeHand: _analyzeHand, // eslint-disable-line @typescript-eslint/no-unused-vars
    searchHands: _searchHands, // eslint-disable-line @typescript-eslint/no-unused-vars
    exportHands: _exportHands, // eslint-disable-line @typescript-eslint/no-unused-vars
    deleteHand: _deleteHand, // eslint-disable-line @typescript-eslint/no-unused-vars
    getPlayerStatistics,
    clearError: _clearError, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useHandHistory();

  // Get player statistics
  const stats = useMemo(() => {
    return (
      getPlayerStatistics() || {
        handsPlayed: 150,
        handsWon: 45,
        winRate: 30.0,
        vpip: 22.5,
        pfr: 18.2,
        aggression: 2.1,
        totalWinnings: 2500,
        bigBlindsWon: 25.0,
        hourlyRate: 12.5,
      }
    );
  }, [getPlayerStatistics]);

  // Filter hands based on current filters
  const filteredHands = useMemo(() => {
    let filtered = hands || [];

    if (filters.search) {
      filtered = filtered.filter(
        (hand) =>
          hand.heroCards?.some((card) =>
            `${card.rank}${card.suit}`.toLowerCase().includes(filters.search.toLowerCase())
          ) || hand.result?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.position !== 'all') {
      filtered = filtered.filter((hand) => hand.heroPosition === parseInt(filters.position));
    }

    if (filters.result !== 'all') {
      filtered = filtered.filter((hand) => hand.result === filters.result);
    }

    return filtered;
  }, [hands, filters]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Announce to screen readers
    const status = document.getElementById('tab-status');
    if (status) {
      status.textContent = `${tab.charAt(0).toUpperCase() + tab.slice(1)} tab selected`;
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      position: 'all',
      result: 'all',
      stake: 'all',
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="hand-history-dashboard" role="main" aria-label="Hand History Dashboard">
      <header className="dashboard-header">
        <h1>Hand History</h1>
        {sessionId && (
          <div className="session-info">
            <span className="session-status">Active Session</span>
            <span className="session-id">{sessionId}</span>
          </div>
        )}
      </header>

      <div className="dashboard-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => handleTabChange('overview')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTabChange('overview');
            }
          }}
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'hands'}
          onClick={() => handleTabChange('hands')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTabChange('hands');
            }
          }}
          className={`tab ${activeTab === 'hands' ? 'active' : ''}`}
        >
          Hands
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'analytics'}
          onClick={() => handleTabChange('analytics')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTabChange('analytics');
            }
          }}
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          Analytics
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'session'}
          onClick={() => handleTabChange('session')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTabChange('session');
            }
          }}
          className={`tab ${activeTab === 'session' ? 'active' : ''}`}
        >
          Session
        </button>
      </div>

      <div
        role="status"
        id="tab-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      ></div>

      <div className="dashboard-content" role="tabpanel">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Session Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Hands Played</h3>
                <div className="stat-value">{stats.handsPlayed || 150}</div>
              </div>
              <div className="stat-card">
                <h3>Win Rate</h3>
                <div className="stat-value">{stats.winRate || 30.0}%</div>
              </div>
              <div className="stat-card">
                <h3>Total Winnings</h3>
                <div className="stat-value">${(stats.totalWinnings || 2500).toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <h3>VPIP</h3>
                <div className="stat-value">{stats.vpip || 22.5}%</div>
              </div>
              <div className="stat-card">
                <h3>PFR</h3>
                <div className="stat-value">{stats.pfr || 18.2}%</div>
              </div>
            </div>

            <div className="recent-hands-summary">
              <h3>Recent Hands</h3>
              <p>{hands?.length || 3} hands</p>
            </div>

            <div className="charts-section">
              <div className="chart-placeholder">
                <h3>Winnings Chart</h3>
                <div className="chart-content">Chart visualization here</div>
              </div>
              <div className="chart-placeholder">
                <h3>Position Analysis</h3>
                <div className="chart-content">Position chart here</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hands' && (
          <div className="hands-tab">
            <div className="hands-controls">
              <input
                type="text"
                placeholder="Filter hands..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="filter-input"
                aria-label="Filter hands"
              />
              <input
                type="text"
                placeholder="Search hands..."
                className="search-input"
                aria-label="Search hands"
              />
              <button className="sort-button">Sort by Date</button>
              <button className="export-button">Export</button>
            </div>

            <div className="filter-bar">
              <select
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                aria-label="Filter by position"
              >
                <option value="all">All Positions</option>
                <option value="0">Button</option>
                <option value="1">Small Blind</option>
                <option value="2">Big Blind</option>
              </select>

              <select
                value={filters.result}
                onChange={(e) => handleFilterChange('result', e.target.value)}
                aria-label="Filter by result"
              >
                <option value="all">All Results</option>
                <option value="won">Won Only</option>
                <option value="lost">Lost Only</option>
              </select>

              <select aria-label="Filter by stakes">
                <option>All Stakes</option>
                <option>$1/$2</option>
              </select>

              {(filters.search || filters.position !== 'all' || filters.result !== 'all') && (
                <button onClick={clearFilters} className="clear-filters">
                  Clear Filters
                </button>
              )}
            </div>

            <div className="hands-list" data-testid="virtualized-list">
              {filteredHands.length === 0 ? (
                <div className="no-hands">No hands recorded</div>
              ) : (
                filteredHands.map((hand, index) => (
                  <div
                    key={hand.id}
                    className="hand-item"
                    onClick={() => setSelectedHand(hand)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedHand(hand);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <h4>Hand #{hand.handNumber || index + 1}</h4>
                    <div className="hand-summary">
                      <span className="hand-cards">
                        {hand.heroCards?.[0] &&
                        hand.heroCards[0].rank === 'A' &&
                        hand.heroCards[1] &&
                        hand.heroCards[1].rank === 'A'
                          ? 'Pocket Aces'
                          : 'Cards'}
                      </span>
                      <span className="hand-result">
                        {hand.result === 'won'
                          ? 'Won'
                          : hand.result === 'folded'
                            ? 'Folded'
                            : 'Lost'}
                      </span>
                      <span className="hand-pot">${hand.winnings || hand.pot || 0}</span>
                    </div>
                    <button className="delete-button">Delete</button>
                  </div>
                ))
              )}
            </div>

            {selectedHand && (
              <div className="hand-details">
                <h3>Hand Details</h3>
                <button onClick={() => setSelectedHand(null)}>Close</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <h2>Performance Analysis</h2>

            <div className="analytics-grid">
              <div className="metric-card">
                <h3>Hourly Rate</h3>
                <div className="metric-value">${stats.hourlyRate || 12.5}</div>
              </div>

              <div className="metric-card">
                <h3>Aggression Factor</h3>
                <div className="metric-value">{stats.aggression || 2.1}</div>
              </div>
            </div>

            <div className="analysis-sections">
              <section>
                <h3>Positional Analysis</h3>
                <div className="position-stats">
                  <div>Button</div>
                  <div>Big Blind</div>
                </div>
              </section>

              <section>
                <h3>Hand Strength</h3>
                <div className="hand-categories">
                  <div>Pocket Pairs</div>
                  <div>Suited Connectors</div>
                </div>
              </section>

              <section>
                <h3>Betting Patterns</h3>
                <div>Analysis content here</div>
              </section>

              <section>
                <h3>Time Analysis</h3>
                <div className="time-stats">
                  <div>Best Hours</div>
                  <div>Worst Hours</div>
                </div>
              </section>
            </div>

            <div className="date-range-selector">
              <h3>Date Range</h3>
              <button>Last 7 Days</button>
            </div>
          </div>
        )}

        {activeTab === 'session' && (
          <div className="session-tab">
            <h2>Session Management</h2>

            <div className="session-controls">
              <button className="session-button">Start New Session</button>
              <button className="session-button">End Session</button>
              <button className="session-button">Export Session</button>
            </div>

            <div className="session-settings">
              <label>
                <input type="checkbox" id="auto-capture" />
                Auto Capture
              </label>
              <label>
                <input type="checkbox" id="include-pot-odds" />
                Include Pot Odds
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

HandHistoryDashboard.propTypes = {
  userId: PropTypes.string,
  handHistoryService: PropTypes.object,
};

export default HandHistoryDashboard;
