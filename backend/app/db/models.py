import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class BetStatus(str, enum.Enum):
    """Bet status enumeration."""
    PENDING = "Pending"
    WON = "Won"
    LOST = "Lost"
    PUSH = "Push"
    VOID = "Void"
    CASHOUT = "Cashout"


class Sport(str, enum.Enum):
    """Sports enumeration."""
    NFL = "NFL"
    NBA = "NBA"
    MLB = "MLB"
    NHL = "NHL"
    NCAAF = "NCAAF"
    NCAAB = "NCAAB"
    SOCCER = "Soccer"
    MMA = "MMA"
    OTHER = "Other"


class MarketType(str, enum.Enum):
    """Market type enumeration."""
    ML = "ML"
    SPREAD = "Spread"
    TOTAL = "Total"
    PROP = "Prop"
    PARLAY = "Parlay"
    FUTURE = "Future"
    OTHER = "Other"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bets = relationship("Bet", back_populates="user", cascade="all, delete-orphan")
    sportsbooks = relationship("Sportsbook", back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    """User settings model."""
    __tablename__ = "user_settings"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    base_unit = Column(Float, nullable=False, default=50.0)
    default_book_id = Column(UUID(as_uuid=True), ForeignKey("sportsbooks.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="settings")
    default_book = relationship("Sportsbook", foreign_keys=[default_book_id])


class Sportsbook(Base):
    """Sportsbook model."""
    __tablename__ = "sportsbooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # NULL = global
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="sportsbooks")
    bets = relationship("Bet", back_populates="book", foreign_keys="Bet.book_id")


class Bet(Base):
    """Bet model."""
    __tablename__ = "bets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bet_name = Column(String, nullable=False)
    sport = Column(SQLEnum(Sport), nullable=False)
    league = Column(String, nullable=True)
    market_type = Column(SQLEnum(MarketType), nullable=False)
    team_or_player = Column(String, nullable=True)
    odds_american = Column(Integer, nullable=False)
    stake = Column(Float, nullable=False)
    units = Column(Float, nullable=False)
    status = Column(SQLEnum(BetStatus), nullable=False, default=BetStatus.PENDING)
    result_profit = Column(Float, nullable=True)
    cashout_amount = Column(Float, nullable=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("sportsbooks.id", ondelete="SET NULL"), nullable=True)
    event_date = Column(DateTime, nullable=True)
    placed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    closing_odds_american = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    parlay_group_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bets")
    book = relationship("Sportsbook", back_populates="bets", foreign_keys=[book_id])
