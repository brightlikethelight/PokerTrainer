/**
 * ScenarioGenerator
 * Generates practice scenarios for poker training
 */

import Card from '../entities/Card';

/**
 * Pre-defined hand categories for training
 */
const HAND_CATEGORIES = {
  premium: [
    // AA, KK, QQ, AK
    [
      ['A', 's'],
      ['A', 'h'],
    ],
    [
      ['K', 's'],
      ['K', 'h'],
    ],
    [
      ['Q', 's'],
      ['Q', 'h'],
    ],
    [
      ['A', 's'],
      ['K', 's'],
    ],
    [
      ['A', 'h'],
      ['K', 'h'],
    ],
  ],
  strong: [
    // JJ, TT, AQ, AJs
    [
      ['J', 's'],
      ['J', 'h'],
    ],
    [
      ['T', 's'],
      ['T', 'h'],
    ],
    [
      ['A', 's'],
      ['Q', 's'],
    ],
    [
      ['A', 'h'],
      ['Q', 'h'],
    ],
    [
      ['A', 's'],
      ['J', 's'],
    ],
  ],
  medium: [
    // 99, 88, KQs, ATs, KJs
    [
      ['9', 's'],
      ['9', 'h'],
    ],
    [
      ['8', 's'],
      ['8', 'h'],
    ],
    [
      ['K', 's'],
      ['Q', 's'],
    ],
    [
      ['A', 's'],
      ['T', 's'],
    ],
    [
      ['K', 's'],
      ['J', 's'],
    ],
  ],
  speculative: [
    // Small pairs, suited connectors
    [
      ['7', 's'],
      ['7', 'h'],
    ],
    [
      ['6', 's'],
      ['6', 'h'],
    ],
    [
      ['9', 's'],
      ['8', 's'],
    ],
    [
      ['8', 's'],
      ['7', 's'],
    ],
    [
      ['7', 's'],
      ['6', 's'],
    ],
  ],
  marginal: [
    // Suited gappers, offsuit broadway
    [
      ['K', 's'],
      ['T', 'h'],
    ],
    [
      ['Q', 's'],
      ['J', 'h'],
    ],
    [
      ['J', 's'],
      ['9', 's'],
    ],
    [
      ['T', 's'],
      ['8', 's'],
    ],
    [
      ['A', 's'],
      ['9', 'h'],
    ],
  ],
  trash: [
    // Weak hands to fold
    [
      ['7', 's'],
      ['2', 'h'],
    ],
    [
      ['8', 's'],
      ['3', 'h'],
    ],
    [
      ['9', 's'],
      ['4', 'h'],
    ],
    [
      ['J', 's'],
      ['3', 'h'],
    ],
    [
      ['K', 's'],
      ['5', 'h'],
    ],
  ],
};

/**
 * Position names for scenarios
 */
const POSITIONS = [
  'button',
  'cutoff',
  'hijack',
  'middle',
  'utg+1',
  'utg',
  'small_blind',
  'big_blind',
];

/**
 * Scenario types for practice
 */
const SCENARIO_TYPES = {
  PREFLOP_OPEN: 'preflop_open',
  PREFLOP_FACING_RAISE: 'preflop_facing_raise',
  PREFLOP_3BET: 'preflop_3bet',
  FLOP_CBET: 'flop_cbet',
  FLOP_FACING_CBET: 'flop_facing_cbet',
  TURN_DECISION: 'turn_decision',
  RIVER_DECISION: 'river_decision',
  BLUFF_SPOT: 'bluff_spot',
  VALUE_BET: 'value_bet',
};

/**
 * Board textures for postflop scenarios
 */
const BOARD_TEXTURES = {
  dry: [
    // Rainbow, unconnected boards
    [
      ['A', 's'],
      ['7', 'h'],
      ['2', 'd'],
    ],
    [
      ['K', 's'],
      ['8', 'h'],
      ['3', 'd'],
    ],
    [
      ['Q', 's'],
      ['6', 'h'],
      ['2', 'd'],
    ],
  ],
  wet: [
    // Connected, suited boards
    [
      ['J', 's'],
      ['T', 's'],
      ['8', 's'],
    ],
    [
      ['9', 'h'],
      ['8', 'h'],
      ['6', 'h'],
    ],
    [
      ['T', 's'],
      ['9', 's'],
      ['7', 'd'],
    ],
  ],
  paired: [
    // Boards with a pair
    [
      ['A', 's'],
      ['A', 'h'],
      ['7', 'd'],
    ],
    [
      ['K', 's'],
      ['K', 'h'],
      ['5', 'd'],
    ],
    [
      ['7', 's'],
      ['7', 'h'],
      ['2', 'd'],
    ],
  ],
  draw_heavy: [
    // Boards with flush/straight draws
    [
      ['Q', 's'],
      ['J', 's'],
      ['5', 's'],
    ],
    [
      ['T', 'h'],
      ['9', 'h'],
      ['8', 'd'],
    ],
    [
      ['A', 'd'],
      ['K', 'd'],
      ['T', 'c'],
    ],
  ],
};

