# Track My Bets

A modern, full-stack sports betting tracker with comprehensive analytics, bankroll management, and NFL schedule integration. Built with React + FastAPI.

## Features

- **JWT Authentication**: Secure email/password authentication with access & refresh tokens
- **Bet Tracking**: Manual bet entry with full validation and settlement tracking
- **Analytics Dashboard**: Real-time KPIs including P&L, ROI, hit rate, units, and more
- **NFL Schedule**: Live NFL game schedule with scores, integrated with ESPN API
- **Bankroll Management**: Track your bankroll over time with visual charts
- **CSV Import/Export**: Import bets from sportsbooks (DraftKings, FanDuel, etc.)
- **Mobile-First Design**: Fully responsive UI built with Tailwind CSS + shadcn/ui
- **OpenAPI Documentation**: Auto-generated API docs at `/docs`

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state
- **Validation**: Zod schemas
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy 2.x ORM
- **Migrations**: Alembic
- **Authentication**: JWT with python-jose
- **Password Hashing**: passlib + bcrypt
- **Validation**: Pydantic v2

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **Python** 3.11 or higher
- **PostgreSQL** 14 or higher (local or hosted on Neon/Supabase/Render)
- **npm** or **yarn**

### Installation

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd track-my-bets
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env
```

#### 3. Configure Backend Environment

Edit `backend/.env` with your settings:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=your_secret_key_change_me
JWT_ALGO=HS256
JWT_ACCESS_EXPIRE_MIN=30
JWT_REFRESH_EXPIRE_MIN=43200
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-vercel-domain.vercel.app
```

#### 4. Initialize Database

```bash
# Run Alembic migrations
alembic upgrade head

# Seed common sportsbooks
python seed_sportsbooks.py
```

#### 5. Start Backend Server

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:
- **API**: http://localhost:8000
- **OpenAPI Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

#### 6. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
```

#### 7. Configure Frontend Environment

Edit `frontend/.env`:

```env
VITE_API_BASE=http://localhost:8000
```

#### 8. Start Frontend Dev Server

```bash
npm run dev
```

Frontend will be available at http://localhost:5173

## Quick Start Scripts

Use the provided convenience scripts to start both servers:

**Windows:**
```bash
.\run.bat
```

**Mac/Linux:**
```bash
chmod +x run.sh
./run.sh
```

## Project Structure

```
track-my-bets/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   │   ├── auth.py      # Authentication
│   │   │   ├── bets.py      # Bet CRUD
│   │   │   ├── analytics.py # KPIs and stats
│   │   │   ├── sportsbooks.py # Sportsbooks
│   │   │   ├── users.py     # User settings
│   │   │   └── imports.py   # CSV import
│   │   ├── core/            # Core configuration
│   │   │   ├── config.py    # Settings
│   │   │   └── security.py  # JWT & password hashing
│   │   ├── db/              # Database layer
│   │   │   ├── models.py    # SQLAlchemy models
│   │   │   ├── session.py   # DB session
│   │   │   └── base.py      # Base classes
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── seed_sportsbooks.py
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   └── layout/     # Header, Layout
│   │   ├── pages/          # Page components
│   │   │   ├── auth/       # Sign in, Sign up, Onboarding
│   │   │   ├── dashboard/  # Dashboard & Bankroll
│   │   │   ├── bets/       # Bet list, form, detail
│   │   │   ├── schedule/   # NFL Schedule page
│   │   │   └── settings/   # Settings
│   │   ├── lib/            # Utilities
│   │   │   ├── api.ts      # Axios client with interceptors
│   │   │   ├── queries.ts  # TanStack Query hooks
│   │   │   ├── espn.ts     # ESPN API integration
│   │   │   ├── odds.ts     # Odds calculations
│   │   │   ├── schemas.ts  # Zod validation
│   │   │   └── utils.ts    # Helpers
│   │   └── styles/         # Global CSS
│   ├── package.json
│   └── vite.config.ts
├── run.bat                  # Windows startup script
├── run.sh                   # Unix startup script
├── SETUP.md                 # Detailed setup guide
└── README.md
```

## Database Schema

The PostgreSQL database includes:

- **users**: User accounts with hashed passwords
- **user_settings**: User preferences (base unit, default sportsbook)
- **sportsbooks**: Global and custom sportsbook listings
- **bets**: Complete bet records with calculated profit/units
- **Optional**: `bet_tags`, `bankroll_snapshots`, `parlay_legs`

All managed through Alembic migrations.

## Available Scripts

### Backend

```bash
# Start dev server with auto-reload
uvicorn app.main:app --reload

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Run tests
pytest
```

### Frontend

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run test      # Run unit tests
npm run lint      # Lint code
```

## Key Concepts

### Odds Calculations

