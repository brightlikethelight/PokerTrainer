import { render, screen, fireEvent } from '@testing-library/react';

import App from './App';

describe('App', () => {
  test('renders PokerTrainer Pro title', () => {
    render(<App />);
    const titleElement = screen.getByText(/PokerTrainer Pro/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders Play and Study buttons', () => {
    render(<App />);
    const playButton = screen.getByText('🎮 Play');
    const studyButton = screen.getByText('📚 Study');

    expect(playButton).toBeInTheDocument();
    expect(studyButton).toBeInTheDocument();
  });

  test('switches between Play and Study views', () => {
    render(<App />);

    // Initially should show Play view (default)
    const playButton = screen.getByText('🎮 Play');
    expect(playButton).toHaveClass('active');

    // Click Study button
    const studyButton = screen.getByText('📚 Study');
    fireEvent.click(studyButton);

    // Study button should now be active
    expect(studyButton).toHaveClass('active');
    expect(playButton).not.toHaveClass('active');

    // Click Play button again
    fireEvent.click(playButton);
    expect(playButton).toHaveClass('active');
    expect(studyButton).not.toHaveClass('active');
  });
});
