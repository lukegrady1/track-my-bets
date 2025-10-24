-- Manual Seed Data for Track My Bets
-- This version doesn't use PL/pgSQL - just replace YOUR_USER_ID with your actual user ID

-- STEP 1: Get your user ID by signing up in the app, then running this query:
-- SELECT id, email FROM auth.users;

-- STEP 2: Replace 'YOUR_USER_ID_HERE' below with your actual UUID

-- Example:
-- If your user ID is: a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- Replace: 'YOUR_USER_ID_HERE'
-- With: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- Insert user settings
INSERT INTO user_settings (user_id, base_unit, default_book_id)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  50,
  (SELECT id FROM sportsbooks WHERE name = 'DraftKings' AND user_id IS NULL LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings WHERE user_id = 'YOUR_USER_ID_HERE'::uuid
);

-- Insert sample bets
-- Bet 1: Chiefs ML - WON
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at, notes
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Chiefs ML vs Bills',
  'NFL',
  'NFL',
  'ML',
  'Kansas City Chiefs',
  -110,
  110,
  2.2,
  'Won',
  100,
  (SELECT id FROM sportsbooks WHERE name = 'DraftKings' LIMIT 1),
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '2 days',
  'Strong play, Chiefs at home';

-- Bet 2: Lakers Spread - LOST
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Lakers -5.5',
  'NBA',
  'NBA',
  'Spread',
  'Los Angeles Lakers',
  -110,
  55,
  1.1,
  'Lost',
  -55,
  (SELECT id FROM sportsbooks WHERE name = 'FanDuel' LIMIT 1),
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '3 days';

-- Bet 3: Yankees ML - WON
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Yankees ML',
  'MLB',
  'MLB',
  'ML',
  'New York Yankees',
  150,
  100,
  2,
  'Won',
  150,
  (SELECT id FROM sportsbooks WHERE name = 'DraftKings' LIMIT 1),
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '5 days';

-- Bet 4: Cowboys Spread - PENDING
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status,
  book_id, event_date, placed_at, notes
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Cowboys +3',
  'NFL',
  'NFL',
  'Spread',
  'Dallas Cowboys',
  -110,
  110,
  2.2,
  'Pending',
  (SELECT id FROM sportsbooks WHERE name = 'BetMGM' LIMIT 1),
  NOW() + INTERVAL '2 days',
  NOW(),
  'Sunday game';

-- Bet 5: NBA Total - PUSH
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Over 220.5',
  'NBA',
  'NBA',
  'Total',
  'Celtics vs Heat',
  -105,
  52.5,
  1.05,
  'Push',
  0,
  (SELECT id FROM sportsbooks WHERE name = 'FanDuel' LIMIT 1),
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '1 day';

-- Bet 6: NHL ML - WON
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Bruins ML',
  'NHL',
  'NHL',
  'ML',
  'Boston Bruins',
  -125,
  125,
  2.5,
  'Won',
  100,
  (SELECT id FROM sportsbooks WHERE name = 'Caesars' LIMIT 1),
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '4 days';

-- Bet 7: Soccer Total - LOST
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at, notes
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Under 2.5 Goals',
  'Soccer',
  'Premier League',
  'Total',
  'Man City vs Arsenal',
  110,
  50,
  1,
  'Lost',
  -50,
  (SELECT id FROM sportsbooks WHERE name = 'BetRivers' LIMIT 1),
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '6 days',
  'High-scoring game';

-- Bet 8: MMA Prop - WON
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'KO in Round 1',
  'MMA',
  'UFC',
  'Prop',
  'Main Event',
  300,
  25,
  0.5,
  'Won',
  75,
  (SELECT id FROM sportsbooks WHERE name = 'DraftKings' LIMIT 1),
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '8 days';

-- Bet 9: NCAAF Spread - PENDING
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status,
  book_id, event_date, placed_at, notes
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  'Alabama -14',
  'NCAAF',
  'SEC',
  'Spread',
  'Alabama',
  -110,
  55,
  1.1,
  'Pending',
  (SELECT id FROM sportsbooks WHERE name = 'FanDuel' LIMIT 1),
  NOW() + INTERVAL '5 days',
  NOW(),
  'Weekend college game';

-- Bet 10: Parlay - WON
INSERT INTO bets (
  user_id, bet_name, sport, league, market_type, team_or_player,
  odds_american, stake, units, status, result_profit,
  book_id, event_date, placed_at, notes
)
SELECT
  'YOUR_USER_ID_HERE'::uuid,
  '3-Team NFL Parlay',
  'NFL',
  'NFL',
  'Parlay',
  'Chiefs/Bills/49ers',
  600,
  50,
  1,
  'Won',
  300,
  (SELECT id FROM sportsbooks WHERE name = 'BetMGM' LIMIT 1),
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '11 days',
  'All three teams covered';

-- Insert bet tags
INSERT INTO bet_tags (user_id, name)
VALUES
  ('YOUR_USER_ID_HERE'::uuid, 'High Confidence'),
  ('YOUR_USER_ID_HERE'::uuid, 'Live Bet'),
  ('YOUR_USER_ID_HERE'::uuid, 'Underdog'),
  ('YOUR_USER_ID_HERE'::uuid, 'Home Team'),
  ('YOUR_USER_ID_HERE'::uuid, 'Divisional Game')
ON CONFLICT (user_id, name) DO NOTHING;

-- Insert bankroll snapshots
INSERT INTO bankroll_snapshots (user_id, amount, snapshot_date)
VALUES
  ('YOUR_USER_ID_HERE'::uuid, 1000, NOW() - INTERVAL '30 days'),
  ('YOUR_USER_ID_HERE'::uuid, 1195, NOW() - INTERVAL '15 days'),
  ('YOUR_USER_ID_HERE'::uuid, 1620, NOW());

-- Summary of sample data:
-- 10 bets total
-- 5 Won: +$725
-- 2 Lost: -$105
-- 1 Push: $0
-- 2 Pending
-- Net P&L: +$620
-- Win rate: 71.4% (5/7 settled)
-- ROI: 78.5% ($620 / $790 staked)
