claude.md — React Betting Tracker (web & mobile)

Goal: Build a modern, responsive React application to track sports bets (wins/losses, PnL, units, ROI%), with authentication and either (a) read-only connections/imports from sportsbooks or (b) manual entry + CSV import. Ship a clean, mobile-first UI with fast interactions and reliable data persistence.

0) Deliverables

Production-ready web app (mobile + desktop) with authentication

Core CRUD for bets, bankroll, and books

Analytics: units up/down, PnL, ROI%, hit rate, average odds, CLV, bankroll curve

CSV import/export

Optional “connections” via CSV/email-parsing gateway for supported books (fallback to manual)

Deployed to Vercel (or Netlify) with a managed Postgres (Supabase)

Test coverage for critical flows (auth, add bet, compute metrics)

1) Tech Stack

Frontend: React + Vite + TypeScript

UI: Tailwind CSS + shadcn/ui + Lucide icons

State & data: TanStack Query (server cache) + Zod for schema validation

Auth & DB: Supabase (Auth + Postgres + RLS)

APIs: Supabase Edge Functions (Deno) for CSV/email parsing & sportsbook import adapters

Charts: Recharts

Testing: Vitest + React Testing Library + Playwright (smoke E2E)

Deployment: Vercel (frontend) + Supabase (backend)

Analytics/Logging: PostHog (optional), Sentry (optional)

Rationale: Fast DX, first-class auth, SQL for analytics, easy RLS, and a fully serverless deployment path.

2) Core Features & Requirements
2.1 Authentication & Accounts

Email/password and OAuth (Google, Apple) via Supabase Auth.

Magic link optional.

Post-signup onboarding to set base unit size (e.g., $50) and default sportsbook.

RLS policies to isolate user data: user_id = auth.uid() on all user-owned tables.

2.2 Bet Entry (Manual)

Fields (all validated):

bet_name (string)

sport (enum: NFL/NBA/MLB/NHL/NCAAF/NCAAB/Soccer/MMA/Other)

league (string, optional)

market_type (enum: ML, Spread, Total, Prop, Parlay, Future, Other)

team_or_player (string)

odds (American; store canonical decimal as well)

stake (number, currency)

units (computed: stake / settings.base_unit; allow override)

book (FK to sportsbooks table)

status (enum: Pending, Won, Lost, Push, Void, Cashout)

result_amount (derived: see §3 formulas; persisted after settlement)

event_date (datetime, timezone aware)

placed_at (datetime)

notes (text)

tags (array; relation via join table)

parlay_group_id (nullable, to group legs)

2.3 Imports / “Connections”

CSV import (MVP): Map headers from DraftKings/FD/MGM CSV to internal schema. Preview mapping UI, dry-run validation, then commit.

Email parse (optional): Edge Function with provider-specific parsers for confirmation emails (Gmail API user token required). Store sanitized payload.

API adapters (future): If/when official read APIs exist, add OAuth adapters. For now, explicitly do not scrape.

2.4 Analytics Dashboard

Cards + charts:

Total PnL ($)

Units up/down

ROI %

Hit rate %

Average odds (American & implied %)

Closing Line Value (CLV) avg (optional field on bet: closing_odds)

Bankroll over time (line chart; includes deposits/withdrawals via bankroll_snapshots)

Performance by book / sport / market / tag (bar charts + tables)

Recent bets (timeline)

2.5 Filtering & Search

Multi-filter by date range, sport, book, market, status, tags.

Quick search by team/player.

2.6 Settings & Bankroll

Set base unit (required)

Set default book, default stake (optional)

Manage bankroll_snapshots (manual add; also auto-update on won/lost if configured)

Currency: USD only (MVP), prepare for i18n later.

2.7 Export/Share

Export CSV (filtered or all)

Copy/share summary (PnL, ROI, units) for given range

2.8 Accessibility & Responsiveness

Mobile-first, keyboard nav, aria labels, color-contrast compliant, prefers-reduced-motion aware.

3) Calculations (Authoritative)

Decimal odds from American odds A:

If A > 0: decimal = 1 + (A / 100)

If A < 0: decimal = 1 + (100 / |A|)

Implied probability: 1 / decimal