American odds conversion to decimal:
- **Positive odds** (e.g., +150): `decimal = 1 + (odds / 100)`
- **Negative odds** (e.g., -110): `decimal = 1 + (100 / |odds|)`

### Profit Calculation

- **Won**: `profit = stake * (decimal - 1)`
- **Lost**: `profit = -stake`
- **Push/Void**: `profit = 0`
- **Cashout**: `profit = cashout_amount - stake`

### Units

Calculated as: `units = stake / base_unit`

Your base unit is configured during onboarding and can be updated in settings.

### ROI

Return on Investment: `ROI = (Total P&L / Total Staked) * 100`

Calculated only on Won/Lost bets (excludes Push/Void/Pending).

## Authentication Flow

1. **Sign up** with email/password → User record created with hashed password
2. **Complete onboarding** → Set base unit & default sportsbook
3. **Access protected routes** → JWT access token (30min) + refresh token (30 days)
4. **Auto-refresh** → Frontend automatically refreshes expired access tokens
5. **Session persistence** → Tokens stored in localStorage

## NFL Schedule Feature

The app includes a live NFL schedule page that:
- Fetches real-time game data from ESPN API
- Shows all games for any regular season week (1-18)
- Displays team logos, scores, kickoff times, networks, and venues
- Highlights live games with animated indicators
- Updates via URL query params (e.g., `/schedule?week=5`)
- Fully responsive with mobile-first design

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Bets
- `GET /api/v1/bets` - List bets with filters
- `POST /api/v1/bets` - Create bet
- `GET /api/v1/bets/{id}` - Get bet detail
- `PATCH /api/v1/bets/{id}` - Update bet
- `DELETE /api/v1/bets/{id}` - Delete bet
- `POST /api/v1/bets/{id}/settle` - Settle bet (Won/Lost/Push/Void)

### Analytics
- `GET /api/v1/analytics/kpis` - Get KPIs (P&L, ROI, Units, Hit Rate)
- `GET /api/v1/analytics/breakdown` - Performance by sport/book/market
- `GET /api/v1/analytics/bankroll` - Bankroll time-series

### Sportsbooks
- `GET /api/v1/sportsbooks` - List all sportsbooks
- `POST /api/v1/sportsbooks` - Create custom sportsbook

### User Settings
- `GET /api/v1/users/{id}/settings` - Get user settings
- `PUT /api/v1/users/{id}/settings` - Update settings

### Import
- `POST /api/v1/imports/csv` - Import CSV (DraftKings, FanDuel)

Full interactive documentation at http://localhost:8000/docs

## Deployment

### Backend Deployment (Render/Fly/Railway)

1. Create a PostgreSQL database
2. Set environment variables (see `backend/.env.example`)
3. Deploy backend with build command: `pip install -r requirements.txt && alembic upgrade head`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Import repository in Vercel
3. Set build settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_BASE=https://your-backend-url.com`
5. Deploy

### CORS Configuration

Update `CORS_ALLOWED_ORIGINS` in backend `.env` to include your frontend domain:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

## Security

- **JWT Authentication**: Access + refresh tokens with secure rotation
- **Password Hashing**: bcrypt with configurable rounds
- **CORS Protection**: Restricted to allowed origins
- **Input Validation**: Pydantic schemas on backend, Zod on frontend
- **Rate Limiting**: (Recommended: add slowapi middleware)
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running and DATABASE_URL is correct
- Ensure Python 3.11+ and all dependencies installed
- Run `alembic upgrade head` to apply migrations

### Frontend can't connect to backend
- Check `VITE_API_BASE` in `frontend/.env`
- Ensure backend is running on port 8000
- Check CORS settings in `backend/.env`

### bcrypt errors
- Ensure `bcrypt==4.0.1` (not 5.x) is installed
- Reinstall: `pip install bcrypt==4.0.1`

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Disclaimer

**For personal record-keeping only. Not financial advice.**

This application is designed to help you track and analyze your sports betting activity. It does not provide betting recommendations, odds, or any form of gambling advice. Sports betting involves risk. Always gamble responsibly.

## Roadmap

- [x] JWT Authentication with refresh tokens
- [x] Full CRUD for bets
- [x] Analytics dashboard with KPIs
- [x] NFL Schedule integration
- [ ] CSV import with auto-detection
- [ ] CLV tracking with closing odds API
- [ ] Parlay bet wizard
- [ ] Bankroll snapshots and equity curve
- [ ] Advanced filtering (date range, tags, search)
- [ ] Dark mode
- [ ] Mobile app (Capacitor)
- [ ] Email notifications
- [ ] Kelly criterion calculator
- [ ] Multi-currency support

## Support

For issues or questions:
- Open an issue on GitHub
- Check the detailed docs in [SETUP.md](SETUP.md)
- Review the implementation guide in [claude.md](claude.md)

---

Built with React, TypeScript, FastAPI, and PostgreSQL
