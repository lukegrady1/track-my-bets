# API Reference - Track My Bets

All APIs are already implemented in [src/lib/queries.ts](src/lib/queries.ts) and ready to use!

## 🎯 Current Status

✅ **All APIs are built and functional**
✅ **Frontend components are connected**
✅ **Works with both mock data and Supabase**
✅ **TanStack Query for caching and state management**

## 🔄 Switching Between Mock and Real Data

In [src/lib/queries.ts](src/lib/queries.ts:10):

```typescript
// Use mock data (no Supabase needed)
const USE_MOCK_DATA = true;

// Use real Supabase database
const USE_MOCK_DATA = false;
```

---

## 📚 Available APIs

### Authentication

#### `getCurrentUser()`
Returns the current authenticated user.

```typescript
import { getCurrentUser } from '@/lib/queries';

const user = await getCurrentUser();
// Returns: { id: string, email: string }
```

**Used in:**
- [Dashboard.tsx](src/pages/dashboard/Dashboard.tsx:14)
- [BetForm.tsx](src/pages/bets/BetForm.tsx)
- [Settings.tsx](src/pages/settings/Settings.tsx)

---

### User Settings

#### `getUserSettings(userId: string)`
Get user's settings (base unit, default sportsbook).

```typescript
import { getUserSettings } from '@/lib/queries';

const settings = await getUserSettings(userId);
// Returns: { user_id, base_unit, default_book_id }
```

#### `upsertUserSettings(settings: UserSettings)`
Create or update user settings.

```typescript
import { upsertUserSettings } from '@/lib/queries';

await upsertUserSettings({
  user_id: userId,
  base_unit: 50,
  default_book_id: 'book-uuid',
});
```

**Used in:**
- [Settings.tsx](src/pages/settings/Settings.tsx:27) - Get settings
- [Settings.tsx](src/pages/settings/Settings.tsx:48) - Update settings
- [Onboarding.tsx](src/pages/auth/Onboarding.tsx:52) - Initial setup

---

### Sportsbooks

