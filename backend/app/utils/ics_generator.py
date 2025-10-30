"""ICS (iCalendar) file generator for bet calendar events."""

import hashlib
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from app.db.models import Bet, UserSettings, Sport


# Sport duration mapping
SPORT_DURATIONS = {
    Sport.NFL: timedelta(hours=3),
    Sport.NBA: timedelta(hours=2, minutes=45),
    Sport.MLB: timedelta(hours=3),
    Sport.NHL: timedelta(hours=2, minutes=45),
    Sport.NCAAF: timedelta(hours=3),
    Sport.NCAAB: timedelta(hours=2, minutes=30),
    Sport.SOCCER: timedelta(hours=2, minutes=10),
    Sport.MMA: timedelta(hours=3),
    Sport.OTHER: timedelta(hours=2),
}


def escape_ics_text(text: str) -> str:
    """
    Escape special characters for ICS format.

    Per RFC 5545:
    - Newlines must be escaped as \\n
    - Commas, semicolons, and backslashes must be escaped
    """
    if not text:
        return ""

    text = text.replace("\\", "\\\\")  # Backslash first
    text = text.replace(",", "\\,")
    text = text.replace(";", "\\;")
    text = text.replace("\n", "\\n")
    text = text.replace("\r", "")  # Remove carriage returns

    return text


def format_ics_datetime(dt: datetime) -> str:
    """
    Format datetime to ICS format (UTC with Z suffix).

    Example: 20251028T143000Z
    """
    # Convert to UTC if not already
    if dt.tzinfo is not None:
        dt = dt.astimezone(None).replace(tzinfo=None)

    return dt.strftime("%Y%m%dT%H%M%SZ")


def generate_ics_uid(user_id: UUID, bet_id: UUID, event_date: datetime) -> str:
    """
    Generate deterministic UID for ICS event.

    This ensures the same bet always gets the same UID,
    allowing calendar apps to detect duplicates.
    """
    data = f"{user_id}|{bet_id}|{event_date.isoformat()}"
    hash_hex = hashlib.md5(data.encode()).hexdigest()
    return f"{hash_hex}@trackmybets.app"


def get_sport_duration(sport: Sport) -> timedelta:
    """Get typical duration for a sport."""
    return SPORT_DURATIONS.get(sport, timedelta(hours=2))


def build_ics(bet: Bet, user_settings: UserSettings, book_name: Optional[str] = None) -> str:
    """
    Build ICS file content for a bet event.

    Args:
        bet: Bet model instance
        user_settings: User settings model instance
        book_name: Optional sportsbook name

    Returns:
        ICS file content as string

    Raises:
        ValueError: If bet.event_date is None
    """
    if not bet.event_date:
        raise ValueError("Bet must have an event_date to create calendar event")

    # Event times (in UTC)
    event_start = bet.event_date
    event_duration = get_sport_duration(bet.sport)
    event_end = event_start + event_duration

    # Current timestamp
    now = datetime.utcnow()

    # Generate UID
    uid = generate_ics_uid(bet.user_id, bet.id, bet.event_date)

    # Format odds
    odds_str = f"{'+' if bet.odds_american > 0 else ''}{bet.odds_american}"

    # Build event summary (title)
    summary_parts = [bet.bet_name]
    if bet.team_or_player:
        summary_parts.append(f"– {bet.team_or_player}")
    summary_parts.append(f"({odds_str})")
    summary = escape_ics_text(" ".join(summary_parts))

    # Build event description
    description_lines = [
        f"Bet: {bet.market_type.value}",
        f"Selection: {bet.team_or_player or 'N/A'} ({odds_str})",
        f"Stake: ${bet.stake:.2f} ({bet.units:.2f}u)",
    ]
    if book_name:
        description_lines.append(f"Book: {book_name}")
    description_lines.append(f"Bet ID: {bet.id}")
    description = escape_ics_text("\\n".join(description_lines))

    # Reminder offset
    reminder_min = user_settings.calendar_reminder_min or 30

    # Build ICS content
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TrackMyBets//Calendar 1.0//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{format_ics_datetime(now)}",
        f"DTSTART:{format_ics_datetime(event_start)}",
        f"DTEND:{format_ics_datetime(event_end)}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
        f"STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        f"TRIGGER:-PT{reminder_min}M",
        "DESCRIPTION:Reminder",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ]

    # Join with CRLF line endings (RFC 5545 requires CRLF)
    return "\r\n".join(ics_lines) + "\r\n"
