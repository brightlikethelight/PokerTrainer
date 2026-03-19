import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ErrorBoundary from '../ErrorBoundary';
import { error as logError, LogCategory } from '../../../services/logger';

// Mock the logger module
vi.mock('../../../services/logger', () => ({
  error: vi.fn(),
  LogCategory: { SYSTEM: 'SYSTEM' },
}));

// Helper component that throws on render when `shouldThrow` is true
function ThrowingComponent({ shouldThrow = true }) {
  if (shouldThrow) {
    throw new Error('Test explosion');
  }
  return <div>Child rendered OK</div>;
}

// Suppress console.error noise from React's error boundary logging
let originalConsoleError;
beforeAll(() => {
  originalConsoleError = console.error;
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Hello world</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('catches error and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An error occurred while running the poker game.')).toBeInTheDocument();
    expect(screen.queryByText('Child rendered OK')).not.toBeInTheDocument();
  });

  it('shows error details in an expandable section', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error details')).toBeInTheDocument();
    expect(screen.getByText(/Test explosion/)).toBeInTheDocument();
  });

  it('resets state and re-renders children on "Try Again" click', () => {
    // Use a closure flag so we can stop throwing after reset
    let shouldThrow = true;
    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error('Test explosion');
      }
      return <div>Child rendered OK</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Stop throwing before clicking reset
    shouldThrow = false;
    userEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Child rendered OK')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('logs error via the logger service', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      LogCategory.SYSTEM,
      'Error caught by boundary',
      expect.objectContaining({
        error: expect.stringContaining('Test explosion'),
        errorInfo: expect.any(Object),
      })
    );
  });

  it('shows component stack in error details when available', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    // React provides componentStack in errorInfo; verify the Stack label renders
    // and that the paragraph contains stack trace content (e.g. "at ErrorBoundary")
    const stackParagraph = screen.getByText((_content, element) => {
      if (element?.tagName !== 'P') return false;
      const text = element.textContent || '';
      return text.includes('Stack:') && text.includes('ErrorBoundary');
    });
    expect(stackParagraph).toBeInTheDocument();
  });

  it('handles error without errorInfo gracefully', () => {
    // Directly set state to simulate missing errorInfo
    const ref = React.createRef();
    render(
      <ErrorBoundary ref={ref}>
        <p>Hello</p>
      </ErrorBoundary>
    );

    // Manually trigger error state without errorInfo
    act(() => {
      ref.current.setState({
        hasError: true,
        error: new Error('Bare error'),
        errorInfo: null,
      });
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Bare error/)).toBeInTheDocument();
    // The "Stack:" paragraph should not render when errorInfo is null
    expect(screen.queryByText(/Stack:/)).not.toBeInTheDocument();
  });
});
