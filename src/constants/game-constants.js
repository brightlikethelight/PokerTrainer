export const SUITS = {
  SPADES: 's',
  HEARTS: 'h',
  DIAMONDS: 'd',
  CLUBS: 'c',
};

export const RANKS = {
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  TEN: 'T',
  JACK: 'J',
  QUEEN: 'Q',
  KING: 'K',
  ACE: 'A',
};

export const RANK_VALUES = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const HAND_RANKINGS = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
};

export const GAME_PHASES = {
  WAITING: 'waiting',
  PREFLOP: 'preflop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown',
};

export const PLAYER_ACTIONS = {
  FOLD: 'fold',
  CHECK: 'check',
  CALL: 'call',
  BET: 'bet',
  RAISE: 'raise',
  ALL_IN: 'all-in',
};

export const PLAYER_STATUS = {
  ACTIVE: 'active',
  FOLDED: 'folded',
  ALL_IN: 'all-in',
  WAITING: 'waiting',
  SITTING_OUT: 'sitting-out',
  CHECKED: 'checked',
  CALLED: 'called',
  RAISED: 'raised',
};

export const AI_PLAYER_TYPES = {
  TAG: 'tight-aggressive',
  LAG: 'loose-aggressive',
  TP: 'tight-passive',
  LP: 'loose-passive',
};

export const POSITION_NAMES = {
  BTN: 'button',
  SB: 'small-blind',
  BB: 'big-blind',
  UTG: 'under-the-gun',
  MP: 'middle-position',
  CO: 'cut-off',
};

export const BETTING_LIMITS = {
  MIN_BET_MULTIPLIER: 1,
  MIN_RAISE_MULTIPLIER: 2,
};

export const POSITIONS = {
  BTN: 'button',
  SB: 'small-blind',
  BB: 'big-blind',
  UTG: 'under-the-gun',
  MP: 'middle-position',
  CO: 'cut-off',
};
