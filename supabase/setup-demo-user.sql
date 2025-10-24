-- Setup Demo User for Track My Bets (No Authentication Required)
-- This script creates a demo user directly in the auth.users table
-- Use this when running the app without authentication enabled

-- WARNING: This bypasses normal Supabase Auth and should only be used for development/testing

-- Create a demo user in the auth schema
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
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
  'demo-user-123-456-789'::uuid,  -- Fixed UUID for demo user
  'authenticated',
  'authenticated',
  'demo@trackmybets.com',
  '$2a$10$dummyhashedpasswordthatdoesntmatterfornow',  -- Dummy password hash
  NOW(),
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
) ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, email, created_at
FROM auth.users
WHERE id = 'demo-user-123-456-789'::uuid;

-- Note: The demo user ID is: demo-user-123-456-789
-- Use this ID in the seed scripts