class ScenarioGenerator {
  /**
   * Generate a random preflop scenario
   * @param {string} difficulty - beginner, intermediate, advanced
   * @returns {Object} Scenario object
   */
  static generatePreflopScenario(difficulty = 'intermediate') {
    const scenarioType = this.getRandomPreflopType();
    const position = this.getRandomPosition(difficulty);
    const hand = this.getHandForDifficulty(difficulty, scenarioType);

    const scenario = {
      type: scenarioType,
      phase: 'preflop',
      difficulty,
      heroPosition: position,
      heroHand: hand.map((c) => new Card(c[0], c[1])),
      potSize: 15, // Default blinds 5/10
      toCall: 0,
      currentBet: 10, // Big blind
      villainAction: null,
      villainPosition: null,
    };

    // Add context based on scenario type
    switch (scenarioType) {
      case SCENARIO_TYPES.PREFLOP_OPEN:
        scenario.description = `You are in ${position}. Action folds to you. What do you do?`;
        scenario.correctActions = this.getCorrectOpenActions(hand, position);
        break;

      case SCENARIO_TYPES.PREFLOP_FACING_RAISE:
        scenario.villainPosition = this.getEarlierPosition(position);
        scenario.villainAction = 'raise';
        scenario.toCall = 30;
        scenario.currentBet = 30;
        scenario.description = `${scenario.villainPosition} raises to 3x. Action to you in ${position}. What do you do?`;
        scenario.correctActions = this.getCorrectCallActions(
          hand,
          position,
          scenario.villainPosition
        );
        break;

      case SCENARIO_TYPES.PREFLOP_3BET:
        scenario.villainPosition = this.getLaterPosition(position);
        scenario.heroRaised = true;
        scenario.toCall = 90;
        scenario.currentBet = 90;
        scenario.description = `You raised to 3x from ${position}. ${scenario.villainPosition} 3-bets to 9x. What do you do?`;
        scenario.correctActions = this.getCorrect3BetResponseActions(hand, position);
        break;
    }

    return scenario;
  }

  /**
   * Generate a postflop scenario
   * @param {string} difficulty - beginner, intermediate, advanced
   * @returns {Object} Scenario object
   */
  static generatePostflopScenario(difficulty = 'intermediate') {
    const scenarioType = this.getRandomPostflopType();
    const position = this.getRandomPosition(difficulty);
    const hand = this.getHandForDifficulty(difficulty, scenarioType);
    const board = this.getRandomBoard();

    const scenario = {
      type: scenarioType,
      phase: 'flop',
      difficulty,
      heroPosition: position,
      heroHand: hand.map((c) => new Card(c[0], c[1])),
      board: board.map((c) => new Card(c[0], c[1])),
      potSize: 60, // Assume 3x preflop raise was called
      toCall: 0,
      currentBet: 0,
      villainAction: null,
      villainPosition: position === 'button' ? 'big_blind' : 'button',
    };

    // Determine if hero is in position
    const heroIP = position === 'button' || position === 'cutoff';

    switch (scenarioType) {
      case SCENARIO_TYPES.FLOP_CBET:
        scenario.isAggressor = true;
        scenario.description = `You raised preflop from ${position}. Villain called from ${scenario.villainPosition}. The flop is ${this.formatBoard(scenario.board)}. Villain checks. What do you do?`;
        scenario.correctActions = this.getCorrectCBetActions(hand, board, heroIP);
        break;

      case SCENARIO_TYPES.FLOP_FACING_CBET:
        scenario.isAggressor = false;
        scenario.toCall = 40;
        scenario.currentBet = 40;
        scenario.villainAction = 'bet';
        scenario.description = `Villain raised preflop from ${scenario.villainPosition}. You called from ${position}. The flop is ${this.formatBoard(scenario.board)}. Villain bets 2/3 pot (${scenario.toCall}). What do you do?`;
        scenario.correctActions = this.getCorrectFacingCBetActions(hand, board, heroIP);
        break;

      case SCENARIO_TYPES.BLUFF_SPOT: {
        scenario.phase = 'river';
        scenario.potSize = 120;
        const turnCard = this.getRandomCard(board);
        const riverCard = this.getRandomCard([...board, turnCard]);
        scenario.board = [
          ...board.map((c) => new Card(c[0], c[1])),
          new Card(turnCard[0], turnCard[1]),
          new Card(riverCard[0], riverCard[1]),
        ];
        scenario.description = `The river is ${this.formatBoard(scenario.board)}. Villain checks. You have ${this.formatHand(scenario.heroHand)} (missed draw). What do you do?`;
        scenario.correctActions = this.getCorrectBluffActions(hand, scenario.board, heroIP);
        break;
      }

      case SCENARIO_TYPES.VALUE_BET: {
        scenario.phase = 'river';
        scenario.potSize = 120;
        const turn = this.getRandomCard(board);
        const river = this.getRandomCard([...board, turn]);
        scenario.board = [
          ...board.map((c) => new Card(c[0], c[1])),
          new Card(turn[0], turn[1]),
          new Card(river[0], river[1]),
        ];
        scenario.description = `The river is ${this.formatBoard(scenario.board)}. Villain checks. You have ${this.formatHand(scenario.heroHand)} (strong made hand). What do you do?`;
        scenario.correctActions = this.getCorrectValueBetActions(hand, scenario.board, heroIP);
        break;
      }
    }

    return scenario;
  }

