# FastAPI Development Guide

## Quick Start

### First Time Setup

```bash
# 1. Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
alembic upgrade head

# 2. Setup frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Daily Development

**Use run scripts:**
```bash
# Mac/Linux
./run.sh

# Windows
run.bat
```

## Project URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Common Tasks

### Creating a New Endpoint

1. Add to router in `backend/app/api/v1/`
2. Create schema in `backend/app/schemas.py`
3. Test in Swagger UI

### Adding Database Field

```bash
# 1. Update model in backend/app/db/models.py
# 2. Create migration
alembic revision --autogenerate -m "add field"
# 3. Apply
alembic upgrade head
```

### Debugging

**Backend SQL logging:**
```python
# In backend/app/db/session.py
engine = create_engine(settings.DATABASE_URL, echo=True)
```

**Frontend API debugging:**
```typescript
// Check DevTools → Network tab
// Or add console logs in frontend/src/lib/api.ts
```

## Helpful Commands

```bash
# View database
psql -U postgres -d trackmybets

# Reset database
alembic downgrade base
alembic upgrade head

# Run tests
cd backend && pytest
cd frontend && npm test
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guide.
