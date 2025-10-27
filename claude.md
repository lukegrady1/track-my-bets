# claude.md — Build a Full‑Stack Betting Tracker (React + FastAPI)

> **Objective:** Implement a production‑ready betting tracker with a **React (Vite + TS)** frontend and a **Python FastAPI** backend. The app tracks bets (wins/losses), **PnL**, **units**, **ROI%**, supports **authentication**, manual bet entry and **CSV import**, with a modern responsive UI. Ship it deployable to Vercel (frontend) and Render/Fly/Railway (backend) with Postgres (Neon/Supabase).

---

## 0) Deliverables

* **Frontend**: React app (Vite + TS + Tailwind + shadcn/ui) with auth screens, dashboard KPIs, bets CRUD, CSV import, settings.
* **Backend**: FastAPI service with JWT auth, Postgres (SQLAlchemy + Alembic), REST endpoints for bets, analytics, import.
* **Database**: Postgres schema + Alembic migrations.
* **E2E**: Working flows → sign up/in, add/settle a bet, see KPIs update.
* **DX**: OpenAPI → TypeScript client types; `.env.example`; npm/pip scripts.
* **CI (nice‑to‑have)**: Lint/test on PR; deploy preview.

---

## 1) Architecture & Stack

* **Frontend**: React (Vite + TypeScript), TailwindCSS, shadcn/ui, Lucide icons, TanStack Query, Zod, Recharts, Framer Motion.
* **Backend**: FastAPI, Pydantic, SQLAlchemy 2.x, Alembic, python‑jose (JWT), passlib (password hashing).
* **DB**: Postgres (Neon/Supabase/Render Postgres).
* **Auth**: Email/password with **JWT** (httpOnly cookie or Bearer token). Include refresh token.
* **Storage**: In‑API CSV import (multipart). (Optional S3 later.)
* **Hosting**: Vercel (FE) + Render/Fly/Railway (BE).
* **Observability (opt.)**: Sentry/PostHog.

### Folder Layout

```
track-my-bets/
  frontend/
    src/
      components/
      pages/
      lib/
      styles/
    index.html
    vite.config.ts
  backend/
    app/
      api/v1/
        auth.py
        bets.py
        analytics.py
        imports.py
      core/
        config.py
        security.py
      db/
        base.py
        session.py
        models.py
        crud.py
      schemas.py
      main.py
    alembic/
      versions/
    alembic.ini
  docker-compose.yml (opt.)
  README.md
  .env.example
```

---

## 2) Data Model & Calculations

**Core entity: `Bet`**

* Fields: `id, user_id, bet_name, sport, league?, market_type, team_or_player?, odds_american, stake, units, status, result_profit?, book?, event_date?, placed_at, created_at`.
* **Units** = `stake / base_unit` (from user settings).
* Decimal odds: `a>0 ? 1 + a/100 : 1 + 100/|a|`.
* Profit: Won=`stake*(decimal-1)`; Lost=`-stake`; Push/Void=`0`; Cashout=`cashout_amount - stake`.
* ROI% = `total_pnl / total_staked * 100` (staked = Won+Lost only). Hit Rate% = `wins/(wins+losses)*100`.

**UserSettings**: `user_id (pk), base_unit, default_book?`.

**Optional**: `Sportsbook`, `ParlayLeg`, `BankrollSnapshot`, `Tag` with join table.

---

## 3) Backend — FastAPI Implementation

### 3.1 Environment & Config

* Use `pydantic-settings` for config. Expected env:

```
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=change_me
JWT_ALGO=HS256
JWT_ACCESS_EXPIRE_MIN=30
JWT_REFRESH_EXPIRE_MIN=43200
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://<vercel-domain>
```

### 3.2 DB & Models (SQLAlchemy)

Create `User`, `UserSettings`, `Bet`. Migration with Alembic (initial + seeds for common sportsbooks optional).

### 3.3 Auth

* Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`.
* Password hashing: `passlib[bcrypt]`.
* Access token (short‑lived) + refresh token (longer). Prefer **httpOnly secure cookies**; allow Bearer for local dev.

### 3.4 Bets API

* `POST /bets` — create bet; compute `units` from user settings.
* `GET /bets` — list with filters (date range, sport, status, book, text search).
* `GET /bets/{id}` — detail.
* `PATCH /bets/{id}` — update.
* `DELETE /bets/{id}` — delete.
* `POST /bets/{id}/settle` — set status + compute `result_profit`.

### 3.5 Analytics API

* `GET /analytics/kpis?from&to` → `{ pnl, units, roiPct, hitRate, avgOdds }`.
* `GET /analytics/breakdown?dim=book|sport|market` → array of `{ key, pnl, roiPct, count }`.
* `GET /analytics/bankroll?from&to` → time‑series of cumulative PnL or snapshots.

### 3.6 Import API

* `POST /imports/csv?provider=auto|dk|fd|mgm` (multipart upload) → preview mapping + commit flag. Validate rows; reject bad lines with errors list.

### 3.7 Boilerplate Code (sketch)

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, bets, analytics, imports
from app.core.config import settings
from app.db.session import init_db

app = FastAPI(title="Track My Bets API", version="1.0.0")
app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.CORS_ALLOWED_ORIGINS,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(bets.router, prefix="/api/v1/bets", tags=["bets"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(imports.router, prefix="/api/v1/imports", tags=["imports"])
```

