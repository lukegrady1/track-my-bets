# Quick Setup Guide

Get Track My Bets running in 5 minutes.

## Prerequisites Checklist

- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 15+ installed and running
- [ ] Git (optional, for cloning)

## Step-by-Step Setup

### 1. Clone or Download

```bash
cd track-my-bets
```

### 2. Create Database

```bash
# Option A: Using psql command line
createdb trackmybets

# Option B: Using PostgreSQL client
psql -U postgres
CREATE DATABASE trackmybets;
\q
```

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Mac/Linux

# Edit .env with your database info
# DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/trackmybets
# Change 'yourpassword' to your PostgreSQL password

# Run migrations
alembic upgrade head

# Start backend (keep this terminal open)
uvicorn app.main:app --reload
```

You should see: `Uvicorn running on http://127.0.0.1:8000`

✅ Backend is running!

### 4. Setup Frontend (New Terminal)

```bash
cd frontend

# Install packages
npm install

# The .env is already configured for local development
# VITE_API_BASE=http://localhost:8000

# Start frontend
npm run dev
```

You should see: `Local: http://localhost:5173/`

✅ Frontend is running!

### 5. Open Browser

Navigate to: **http://localhost:5173**

You should see the Track My Bets login screen.

### 6. Create Account

1. Click "Sign Up"
2. Enter email and password (min 8 characters)
3. Set your base unit (e.g., $50)
4. Start tracking bets!

## Verify Setup

### Check Backend API

Visit: **http://localhost:8000/docs**

You should see the FastAPI Swagger documentation.

### Check Database

```bash
psql -U postgres -d trackmybets

# List tables
\dt

# You should see: users, user_settings, bets, sportsbooks, alembic_version
```

## Common Issues

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Make sure virtual environment is activated
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Then install again
pip install -r requirements.txt
```

**Error**: `sqlalchemy.exc.OperationalError: could not connect to server`

**Solution**: Start PostgreSQL
```bash
# Windows (run as administrator)
net start postgresql-x64-15

# Mac
brew services start postgresql

# Linux
sudo service postgresql start
```

**Error**: `alembic.util.exc.CommandError: Can't locate revision identified by...`

**Solution**: Reset migrations
```bash
# Delete alembic_version table
psql -U postgres -d trackmybets -c "DROP TABLE IF EXISTS alembic_version;"

# Run migrations again
alembic upgrade head
```

### Frontend won't start

**Error**: `Cannot find module` or `Module not found`

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Failed to fetch dynamically imported module`

**Solution**: Clear browser cache and restart dev server
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### CORS Errors in Browser

**Error**: `Access to XMLHttpRequest... has been blocked by CORS policy`

**Solution**: Check backend .env has correct CORS_ALLOWED_ORIGINS
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Can't Login After Registration

**Error**: 401 Unauthorized

**Solution**:
1. Check backend terminal for errors
2. Verify JWT_SECRET is set in backend .env
3. Try registering a new account
4. Clear browser localStorage: Open DevTools → Application → Local Storage → Clear

## Testing Your Setup

### 1. Register & Login
- Create an account
- Login with credentials
- Should redirect to dashboard

### 2. Create a Bet
- Click "Add Bet" or navigate to /bets/new
- Fill in form:
  - Name: "Test Bet"
  - Sport: NFL
  - Market: ML
  - Odds: -110
  - Stake: 100
- Submit
- Should see bet in list

### 3. Settle Bet
- Click on the bet
- Click "Won" or "Lost"
- Return to dashboard
- Should see updated P&L

### 4. Check Analytics
- Dashboard should show:
  - Total P&L
  - Units up/down
  - ROI%
  - Hit rate

## Next Steps

- [ ] Add real bets
- [ ] Import from CSV
- [ ] Explore analytics
- [ ] Customize settings
- [ ] Read full documentation in README.md

## Need Help?

- Check API docs: http://localhost:8000/docs
- Review logs in terminal windows
- See MIGRATION-GUIDE.md for detailed info
- Open an issue on GitHub

## Production Deployment

Once everything works locally, see README.md section on deployment to:
- **Backend**: Render, Fly.io, or Railway
- **Frontend**: Vercel or Netlify

---

Happy tracking! 🎯
