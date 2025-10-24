-- Track My Bets Database Schema
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Settings Table
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_unit numeric not null check (base_unit > 0),
  default_book_id uuid null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Sportsbooks Table
create table if not exists public.sportsbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Bets Table
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bet_name text not null,
  sport text not null,
  league text,
  market_type text not null,
  team_or_player text,
  odds_american int not null,
  odds_decimal numeric generated always as (
    case when odds_american > 0 then 1 + (odds_american::numeric / 100)
         when odds_american < 0 then 1 + (100 / abs(odds_american::numeric))
         else null end
  ) stored,
  implied_prob numeric generated always as (
    case
      when odds_american > 0 then 1 / (1 + (odds_american::numeric / 100))
      when odds_american < 0 then 1 / (1 + (100 / abs(odds_american::numeric)))
      else null
    end
  ) stored,
  stake numeric not null check (stake >= 0),
  units numeric not null,
  status text not null check (status in ('Pending','Won','Lost','Push','Void','Cashout')),
  result_profit numeric null,
  cashout_amount numeric null,
  book_id uuid references public.sportsbooks(id),
  event_date timestamptz,
  placed_at timestamptz default now(),
  closing_odds_american int null,
  notes text,
  parlay_group_id uuid null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bet Tags Table
create table if not exists public.bet_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unique(user_id, name)
);

-- Bet Tag Joins Table (Many-to-Many)
create table if not exists public.bet_tag_joins (
  bet_id uuid references public.bets(id) on delete cascade,
  tag_id uuid references public.bet_tags(id) on delete cascade,
  primary key (bet_id, tag_id)
);

-- Bankroll Snapshots Table (for tracking bankroll over time)
create table if not exists public.bankroll_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  snapshot_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_bets_user_id on public.bets(user_id);
create index if not exists idx_bets_placed_at on public.bets(placed_at);
create index if not exists idx_bets_status on public.bets(status);
create index if not exists idx_bets_sport on public.bets(sport);
create index if not exists idx_bets_book_id on public.bets(book_id);
create index if not exists idx_sportsbooks_user_id on public.sportsbooks(user_id);
create index if not exists idx_bet_tags_user_id on public.bet_tags(user_id);
create index if not exists idx_bankroll_snapshots_user_id on public.bankroll_snapshots(user_id);
create index if not exists idx_bankroll_snapshots_date on public.bankroll_snapshots(snapshot_date);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.user_settings enable row level security;
alter table public.sportsbooks enable row level security;
alter table public.bets enable row level security;
alter table public.bet_tags enable row level security;
alter table public.bet_tag_joins enable row level security;
alter table public.bankroll_snapshots enable row level security;

-- User Settings Policies
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Sportsbooks Policies
create policy "Users can view global and own sportsbooks"
  on public.sportsbooks for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can insert own sportsbooks"
  on public.sportsbooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sportsbooks"
  on public.sportsbooks for update
  using (auth.uid() = user_id);

create policy "Users can delete own sportsbooks"
  on public.sportsbooks for delete
  using (auth.uid() = user_id);

-- Bets Policies
create policy "Users can view own bets"
  on public.bets for select
  using (auth.uid() = user_id);

create policy "Users can insert own bets"
  on public.bets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bets"
  on public.bets for update
  using (auth.uid() = user_id);

create policy "Users can delete own bets"
  on public.bets for delete
  using (auth.uid() = user_id);

-- Bet Tags Policies
create policy "Users can view own tags"
  on public.bet_tags for select
  using (auth.uid() = user_id);

create policy "Users can insert own tags"
  on public.bet_tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tags"
  on public.bet_tags for update
  using (auth.uid() = user_id);

create policy "Users can delete own tags"
  on public.bet_tags for delete
  using (auth.uid() = user_id);

-- Bet Tag Joins Policies
create policy "Users can view own bet tag joins"
  on public.bet_tag_joins for select
  using (exists (
    select 1 from public.bets
    where bets.id = bet_tag_joins.bet_id
    and bets.user_id = auth.uid()
  ));

create policy "Users can insert own bet tag joins"
  on public.bet_tag_joins for insert
  with check (exists (
    select 1 from public.bets
    where bets.id = bet_tag_joins.bet_id
    and bets.user_id = auth.uid()
  ));

create policy "Users can delete own bet tag joins"
  on public.bet_tag_joins for delete
  using (exists (
    select 1 from public.bets
    where bets.id = bet_tag_joins.bet_id
    and bets.user_id = auth.uid()
  ));

-- Bankroll Snapshots Policies
create policy "Users can view own bankroll snapshots"
  on public.bankroll_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert own bankroll snapshots"
  on public.bankroll_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bankroll snapshots"
  on public.bankroll_snapshots for delete
  using (auth.uid() = user_id);

-- Seed global sportsbooks
insert into public.sportsbooks (user_id, name) values
  (null, 'DraftKings'),
  (null, 'FanDuel'),
  (null, 'BetMGM'),
  (null, 'Caesars'),
  (null, 'BetRivers'),
  (null, 'PointsBet'),
  (null, 'Barstool'),
  (null, 'Unibet'),
  (null, 'WynnBET'),
  (null, 'Hard Rock Bet')
on conflict do nothing;

-- Function to automatically update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for bets table
create trigger update_bets_updated_at before update on public.bets
  for each row execute function public.update_updated_at_column();

-- Trigger for user_settings table
create trigger update_user_settings_updated_at before update on public.user_settings
  for each row execute function public.update_updated_at_column();
