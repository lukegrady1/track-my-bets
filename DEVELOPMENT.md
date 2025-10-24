# Development Mode Setup

The application is currently configured to run **without Supabase** for local development.

## Current Configuration

### Authentication: DISABLED ✅
- No login required
- Direct access to all pages
- Mock user data automatically provided

### Database: MOCK DATA ✅
- Using in-memory mock data (no Supabase needed)
- Pre-populated with 5 sample bets
- Changes persist during session (resets on page reload)

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Start the dev server**:
```bash
npm run dev
```

3. **Open your browser**:
```
http://localhost:5173
```

You'll be taken directly to the dashboard with sample data!

## Features Available in Dev Mode

✅ View dashboard with KPIs (P&L, ROI, Hit Rate)
✅ Browse all bets
✅ Add new bets
✅ Edit and settle bets
✅ Delete bets
✅ Update settings (base unit)
✅ All calculations work correctly

## Mock Data Included

- **5 sample bets** (NFL, NBA, MLB)
  - 3 settled (2 wins, 1 loss, 1 push)
  - 1 pending
- **5 sportsbooks** (DraftKings, FanDuel, BetMGM, Caesars, BetRivers)
- **User settings** (base unit: $50)

## Re-enabling Supabase (Production Mode)

When you're ready to connect to a real database:

### 1. Update [src/lib/queries.ts](src/lib/queries.ts:9)
```typescript
// Change this line from:
const USE_MOCK_DATA = true;

// To:
const USE_MOCK_DATA = false;
```

### 2. Uncomment authentication in [src/App.tsx](src/App.tsx:18-56)
Uncomment the authentication logic in the `ProtectedRoute` component and the auth route definitions.

### 3. Set up Supabase
- Create a project at [supabase.com](https://supabase.com)
- Run the SQL from [supabase/schema.sql](supabase/schema.sql)
- Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Restart the server
```bash
npm run dev
```

Now you'll have full authentication and persistent database storage!

## Testing

Run unit tests (works in both modes):
```bash
npm run test
```

## Notes

- All odds calculations use real formulas
- Mock data resets on page reload
- No .env file needed for development mode
- Perfect for UI development and testing