#### `getSportsbooks(userId: string)`
Get all sportsbooks (global + user's custom books).

```typescript
import { getSportsbooks } from '@/lib/queries';

const books = await getSportsbooks(userId);
// Returns: Array of { id, name, user_id, created_at }
```

**Used in:**
- [BetForm.tsx](src/pages/bets/BetForm.tsx:42) - Populate sportsbook dropdown
- [Onboarding.tsx](src/pages/auth/Onboarding.tsx:26) - Default book selection

---

### Bets (CRUD Operations)

#### `getBets(userId: string, filters?)`
Get all bets with optional filtering.

```typescript
import { getBets } from '@/lib/queries';

// Get all bets
const allBets = await getBets(userId);

// With filters
const filteredBets = await getBets(userId, {
  sport: 'NFL',
  status: 'Won',
  bookId: 'book-uuid',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
});
```

**Filters:**
- `sport?: string` - Filter by sport (NFL, NBA, etc.)
- `status?: string` - Filter by status (Won, Lost, Pending, etc.)
- `bookId?: string` - Filter by sportsbook
- `startDate?: string` - Start date (ISO format)
- `endDate?: string` - End date (ISO format)

**Used in:**
- [Dashboard.tsx](src/pages/dashboard/Dashboard.tsx:28) - Recent bets
- [BetsList.tsx](src/pages/bets/BetsList.tsx:17) - All bets table

#### `getBetById(betId: string)`
Get a single bet by ID.

```typescript
import { getBetById } from '@/lib/queries';

const bet = await getBetById('bet-uuid');
// Returns: Full bet object or null
```

**Used in:**
- [BetDetail.tsx](src/pages/bets/BetDetail.tsx:12) - Bet detail page

#### `createBet(bet)`
Create a new bet.

```typescript
import { createBet } from '@/lib/queries';

const newBet = await createBet({
  user_id: userId,
  bet_name: 'Chiefs ML vs Bills',
  sport: 'NFL',
  league: 'NFL',
  market_type: 'ML',
  team_or_player: 'Kansas City Chiefs',
  odds_american: -110,
  stake: 110,
  units: 2.2,
  status: 'Pending',
  book_id: 'book-uuid',
  placed_at: new Date().toISOString(),
  notes: 'Strong play',
});
```

**Used in:**
- [BetForm.tsx](src/pages/bets/BetForm.tsx:80) - Create bet form

#### `updateBet(betId: string, updates)`
Update an existing bet.

```typescript
import { updateBet } from '@/lib/queries';

await updateBet('bet-uuid', {
  status: 'Won',
  result_profit: 100,
});
```

**Used in:**
- [BetDetail.tsx](src/pages/bets/BetDetail.tsx) - Edit bet

#### `deleteBet(betId: string)`
Delete a bet.

```typescript
import { deleteBet } from '@/lib/queries';

await deleteBet('bet-uuid');
```

**Used in:**
- [BetDetail.tsx](src/pages/bets/BetDetail.tsx:35) - Delete button

#### `settleBet(betId, status, cashoutAmount?)`
Settle a bet and calculate profit automatically.

```typescript
import { settleBet } from '@/lib/queries';

// Mark as won (profit auto-calculated)
await settleBet('bet-uuid', 'Won');

// Mark as lost
await settleBet('bet-uuid', 'Lost');

// Mark as push
await settleBet('bet-uuid', 'Push');

// Cashout
await settleBet('bet-uuid', 'Cashout', 150);
```

**Used in:**
- [BetDetail.tsx](src/pages/bets/BetDetail.tsx:22) - Settle buttons

---

### Analytics

#### `getKPIs(userId: string, filters?)`
Get all KPIs calculated from bets.

```typescript
import { getKPIs } from '@/lib/queries';

const kpis = await getKPIs(userId);
/* Returns:
{
  totalPnL: number,        // Total profit/loss
  totalUnits: number,      // Units up/down
  roi: number,             // ROI percentage
  hitRate: number,         // Win rate percentage
  avgOdds: number,         // Average American odds
  avgImpliedProb: number,  // Average implied probability
  totalStaked: number,     // Total amount wagered
  totalBets: number,       // Total number of bets
  wonBets: number,         // Number of wins
  lostBets: number,        // Number of losses
  pendingBets: number,     // Number pending
}
*/

// With date filters
const monthlyKPIs = await getKPIs(userId, {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});
```

**Used in:**
- [Dashboard.tsx](src/pages/dashboard/Dashboard.tsx:21) - Dashboard KPIs

---

## 🎨 How Components Use the APIs

### Dashboard Component

```typescript
// src/pages/dashboard/Dashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getKPIs, getBets } from '@/lib/queries';

export default function Dashboard() {
  const [userId, setUserId] = useState('');

  // Get current user
  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Fetch KPIs with caching
  const { data: kpis } = useQuery({
    queryKey: ['kpis', userId],
    queryFn: () => getKPIs(userId),
    enabled: !!userId,
  });

  // Fetch recent bets
  const { data: recentBets } = useQuery({
    queryKey: ['recentBets', userId],
    queryFn: async () => {
      const allBets = await getBets(userId);
      return allBets.slice(0, 5);
    },
    enabled: !!userId,
  });

  return (
    <div>
      <h2>P&L: {formatCurrency(kpis?.totalPnL)}</h2>
      <h2>ROI: {formatPercent(kpis?.roi)}</h2>
      {/* ... */}
    </div>
  );
}
```

### Bet Form Component

```typescript
// src/pages/bets/BetForm.tsx

import { createBet } from '@/lib/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function BetForm() {
  const queryClient = useQueryClient();

  const handleSubmit = async (formData) => {
    // Create bet
    await createBet({
      user_id: userId,
      bet_name: formData.betName,
      sport: formData.sport,
      odds_american: formData.odds,
      stake: formData.stake,
      units: formData.stake / baseUnit,
      status: 'Pending',
      // ... more fields
    });

    // Navigate back to bets list
    navigate('/bets');
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Bet Detail Component

```typescript
// src/pages/bets/BetDetail.tsx

import { getBetById, settleBet, deleteBet } from '@/lib/queries';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function BetDetail() {
  const { id } = useParams();

  // Fetch bet details
  const { data: bet, refetch } = useQuery({
    queryKey: ['bet', id],
    queryFn: () => getBetById(id!),
  });

  // Settle bet
  const handleSettle = async (status) => {
    await settleBet(id!, status);
    refetch(); // Refresh data
  };

  // Delete bet
  const handleDelete = async () => {
    await deleteBet(id!);
    navigate('/bets');
  };

  return (
    <div>
      <h1>{bet?.bet_name}</h1>
      <button onClick={() => handleSettle('Won')}>Won</button>
      <button onClick={() => handleSettle('Lost')}>Lost</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

---

## 🔧 TanStack Query Integration

All components use **TanStack Query** for:
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Loading states
- ✅ Error handling
- ✅ Optimistic updates

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['bets', userId],
  queryFn: () => getBets(userId),
  enabled: !!userId,
  staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});
```

---

## 📊 Data Flow

```
User Action (Click, Submit)
    ↓
Component Handler Function
    ↓
API Call (src/lib/queries.ts)
    ↓
Check USE_MOCK_DATA flag
    ↓
├─→ Mock Data (mockData.ts) ← Currently Active
└─→ Supabase (supabase.ts)
    ↓
Return Data
    ↓
TanStack Query Cache
    ↓
Component Re-renders
    ↓
UI Updates
```

---

## 🚀 To Enable Real Database

1. **Set up Supabase** (see [SUPABASE-SETUP.md](SUPABASE-SETUP.md))

2. **Change one line** in [src/lib/queries.ts](src/lib/queries.ts:10):
   ```typescript
   const USE_MOCK_DATA = false; // Changed from true
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

That's it! All the same APIs now hit your real Supabase database instead of mock data.

---

## 📝 Complete API List

| API Function | Purpose | Used In |
|--------------|---------|---------|
| `getCurrentUser()` | Get logged-in user | Dashboard, Forms, Settings |
| `getUserSettings()` | Get user settings | Settings, Forms |
| `upsertUserSettings()` | Save user settings | Settings, Onboarding |
| `getSportsbooks()` | Get sportsbooks list | Forms, Onboarding |
| `getBets()` | Get all/filtered bets | Dashboard, BetsList |
| `getBetById()` | Get single bet | BetDetail |
| `createBet()` | Create new bet | BetForm |
| `updateBet()` | Update bet | BetDetail |
| `deleteBet()` | Delete bet | BetDetail |
| `settleBet()` | Settle bet + calc profit | BetDetail |
| `getKPIs()` | Get analytics | Dashboard |

---

## ✨ Everything is Already Connected!

**You don't need to write any new APIs!**

The backend queries are fully implemented and the frontend is already using them via TanStack Query. Just switch `USE_MOCK_DATA` to `false` when you're ready to use your Supabase database.

---

## 🐛 Debugging

### Check if using mock or real data:
```typescript
// In browser console
console.log('Mock data:', localStorage.getItem('USE_MOCK_DATA'));
```

### View TanStack Query cache:
Install React Query DevTools (already configured):
- Look for the floating icon in bottom-right of the app
- Click to see all cached queries and their data

### Test API calls directly:
```typescript
// In browser console
import { getBets } from './src/lib/queries';
const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
const bets = await getBets(userId);
console.log(bets);
```
