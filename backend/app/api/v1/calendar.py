"""Calendar integration API endpoints."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.db.models import User, Bet, Sportsbook
from app import schemas
from app.utils.ics_generator import build_ics


router = APIRouter()


@router.post("/prepare", response_model=schemas.CalendarPrepareResponse)
def prepare_calendar_event(
    request: schemas.CalendarPrepareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> schemas.CalendarPrepareResponse:
    """
    Prepare calendar event for a bet.

    Determines the best action for adding a bet to the user's calendar:
    - If already added: returns duplicate status
    - For ICS provider: returns download URL
    - For Google (future): would create event directly
    - For Outlook: returns web calendar link
    """
    # Fetch bet
    bet = db.query(Bet).filter(
        Bet.id == request.betId,
        Bet.user_id == current_user.id
    ).first()

    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    # Check if event_date exists
    if not bet.event_date:
        raise HTTPException(
            status_code=400,
            detail="Bet must have an event_date to create calendar event"
        )

    # Check if already added to calendar
    if bet.calendar_provider:
        return schemas.CalendarPrepareResponse(
            action="duplicate",
            status="duplicate",
            message=f"This bet was already added to {bet.calendar_provider} calendar on {bet.calendar_created_at.strftime('%Y-%m-%d %H:%M')}"
        )

    # Determine provider (default to 'ics' if not specified)
    provider = request.provider or current_user.settings.preferred_calendar_provider or "ics"

    # For MVP: only ICS download is supported
    if provider == "google":
        # Future: Google OAuth integration
        return schemas.CalendarPrepareResponse(
            action="download-ics",
            status="created",
            downloadUrl=f"/api/v1/calendar/ics/{bet.id}",
            message="Google Calendar integration coming soon. Please download the ICS file instead."
        )
    elif provider == "outlook":
        # Future: Could generate Outlook.com web link
        return schemas.CalendarPrepareResponse(
            action="download-ics",
            status="created",
            downloadUrl=f"/api/v1/calendar/ics/{bet.id}",
            message="Please download the ICS file and import it into Outlook."
        )
    else:
        # Default: ICS download
        return schemas.CalendarPrepareResponse(
            action="download-ics",
            status="created",
            downloadUrl=f"/api/v1/calendar/ics/{bet.id}",
            message="Download ICS file to add to your calendar."
        )


@router.get("/ics/{bet_id}")
def download_ics(
    bet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Response:
    """
    Generate and download ICS file for a bet.

    Returns:
        ICS file as downloadable attachment with Content-Type: text/calendar
    """
    # Fetch bet with sportsbook relationship
    bet = db.query(Bet).filter(
        Bet.id == bet_id,
        Bet.user_id == current_user.id
    ).first()

    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    # Check if event_date exists
    if not bet.event_date:
        raise HTTPException(
            status_code=400,
            detail="Bet must have an event_date to create calendar event"
        )

    # Get sportsbook name if available
    book_name: Optional[str] = None
    if bet.book_id:
        book = db.query(Sportsbook).filter(Sportsbook.id == bet.book_id).first()
        if book:
            book_name = book.name

    # Generate ICS file content
    try:
        ics_content = build_ics(bet, current_user.settings, book_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Update bet with calendar metadata (mark as added to calendar)
    bet.calendar_provider = "ics"
    bet.calendar_created_at = datetime.utcnow()
    bet.calendar_timezone = current_user.settings.timezone
    bet.calendar_reminder_min = current_user.settings.calendar_reminder_min
    db.commit()

    # Generate filename
    # Sanitize bet name for filename (remove special chars)
    safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in bet.bet_name)
    safe_name = safe_name[:50]  # Limit length
    filename = f"{safe_name}_{bet_id}.ics"

    # Return ICS file as downloadable attachment
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )


@router.delete("/{bet_id}")
def remove_calendar_event(
    bet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove calendar event metadata from bet.

    This doesn't delete the event from the user's calendar app,
    but allows them to re-add it if needed.
    """
    bet = db.query(Bet).filter(
        Bet.id == bet_id,
        Bet.user_id == current_user.id
    ).first()

    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    # Clear calendar metadata
    bet.calendar_provider = None
    bet.calendar_event_id = None
    bet.calendar_created_at = None
    bet.calendar_timezone = None
    bet.calendar_reminder_min = None
    db.commit()

    return {"message": "Calendar event metadata removed. You can now re-add this bet to your calendar."}
