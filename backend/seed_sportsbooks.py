"""Seed common sportsbooks into the database."""
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Sportsbook
from app.core.config import settings

# Create engine
engine = create_engine(str(settings.DATABASE_URL))
SessionLocal = sessionmaker(bind=engine)

COMMON_SPORTSBOOKS = [
    "DraftKings",
    "FanDuel",
    "BetMGM",
    "Caesars",
    "BetRivers",
    "PointsBet",
    "Barstool",
    "WynnBET",
    "Unibet",
    "FOX Bet",
]


def seed_sportsbooks():
    """Seed common sportsbooks."""
    db = SessionLocal()
    try:
        # Check if sportsbooks already exist
        existing = db.query(Sportsbook).filter(Sportsbook.user_id.is_(None)).count()
        if existing > 0:
            print(f"[OK] {existing} sportsbooks already exist. Skipping seed.")
            return

        # Add common sportsbooks (user_id=None means global)
        for name in COMMON_SPORTSBOOKS:
            book = Sportsbook(name=name, user_id=None)
            db.add(book)

        db.commit()
        print(f"[OK] Seeded {len(COMMON_SPORTSBOOKS)} common sportsbooks")
    except Exception as e:
        print(f"[ERROR] Error seeding sportsbooks: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_sportsbooks()
