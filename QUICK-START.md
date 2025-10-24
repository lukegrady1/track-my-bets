# Quick Start - Switch to Real Database

Your app is now configured to use Supabase! Follow these steps:

## ✅ What I Just Fixed

1. **Updated `.env`** - Fixed the Supabase URL (was pointing to dashboard, now points to API)
2. **Disabled mock data** - Changed `USE_MOCK_DATA = false` in [src/lib/queries.ts](src/lib/queries.ts:11)

## 📋 Next Steps

### Step 1: Set Up Database Tables

Go to your Supabase project: https://supabase.com/dashboard/project/hvaomrpzpvqbfyugnmqr

Click **SQL Editor** → **New Query**, then run these scripts **in order**:

#### Query 1: Create Tables
Copy and paste **ALL** of [supabase/schema.sql](supabase/schema.sql)
- Click **Run** or press Ctrl+Enter
- Wait for "Success. No rows returned"

#### Query 2: Add Sample Data
Copy and paste **ALL** of [supabase/seed-with-demo-user.sql](supabase/seed-with-demo-user.sql)
- Click **Run**
- You should see: "SETUP COMPLETE! Total P&L: +$620"

### Step 2: Restart Your Dev Server

Stop your current dev server (Ctrl+C) and restart:

```bash
npm run dev
```

### Step 3: Open the App

Go to http://localhost:5173

You should now see **REAL DATA from Supabase**:
- ✅ 10 sample bets
- ✅ P&L: +$620
- ✅ Win Rate: 71.4%
- ✅ ROI: 78.5%

## 🧪 Test It Works

1. **Add a new bet** - Click "Add Bet", fill the form, submit
2. **Refresh the page** - The bet should still be there (it's in the database!)
3. **Check Supabase** - Go to Table Editor → `bets` → you'll see your bet

## ❌ Troubleshooting

### "No data showing" or "Loading forever"

**Check 1: Database tables exist**
- Go to Supabase → Table Editor
- You should see: `bets`, `user_settings`, `sportsbooks`, etc.
- If not, run [supabase/schema.sql](supabase/schema.sql)

**Check 2: Demo user exists**
- Go to Supabase → SQL Editor
- Run: `SELECT id, email FROM auth.users;`
- You should see: `demo@trackmybets.com`
- If not, run [supabase/seed-with-demo-user.sql](supabase/seed-with-demo-user.sql)

**Check 3: Check browser console**
- Press F12 → Console tab
- Look for errors (red text)
- Common error: "Failed to fetch" = database URL wrong

### "Failed to fetch" errors

Your Supabase project might not be running. Check:
1. Go to https://supabase.com/dashboard/project/hvaomrpzpvqbfyugnmqr
2. Look for "Project paused" or "Resuming..."
3. Click "Resume project" if needed
4. Wait 1-2 minutes for it to start

### Still showing mock data?

1. Check [src/lib/queries.ts](src/lib/queries.ts:11) says `const USE_MOCK_DATA = false;`
2. Restart dev server (Ctrl+C, then `npm run dev`)
3. Hard refresh browser (Ctrl+Shift+R)

## 🔙 Go Back to Mock Data

If you want to go back to mock data:

Edit [src/lib/queries.ts](src/lib/queries.ts:11):
```typescript
const USE_MOCK_DATA = true;  // Changed back to true
```

Restart server.

## ✨ What's Different Now?

| Before (Mock) | After (Supabase) |
|---------------|------------------|
| Data resets on refresh | Data persists |
| In-memory only | Real database |
| No authentication needed | Uses demo user |
| Can't share data | Data is in cloud |
| Fast but temporary | Permanent storage |

## 📊 Your Supabase Project Info

- **Project ID**: hvaomrpzpvqbfyugnmqr
- **Region**: Automatically selected
- **Database**: PostgreSQL 15
- **API URL**: https://hvaomrpzpvqbfyugnmqr.supabase.co
- **Demo User ID**: a1b2c3d4-e5f6-7890-1234-567890abcdef
- **Demo Email**: demo@trackmybets.com

## 🎯 Verify Everything Works

Run through this checklist:

- [ ] Database tables created (run schema.sql)
- [ ] Sample data inserted (run seed-with-demo-user.sql)
- [ ] Dev server restarted
- [ ] Dashboard loads with data
- [ ] Can add a new bet
- [ ] New bet persists after page refresh
- [ ] Can edit/delete bets
- [ ] Can update settings

If all checkboxes pass, you're good to go! 🎉

## 📞 Need Help?

Common issues and solutions are in [SUPABASE-SETUP.md](SUPABASE-SETUP.md)
