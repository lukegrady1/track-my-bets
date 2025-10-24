/**
 * Mock data for local development without Supabase
 * This allows testing the UI without setting up a database
 */

import type { Bet, UserSettings, Sportsbook, KPIData } from './schemas';

// Mock user ID - matches the demo user created in seed-with-demo-user.sql
// This allows seamless switching between mock data and real database
export const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

// Mock sportsbooks
export const mockSportsbooks: Sportsbook[] = [
  { id: '1', user_id: null, name: 'DraftKings', created_at: new Date().toISOString() },
  { id: '2', user_id: null, name: 'FanDuel', created_at: new Date().toISOString() },
  { id: '3', user_id: null, name: 'BetMGM', created_at: new Date().toISOString() },
  { id: '4', user_id: null, name: 'Caesars', created_at: new Date().toISOString() },
  { id: '5', user_id: null, name: 'BetRivers', created_at: new Date().toISOString() },
];

// Mock user settings
export const mockUserSettings: UserSettings = {
  user_id: MOCK_USER_ID,
  base_unit: 50,
  default_book_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock bets
export const mockBets: Bet[] = [
  {
    id: '1',
    user_id: MOCK_USER_ID,
    bet_name: 'Chiefs ML vs Bills',
    sport: 'NFL',
    league: 'NFL',
    market_type: 'ML',
    team_or_player: 'Kansas City Chiefs',
    odds_american: -110,
    stake: 110,
    units: 2.2,
    status: 'Won',
    result_profit: 100,
    book_id: '1',
    placed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Strong play, Chiefs at home',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: MOCK_USER_ID,
    bet_name: 'Lakers -5.5',
    sport: 'NBA',
    league: 'NBA',
    market_type: 'Spread',
    team_or_player: 'Los Angeles Lakers',
    odds_american: -110,
    stake: 55,
    units: 1.1,
    status: 'Lost',
    result_profit: -55,
    book_id: '2',
    placed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: MOCK_USER_ID,
    bet_name: 'Yankees ML',
    sport: 'MLB',
    league: 'MLB',
    market_type: 'ML',
    team_or_player: 'New York Yankees',
    odds_american: 150,
    stake: 100,
    units: 2,
    status: 'Won',
    result_profit: 150,
    book_id: '1',
    placed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    user_id: MOCK_USER_ID,
    bet_name: 'Cowboys +3',
    sport: 'NFL',
    league: 'NFL',
    market_type: 'Spread',
    team_or_player: 'Dallas Cowboys',
    odds_american: -110,
    stake: 110,
    units: 2.2,
    status: 'Pending',
    book_id: '3',
    placed_at: new Date().toISOString(),
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Sunday game',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    user_id: MOCK_USER_ID,
    bet_name: 'Over 220.5',
    sport: 'NBA',
    league: 'NBA',
    market_type: 'Total',
    team_or_player: 'Celtics vs Heat',
    odds_american: -105,
    stake: 52.5,
    units: 1.05,
    status: 'Push',
    result_profit: 0,
    book_id: '2',
    placed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

// In-memory storage for new bets
let betsStore = [...mockBets];
let settingsStore = { ...mockUserSettings };

// Mock query functions
export const mockQueries = {
  getCurrentUser: async () => ({
    id: MOCK_USER_ID,
    email: 'demo@example.com',
  }),

  getUserSettings: async (userId: string) => {
    return settingsStore;
  },

  upsertUserSettings: async (settings: UserSettings) => {
    settingsStore = { ...settings };
    return settingsStore;
  },

  getSportsbooks: async (userId: string) => {
    return mockSportsbooks;
  },

  getBets: async (userId: string, filters?: any) => {
    let filtered = [...betsStore];

    if (filters?.sport) {
      filtered = filtered.filter(b => b.sport === filters.sport);
    }
    if (filters?.status) {
      filtered = filtered.filter(b => b.status === filters.status);
    }
    if (filters?.bookId) {
      filtered = filtered.filter(b => b.book_id === filters.bookId);
    }

    return filtered.sort((a, b) =>
      new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
    );
  },

  getBetById: async (betId: string) => {
    return betsStore.find(b => b.id === betId) || null;
  },

  createBet: async (bet: Omit<Bet, 'id' | 'created_at' | 'updated_at'>) => {
    const newBet: Bet = {
      ...bet,
      id: `bet-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    betsStore.push(newBet);
    return newBet;
  },

  updateBet: async (betId: string, updates: Partial<Bet>) => {
    const index = betsStore.findIndex(b => b.id === betId);
    if (index >= 0) {
      betsStore[index] = {
        ...betsStore[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return betsStore[index];
    }
    throw new Error('Bet not found');
  },

  deleteBet: async (betId: string) => {
    betsStore = betsStore.filter(b => b.id !== betId);
  },

  settleBet: async (
    betId: string,
    status: 'Won' | 'Lost' | 'Push' | 'Void' | 'Cashout',
    cashoutAmount?: number
  ) => {
    const bet = betsStore.find(b => b.id === betId);
    if (!bet) throw new Error('Bet not found');

    // Calculate profit based on the profit function
    const { profit: profitCalc } = await import('./odds');
    const resultProfit = profitCalc(bet.odds_american, bet.stake, status, cashoutAmount);

    return mockQueries.updateBet(betId, {
      status,
      result_profit: resultProfit,
      cashout_amount: cashoutAmount || null,
    });
  },

  getKPIs: async (userId: string, filters?: any): Promise<KPIData> => {
    const bets = await mockQueries.getBets(userId, filters);

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

    // Calculate average implied probability
    const { impliedProbFromAmerican } = await import('./odds');
    const avgImpliedProb = bets.length > 0
      ? bets.reduce((sum, bet) => sum + impliedProbFromAmerican(bet.odds_american), 0) / bets.length
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
  },

  signOut: async () => {
    console.log('Mock sign out');
  },
};
