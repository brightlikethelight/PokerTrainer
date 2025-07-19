// Utility functions for formatting data in the UI

/**
 * Format currency values for display
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showSign = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    useSymbol = false,
  } = options;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return useSymbol ? '$0' : '0';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: useSymbol ? 'currency' : 'decimal',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay: showSign ? 'always' : 'auto',
  });

  const formatted = formatter.format(amount);

  // Add custom chip symbol for poker context
  return useSymbol ? formatted : `${formatted}c`;
};

/**
 * Format date for display
 * @param {Date} date - The date to format
 * @param {string} format - Format type ('short', 'medium', 'long', 'time')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date || !(date instanceof Date)) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Relative time for recent dates
  if (format === 'relative') {
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }

  // Standard formatting
  const options = {
    short: {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
    medium: {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
    long: {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    },
  };

  return date.toLocaleDateString('en-US', options[format] || options.medium);
};

/**
 * Format duration in milliseconds to human readable string
 * @param {number} duration - Duration in milliseconds
 * @param {object} options - Formatting options
 * @returns {string} Formatted duration string
 */
export const formatDuration = (duration, options = {}) => {
  const {
    showMilliseconds = false,
    compact = false,
    units = 'auto', // 'auto', 'seconds', 'minutes', 'hours'
  } = options;

  if (typeof duration !== 'number' || isNaN(duration) || duration < 0) {
    return '0s';
  }

  const ms = duration;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Auto-determine best unit
  if (units === 'auto') {
    if (days > 0) {
      const remainingHours = hours % 24;
      return compact
        ? `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`
        : `${days} day${days > 1 ? 's' : ''}${
            remainingHours > 0 ? ` ${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : ''
          }`;
    }

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return compact
        ? `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`
        : `${hours} hour${hours > 1 ? 's' : ''}${
            remainingMinutes > 0
              ? ` ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
              : ''
          }`;
    }

    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return compact
        ? `${minutes}m${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ''}`
        : `${minutes} minute${minutes > 1 ? 's' : ''}${
            remainingSeconds > 0
              ? ` ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`
              : ''
          }`;
    }

    if (seconds > 0) {
      return compact ? `${seconds}s` : `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    if (showMilliseconds) {
      return compact ? `${ms}ms` : `${ms} millisecond${ms > 1 ? 's' : ''}`;
    }

    return '0s';
  }

  // Specific unit formatting
  switch (units) {
    case 'seconds':
      return compact ? `${seconds}s` : `${seconds} second${seconds !== 1 ? 's' : ''}`;
    case 'minutes':
      return compact ? `${minutes}m` : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    case 'hours':
      return compact ? `${hours}h` : `${hours} hour${hours !== 1 ? 's' : ''}`;
    default:
      return '0s';
  }
};

/**
 * Format percentage for display
 * @param {number} value - The value to format as percentage
 * @param {object} options - Formatting options
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, options = {}) => {
  const { decimalPlaces = 1, showSign = false, multiply100 = true } = options;

  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  const percentage = multiply100 ? value * 100 : value;
  const sign = showSign && percentage > 0 ? '+' : '';

  return `${sign}${percentage.toFixed(decimalPlaces)}%`;
};

/**
 * Format large numbers with suffixes (K, M, B)
 * @param {number} num - The number to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (num, options = {}) => {
  const { decimalPlaces = 1, useFullWords = false } = options;

  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1000000000) {
    const billions = absNum / 1000000000;
    const suffix = useFullWords ? ' billion' : 'B';
    return `${sign}${billions.toFixed(decimalPlaces)}${suffix}`;
  }

  if (absNum >= 1000000) {
    const millions = absNum / 1000000;
    const suffix = useFullWords ? ' million' : 'M';
    return `${sign}${millions.toFixed(decimalPlaces)}${suffix}`;
  }

  if (absNum >= 1000) {
    const thousands = absNum / 1000;
    const suffix = useFullWords ? ' thousand' : 'K';
    return `${sign}${thousands.toFixed(decimalPlaces)}${suffix}`;
  }

  return `${sign}${absNum.toString()}`;
};

/**
 * Format poker hand for display
 * @param {Array} cards - Array of card objects with rank and suit
 * @param {object} options - Formatting options
 * @returns {string} Formatted hand string
 */
export const formatHand = (cards, options = {}) => {
  const { showSuits = true, separator = ' ', suitSymbols = true } = options;

  if (!Array.isArray(cards) || cards.length === 0) {
    return 'No cards';
  }

  const suitMap = suitSymbols
    ? {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠',
        h: '♥',
        d: '♦',
        c: '♣',
        s: '♠',
      }
    : {
        hearts: 'h',
        diamonds: 'd',
        clubs: 'c',
        spades: 's',
        h: 'h',
        d: 'd',
        c: 'c',
        s: 's',
      };

  return cards
    .filter((card) => card && card.rank && card.suit)
    .map((card) => {
      const rank = card.rank.toString().toUpperCase();
      const suit = showSuits ? suitMap[card.suit.toLowerCase()] || card.suit : '';
      return `${rank}${suit}`;
    })
    .join(separator);
};

/**
 * Format position name for display
 * @param {number} position - Position number (0-based)
 * @param {number} totalPlayers - Total number of players
 * @param {object} options - Formatting options
 * @returns {string} Formatted position string
 */
export const formatPosition = (position, totalPlayers = 6, options = {}) => {
  const { useFullNames = false, showNumber = false } = options;

  if (typeof position !== 'number' || position < 0) {
    return 'Unknown';
  }

  // Standard 6-max position names
  const positions6Max = useFullNames
    ? ['Button', 'Cutoff', 'Hijack', 'Middle Position', 'Under the Gun +1', 'Under the Gun']
    : ['BTN', 'CO', 'HJ', 'MP', 'UTG+1', 'UTG'];

  // 9-max position names
  const positions9Max = useFullNames
    ? [
        'Button',
        'Cutoff',
        'Hijack',
        'Lojack',
        'Middle Position',
        'Middle Position 1',
        'Under the Gun +2',
        'Under the Gun +1',
        'Under the Gun',
      ]
    : ['BTN', 'CO', 'HJ', 'LJ', 'MP', 'MP1', 'UTG+2', 'UTG+1', 'UTG'];

  const positionNames = totalPlayers <= 6 ? positions6Max : positions9Max;
  const positionName = positionNames[position] || `Seat ${position + 1}`;

  return showNumber ? `${positionName} (${position})` : positionName;
};

/**
 * Format action for display
 * @param {string} action - The action type
 * @param {number} amount - The action amount
 * @param {object} options - Formatting options
 * @returns {string} Formatted action string
 */
export const formatAction = (action, amount = 0, options = {}) => {
  const { includeAmount = true, capitalize = true } = options;

  if (!action) {
    return 'No action';
  }

  const actionName = capitalize
    ? action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()
    : action.toLowerCase();

  if (!includeAmount || amount <= 0) {
    return actionName;
  }

  const formattedAmount = formatCurrency(amount);

  switch (action.toLowerCase()) {
    case 'bet':
      return `${actionName} ${formattedAmount}`;
    case 'raise':
      return `${actionName} to ${formattedAmount}`;
    case 'call':
      return `${actionName} ${formattedAmount}`;
    default:
      return actionName;
  }
};

/**
 * Format time range for display
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {object} options - Formatting options
 * @returns {string} Formatted time range string
 */
export const formatTimeRange = (startDate, endDate, options = {}) => {
  const { format = 'medium', separator = ' - ' } = options;

  if (!startDate || !endDate) {
    return 'Invalid range';
  }

  const start = formatDate(startDate, format);
  const end = formatDate(endDate, format);

  // If same day, show date once
  if (startDate.toDateString() === endDate.toDateString()) {
    const dateStr = formatDate(startDate, 'short').split(',')[0];
    const startTime = formatDate(startDate, 'time');
    const endTime = formatDate(endDate, 'time');
    return `${dateStr}, ${startTime}${separator}${endTime}`;
  }

  return `${start}${separator}${end}`;
};
