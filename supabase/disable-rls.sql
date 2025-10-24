-- Disable RLS for Development (No Authentication Required)
-- This allows access to all tables without requiring a logged-in user
-- WARNING: Only use this for development! Re-enable RLS for production.

-- Disable RLS on all tables
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sportsbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_tag_joins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bankroll_snapshots DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_settings', 'sportsbooks', 'bets', 'bet_tags', 'bet_tag_joins', 'bankroll_snapshots');

-- You should see 'false' in the rowsecurity column for all tables