```python
# app/api/v1/bets.py (essential logic only)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import current_user
from app.db import models
from app.schemas import BetCreate, BetOut

router = APIRouter()

def american_to_decimal(a:int)->float: return 1 + (a/100) if a>0 else 1 + 100/abs(a)

@router.post("/", response_model=BetOut)
def create_bet(body: BetCreate, db: Session = Depends(get_db), user=Depends(current_user)):
    units = round(body.stake / user.settings.base_unit, 4)
    bet = models.Bet(user_id=user.id, units=units, status="Pending", **body.dict())
    db.add(bet); db.commit(); db.refresh(bet)
    return bet
```

---

## 4) Frontend — React Implementation

### 4.1 Setup

* Vite + React + TS + Tailwind
* Install: `@tanstack/react-query`, `zod`, `react-hook-form`, `recharts`, `react-router-dom`, `axios`, `shadcn/ui`, `lucide-react`.
* Configure Tailwind + shadcn. Global API base from `VITE_API_BASE`.

### 4.2 Routes

* `/auth/*` → Sign in / Sign up / Forgot.
* `/` → Dashboard KPIs + charts.
* `/bets` → Table/list with filters.
* `/bets/new` → Create bet wizard (supports parlay later).
* `/settings` → Base unit, default book, CSV import.

### 4.3 Components

* **KPI Cards**: PnL, Units, ROI%, Hit Rate.
* **BankrollChart** (Recharts line).
* **BetTable**: virtualized rows, inline status update.
* **BetForm**: RHF + Zod; live preview of implied probability, units.
* **ImportModal**: file input → preview rows → commit.

### 4.4 API Client

* Axios with interceptor to include JWT (cookie) or Bearer.
* Hooks with TanStack Query: `useKPIs(params)`, `useBets(filters)`, `useCreateBet()`, etc.

### 4.5 UX/Design

* Mobile‑first, keyboard navigable; a11y labels.
* Light theme MVP; respect `prefers-reduced-motion`.

---

## 5) Type Contracts & Codegen

* Expose OpenAPI from FastAPI at `/openapi.json`.
* Generate TS types: `npx openapi-typescript http://localhost:8000/openapi.json -o frontend/src/lib/api-types.ts`.
* Optional: generate API client or keep lightweight fetch/axios wrappers.

---

## 6) CSV Import Mapping

* Support **DraftKings** + **FanDuel** CSVs initially.
* Auto‑detect provider by header signature; fallback to mapping UI.
* Validate: odds integer, stake > 0, status in set, timestamps parseable.
* Dry‑run endpoint returns arrays: `validRows[]`, `invalidRows[] {line, error}`.
* Commit endpoint upserts `Bet` rows for valid entries only.

---

## 7) Testing

* **Backend**: Pytest for auth, bet creation, settlement math, KPIs. Use a transactional test DB.
* **Frontend**: Vitest + Testing Library for forms and KPI rendering. Playwright smoke test: login → add bet → see KPI change.

---

## 8) Security & Ops

* CORS restricted to known origins.
* Store JWT in **httpOnly Secure SameSite=Lax cookies** in production.
* Rate‑limit auth & import endpoints (e.g., `slowapi`).
* Validate all payloads with Pydantic & Zod.
* Alembic migrations for all schema changes.

---

## 9) Environment & Scripts

**Frontend** `.env.example`

```
VITE_API_BASE=http://localhost:8000
```

**Backend** `.env.example` (see §3.1) and `scripts`:

```
# backend
uvicorn app.main:app --reload
alembic init alembic
alembic revision --autogenerate -m "init"
alembic upgrade head
pytest -q
```

---

## 10) Deployment

* **Backend**: Render/Fly/Railway. Set env vars, run migrations on release, expose `https://api.<domain>`.
* **Frontend**: Vercel → set `VITE_API_BASE` to backend URL. Configure CORS accordingly.
* **Domain**: `app.trackmybets.xyz` (example). Redirect `www` to apex.

---

## 11) Acceptance Criteria

* [ ] User can register/login; JWT stored in cookie; `/auth/me` returns profile & settings.
* [ ] User sets **base unit**; new bets show computed **units**.
* [ ] Add bet (validations), edit, delete, **settle**; profit math matches spec.
* [ ] Dashboard shows **PnL, Units, ROI%, Hit Rate** for date range; values match DB aggregation.
* [ ] CSV import for DK/FD works with preview + row‑level errors.
* [ ] Mobile layout renders cleanly (Lighthouse Perf & A11y ≥ 90 on mobile).
* [ ] Deployed FE+BE with environment docs.

---

## 12) Stretch Goals (Post‑MVP)

* Parlay legs & combined odds; futures support.
* CLV tracking (add `closing_odds_american`) + external odds API.
* Bankroll snapshots and equity curve.
* Shareable summary cards (image export).
* OAuth social login.
* iOS/Android wrapper via Capacitor.

---

## 13) Helpful Snippets

**Odds/Profit (shared logic reference)**

```py
def american_to_decimal(a:int)->float:
    return 1 + a/100 if a>0 else 1 + 100/abs(a)

def profit(odds_a:int, stake:float, status:str, cashout_amount:float|None=None)->float:
    dec = american_to_decimal(odds_a)
    if status=="Won": return stake*(dec-1)
    if status=="Lost": return -stake
    if status in ("Push","Void"): return 0.0
    if status=="Cashout": return (cashout_amount or 0)-stake
    return 0.0
```

**React query example**

```ts
// frontend/src/lib/api.ts
import axios from "axios";
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE, withCredentials: true });
export async function fetchKPIs(params?: {from?:string; to?:string}) {
  const { data } = await api.get("/api/v1/analytics/kpis", { params });
  return data as { pnl:number; units:number; roiPct:number; hitRate:number; avgOdds:number };
}
```

---

**End of claude.md**
