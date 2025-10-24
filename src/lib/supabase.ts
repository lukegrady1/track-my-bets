/**
 * Supabase client configuration
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// In development mode without Supabase, we create a dummy client
// The actual queries will use mock data instead
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Type definitions for database tables
export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          user_id: string;
          base_unit: number;
          default_book_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          base_unit: number;
          default_book_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          base_unit?: number;
          default_book_id?: string | null;
          updated_at?: string;
        };
      };
      sportsbooks: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
        };
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          bet_name: string;
          sport: string;
          league: string | null;
          market_type: string;
          team_or_player: string | null;
          odds_american: number;
          odds_decimal: number;
          implied_prob: number;
          stake: number;
          units: number;
          status: string;
          result_profit: number | null;
          cashout_amount: number | null;
          book_id: string | null;
          event_date: string | null;
          placed_at: string;
          closing_odds_american: number | null;
          notes: string | null;
          parlay_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bet_name: string;
          sport: string;
          league?: string | null;
          market_type: string;
          team_or_player?: string | null;
          odds_american: number;
          stake: number;
          units: number;
          status: string;
          result_profit?: number | null;
          cashout_amount?: number | null;
          book_id?: string | null;
          event_date?: string | null;
          placed_at?: string;
          closing_odds_american?: number | null;
          notes?: string | null;
          parlay_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bet_name?: string;
          sport?: string;
          league?: string | null;
          market_type?: string;
          team_or_player?: string | null;
          odds_american?: number;
          stake?: number;
          units?: number;
          status?: string;
          result_profit?: number | null;
          cashout_amount?: number | null;
          book_id?: string | null;
          event_date?: string | null;
          closing_odds_american?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      bet_tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
      };
      bet_tag_joins: {
        Row: {
          bet_id: string;
          tag_id: string;
        };
        Insert: {
          bet_id: string;
          tag_id: string;
        };
        Update: never;
      };
    };
  };
}