Profit for a single bet:

If Won: profit = stake * (decimal - 1)

If Lost: profit = -stake

If Push/Void: profit = 0

If Cashout: profit = cashout_amount - stake (requires field)

Units: units = stake / base_unit

Total PnL: Σ profit

Total Staked: Σ stake (for settled bets, exclude void?)

ROI %: (Total PnL / Total Staked) * 100

Hit rate %: wins / (wins + losses) (exclude push/void)

Parlay: either store as a single bet with combined odds, or legs + group id. If legs, compute parlay decimal = product(legs.decimal), payout based on total stake.

Ensure all computed values are re-derived on the fly in queries and cached.

4) Information Architecture & Routes

/ → Dashboard (KPIs, charts, recent bets)

/bets → Table w/ filters; bulk edit; csv import/export

/bets/new → Create bet form (wizard for parlay)

/bets/:id → Detail view (edit, settle, add closing odds)

/bankroll → Bankroll snapshots & chart

/settings → Profile, base unit, default book, API/CSV connections, danger zone (delete account)

/auth/* → Sign in / Sign up / Reset

5) Database Schema (Supabase SQL)
-- users are in auth schema; use a public profile table if needed
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_unit numeric not null check (base_unit > 0),
  default_book_id uuid null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);


create table if not exists public.sportsbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade, -- allow global (null) and user custom
  name text not null,
  created_at timestamptz default now()
);


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
  implied_prob numeric generated always as (1 / odds_decimal) stored,
  stake numeric not null check (stake >= 0),
  units numeric not null,
  status text not null check (status in ('Pending','Won','Lost','Push','Void','Cashout')),
  result_profit numeric null, -- set when settled
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


create table if not exists public.bet_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null
);


create table if not exists public.bet_tag_joins (
  bet_id uuid references public.bets(id) on delete cascade,
  tag_id uuid references public.bet_tags(id) on delete cascade,
  primary key (bet_id, tag_id)
);
6) API Surface (Supabase + Edge Functions)

Client uses Supabase JS for CRUD; Edge Functions for heavy lifting.

Tables (RPC-like patterns)

Insert bet: validate with Zod, compute units, default status = Pending.

Settle bet: update status + result_profit (use §3 formulas). Option to auto-create bankroll snapshot.

CSV import: upload to Supabase Storage → Edge Function parses and upserts bets.

Edge Functions

import/csv-parse: Accept CSV, detect provider, map headers, return preview & errors, commit on confirm.

connections/email-webhook (optional): Parse bet confirmations (provider-specific); store sanitized result.

7) UI/UX Spec
Components (shadcn/ui)

NavBar (avatar, range picker, Add Bet)

KPI Cards (PnL, Units, ROI, Hit Rate)

BetTable (virtualized, sticky actions)

BetForm (wizard for Parlay)

FiltersBar (multi-selects, search)

BankrollChart (Recharts line)

BreakdownCharts (by sport/book/market)

ImportModal (CSV mapping preview)

Toast/Dialogs for errors/confirmations

Design

Clean, minimal, plenty of white space

12–14px on small, 16px+ body on desktop; xl headings

Motion via Framer Motion (reduced for prefers-reduced-motion)

Dark mode ready (MVP: light)

Responsive Behavior

Mobile: single-column dashboard, condensed table cards

Desktop: 2–3 column grid, full table with pinned filters

8) Pages & Acceptance Criteria
Dashboard

Shows KPIs for selected date range; numbers match SQL aggregation

Bankroll chart renders for last 90 days by default

Bets List

Filter & search working; pagination/virtualization OK

Inline edit status; bulk settle; export filtered CSV

Add/Edit Bet

Client-side validation; computed fields preview (units, implied prob)

Parlay wizard supports 2–10 legs; shows combined odds and payout

Settings

Base unit update persists and re-computes display units

Manage books; add custom book names

CSV import with preview and mapping

9) Implementation Steps

Scaffold Vite + TS + Tailwind + shadcn/ui; install Supabase, TanStack Query, Zod, Recharts, Framer Motion.

Auth: Supabase Auth UI or custom forms; protect routes.

DB: Apply schema + RLS; seed global sportsbooks (DraftKings, FanDuel, BetMGM, etc.).

Settings: Onboarding for base unit; settings page.

Bets CRUD: Form + list + detail; settlement logic + derived fields.

Analytics: Aggregation queries + KPI cards; bankroll & breakdown charts.

CSV Import: Storage upload → Edge Function parse → preview → upsert.

Testing: Unit tests for formulas; component tests for form/list; E2E smoke (auth + add bet + KPI updates).

Polish: Animations, a11y, empty states, error toasts.

Deploy: Vercel + env vars; Supabase project; DNS if custom domain.

10) Environment Variables (.env example)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
# Optional
VITE_POSTHOG_KEY=...
VITE_SENTRY_DSN=...
11) Sample Types & Utility
// odds.ts
export function americanToDecimal(a: number): number {
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}
export function impliedProbFromAmerican(a: number): number {
  return 1 / americanToDecimal(a);
}
export function profit(oddsAmerican: number, stake: number, status: 'Won'|'Lost'|'Push'|'Void'|'Cashout', cashoutAmount?: number) {
  const dec = americanToDecimal(oddsAmerican);
  if (status === 'Won') return stake * (dec - 1);
  if (status === 'Lost') return -stake;
  if (status === 'Push' || status === 'Void') return 0;
  if (status === 'Cashout') return (cashoutAmount ?? 0) - stake;
  return 0;
}
12) Example CSV Mapping

Input (DraftKings-like)

Event,Market,Selection,Odds,Stake,ToWin,Placed,Result
BUF vs MIA,Moneyline,Bills,-125,125,100,2025-10-01 13:22,Won

Mapped

bet_name: Bills ML vs MIA
market_type: ML
team_or_player: Bills
odds_american: -125
stake: 125
status: Won
placed_at: 2025-10-01T13:22:00Z
13) Testing Matrix

Auth: sign up/in/out, protected routes redirect

Add bet: valid/invalid odds, negative stake blocked

Settle bet: statuses compute correct result_profit

KPIs: ROI, units, PnL accuracy with fixture dataset

CSV: bad headers/error rows surfaced; dry-run vs commit

RLS: user A cannot read user B rows

A11y: tab order, aria labels, color contrast

14) Security & Privacy

RLS on all tables; no public buckets for PII

Input validation with Zod on client and server (Edge Functions)

Rate-limit Edge Functions; log suspicious activity

Avoid storing email bodies; if parsing, only persist normalized bet info

15) Nice-to-haves (Post-MVP)

Kelly / staking strategy helper

CLV auto-calc (via odds API for closing numbers)

Futures tracker (hold period, partial cashouts)

Live hedging planner (link bets as “hedge-of”)

Widgets: “Last 7/30 days” share card

iOS/Android wrapper via Capacitor

16) Acceptance Checklist




17) Developer Notes for Claude

Prefer functional components, hooks, and composition; no heavy global state

Encapsulate Supabase queries in /lib/db with typed helpers

Use Zod schemas in both form validation and server parsing

Keep colors/tokens in Tailwind config; use shadcn primitives for consistency

Write utility unit tests early (odds, profit, ROI)

18) Project Structure
track-my-bets/
  src/
    components/
      kpis/
      bets/
      charts/
      ui/ (shadcn)
    pages/
      dashboard/
      bets/
      settings/
      auth/
    lib/
      supabase.ts
      odds.ts
      queries.ts
    features/
      import/
      bankroll/
    styles/
    app.tsx
    main.tsx
  supabase/
    schema.sql
    functions/
      import-csv/index.ts
  tests/
    unit/
    e2e/
  .env.example
19) Deployment Steps (Vercel + Supabase)

Create Supabase project → run schema.sql → enable RLS & policies.

Set Auth providers (Google/Apple) if desired.

Create Storage bucket imports (private).

Deploy Edge Function import-csv with required permissions.

Vercel: import Git repo → set env VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.

Configure domain, redirects, and caching headers.

20) Copy Blocks (UI)

Empty state: “No bets yet. Add your first bet or import a CSV.”

Import help: “We don’t scrape sportsbooks. Use CSV exports or email confirmations where supported.”

Disclaimer: “For personal record-keeping only. Not financial advice.”

End of claude.md