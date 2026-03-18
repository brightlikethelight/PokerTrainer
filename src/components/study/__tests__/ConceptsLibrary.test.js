import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConceptsLibrary, { CONCEPTS } from '../ConceptsLibrary';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ConceptsLibrary', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('Concept List View', () => {
    test('should render fundamentals category by default', () => {
      render(<ConceptsLibrary />);

      // "Fundamentals" appears in both tab and heading
      expect(screen.getByRole('heading', { name: 'Fundamentals' })).toBeInTheDocument();
      expect(screen.getByText('Core concepts every poker player must know')).toBeInTheDocument();
    });

    test('should render all concept cards for selected category', () => {
      render(<ConceptsLibrary />);

      const fundamentalsConcepts = CONCEPTS.fundamentals.concepts;
      fundamentalsConcepts.forEach((concept) => {
        expect(screen.getByText(concept.title)).toBeInTheDocument();
      });
    });

    test('should render category tabs', () => {
      render(<ConceptsLibrary />);

      // Use getAllByText since category names appear in both tabs and headers
      expect(screen.getAllByText(/Fundamentals/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Intermediate/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Advanced/).length).toBeGreaterThanOrEqual(1);
    });

    test('should switch categories when tab clicked', async () => {
      render(<ConceptsLibrary />);

      // Click Intermediate tab
      const intermediateTab = screen.getByRole('button', { name: /Intermediate/ });
      await userEvent.click(intermediateTab);

      expect(screen.getByText('Concepts to elevate your game')).toBeInTheDocument();
      expect(screen.getByText('Hand Ranges')).toBeInTheDocument();
    });

    test('should display progress bar', () => {
      render(<ConceptsLibrary />);

      const totalConcepts = Object.values(CONCEPTS).reduce(
        (acc, cat) => acc + cat.concepts.length,
        0
      );
      expect(screen.getByText(`0 / ${totalConcepts} concepts completed`)).toBeInTheDocument();
    });

    test('should load completed concepts from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['position']));

      render(<ConceptsLibrary />);

      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  describe('Concept Detail View', () => {
    test('should show concept detail when card is clicked', async () => {
      render(<ConceptsLibrary />);

      await userEvent.click(screen.getByText('Position'));

      expect(screen.getByText('Key Takeaways')).toBeInTheDocument();
      expect(screen.getByText('Later position = wider opening range')).toBeInTheDocument();
      expect(screen.getByText('Back to Concepts')).toBeInTheDocument();
    });

    test('should navigate back to list when back button clicked', async () => {
      render(<ConceptsLibrary />);

      await userEvent.click(screen.getByText('Position'));
      expect(screen.getByText('Key Takeaways')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Back to Concepts'));
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    test('should show Mark as Complete button for incomplete concepts', async () => {
      render(<ConceptsLibrary />);

      await userEvent.click(screen.getByText('Position'));

      expect(screen.getByText('Mark as Complete')).toBeInTheDocument();
    });

    test('should mark concept as complete and persist to localStorage', async () => {
      render(<ConceptsLibrary />);

      await userEvent.click(screen.getByText('Position'));
      await userEvent.click(screen.getByText('Mark as Complete'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'completedConcepts',
        JSON.stringify(['position'])
      );
    });

    test('should not show Mark as Complete for already completed concepts', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['position']));

      render(<ConceptsLibrary />);

      await userEvent.click(screen.getByText('Position'));

      expect(screen.queryByText('Mark as Complete')).not.toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    test('should display level badge', async () => {
      render(<ConceptsLibrary />);

      await userEvent.click(screen.getByText('Position'));

      expect(screen.getByText('beginner')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    test('should update progress when concept is completed', async () => {
      render(<ConceptsLibrary />);

      const totalConcepts = Object.values(CONCEPTS).reduce(
        (acc, cat) => acc + cat.concepts.length,
        0
      );

      await userEvent.click(screen.getByText('Position'));
      await userEvent.click(screen.getByText('Mark as Complete'));
      await userEvent.click(screen.getByText('Back to Concepts'));

      expect(screen.getByText(`1 / ${totalConcepts} concepts completed`)).toBeInTheDocument();
    });

    test('should show category completion counts in tabs', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['position', 'pot_odds']));

      render(<ConceptsLibrary />);

      // Fundamentals tab should show 2/4
      expect(screen.getByText('2/4')).toBeInTheDocument();
    });
  });
});
