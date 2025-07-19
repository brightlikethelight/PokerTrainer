import React, { lazy, Suspense, useState } from 'react';

import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

// Lazy load heavy components for better initial performance
const PokerTable = lazy(
  () => import(/* webpackChunkName: "poker-game" */ './components/game/PokerTable')
);

const StudyDashboard = lazy(
  () => import(/* webpackChunkName: "study-dashboard" */ './components/study/StudyDashboard')
);

// Note: HandHistoryDashboard will be lazy-loaded when needed
// const HandHistoryDashboard = lazy(
//   () => import(/* webpackChunkName: "hand-history" */ './components/study/HandHistoryDashboard')
// );

// Loading component
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  </div>
);

function App() {
  const [activeView, setActiveView] = useState('play'); // 'play' or 'study'

  return (
    <div className="App">
      <nav className="app-navigation">
        <div className="nav-brand">
          <h1>PokerTrainer Pro</h1>
        </div>
        <div className="nav-buttons">
          <button
            className={`nav-btn ${activeView === 'play' ? 'active' : ''}`}
            onClick={() => setActiveView('play')}
          >
            🎮 Play
          </button>
          <button
            className={`nav-btn ${activeView === 'study' ? 'active' : ''}`}
            onClick={() => setActiveView('study')}
          >
            📚 Study
          </button>
        </div>
      </nav>

      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          {activeView === 'play' ? <PokerTable /> : <StudyDashboard />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
