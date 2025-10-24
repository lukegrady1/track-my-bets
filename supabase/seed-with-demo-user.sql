-- Complete Setup: Demo User + Sample Data
-- Run this script to set up everything you need without authentication

-- This uses a fixed demo user ID, so you don't need to sign up first

-- DEMO USER ID (hardcoded for convenience)
DO $$
DECLARE
  demo_user_id uuid := 'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid;
  draftkings_id uuid;
  fanduel_id uuid;
  betmgm_id uuid;
  caesars_id uuid;
  betrivers_id uuid;
BEGIN
  -- Step 1: Create demo user in auth.users (if it doesn't exist)
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      demo_user_id,
      'authenticated',
      'authenticated',
      'demo@trackmybets.com',
      '$2a$10$dummyhashedpasswordnotused',
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    RAISE NOTICE 'Demo user created with ID: %', demo_user_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Demo user already exists with ID: %', demo_user_id;
  END;

  -- Get sportsbook IDs
  SELECT id INTO draftkings_id FROM sportsbooks WHERE name = 'DraftKings' AND user_id IS NULL LIMIT 1;
  SELECT id INTO fanduel_id FROM sportsbooks WHERE name = 'FanDuel' AND user_id IS NULL LIMIT 1;
  SELECT id INTO betmgm_id FROM sportsbooks WHERE name = 'BetMGM' AND user_id IS NULL LIMIT 1;
  SELECT id INTO caesars_id FROM sportsbooks WHERE name = 'Caesars' AND user_id IS NULL LIMIT 1;
  SELECT id INTO betrivers_id FROM sportsbooks WHERE name = 'BetRivers' AND user_id IS NULL LIMIT 1;

  -- Step 2: Insert user settings
  INSERT INTO user_settings (user_id, base_unit, default_book_id)
  VALUES (demo_user_id, 50, draftkings_id)
  ON CONFLICT (user_id) DO UPDATE SET
    base_unit = 50,
    default_book_id = draftkings_id;

  RAISE NOTICE 'User settings configured';

  -- Step 3: Clear any existing bets for demo user (optional - remove if you want to keep existing data)
  -- DELETE FROM bets WHERE user_id = demo_user_id;
  -- RAISE NOTICE 'Existing bets cleared';

  -- Step 4: Insert sample bets

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
    -110, 110, 2.2, 'Won', 100,
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
    'NBA', 'NBA', 'Spread', 'Los Angeles Lakers',
    -110, 55, 1.1, 'Lost', -55,
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
    'MLB', 'MLB', 'ML', 'New York Yankees',
    150, 100, 2, 'Won', 150,
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
    'NFL', 'NFL', 'Spread', 'Dallas Cowboys',
    -110, 110, 2.2, 'Pending',
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
    'NBA', 'NBA', 'Total', 'Celtics vs Heat',
    -105, 52.5, 1.05, 'Push', 0,
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
    'NHL', 'NHL', 'ML', 'Boston Bruins',
    -125, 125, 2.5, 'Won', 100,
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
    'Soccer', 'Premier League', 'Total', 'Man City vs Arsenal',
    110, 50, 1, 'Lost', -50,
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
    'MMA', 'UFC', 'Prop', 'Main Event',
    300, 25, 0.5, 'Won', 75,
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
    'NCAAF', 'SEC', 'Spread', 'Alabama',
    -110, 55, 1.1, 'Pending',
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
    'NFL', 'NFL', 'Parlay', 'Chiefs/Bills/49ers',
    600, 50, 1, 'Won', 300,
    betmgm_id,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '11 days',
    'All three teams covered'
  );

  RAISE NOTICE 'Sample bets inserted';

  -- Step 5: Insert bet tags
  INSERT INTO bet_tags (user_id, name)
  VALUES
    (demo_user_id, 'High Confidence'),
    (demo_user_id, 'Live Bet'),
    (demo_user_id, 'Underdog'),
    (demo_user_id, 'Home Team'),
    (demo_user_id, 'Divisional Game')
  ON CONFLICT (user_id, name) DO NOTHING;

  RAISE NOTICE 'Bet tags created';

  -- Step 6: Insert bankroll snapshots
  INSERT INTO bankroll_snapshots (user_id, amount, snapshot_date)
  VALUES
    (demo_user_id, 1000, NOW() - INTERVAL '30 days'),
    (demo_user_id, 1195, NOW() - INTERVAL '15 days'),
    (demo_user_id, 1620, NOW());

  RAISE NOTICE 'Bankroll snapshots created';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Demo User ID: %', demo_user_id;
  RAISE NOTICE 'Email: demo@trackmybets.com';
  RAISE NOTICE 'Sample Data: 10 bets, 5 tags, 3 snapshots';
  RAISE NOTICE 'Total P&L: +$620';
  RAISE NOTICE 'Win Rate: 71.4%% (5/7)';
  RAISE NOTICE 'ROI: 78.5%%';
  RAISE NOTICE '═══════════════════════════════════════';

END $$;
