import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';

import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

// Lazy load heavy components for better initial performance
const PokerTable = lazy(
  () => import(/* webpackChunkName: "poker-game" */ './components/game/PokerTable')
);

const StudyDashboard = lazy(
  () => import(/* webpackChunkName: "study-dashboard" */ './components/study/StudyDashboard')
);

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
  return (
    <BrowserRouter basename="/PokerTrainer">
      <div className="App">
        <nav className="app-navigation">
          <div className="nav-brand">
            <h1>PokerTrainer Pro</h1>
          </div>
          <div className="nav-buttons">
            <NavLink to="/play" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              Play
            </NavLink>
            <NavLink
              to="/study"
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            >
              Study
            </NavLink>
          </div>
        </nav>

        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/play" replace />} />
              <Route path="/play" element={<PokerTable />} />
              <Route path="/study" element={<StudyDashboard />} />
              <Route path="/study/*" element={<StudyDashboard />} />
              <Route path="*" element={<Navigate to="/play" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}

export default App;
