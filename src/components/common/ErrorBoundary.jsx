import React from 'react';
import PropTypes from 'prop-types';

import { error as logError, LogCategory } from '../../services/logger';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(_error, errorInfo) {
    // Log error details for debugging
    logError(LogCategory.SYSTEM, 'Error caught by boundary', {
      error: _error.toString(),
      errorInfo,
      stack: _error.stack,
    });

    // Update state with error details
    this.setState({
      error: _error,
      errorInfo,
    });
  }

  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>An error occurred while running the poker game.</p>

            {this.state.error && (
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
                <summary>Error details</summary>
                <p>
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <p>
                    <strong>Stack:</strong> {this.state.errorInfo.componentStack}
                  </p>
                )}
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="error-reset-button"
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
