import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import current_user
from app.db.session import get_db
from app.db import models
from app import schemas
from app.utils import calculate_units

router = APIRouter()


def parse_csv_row(row: dict, provider: str = "auto") -> Optional[dict]:
    """Parse a CSV row based on provider format."""
    # Auto-detect or use specific provider mapping
    # For now, we'll use a generic mapping that works for most formats

    try:
        # Try to map common field names
        bet_data = {}

        # Bet name (various possible column names)
        bet_data["bet_name"] = (
            row.get("Event") or
            row.get("Game") or
            row.get("Bet Name") or
            row.get("Description") or
            "Imported Bet"
        )

        # Sport
        bet_data["sport"] = row.get("Sport", "Other")

        # Market type
        market = row.get("Market") or row.get("Bet Type") or "ML"
        # Map common values
        market_map = {
            "Moneyline": "ML",
            "Money Line": "ML",
            "Point Spread": "Spread",
            "Total": "Total",
            "Over/Under": "Total",
            "Prop": "Prop",
            "Parlay": "Parlay"
        }
        bet_data["market_type"] = market_map.get(market, market)

        # Selection/Team
        bet_data["team_or_player"] = row.get("Selection") or row.get("Team") or row.get("Pick")

        # Odds
        odds_str = row.get("Odds") or row.get("American Odds") or row.get("Price") or "0"
        bet_data["odds_american"] = int(odds_str.replace("+", ""))

        # Stake
        stake_str = row.get("Stake") or row.get("Amount") or row.get("Wager") or "0"
        bet_data["stake"] = float(stake_str.replace("$", "").replace(",", ""))

        # Status
        status_str = row.get("Result") or row.get("Status") or "Pending"
        # Map common values
        status_map = {
            "Win": "Won",
            "W": "Won",
            "Loss": "Lost",
            "L": "Lost",
            "Push": "Push",
            "Void": "Void",
            "Pending": "Pending",
            "Open": "Pending"
        }
        bet_data["status"] = status_map.get(status_str, status_str)

        # Date
        date_str = row.get("Placed") or row.get("Date") or row.get("Time") or datetime.utcnow().isoformat()
        try:
            bet_data["placed_at"] = datetime.fromisoformat(date_str)
        except:
            # Try common date formats
            for fmt in ["%Y-%m-%d %H:%M", "%Y-%m-%d", "%m/%d/%Y", "%m/%d/%Y %H:%M"]:
                try:
                    bet_data["placed_at"] = datetime.strptime(date_str, fmt)
                    break
                except:
                    continue
            else:
                bet_data["placed_at"] = datetime.utcnow()

        # Optional fields
        bet_data["league"] = row.get("League")
        bet_data["notes"] = row.get("Notes")

        return bet_data

    except Exception as e:
        return None


@router.post("/csv", response_model=schemas.CSVImportResponse)
async def import_csv(
    file: UploadFile = File(...),
    provider: str = "auto",
    commit: bool = False,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """Import bets from a CSV file.

    Args:
        file: The CSV file to import
        provider: Provider format (auto, dk, fd, mgm)
        commit: If True, import the bets. If False, just preview.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )

    # Read CSV content
    content = await file.read()
    csv_text = content.decode('utf-8')
    csv_file = io.StringIO(csv_text)

    # Parse CSV
    reader = csv.DictReader(csv_file)

    valid_rows = []
    invalid_rows = []

    for line_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
        parsed = parse_csv_row(row, provider)

        if parsed is None:
            invalid_rows.append({
                "line": line_num,
                "error": "Could not parse row",
                "row": row
            })
            continue

        # Validate required fields
        if parsed["odds_american"] == 0:
            invalid_rows.append({
                "line": line_num,
                "error": "Odds cannot be zero",
                "row": row
            })
            continue

        if parsed["stake"] <= 0:
            invalid_rows.append({
                "line": line_num,
                "error": "Stake must be positive",
                "row": row
            })
            continue

        valid_rows.append(parsed)

    # If commit=True, insert the bets
    if commit and valid_rows:
        if not user.settings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User settings not found. Please set your base unit first."
            )

        for bet_data in valid_rows:
            # Calculate units
            units = calculate_units(bet_data["stake"], user.settings.base_unit)

            # Calculate profit if settled
            result_profit = None
            if bet_data["status"] in ["Won", "Lost", "Push", "Void"]:
                from app.utils import calculate_profit
                result_profit = calculate_profit(
                    bet_data["odds_american"],
                    bet_data["stake"],
                    bet_data["status"]
                )

            # Create bet
            new_bet = models.Bet(
                user_id=user.id,
                bet_name=bet_data["bet_name"],
                sport=bet_data["sport"],
                league=bet_data.get("league"),
                market_type=bet_data["market_type"],
                team_or_player=bet_data.get("team_or_player"),
                odds_american=bet_data["odds_american"],
                stake=bet_data["stake"],
                units=units,
                status=bet_data["status"],
                result_profit=result_profit,
                placed_at=bet_data["placed_at"],
                notes=bet_data.get("notes")
            )
            db.add(new_bet)

        db.commit()

    return schemas.CSVImportResponse(
        valid_rows=[schemas.CSVImportRow(**row) for row in valid_rows],
        invalid_rows=invalid_rows,
        message=f"Preview: {len(valid_rows)} valid, {len(invalid_rows)} invalid rows" if not commit
                else f"Imported {len(valid_rows)} bets successfully"
    )
