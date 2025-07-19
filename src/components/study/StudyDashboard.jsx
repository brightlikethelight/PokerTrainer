import { useState } from 'react';

import HandHistoryDashboard from './HandHistoryDashboard';
import './StudyDashboard.css';

/**
 * Study Dashboard Component
 * Main interface for poker learning and practice
 */
const StudyDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionCount, setSessionCount] = useState(0);

  const startStudySession = () => {
    setSessionCount((prev) => prev + 1);
    // TODO: Implement study session functionality
  };

  return (
    <div className="study-dashboard">
      <header className="study-header">
        <h1>🎓 Study Dashboard</h1>
        <p>Master poker strategy through structured practice</p>
      </header>

      <nav className="study-tabs">
        {['overview', 'practice', 'progress', 'concepts', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'history' ? 'Hand History' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className="study-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Study Overview</h2>

            <div className="stats-grid">
              <div className="stat-card sessions">
                <h3>Study Sessions</h3>
                <div className="stat-value">{sessionCount}</div>
                <p>Sessions completed</p>
              </div>

              <div className="stat-card accuracy">
                <h3>Overall Accuracy</h3>
                <div className="stat-value">--%</div>
                <p>Coming soon</p>
              </div>

              <div className="stat-card streak">
                <h3>Learning Streak</h3>
                <div className="stat-value">--</div>
                <p>Coming soon</p>
              </div>
            </div>

            <div className="quick-start">
              <h3>Quick Start</h3>
              <button onClick={startStudySession} className="start-button">
                Start Practice Session
              </button>
            </div>
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="practice-section">
            <h2>Practice Sessions</h2>
            <p>Structured practice sessions will be available soon.</p>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="progress-section">
            <h2>Progress Tracking</h2>
            <p>Detailed progress analytics will be available soon.</p>
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="concepts-section">
            <h2>Poker Concepts</h2>
            <p>Interactive concept learning will be available soon.</p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <HandHistoryDashboard />
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyDashboard;
