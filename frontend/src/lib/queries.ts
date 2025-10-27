/**
 * Database query helpers using FastAPI backend
 */
import api, { setTokens, clearTokens } from './api';
import type { Bet, UserSettings, Sportsbook, BetTag, KPIData } from './schemas';
import { mockQueries } from './mockData';

// DEVELOPMENT MODE: Set to true to use mock data without backend
// Set to false to use real FastAPI backend
const USE_MOCK_DATA = false;

// Auth queries
export async function getCurrentUser() {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getCurrentUser();
  }

  const { data } = await api.get('/api/v1/auth/me');
  // Backend returns { user: {...}, settings: {...} }
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data } = await api.post('/api/v1/auth/login', {
    email,
    password,
  });

  // Store tokens from FastAPI response
  if (data.access_token && data.refresh_token) {
    setTokens(data.access_token, data.refresh_token);
  }

  return data;
}

export async function signUp(email: string, password: string) {
  const { data } = await api.post('/api/v1/auth/register', {
    email,
    password,
  });

  // Store tokens from FastAPI response
  if (data.access_token && data.refresh_token) {
    setTokens(data.access_token, data.refresh_token);
  }

  return data;
}

export async function signOut() {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.signOut();
  }
  await api.post('/api/v1/auth/logout');
  // Clear tokens on logout
  clearTokens();
}

export async function resetPassword(email: string) {
  await api.post('/api/v1/auth/reset-password', { email });
}

// User Settings queries
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getUserSettings(userId);
  }
  try {
    const { data } = await api.get(`/api/v1/users/${userId}/settings`);
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function upsertUserSettings(settings: UserSettings) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.upsertUserSettings(settings);
  }
  const { data } = await api.put(`/api/v1/users/${settings.user_id}/settings`, settings);
  return data;
}

// Sportsbook queries
export async function getSportsbooks(userId: string): Promise<Sportsbook[]> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getSportsbooks(userId);
  }
  const { data } = await api.get(`/api/v1/sportsbooks?user_id=${userId}`);
  return data || [];
}

export async function createSportsbook(sportsbook: Omit<Sportsbook, 'id' | 'created_at'>) {
  const { data } = await api.post('/api/v1/sportsbooks', sportsbook);
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

  const params = new URLSearchParams();
  if (filters?.sport) params.append('sport', filters.sport);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.bookId) params.append('book_id', filters.bookId);
  if (filters?.startDate) params.append('from', filters.startDate);
  if (filters?.endDate) params.append('to', filters.endDate);

  const { data } = await api.get(`/api/v1/bets?${params.toString()}`);
  return data || [];
}

export async function getBetById(betId: string): Promise<Bet | null> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getBetById(betId);
  }
  try {
    const { data } = await api.get(`/api/v1/bets/${betId}`);
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function createBet(bet: Omit<Bet, 'id' | 'created_at' | 'updated_at'>) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.createBet(bet);
  }
  const { data } = await api.post('/api/v1/bets', bet);
  return data;
}

export async function updateBet(betId: string, updates: Partial<Bet>) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.updateBet(betId, updates);
  }
  const { data } = await api.patch(`/api/v1/bets/${betId}`, updates);
  return data;
}

export async function deleteBet(betId: string) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.deleteBet(betId);
  }
  await api.delete(`/api/v1/bets/${betId}`);
}

export async function settleBet(
  betId: string,
  status: 'Won' | 'Lost' | 'Push' | 'Void' | 'Cashout',
  cashoutAmount?: number
) {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.settleBet(betId, status, cashoutAmount);
  }
  const { data } = await api.post(`/api/v1/bets/${betId}/settle`, {
    status,
    cashout_amount: cashoutAmount,
  });
  return data;
}

// Analytics queries
export async function getKPIs(userId: string, filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<KPIData> {
  if (USE_MOCK_DATA && mockQueries) {
    return await mockQueries.getKPIs(userId, filters);
  }

  const params = new URLSearchParams();
  if (filters?.startDate) params.append('from', filters.startDate);
  if (filters?.endDate) params.append('to', filters.endDate);

  const { data } = await api.get(`/api/v1/analytics/kpis?${params.toString()}`);
  return data;
}

// Tag queries
export async function getTags(userId: string): Promise<BetTag[]> {
  const { data } = await api.get(`/api/v1/tags?user_id=${userId}`);
  return data || [];
}

export async function createTag(tag: Omit<BetTag, 'id'>) {
  const { data } = await api.post('/api/v1/tags', tag);
  return data;
}
