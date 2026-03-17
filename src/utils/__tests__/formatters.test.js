import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatPercentage,
  formatLargeNumber,
  formatHand,
  formatPosition,
  formatAction,
} from '../formatters';

describe('formatCurrency', () => {
  it('formats numbers with chip symbol', () => {
    expect(formatCurrency(1000)).toBe('1,000c');
  });

  it('returns "0" for NaN', () => {
    expect(formatCurrency(NaN)).toBe('0');
  });

  it('adds $ when useSymbol is true', () => {
    expect(formatCurrency(1000, { useSymbol: true })).toBe('$1,000');
  });

  it('returns "$0" for NaN with useSymbol', () => {
    expect(formatCurrency(NaN, { useSymbol: true })).toBe('$0');
  });
});

describe('formatDate', () => {
  it('formats a valid date', () => {
    const date = new Date('2025-06-15T12:00:00');
    const result = formatDate(date);
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });

  it('returns "Invalid Date" for non-Date inputs', () => {
    expect(formatDate('not a date')).toBe('Invalid Date');
    expect(formatDate(null)).toBe('Invalid Date');
  });
});

describe('formatDuration', () => {
  it('returns "0s" for zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats seconds', () => {
    expect(formatDuration(5000)).toBe('5 seconds');
  });

  it('formats minutes', () => {
    expect(formatDuration(120000)).toBe('2 minutes');
  });

  it('returns "0s" for negative values', () => {
    expect(formatDuration(-1000)).toBe('0s');
  });

  it('uses compact mode', () => {
    expect(formatDuration(5000, { compact: true })).toBe('5s');
    expect(formatDuration(120000, { compact: true })).toBe('2m');
  });
});

describe('formatPercentage', () => {
  it('multiplies by 100 and formats', () => {
    expect(formatPercentage(0.5)).toBe('50.0%');
  });

  it('returns "0%" for NaN', () => {
    expect(formatPercentage(NaN)).toBe('0%');
  });

  it('shows + sign for positive values with showSign', () => {
    expect(formatPercentage(0.25, { showSign: true })).toBe('+25.0%');
  });
});

describe('formatLargeNumber', () => {
  it('returns small numbers as-is', () => {
    expect(formatLargeNumber(500)).toBe('500');
  });

  it('formats thousands with K', () => {
    expect(formatLargeNumber(1500)).toBe('1.5K');
  });

  it('formats millions with M', () => {
    expect(formatLargeNumber(2000000)).toBe('2.0M');
  });

  it('returns "0" for NaN', () => {
    expect(formatLargeNumber(NaN)).toBe('0');
  });

  it('uses full words when requested', () => {
    expect(formatLargeNumber(1500, { useFullWords: true })).toBe('1.5 thousand');
  });
});

describe('formatHand', () => {
  it('formats cards with suit symbols', () => {
    const cards = [
      { rank: 'A', suit: 'h' },
      { rank: 'K', suit: 's' },
    ];
    expect(formatHand(cards)).toBe('A♥ K♠');
  });

  it('returns "No cards" for empty array', () => {
    expect(formatHand([])).toBe('No cards');
  });

  it('returns "No cards" for non-array', () => {
    expect(formatHand(null)).toBe('No cards');
  });
});

describe('formatPosition', () => {
  it('returns BTN for position 0', () => {
    expect(formatPosition(0)).toBe('BTN');
  });

  it('returns "Unknown" for invalid position', () => {
    expect(formatPosition(-1)).toBe('Unknown');
    expect(formatPosition('abc')).toBe('Unknown');
  });

  it('uses full names when requested', () => {
    expect(formatPosition(0, 6, { useFullNames: true })).toBe('Button');
  });
});

describe('formatAction', () => {
  it('capitalizes fold', () => {
    expect(formatAction('fold')).toBe('Fold');
  });

  it('formats bet with amount', () => {
    expect(formatAction('bet', 100)).toBe('Bet 100c');
  });

  it('formats raise with "to"', () => {
    expect(formatAction('raise', 200)).toBe('Raise to 200c');
  });

  it('returns "No action" for null', () => {
    expect(formatAction(null)).toBe('No action');
  });
});
