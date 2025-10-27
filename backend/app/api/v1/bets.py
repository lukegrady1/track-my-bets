from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.security import current_user
from app.db.session import get_db
from app.db import models
from app import schemas
from app.utils import calculate_units, calculate_profit

router = APIRouter()


@router.post("/", response_model=schemas.BetOut, status_code=status.HTTP_201_CREATED)
def create_bet(
    body: schemas.BetCreate,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Create a new bet."""
    # Calculate units from user's base unit
    if not user.settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User settings not found. Please set your base unit first."
        )

    units = calculate_units(body.stake, user.settings.base_unit)

    # Create bet
    new_bet = models.Bet(
        user_id=user.id,
        bet_name=body.bet_name,
        sport=body.sport,
        league=body.league,
        market_type=body.market_type,
        team_or_player=body.team_or_player,
        odds_american=body.odds_american,
        stake=body.stake,
        units=units,
        status=models.BetStatus.PENDING,
        book_id=body.book_id,
        event_date=body.event_date,
        notes=body.notes,
        parlay_group_id=body.parlay_group_id,
        placed_at=datetime.utcnow()
    )

    db.add(new_bet)
    db.commit()
    db.refresh(new_bet)

    return schemas.BetOut.model_validate(new_bet)


@router.get("/", response_model=list[schemas.BetOut])
def list_bets(
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    sport_filter: Optional[str] = Query(None, description="Filter by sport"),
    book_id_filter: Optional[UUID] = Query(None, description="Filter by sportsbook ID"),
    from_date: Optional[datetime] = Query(None, description="Filter from date"),
    to_date: Optional[datetime] = Query(None, description="Filter to date"),
    search: Optional[str] = Query(None, description="Search by bet name or team/player"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """List bets with optional filters."""
    query = db.query(models.Bet).filter(models.Bet.user_id == user.id)

    # Apply filters
    if status_filter:
        query = query.filter(models.Bet.status == status_filter)
    if sport_filter:
        query = query.filter(models.Bet.sport == sport_filter)
    if book_id_filter:
        query = query.filter(models.Bet.book_id == book_id_filter)
    if from_date:
        query = query.filter(models.Bet.placed_at >= from_date)
    if to_date:
        query = query.filter(models.Bet.placed_at <= to_date)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Bet.bet_name.ilike(search_pattern),
                models.Bet.team_or_player.ilike(search_pattern)
            )
        )

    # Order by most recent first
    query = query.order_by(models.Bet.placed_at.desc())

    # Pagination
    bets = query.offset(skip).limit(limit).all()

    return [schemas.BetOut.model_validate(bet) for bet in bets]


@router.get("/{bet_id}", response_model=schemas.BetOut)
def get_bet(
    bet_id: UUID,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Get a specific bet by ID."""
    bet = db.query(models.Bet).filter(
        models.Bet.id == bet_id,
        models.Bet.user_id == user.id
    ).first()

    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bet not found"
        )

    return schemas.BetOut.model_validate(bet)


@router.patch("/{bet_id}", response_model=schemas.BetOut)
def update_bet(
    bet_id: UUID,
    body: schemas.BetUpdate,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Update a bet."""
    bet = db.query(models.Bet).filter(
        models.Bet.id == bet_id,
        models.Bet.user_id == user.id
    ).first()

    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bet not found"
        )

    # Update fields
    update_data = body.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(bet, field, value)

    # Recalculate units if stake changed
    if body.stake is not None and user.settings:
        bet.units = calculate_units(body.stake, user.settings.base_unit)

    db.commit()
    db.refresh(bet)

    return schemas.BetOut.model_validate(bet)


@router.delete("/{bet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bet(
    bet_id: UUID,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Delete a bet."""
    bet = db.query(models.Bet).filter(
        models.Bet.id == bet_id,
        models.Bet.user_id == user.id
    ).first()

    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bet not found"
        )

    db.delete(bet)
    db.commit()

    return None


@router.post("/{bet_id}/settle", response_model=schemas.BetOut)
def settle_bet(
    bet_id: UUID,
    body: schemas.BetSettle,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Settle a bet and calculate profit."""
    bet = db.query(models.Bet).filter(
        models.Bet.id == bet_id,
        models.Bet.user_id == user.id
    ).first()

    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bet not found"
        )

    # Validate cashout amount if status is Cashout
    if body.status == "Cashout" and body.cashout_amount is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cashout amount required when status is Cashout"
        )

    # Calculate profit
    profit = calculate_profit(
        bet.odds_american,
        bet.stake,
        body.status,
        body.cashout_amount
    )

    # Update bet
    bet.status = body.status
    bet.result_profit = profit
    if body.cashout_amount is not None:
        bet.cashout_amount = body.cashout_amount

    db.commit()
    db.refresh(bet)

    return schemas.BetOut.model_validate(bet)
