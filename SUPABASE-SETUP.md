# Supabase Setup Guide (No Authentication Required)

Since you have authentication disabled, follow these steps to set up Supabase with a demo user.

## Step-by-Step Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project
4. Wait for it to finish setting up (~2 minutes)

### 2. Get Your Credentials
1. In your Supabase project, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string)

### 3. Create `.env` File
Create a `.env` file in the root of your project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Setup Scripts

Go to **SQL Editor** in Supabase and run these scripts **in order**:

#### Script 1: Create Tables
Copy and paste all of [supabase/schema.sql](supabase/schema.sql)
- Click "Run"
- This creates all tables, indexes, and RLS policies

#### Script 2: Add Sample Data with Demo User
Copy and paste all of [supabase/seed-with-demo-user.sql](supabase/seed-with-demo-user.sql)
- Click "Run"
- This creates:
  - A demo user (no password needed!)
  - 10 sample bets
  - 5 bet tags
  - 3 bankroll snapshots
  - User settings

You should see output like:
```
Demo user created with ID: a1b2c3d4-e5f6-7890-1234-567890abcdef
User settings configured
Sample bets inserted
...
SETUP COMPLETE!
Total P&L: +$620
Win Rate: 71.4%
```

### 5. Enable Supabase in Your App

Edit [src/lib/queries.ts](src/lib/queries.ts):

**Line 10** - Change from:
```typescript
const USE_MOCK_DATA = true;
```

To:
```typescript
const USE_MOCK_DATA = false;
```

### 6. Restart Your Dev Server

```bash
npm run dev
```

### 7. Open the App

Go to http://localhost:5173

You should now see:
- Real data from Supabase database
- 10 sample bets
- Calculated KPIs: +$620 P&L, 71.4% win rate, 78.5% ROI
- All CRUD operations persist to the database

## Demo User Details

The seed script creates this user:
- **ID**: `a1b2c3d4-e5f6-7890-1234-567890abcdef`
- **Email**: `demo@trackmybets.com`
- **Password**: Not needed (auth is disabled)

This is the same user ID used in mock data, so switching between mock and real data is seamless.

## Verify It's Working

1. **Dashboard loads with data** ✅
2. **Add a new bet** - it should persist after page refresh ✅
3. **Edit/delete a bet** - changes should persist ✅
4. **Check Supabase Table Editor** - you should see your data in the `bets` table ✅

## Troubleshooting

### "No data showing"
- Check that `USE_MOCK_DATA = false` in [src/lib/queries.ts](src/lib/queries.ts:10)
- Verify your `.env` file has the correct credentials
- Restart the dev server after changing .env

### "RLS policy violation"
- Make sure you ran [supabase/schema.sql](supabase/schema.sql) completely
- The RLS policies should allow the demo user to access their data

### "Can't add new bets"
- Check browser console for errors
- Verify the demo user exists in Supabase Table Editor → `auth.users`

## Sample Data Summary

The seed script creates:

| Bet | Sport | Status | Profit |
|-----|-------|--------|--------|
| Chiefs ML | NFL | Won | +$100 |
| Lakers -5.5 | NBA | Lost | -$55 |
| Yankees ML | MLB | Won | +$150 |
| Cowboys +3 | NFL | Pending | - |
| Over 220.5 | NBA | Push | $0 |
| Bruins ML | NHL | Won | +$100 |
| Under 2.5 | Soccer | Lost | -$50 |
| KO Round 1 | MMA | Won | +$75 |
| Alabama -14 | NCAAF | Pending | - |
| 3-Team Parlay | NFL | Won | +$300 |

**Total**: +$620 profit, 71.4% win rate, 78.5% ROI

## Re-enabling Authentication Later

When you want to enable authentication:

1. **Uncomment auth code** in [src/App.tsx](src/App.tsx:18-66)
2. **Restart the app**
3. **Sign up** creates a real user via Supabase Auth
4. **Sign in** required to access the app

The demo user will still exist in the database and can be deleted from Supabase Table Editor if needed.

## Alternative: Manual Setup

If you prefer to use your own user ID instead of the demo user:

1. Uncomment authentication in [src/App.tsx](src/App.tsx)
2. Sign up in the app
3. Get your user ID from Supabase SQL Editor:
   ```sql
   SELECT id, email FROM auth.users;
   ```
4. Use [supabase/seed-manual.sql](supabase/seed-manual.sql) and replace `YOUR_USER_ID_HERE` with your actual ID
5. Run the modified script

---

**You're all set!** Your app is now connected to a real Supabase database with sample data.
