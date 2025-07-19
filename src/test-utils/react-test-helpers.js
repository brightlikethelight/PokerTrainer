/**
 * React testing utilities
 */

import { render, screen, act } from '@testing-library/react';
import PropTypes from 'prop-types';

/**
 * Custom render function with providers
 * @param {ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with utils
 */
export const renderWithProviders = (ui, options = {}) => {
  const { ...renderOptions } = options;

  // Add any context providers here as the app grows
  const Wrapper = ({ children }) => <>{children}</>;
  Wrapper.displayName = 'TestWrapper';
  Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Wait for async updates with act
 * @param {Function} callback - Async callback
 */
export const waitForAsync = async (callback) => {
  await act(async () => {
    await callback();
  });
};

/**
 * Mock component for testing
 * @param {string} name - Component name
 * @returns {Function} Mock component
 */
export const createMockComponent = (name) => {
  const MockComponent = function ({ children, ...props }) {
    return (
      <div data-testid={`mock-${name}`} {...props}>
        {children}
      </div>
    );
  };

  MockComponent.propTypes = {
    children: PropTypes.node,
  };

  return MockComponent;
};

/**
 * Create a mock hook for testing
 * @param {string} hookName - Hook name
 * @param {*} returnValue - Return value
 * @returns {Function} Mock hook
 */
export const createMockHook = (hookName, returnValue) => jest.fn(() => returnValue);

/**
 * Get all elements by role with specific name
 * @param {HTMLElement} container - Container element
 * @param {string} role - ARIA role
 * @param {string} name - Accessible name
 * @returns {HTMLElement[]} Matching elements
 */
export const getAllByRoleAndName = (container, role, name) =>
  screen
    .getAllByRole(role)
    .filter(
      (element) => element.getAttribute('aria-label') === name || element.textContent === name
    );

/**
 * Fire a custom event with data
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 */
export const fireCustomEvent = (element, eventType, eventData = {}) => {
  const event = new CustomEvent(eventType, {
    detail: eventData,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
};

/**
 * Assert component style
 * @param {HTMLElement} element - Element to check
 * @param {Object} expectedStyles - Expected styles
 */
export const assertStyles = (element, expectedStyles) => {
  Object.entries(expectedStyles).forEach(([property, value]) => {
    expect(element).toHaveStyle({ [property]: value });
  });
};

/**
 * Mock ResizeObserver for tests
 */
export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

/**
 * Mock IntersectionObserver for tests
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

/**
 * Mock providers for testing
 */
export const mockProviders = {
  MockProvider: function MockProvider({ children }) {
    return children;
  },
};
