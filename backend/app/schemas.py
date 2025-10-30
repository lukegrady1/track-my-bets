from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


# ============================================================================
# Auth Schemas
# ============================================================================

class UserRegister(BaseModel):
    """User registration schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""
    email: EmailStr


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """User output schema."""
    id: UUID
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# User Settings Schemas
# ============================================================================

class UserSettingsOut(BaseModel):
    """User settings output schema."""
    user_id: UUID
    base_unit: float
    default_book_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    """User settings update schema."""
    base_unit: Optional[float] = Field(None, gt=0)
    default_book_id: Optional[UUID] = None


# ============================================================================
# Sportsbook Schemas
# ============================================================================

class SportsbookCreate(BaseModel):
    """Sportsbook creation schema."""
    name: str


class SportsbookOut(BaseModel):
    """Sportsbook output schema."""
    id: UUID
    name: str
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Bet Schemas
# ============================================================================

class BetCreate(BaseModel):
    """Bet creation schema."""
    bet_name: str
    sport: str
    league: Optional[str] = None
    market_type: str
    team_or_player: Optional[str] = None
    odds_american: int = Field(..., description="American odds (e.g., -110, +150)")
    stake: float = Field(..., gt=0, description="Bet amount in currency")
    book_id: Optional[UUID] = None
    event_date: Optional[datetime] = None
    notes: Optional[str] = None
    parlay_group_id: Optional[UUID] = None

    @field_validator('odds_american')
    @classmethod
    def validate_odds(cls, v):
        if v == 0:
            raise ValueError("Odds cannot be zero")
        return v


class BetUpdate(BaseModel):
    """Bet update schema."""
    bet_name: Optional[str] = None
    sport: Optional[str] = None
    league: Optional[str] = None
    market_type: Optional[str] = None
    team_or_player: Optional[str] = None
    odds_american: Optional[int] = None
    stake: Optional[float] = Field(None, gt=0)
    book_id: Optional[UUID] = None
    event_date: Optional[datetime] = None
    notes: Optional[str] = None
    closing_odds_american: Optional[int] = None


class BetSettle(BaseModel):
    """Bet settlement schema."""
    status: str = Field(..., description="Won, Lost, Push, Void, or Cashout")
    cashout_amount: Optional[float] = Field(None, description="Required if status is Cashout")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        allowed = ["Won", "Lost", "Push", "Void", "Cashout"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class BetOut(BaseModel):
    """Bet output schema."""
    id: UUID
    user_id: UUID
    bet_name: str
    sport: str
    league: Optional[str] = None
    market_type: str
    team_or_player: Optional[str] = None
    odds_american: int
    stake: float
    units: float
    status: str
    result_profit: Optional[float] = None
    cashout_amount: Optional[float] = None
    book_id: Optional[UUID] = None
    event_date: Optional[datetime] = None
    placed_at: datetime
    closing_odds_american: Optional[int] = None
    notes: Optional[str] = None
    parlay_group_id: Optional[UUID] = None
    calendar_provider: Optional[str] = None
    calendar_event_id: Optional[str] = None
    calendar_created_at: Optional[datetime] = None
    calendar_timezone: Optional[str] = None
    calendar_reminder_min: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Analytics Schemas
# ============================================================================

class KPIData(BaseModel):
    """KPI data schema."""
    totalPnL: float
    totalUnits: float
    roi: float
    hitRate: float
    avgOdds: float
    totalBets: int
    wonBets: int
    lostBets: int
    pendingBets: int


class BreakdownItem(BaseModel):
    """Breakdown item schema."""
    key: str
    pnl: float
    roi_pct: float
    count: int


class BankrollPoint(BaseModel):
    """Bankroll time series point."""
    date: datetime
    cumulative_pnl: float
    balance: float


# ============================================================================
# CSV Import Schemas
# ============================================================================

class CSVImportRow(BaseModel):
    """CSV import row validation."""
    bet_name: str
    sport: str
    market_type: str
    odds_american: int
    stake: float
    status: str
    placed_at: datetime
    team_or_player: Optional[str] = None
    league: Optional[str] = None
    notes: Optional[str] = None


class CSVImportResponse(BaseModel):
    """CSV import response."""
    valid_rows: list[CSVImportRow]
    invalid_rows: list[dict]
    message: str


# ============================================================================
# Group & Leaderboard Schemas
# ============================================================================

class GroupCreate(BaseModel):
    """Group creation schema."""
    name: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=200)


class GroupJoin(BaseModel):
    """Join group by invite code."""
    invite_code: str


class GroupMemberOut(BaseModel):
    """Group member output schema."""
    user_id: UUID
    email: str
    joined_at: datetime

    class Config:
        from_attributes = True


class GroupOut(BaseModel):
    """Group output schema."""
    id: UUID
    name: str
    description: Optional[str]
    owner_id: UUID
    invite_code: str
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True


class GroupDetailOut(GroupOut):
    """Group detail with members."""
    members: list[GroupMemberOut]


class LeaderboardEntry(BaseModel):
    """Leaderboard entry for a single user."""
    rank: int
    user_id: UUID
    email: str
    roi: float
    units: float
    win_rate: float
    total_bets: int
    wins: int
    losses: int
    top_sport: Optional[str] = None


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""
    group_id: UUID
    group_name: str
    month: str
    leaderboard: list[LeaderboardEntry]


# ============================================================================
# Calendar Integration Schemas
# ============================================================================

class CalendarPrepareRequest(BaseModel):
    """Calendar prepare request schema."""
    betId: UUID
    provider: Optional[str] = None  # 'google', 'ics', 'outlook'

    @field_validator('provider')
    @classmethod
    def validate_provider(cls, v):
        if v and v not in ['google', 'ics', 'outlook']:
            raise ValueError("Provider must be 'google', 'ics', or 'outlook'")
        return v


class CalendarPrepareResponse(BaseModel):
    """Calendar prepare response schema."""
    action: str  # 'google-insert', 'download-ics', 'outlook-link'
    status: Optional[str] = None  # 'created', 'duplicate'
    eventId: Optional[str] = None
    downloadUrl: Optional[str] = None
    url: Optional[str] = None
    message: Optional[str] = None
