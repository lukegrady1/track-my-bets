/**
 * Database query helpers using Supabase
 */
import { supabase } from './supabase';
import type { Bet, UserSettings, Sportsbook, BetTag, KPIData } from './schemas';
import { profit } from './odds';
import { mockQueries } from './mockData';

// DEVELOPMENT MODE: Set to true to use mock data without Supabase
// Set to false to use real Supabase database
const USE_MOCK_DATA = false;

// Auth queries
export async function getCurrentUser() {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getCurrentUser();
  }

  // Since auth is disabled, return the demo user directly
  // This matches the user created in seed-with-demo-user.sql
  return {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    email: 'demo@trackmybets.com',
  };

  // Uncomment below when you re-enable authentication
  // const { data: { user }, error } = await supabase.auth.getUser();
  // if (error) throw error;
  // return user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.signOut();
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// User Settings queries
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getUserSettings(userId);
  }
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

export async function upsertUserSettings(settings: UserSettings) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.upsertUserSettings(settings);
  }
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(settings)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Sportsbook queries
export async function getSportsbooks(userId: string): Promise<Sportsbook[]> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getSportsbooks(userId);
  }
  const { data, error } = await supabase
    .from('sportsbooks')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createSportsbook(sportsbook: Omit<Sportsbook, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('sportsbooks')
    .insert(sportsbook)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Bet queries
export async function getBets(userId: string, filters?: {
  sport?: string;
  status?: string;
  bookId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Bet[]> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getBets(userId, filters);
  }
  let query = supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false });

  if (filters?.sport) {
    query = query.eq('sport', filters.sport);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.bookId) {
    query = query.eq('book_id', filters.bookId);
  }
  if (filters?.startDate) {
    query = query.gte('placed_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('placed_at', filters.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBetById(betId: string): Promise<Bet | null> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getBetById(betId);
  }
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('id', betId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createBet(bet: Omit<Bet, 'id' | 'created_at' | 'updated_at'>) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.createBet(bet);
  }
  const { data, error } = await supabase
    .from('bets')
    .insert(bet)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBet(betId: string, updates: Partial<Bet>) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.updateBet(betId, updates);
  }
  const { data, error } = await supabase
    .from('bets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', betId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBet(betId: string) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.deleteBet(betId);
  }
  const { error } = await supabase
    .from('bets')
    .delete()
    .eq('id', betId);

  if (error) throw error;
}

export async function settleBet(
  betId: string,
  status: 'Won' | 'Lost' | 'Push' | 'Void' | 'Cashout',
  cashoutAmount?: number
) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.settleBet(betId, status, cashoutAmount);
  }
  const bet = await getBetById(betId);
  if (!bet) throw new Error('Bet not found');

  const resultProfit = profit(bet.odds_american, bet.stake, status, cashoutAmount);

  return updateBet(betId, {
    status,
    result_profit: resultProfit,
    cashout_amount: cashoutAmount || null,
  });
}

// Analytics queries
export async function getKPIs(userId: string, filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<KPIData> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getKPIs(userId, filters);
  }
  const bets = await getBets(userId, filters);

  const settledBets = bets.filter(b =>
    ['Won', 'Lost', 'Push', 'Void', 'Cashout'].includes(b.status)
  );

  const totalPnL = settledBets.reduce((sum, bet) => sum + (bet.result_profit || 0), 0);
  const totalStaked = settledBets
    .filter(b => b.status !== 'Void')
    .reduce((sum, bet) => sum + bet.stake, 0);

  const wonBets = settledBets.filter(b => b.status === 'Won').length;
  const lostBets = settledBets.filter(b => b.status === 'Lost').length;
  const pendingBets = bets.filter(b => b.status === 'Pending').length;

  const totalBets = bets.length;
  const totalUnits = settledBets.reduce((sum, bet) => sum + (bet.result_profit || 0), 0);
  const roi = totalStaked > 0 ? (totalPnL / totalStaked) * 100 : 0;
  const hitRate = (wonBets + lostBets) > 0 ? (wonBets / (wonBets + lostBets)) * 100 : 0;

  const avgOdds = bets.length > 0
    ? bets.reduce((sum, bet) => sum + bet.odds_american, 0) / bets.length
    : 0;

  const avgImpliedProb = bets.length > 0
    ? bets.reduce((sum, bet) => sum + bet.implied_prob, 0) / bets.length
    : 0;

  return {
    totalPnL,
    totalUnits,
    roi,
    hitRate,
    avgOdds,
    avgImpliedProb,
    totalStaked,
    totalBets,
    wonBets,
    lostBets,
    pendingBets,
  };
}

// Tag queries
export async function getTags(userId: string): Promise<BetTag[]> {
  const { data, error } = await supabase
    .from('bet_tags')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createTag(tag: Omit<BetTag, 'id'>) {
  const { data, error } = await supabase
    .from('bet_tags')
    .insert(tag)
    .select()
    .single();

  if (error) throw error;
  return data;
}
