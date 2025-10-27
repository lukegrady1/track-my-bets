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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Analytics Schemas
# ============================================================================

class KPIData(BaseModel):
    """KPI data schema."""
    pnl: float
    units: float
    roi_pct: float
    hit_rate: float
    avg_odds: float
    total_bets: int
    pending_bets: int


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
