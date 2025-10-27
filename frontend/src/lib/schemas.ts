/**
 * Zod validation schemas for all data types
 */
import { z } from 'zod';

// Enums
export const sportSchema = z.enum([
  'NFL',
  'NBA',
  'MLB',
  'NHL',
  'NCAAF',
  'NCAAB',
  'Soccer',
  'MMA',
  'Other',
]);

export const marketTypeSchema = z.enum([
  'ML',
  'Spread',
  'Total',
  'Prop',
  'Parlay',
  'Future',
  'Other',
]);

export const betStatusSchema = z.enum([
  'Pending',
  'Won',
  'Lost',
  'Push',
  'Void',
  'Cashout',
]);

// User Settings Schema
export const userSettingsSchema = z.object({
  user_id: z.string().uuid(),
  base_unit: z.number().positive('Base unit must be positive'),
  default_book_id: z.string().uuid().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// Sportsbook Schema
export const sportsbookSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().nullable(),
  name: z.string().min(1, 'Sportsbook name is required'),
  created_at: z.string().datetime().optional(),
});

export type Sportsbook = z.infer<typeof sportsbookSchema>;

// Bet Schema
export const betSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  bet_name: z.string().min(1, 'Bet name is required'),
  sport: sportSchema,
  league: z.string().nullable().optional(),
  market_type: marketTypeSchema,
  team_or_player: z.string().nullable().optional(),
  odds_american: z.number().int('Odds must be an integer'),
  stake: z.number().nonnegative('Stake must be non-negative'),
  units: z.number(),
  status: betStatusSchema,
  result_profit: z.number().nullable().optional(),
  cashout_amount: z.number().nullable().optional(),
  book_id: z.string().uuid().nullable().optional(),
  event_date: z.string().datetime().nullable().optional(),
  placed_at: z.string().datetime().optional(),
  closing_odds_american: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  parlay_group_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Bet = z.infer<typeof betSchema>;

// Bet Form Schema (for client-side validation)
export const betFormSchema = z.object({
  bet_name: z.string().min(1, 'Bet name is required'),
  sport: sportSchema,
  league: z.string().optional(),
  market_type: marketTypeSchema,
  team_or_player: z.string().optional(),
  odds_american: z.number().int('Odds must be an integer').refine(
    (val) => val !== 0,
    'Odds cannot be zero'
  ),
  stake: z.number().positive('Stake must be positive'),
  book_id: z.string().uuid('Please select a sportsbook'),
  event_date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type BetFormData = z.infer<typeof betFormSchema>;

// Bet Tag Schema
export const betTagSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Tag name is required'),
});

export type BetTag = z.infer<typeof betTagSchema>;

// Settings Form Schema
export const settingsFormSchema = z.object({
  base_unit: z.number().positive('Base unit must be positive'),
  default_book_id: z.string().uuid().nullable(),
  default_stake: z.number().positive().optional(),
});

export type SettingsFormData = z.infer<typeof settingsFormSchema>;

// CSV Import Schema
export const csvImportSchema = z.object({
  provider: z.enum(['draftkings', 'fanduel', 'betmgm', 'generic']),
  file: z.instanceof(File),
  mapping: z.record(z.string(), z.string()).optional(),
});

export type CSVImportData = z.infer<typeof csvImportSchema>;

// Analytics Types
export interface KPIData {
  totalPnL: number;
  totalUnits: number;
  roi: number;
  hitRate: number;
  avgOdds: number;
  avgImpliedProb: number;
  totalStaked: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
}

export interface BankrollSnapshot {
  id?: string;
  user_id: string;
  amount: number;
  date: string;
  created_at?: string;
}

export interface PerformanceByCategory {
  category: string;
  pnl: number;
  units: number;
  roi: number;
  bets: number;
  wins: number;
  losses: number;
}