  /**
   * Generate a quiz question for a specific concept
   * @param {string} concept - position, pot_odds, hand_ranges, bet_sizing
   * @returns {Object} Quiz question object
   */
  static generateQuizQuestion(concept) {
    switch (concept) {
      case 'position':
        return this.generatePositionQuiz();
      case 'pot_odds':
        return this.generatePotOddsQuiz();
      case 'hand_ranges':
        return this.generateHandRangeQuiz();
      case 'bet_sizing':
        return this.generateBetSizingQuiz();
      default:
        return this.generatePositionQuiz();
    }
  }

  // ============ Helper Methods ============

  static getRandomPreflopType() {
    const types = [
      SCENARIO_TYPES.PREFLOP_OPEN,
      SCENARIO_TYPES.PREFLOP_FACING_RAISE,
      SCENARIO_TYPES.PREFLOP_3BET,
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  static getRandomPostflopType() {
    const types = [
      SCENARIO_TYPES.FLOP_CBET,
      SCENARIO_TYPES.FLOP_FACING_CBET,
      SCENARIO_TYPES.BLUFF_SPOT,
      SCENARIO_TYPES.VALUE_BET,
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  static getRandomPosition(difficulty) {
    if (difficulty === 'beginner') {
      // Simpler positions for beginners
      return ['button', 'big_blind'][Math.floor(Math.random() * 2)];
    }
    return POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  }

  static getHandForDifficulty(difficulty, _scenarioType) {
    let categories;

    switch (difficulty) {
      case 'beginner':
        // Clear-cut decisions
        categories = ['premium', 'trash'];
        break;
      case 'intermediate':
        // More nuanced
        categories = ['strong', 'medium', 'marginal'];
        break;
      case 'advanced':
        // Complex spots
        categories = ['medium', 'speculative', 'marginal'];
        break;
      default:
        categories = ['medium'];
    }

    const category = categories[Math.floor(Math.random() * categories.length)];
    const hands = HAND_CATEGORIES[category];
    return hands[Math.floor(Math.random() * hands.length)];
  }

  static getRandomBoard() {
    const textures = Object.keys(BOARD_TEXTURES);
    const texture = textures[Math.floor(Math.random() * textures.length)];
    const boards = BOARD_TEXTURES[texture];
    return boards[Math.floor(Math.random() * boards.length)];
  }

  static getRandomCard(excludeCards) {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = ['s', 'h', 'd', 'c'];

    let card;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      card = [rank, suit];
      attempts++;
    } while (
      attempts < maxAttempts &&
      excludeCards.some((c) => {
        const r = c instanceof Card ? c.rank : c[0];
        const s = c instanceof Card ? c.suit : c[1];
        return r === card[0] && s === card[1];
      })
    );

    return card;
  }

  static getEarlierPosition(position) {
    const posIndex = POSITIONS.indexOf(position);
    if (posIndex <= 0) return 'utg';
    return POSITIONS[Math.floor(Math.random() * posIndex)];
  }

  static getLaterPosition(position) {
    const posIndex = POSITIONS.indexOf(position);
    if (posIndex >= POSITIONS.length - 1) return 'button';
    const laterPositions = POSITIONS.slice(0, posIndex);
    return laterPositions[Math.floor(Math.random() * laterPositions.length)] || 'button';
  }

  static formatBoard(cards) {
    return cards.map((c) => `${c.rank}${c.suit}`).join(' ');
  }

  static formatHand(cards) {
    return cards.map((c) => `${c.rank}${c.suit}`).join(' ');
  }

  // ============ Correct Action Generators ============

  static getCorrectOpenActions(hand, position) {
    // Simplified logic based on position and hand strength
    const handStr = hand
      .map((c) => c[0])
      .sort()
      .join('');
    const isPremium = ['AA', 'KK', 'QQ', 'AK'].includes(handStr);
    const isStrong = ['JJ', 'TT', 'AQ', 'AJ'].some((h) => handStr.includes(h.substring(0, 2)));

    const isLatePosition = ['button', 'cutoff', 'hijack'].includes(position);

    const actions = [];

    if (isPremium) {
      actions.push({
        action: 'raise',
        explanation: 'Premium hand - always raise',
        isOptimal: true,
      });
    } else if (isStrong) {
      actions.push({
        action: 'raise',
        explanation: 'Strong hand - raise from most positions',
        isOptimal: true,
      });
    } else if (isLatePosition) {
      actions.push({
        action: 'raise',
        explanation: 'Steal opportunity from late position',
        isOptimal: true,
      });
      actions.push({ action: 'fold', explanation: 'Acceptable if very tight', isOptimal: false });
    } else {
      actions.push({
        action: 'fold',
        explanation: 'Not strong enough from early position',
        isOptimal: true,
      });
    }

    return actions;
  }

  static getCorrectCallActions(hand, _heroPosition, _villainPosition) {
    const handStr = hand
      .map((c) => c[0])
      .sort()
      .join('');
    const isPremium = ['AA', 'KK', 'QQ', 'AK'].includes(handStr);
    const isStrong = ['JJ', 'TT', 'AQ', 'AJ'].some((h) => handStr.includes(h.substring(0, 2)));

    const actions = [];

    if (isPremium) {
      actions.push({
        action: 'raise',
        explanation: 'Premium hand - 3-bet for value',
        isOptimal: true,
      });
    } else if (isStrong) {
      actions.push({
        action: 'call',
        explanation: 'Strong hand - call to see flop',
        isOptimal: true,
      });
      actions.push({
        action: 'raise',
        explanation: '3-bet as a mix is acceptable',
        isOptimal: false,
      });
    } else {
      actions.push({
        action: 'fold',
        explanation: 'Not strong enough to call a raise',
        isOptimal: true,
      });
    }

    return actions;
  }

  static getCorrect3BetResponseActions(hand, _position) {
    const handStr = hand
      .map((c) => c[0])
      .sort()
      .join('');
    const isPremium = ['AA', 'KK'].includes(handStr);
    const isStrong = ['QQ', 'JJ', 'AK'].some((h) => handStr.includes(h.substring(0, 2)));

    const actions = [];

    if (isPremium) {
      actions.push({
        action: 'raise',
        explanation: 'Premium - 4-bet/shove for value',
        isOptimal: true,
      });
    } else if (isStrong) {
      actions.push({
        action: 'call',
        explanation: 'Strong hand - call and play postflop',
        isOptimal: true,
      });
      actions.push({ action: 'fold', explanation: 'Tight fold is acceptable', isOptimal: false });
    } else {
      actions.push({ action: 'fold', explanation: 'Not strong enough vs 3-bet', isOptimal: true });
    }

    return actions;
  }

  static getCorrectCBetActions(_hand, _board, heroIP) {
    // Simplified c-bet logic
    const actions = [];

    if (heroIP) {
      actions.push({
        action: 'bet',
        explanation: 'In position - c-bet to deny equity',
        isOptimal: true,
      });
    } else {
      actions.push({
        action: 'check',
        explanation: 'Out of position - check-call or give up',
        isOptimal: true,
      });
      actions.push({
        action: 'bet',
        explanation: 'C-bet can work on dry boards',
        isOptimal: false,
      });
    }

    return actions;
  }

  static getCorrectFacingCBetActions(_hand, _board, heroIP) {
    const actions = [];

    actions.push({ action: 'call', explanation: 'Continue with draws and pairs', isOptimal: true });
    actions.push({ action: 'fold', explanation: 'Give up without equity', isOptimal: false });
    if (heroIP) {
      actions.push({
        action: 'raise',
        explanation: 'Raise with strong hands or as bluff',
        isOptimal: false,
      });
    }

    return actions;
  }

  static getCorrectBluffActions(_hand, _board, heroIP) {
    const actions = [];

    if (heroIP) {
      actions.push({
        action: 'bet',
        explanation: 'Bluff when villain shows weakness',
        isOptimal: true,
      });
    } else {
      actions.push({ action: 'check', explanation: 'Give up OOP with air', isOptimal: true });
    }

    return actions;
  }

  static getCorrectValueBetActions(_hand, _board, _heroIP) {
    const actions = [];

    actions.push({ action: 'bet', explanation: 'Value bet strong hands', isOptimal: true });

    return actions;
  }

  // ============ Quiz Generators ============

  static generatePositionQuiz() {
    const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    const pos = positions[Math.floor(Math.random() * positions.length)];

    return {
      type: 'multiple_choice',
      concept: 'position',
      question: `What type of position is ${pos} in a 6-handed game?`,
      options: ['Early Position', 'Middle Position', 'Late Position', 'Blinds'],
      correctAnswer: this.getPositionCategory(pos),
      explanation: this.getPositionExplanation(pos),
    };
  }

  static getPositionCategory(pos) {
    switch (pos) {
      case 'UTG':
        return 'Early Position';
      case 'MP':
        return 'Middle Position';
      case 'CO':
      case 'BTN':
        return 'Late Position';
      case 'SB':
      case 'BB':
        return 'Blinds';
      default:
        return 'Unknown';
    }
  }

  static getPositionExplanation(pos) {
    const explanations = {
      UTG: 'Under the Gun acts first preflop and is in early position.',
      MP: 'Middle Position has moderate positional advantage.',
      CO: 'Cutoff is late position, one seat before the button.',
      BTN: 'Button acts last postflop and has the best position.',
      SB: 'Small Blind posts forced bet and acts first postflop.',
      BB: 'Big Blind posts full forced bet, defends vs raises.',
    };
    return explanations[pos] || '';
  }

  static generatePotOddsQuiz() {
    const potSizes = [100, 150, 200, 250];
    const betSizes = [50, 75, 100, 125];

    const potSize = potSizes[Math.floor(Math.random() * potSizes.length)];
    const betSize = betSizes[Math.floor(Math.random() * betSizes.length)];
    const totalPot = potSize + betSize;
    const odds = Math.round((betSize / (totalPot + betSize)) * 100);

    return {
      type: 'calculation',
      concept: 'pot_odds',
      question: `The pot is ${potSize}. Villain bets ${betSize}. What pot odds are you getting?`,
      options: [`${odds - 5}%`, `${odds}%`, `${odds + 5}%`, `${odds + 10}%`],
      correctAnswer: `${odds}%`,
      explanation: `You need to call ${betSize} to win ${totalPot + betSize}. Pot odds = ${betSize}/${totalPot + betSize} = ${odds}%`,
    };
  }

  static generateHandRangeQuiz() {
    const hands = [
      { hand: 'AA', strength: 'Top 1%' },
      { hand: 'KK', strength: 'Top 1%' },
      { hand: 'AKs', strength: 'Top 3%' },
      { hand: 'JJ', strength: 'Top 3%' },
      { hand: 'AQs', strength: 'Top 5%' },
      { hand: '99', strength: 'Top 6%' },
      { hand: 'ATs', strength: 'Top 10%' },
      { hand: '76s', strength: 'Top 25%' },
    ];

    const selected = hands[Math.floor(Math.random() * hands.length)];

    return {
      type: 'multiple_choice',
      concept: 'hand_ranges',
      question: `Approximately what percentile is ${selected.hand} in terms of hand strength?`,
      options: ['Top 1%', 'Top 3%', 'Top 5%', 'Top 25%'],
      correctAnswer: selected.strength,
      explanation: `${selected.hand} is approximately in the ${selected.strength} of starting hands.`,
    };
  }

  static generateBetSizingQuiz() {
    const scenarios = [
      {
        situation: 'value betting a strong hand on a dry board',
        correct: '2/3 pot to full pot',
        explanation: 'Larger sizing extracts more value from calling ranges.',
      },
      {
        situation: 'c-betting a missed flop as a bluff',
        correct: '1/3 pot',
        explanation: 'Small sizing risks less and still folds out weak hands.',
      },
      {
        situation: 'betting the river for thin value',
        correct: '1/2 pot',
        explanation: 'Medium sizing balances value and getting called.',
      },
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    return {
      type: 'multiple_choice',
      concept: 'bet_sizing',
      question: `What is the optimal bet sizing when ${scenario.situation}?`,
      options: ['1/3 pot', '1/2 pot', '2/3 pot to full pot', 'Overbet (1.5x pot+)'],
      correctAnswer: scenario.correct,
      explanation: scenario.explanation,
    };
  }
}

export default ScenarioGenerator;
export { SCENARIO_TYPES, HAND_CATEGORIES, BOARD_TEXTURES };
