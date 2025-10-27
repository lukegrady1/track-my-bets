# Migration Guide: Supabase → FastAPI Backend

This guide explains the refactoring from a Supabase-based backend to a FastAPI backend.

## What Changed

### Architecture
- **Before**: React frontend → Supabase (Auth + Database)
- **After**: React frontend → FastAPI backend → PostgreSQL

### Project Structure
```
Before:
track-my-bets/
├── src/           # React app
├── supabase/      # SQL scripts
└── package.json

After:
track-my-bets/
├── frontend/      # React app (moved from root)
├── backend/       # FastAPI app (new)
└── README.md
```

### Authentication
- **Before**: Supabase Auth with JWT cookies
- **After**: Custom JWT implementation in FastAPI
  - Access tokens (30 min)
  - Refresh tokens (30 days)
  - Stored in localStorage
  - Automatic refresh on 401

### API Layer
- **Before**: Direct Supabase client calls (`supabase.from('bets').select()`)
- **After**: REST API with axios (`api.get('/api/v1/bets')`)

## Migration Steps

### 1. Database Migration

The PostgreSQL schema remains mostly the same. Key differences:

1. **No RLS**: Security is handled at the application level in FastAPI
2. **Enum types**: Changed from PostgreSQL enums to SQLAlchemy enums
3. **Generated columns removed**: Calculated in application code

To migrate your data:

```sql
-- Export from Supabase
pg_dump -h your-supabase-host -U postgres -d postgres -t public.* > backup.sql

-- Import to new database
psql -U postgres -d trackmybets < backend/alembic/versions/001_initial.sql
```

### 2. Environment Variables

**Frontend (.env)**
```diff
- VITE_SUPABASE_URL=https://xxx.supabase.co
- VITE_SUPABASE_ANON_KEY=eyJxxx...
+ VITE_API_BASE=http://localhost:8000
```

**Backend (.env)** - New file
```env
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/trackmybets
JWT_SECRET=your-secret-key
JWT_ALGO=HS256
JWT_ACCESS_EXPIRE_MIN=30
JWT_REFRESH_EXPIRE_MIN=43200
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Code Changes

#### Authentication Flow

**Before** (Supabase):
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});

// Get user
const { data: { user } } = await supabase.auth.getUser();
```

**After** (FastAPI):
```typescript
// Login
const response = await api.post('/api/v1/auth/login', {
  email, password
});
setTokens(response.data.access_token, response.data.refresh_token);

// Get user
const response = await api.get('/api/v1/auth/me');
const user = response.data.user;
```

#### Data Fetching

**Before** (Supabase):
```typescript
const { data: bets } = await supabase
  .from('bets')
  .select('*')
  .eq('user_id', userId)
  .order('placed_at', { ascending: false });
```

**After** (FastAPI):
```typescript
const response = await api.get('/api/v1/bets', {
  params: { skip: 0, limit: 100 }
});
const bets = response.data;
```

#### Creating Records

**Before** (Supabase):
```typescript
const { data, error } = await supabase
  .from('bets')
  .insert([{ bet_name, sport, ... }])
  .select()
  .single();
```

**After** (FastAPI):
```typescript
const response = await api.post('/api/v1/bets', {
  bet_name, sport, ...
});
const bet = response.data;
```

### 4. TanStack Query Hooks

Update your hooks to use the new API:

**Before**:
```typescript
export function useBets() {
  return useQuery({
    queryKey: ['bets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bets')
        .select('*');
      return data;
    }
  });
}
```

**After**:
```typescript
export function useBets() {
  return useQuery({
    queryKey: ['bets'],
    queryFn: async () => {
      const response = await api.get('/api/v1/bets');
      return response.data;
    }
  });
}
```

### 5. Dependencies

**Frontend**:
```diff
- "@supabase/supabase-js": "^2.45.0",
+ "axios": "^1.6.2",
```

**Backend** (new):
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg[binary]==3.1.13
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

### 6. Running the Application

**Before**:
```bash
npm run dev  # Single command
```

**After**:
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints Reference

| Feature | Old (Supabase) | New (FastAPI) |
|---------|---------------|---------------|
| Register | `supabase.auth.signUp()` | `POST /api/v1/auth/register` |
| Login | `supabase.auth.signInWithPassword()` | `POST /api/v1/auth/login` |
| Get User | `supabase.auth.getUser()` | `GET /api/v1/auth/me` |
| List Bets | `supabase.from('bets').select()` | `GET /api/v1/bets` |
| Create Bet | `supabase.from('bets').insert()` | `POST /api/v1/bets` |
| Update Bet | `supabase.from('bets').update()` | `PATCH /api/v1/bets/{id}` |
| Delete Bet | `supabase.from('bets').delete()` | `DELETE /api/v1/bets/{id}` |
| Settle Bet | `supabase.from('bets').update()` | `POST /api/v1/bets/{id}/settle` |
| Get KPIs | Custom RPC | `GET /api/v1/analytics/kpis` |
| CSV Import | Edge Function | `POST /api/v1/imports/csv` |

## Benefits of New Architecture

1. **Full Control**: Complete control over auth, validation, and business logic
2. **Type Safety**: Pydantic schemas generate OpenAPI spec
3. **Flexibility**: Easy to add custom endpoints and logic
4. **Testing**: Easier to unit test backend logic
5. **Migration Path**: Can switch databases without changing frontend
6. **Local Development**: No external dependencies needed

## Rollback Plan

If you need to rollback to Supabase:

1. Keep the old code in a `legacy` branch
2. Re-enable Supabase client in frontend
3. Update environment variables
4. Restore `src/lib/queries.ts` to use Supabase

## Troubleshooting

### CORS Issues
- Ensure `CORS_ALLOWED_ORIGINS` in backend .env includes frontend URL
- Check browser console for specific CORS errors

### 401 Errors
- Check if token is being sent in Authorization header
- Verify JWT_SECRET matches between requests
- Check token expiration

### Database Connection
- Verify DATABASE_URL format: `postgresql+psycopg://user:pass@host:port/db`
- Ensure PostgreSQL is running
- Check database exists: `psql -l`

### Migration Errors
- Run `alembic downgrade base` then `alembic upgrade head`
- Check alembic/versions/ for duplicate revisions

## Next Steps

After migration:

1. Update frontend to remove Supabase dependencies
2. Migrate queries.ts to use new API
3. Test all flows (auth, CRUD, analytics)
4. Set up production deployment (Vercel + Render/Fly)
5. Configure production environment variables

## Questions?

Check the [README.md](README.md) for full setup instructions or open an issue on GitHub.
