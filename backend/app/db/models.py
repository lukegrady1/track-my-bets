import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Enum as SQLEnum, Boolean
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

    # Calendar settings
    preferred_calendar_provider = Column(String, nullable=True)  # 'google', 'ics', 'outlook', 'none'
    timezone = Column(String, nullable=False, default='America/New_York')
    calendar_reminder_min = Column(Integer, nullable=False, default=30)
    google_oauth_connected = Column(Boolean, nullable=False, default=False)
    google_refresh_token = Column(String, nullable=True)  # Should be encrypted in production

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

    # Calendar integration fields
    calendar_provider = Column(String, nullable=True)  # 'google', 'ics', 'outlook', 'none'
    calendar_event_id = Column(String, nullable=True)  # Google Calendar event ID if created
    calendar_created_at = Column(DateTime, nullable=True)
    calendar_timezone = Column(String, nullable=True)  # e.g., 'America/New_York'
    calendar_reminder_min = Column(Integer, nullable=True)  # Reminder minutes before event

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bets")
    book = relationship("Sportsbook", back_populates="bets", foreign_keys=[book_id])


class Group(Base):
    """Group model for social competition."""
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invite_code = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    monthly_stats = relationship("GroupMonthlyStats", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    """Group membership model."""
    __tablename__ = "group_members"

    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User")


class GroupMonthlyStats(Base):
    """Monthly statistics for group members."""
    __tablename__ = "group_monthly_stats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    month_year = Column(String, nullable=False)  # e.g., '2025-10'
    total_bets = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    pushes = Column(Integer, nullable=False, default=0)
    units = Column(Float, nullable=False, default=0.0)
    roi = Column(Float, nullable=False, default=0.0)
    win_rate = Column(Float, nullable=False, default=0.0)
    top_sport = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    group = relationship("Group", back_populates="monthly_stats")
    user = relationship("User")
