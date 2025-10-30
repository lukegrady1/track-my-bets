from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.security import current_user
from app.db.session import get_db
from app.db import models
from app import schemas
from app.utils import calculate_roi, calculate_hit_rate, american_to_decimal

router = APIRouter()


@router.get("/kpis", response_model=schemas.KPIData)
def get_kpis(
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
    from_date: Optional[datetime] = Query(None, description="Start date filter"),
    to_date: Optional[datetime] = Query(None, description="End date filter")
):
    """Get KPI metrics for the user."""
    # Build base query for settled bets
    query = db.query(models.Bet).filter(models.Bet.user_id == user.id)

    # Apply date filters
    if from_date:
        query = query.filter(models.Bet.placed_at >= from_date)
    if to_date:
        query = query.filter(models.Bet.placed_at <= to_date)

    # Get all bets
    all_bets = query.all()

    # Filter settled bets (Won or Lost) for ROI calculation
    settled_bets = [b for b in all_bets if b.status in [models.BetStatus.WON, models.BetStatus.LOST]]

    # Calculate metrics
    total_pnl = sum(b.result_profit or 0 for b in all_bets if b.result_profit is not None)
    total_units = sum(b.units * (1 if b.result_profit and b.result_profit > 0 else -1 if b.result_profit and b.result_profit < 0 else 0)
                      for b in all_bets if b.result_profit is not None)

    # Calculate total staked from Won/Lost bets only
    total_staked = sum(b.stake for b in settled_bets)

    # Calculate ROI
    roi_pct = calculate_roi(total_pnl, total_staked)

    # Calculate hit rate
    wins = len([b for b in all_bets if b.status == models.BetStatus.WON])
    losses = len([b for b in all_bets if b.status == models.BetStatus.LOST])
    hit_rate = calculate_hit_rate(wins, losses)

    # Calculate average odds (of all bets)
    if all_bets:
        avg_odds = sum(american_to_decimal(b.odds_american) for b in all_bets) / len(all_bets)
        avg_odds_american = sum(b.odds_american for b in all_bets) / len(all_bets)
    else:
        avg_odds = 0
        avg_odds_american = 0

    # Count bets
    total_bets = len(all_bets)
    pending_bets = len([b for b in all_bets if b.status == models.BetStatus.PENDING])

    return schemas.KPIData(
        totalPnL=round(total_pnl, 2),
        totalUnits=round(total_units, 2),
        roi=roi_pct,
        hitRate=hit_rate,
        avgOdds=round(avg_odds_american, 0),
        totalBets=total_bets,
        wonBets=wins,
        lostBets=losses,
        pendingBets=pending_bets
    )


@router.get("/breakdown", response_model=list[schemas.BreakdownItem])
def get_breakdown(
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
    dim: str = Query(..., description="Dimension: book, sport, or market"),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None)
):
    """Get performance breakdown by dimension (book, sport, or market)."""
    # Build base query
    query = db.query(models.Bet).filter(models.Bet.user_id == user.id)

    # Apply date filters
    if from_date:
        query = query.filter(models.Bet.placed_at >= from_date)
    if to_date:
        query = query.filter(models.Bet.placed_at <= to_date)

    # Get all bets
    bets = query.all()

    # Group by dimension
    breakdown = {}

    for bet in bets:
        # Determine key based on dimension
        if dim == "book":
            if bet.book_id:
                key = bet.book.name if bet.book else "Unknown"
            else:
                key = "Unknown"
        elif dim == "sport":
            key = bet.sport.value if isinstance(bet.sport, models.Sport) else bet.sport
        elif dim == "market":
            key = bet.market_type.value if isinstance(bet.market_type, models.MarketType) else bet.market_type
        else:
            key = "Unknown"

        if key not in breakdown:
            breakdown[key] = {
                "pnl": 0,
                "staked": 0,
                "count": 0
            }

        # Accumulate metrics
        breakdown[key]["count"] += 1
        if bet.result_profit is not None:
            breakdown[key]["pnl"] += bet.result_profit
        if bet.status in [models.BetStatus.WON, models.BetStatus.LOST]:
            breakdown[key]["staked"] += bet.stake

    # Convert to response format
    result = []
    for key, data in breakdown.items():
        roi_pct = calculate_roi(data["pnl"], data["staked"])
        result.append(schemas.BreakdownItem(
            key=key,
            pnl=round(data["pnl"], 2),
            roi=roi_pct,
            count=data["count"]
        ))

    # Sort by PnL descending
    result.sort(key=lambda x: x.pnl, reverse=True)

    return result


@router.get("/bankroll", response_model=list[schemas.BankrollPoint])
def get_bankroll(
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None)
):
    """Get bankroll over time (cumulative P&L)."""
    # Build base query
    query = db.query(models.Bet).filter(
        models.Bet.user_id == user.id,
        models.Bet.result_profit.isnot(None)
    ).order_by(models.Bet.placed_at)

    # Apply date filters
    if from_date:
        query = query.filter(models.Bet.placed_at >= from_date)
    if to_date:
        query = query.filter(models.Bet.placed_at <= to_date)

    # Get all settled bets
    bets = query.all()

    # Calculate cumulative P&L
    bankroll_points = []
    cumulative_pnl = 0
    starting_balance = user.settings.base_unit * 20 if user.settings else 1000  # Assume 20 unit bankroll

    for bet in bets:
        cumulative_pnl += bet.result_profit or 0
        bankroll_points.append(schemas.BankrollPoint(
            date=bet.placed_at,
            cumulative_pnl=round(cumulative_pnl, 2),
            balance=round(starting_balance + cumulative_pnl, 2)
        ))

    return bankroll_points
