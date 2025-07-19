// Type definitions for gradual TypeScript migration
// Start with core game types and expand incrementally

import React from 'react';

// Game Types
export interface Card {
  rank: string;
  suit: string;
  value: number;
  toString(): string;
  equals(other: Card): boolean;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  position: number;
  isAI: boolean;
  aiType?: string;
  status: PlayerStatus;
  holeCards: Card[];
  currentBet: number;
  totalPotContribution: number;
  lastAction: string | null;
}

export interface GameState {
  players: Player[];
  dealerPosition: number;
  currentPlayerIndex: number;
  phase: GamePhase;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  blinds: {
    small: number;
    big: number;
  };
  handNumber: number;
}

// Enums
export type PlayerStatus =
  | 'active'
  | 'folded'
  | 'all-in'
  | 'waiting'
  | 'sitting-out'
  | 'checked'
  | 'called'
  | 'raised';

export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

// Analytics Types
export interface PlayerStats {
  handsPlayed: number;
  handsWon: number;
  biggestPotWon: number;
  totalWinnings: number;
  vpip: number; // Voluntarily Put Money In Pot
  pfr: number; // Pre-Flop Raise
  aggression: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  metric: string;
  value: number;
  context?: Record<string, unknown>;
}

// Learning Types
export interface StudySession {
  id: string;
  userId: string;
  type: StudyType;
  startTime: Date;
  endTime?: Date;
  progress: number;
  score?: number;
}

export type StudyType =
  | 'hand-analysis'
  | 'position-play'
  | 'betting-patterns'
  | 'pot-odds'
  | 'tournament-strategy';

// User Types
export interface User {
  id: string;
  name: string;
  email?: string;
  preferences: UserPreferences;
  stats: PlayerStats;
  createdAt: Date;
  lastActive: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoActionDelay: number;
  tableLayout: 'classic' | 'modern';
  cardStyle: 'traditional' | 'modern';
}

// Event Types
export interface DomainEvent {
  eventType: string;
  eventId: string;
  timestamp: Date;
  aggregateId: string;
  version: number;
  payload: Record<string, unknown>;
}

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface Command {
  type: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Query {
  type: string;
  params: Record<string, unknown>;
}

// Utility Types
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export type Optional<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Component Props Types (for React migration)
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface GameComponentProps extends BaseComponentProps {
  gameState?: GameState;
  onAction?: (action: PlayerAction, amount?: number) => void;
}

// Hook Types
export interface UseGameStateResult {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  executeAction: (action: PlayerAction, amount?: number) => Promise<void>;
}

// Security Types
export interface SecurityConfig {
  csrfProtection: boolean;
  rateLimiting: boolean;
  inputSanitization: boolean;
  contentSecurityPolicy: string;
}

// Performance Types
export interface WebVitalsMetrics {
  CLS: number;
  FID: number;
  FCP: number;
  LCP: number;
  TTFB: number;
  INP?: number;
}

// Configuration Types
export interface AppConfig {
  environment: 'development' | 'production' | 'test';
  apiUrl: string;
  enableAnalytics: boolean;
  enableLogging: boolean;
  security: SecurityConfig;
  features: {
    multiplayer: boolean;
    tournaments: boolean;
    coaching: boolean;
  };
}
