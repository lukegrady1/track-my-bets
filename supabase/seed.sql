-- Seed data for Track My Bets
-- Run this after running schema.sql to populate your database with sample data

-- Note: Replace 'YOUR_USER_ID_HERE' with your actual Supabase auth user ID
-- You can get this by signing up in the app, then running:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- For this example, we'll use a placeholder. Update it with your real user ID.
DO $$
DECLARE
  demo_user_id uuid;
  draftkings_id uuid;
  fanduel_id uuid;
  betmgm_id uuid;
  caesars_id uuid;
  betrivers_id uuid;
BEGIN
  -- Get or create a demo user (you should replace this with your actual user ID)
  -- This is just for demonstration - in production, users are created via Supabase Auth

  -- IMPORTANT: Replace this with your actual user ID from auth.users
  -- demo_user_id := 'YOUR_USER_ID_HERE'::uuid;

  -- For now, let's assume you have a user. Get the first user from auth.users
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No user found. Please sign up first, then run this script.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using user ID: %', demo_user_id;

  -- Get sportsbook IDs
  SELECT id INTO draftkings_id FROM sportsbooks WHERE name = 'DraftKings' AND user_id IS NULL LIMIT 1;
  SELECT id INTO fanduel_id FROM sportsbooks WHERE name = 'FanDuel' AND user_id IS NULL LIMIT 1;
  SELECT id INTO betmgm_id FROM sportsbooks WHERE name = 'BetMGM' AND user_id IS NULL LIMIT 1;
  SELECT id INTO caesars_id FROM sportsbooks WHERE name = 'Caesars' AND user_id IS NULL LIMIT 1;
  SELECT id INTO betrivers_id FROM sportsbooks WHERE name = 'BetRivers' AND user_id IS NULL LIMIT 1;

  -- Insert user settings if they don't exist
  INSERT INTO user_settings (user_id, base_unit, default_book_id)
  VALUES (demo_user_id, 50, draftkings_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert sample bets

  -- Bet 1: Chiefs ML - WON
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at, notes
  ) VALUES (
    demo_user_id,
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
    draftkings_id,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days',
    'Strong play, Chiefs at home'
  );

  -- Bet 2: Lakers Spread - LOST
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at
  ) VALUES (
    demo_user_id,
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
    fanduel_id,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '3 days'
  );

  -- Bet 3: Yankees ML - WON
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at
  ) VALUES (
    demo_user_id,
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
    draftkings_id,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '5 days'
  );

  -- Bet 4: Cowboys Spread - PENDING
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status,
    book_id, event_date, placed_at, notes
  ) VALUES (
    demo_user_id,
    'Cowboys +3',
    'NFL',
    'NFL',
    'Spread',
    'Dallas Cowboys',
    -110,
    110,
    2.2,
    'Pending',
    betmgm_id,
    NOW() + INTERVAL '2 days',
    NOW(),
    'Sunday game'
  );

  -- Bet 5: NBA Total - PUSH
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at
  ) VALUES (
    demo_user_id,
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
    fanduel_id,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '1 day'
  );

  -- Bet 6: NHL ML - WON
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at
  ) VALUES (
    demo_user_id,
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
    caesars_id,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days'
  );

  -- Bet 7: Soccer Total - LOST
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at, notes
  ) VALUES (
    demo_user_id,
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
    betrivers_id,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '6 days',
    'High-scoring game'
  );

  -- Bet 8: MMA Prop - WON
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at
  ) VALUES (
    demo_user_id,
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
    draftkings_id,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '8 days'
  );

  -- Bet 9: NCAAF Spread - PENDING
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status,
    book_id, event_date, placed_at, notes
  ) VALUES (
    demo_user_id,
    'Alabama -14',
    'NCAAF',
    'SEC',
    'Spread',
    'Alabama',
    -110,
    55,
    1.1,
    'Pending',
    fanduel_id,
    NOW() + INTERVAL '5 days',
    NOW(),
    'Weekend college game'
  );

  -- Bet 10: Parlay - WON
  INSERT INTO bets (
    user_id, bet_name, sport, league, market_type, team_or_player,
    odds_american, stake, units, status, result_profit,
    book_id, event_date, placed_at, notes
  ) VALUES (
    demo_user_id,
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
    betmgm_id,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '11 days',
    'All three teams covered'
  );

  -- Insert some bet tags
  INSERT INTO bet_tags (user_id, name)
  VALUES
    (demo_user_id, 'High Confidence'),
    (demo_user_id, 'Live Bet'),
    (demo_user_id, 'Underdog'),
    (demo_user_id, 'Home Team'),
    (demo_user_id, 'Divisional Game')
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Insert a bankroll snapshot (starting bankroll)
  INSERT INTO bankroll_snapshots (user_id, amount, snapshot_date)
  VALUES
    (demo_user_id, 1000, NOW() - INTERVAL '30 days'),
    (demo_user_id, 1195, NOW() - INTERVAL '15 days'),
    (demo_user_id, 1620, NOW());

  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'Total P&L from sample bets: $620 (Won: $725, Lost: $105)';
  RAISE NOTICE 'Win rate: 5/7 settled bets = 71.4%%';

END $$;
