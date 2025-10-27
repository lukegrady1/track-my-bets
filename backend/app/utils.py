"""Utility functions for odds calculations and profit computation."""


def american_to_decimal(odds_american: int) -> float:
    """Convert American odds to decimal odds.

    Args:
        odds_american: American odds (e.g., -110, +150)

    Returns:
        Decimal odds (e.g., 1.91, 2.50)
    """
    if odds_american == 0:
        return 1.0
    if odds_american > 0:
        return 1 + (odds_american / 100)
    else:
        return 1 + (100 / abs(odds_american))


def implied_prob_from_american(odds_american: int) -> float:
    """Calculate implied probability from American odds.

    Args:
        odds_american: American odds

    Returns:
        Implied probability as a decimal (0-1)
    """
    decimal = american_to_decimal(odds_american)
    return 1 / decimal if decimal > 0 else 0


def calculate_profit(
    odds_american: int,
    stake: float,
    status: str,
    cashout_amount: float | None = None
) -> float:
    """Calculate profit for a settled bet.

    Args:
        odds_american: American odds
        stake: Bet amount
        status: Bet status (Won, Lost, Push, Void, Cashout)
        cashout_amount: Cashout amount if applicable

    Returns:
        Profit (positive) or loss (negative)
    """
    decimal_odds = american_to_decimal(odds_american)

    if status == "Won":
        return stake * (decimal_odds - 1)
    elif status == "Lost":
        return -stake
    elif status in ("Push", "Void"):
        return 0.0
    elif status == "Cashout":
        return (cashout_amount or 0) - stake
    else:
        return 0.0


def calculate_units(stake: float, base_unit: float) -> float:
    """Calculate units from stake and base unit.

    Args:
        stake: Bet amount
        base_unit: User's base unit size

    Returns:
        Units (rounded to 4 decimal places)
    """
    if base_unit <= 0:
        return 0.0
    return round(stake / base_unit, 4)


def calculate_roi(total_pnl: float, total_staked: float) -> float:
    """Calculate ROI percentage.

    Args:
        total_pnl: Total profit/loss
        total_staked: Total amount staked

    Returns:
        ROI as a percentage
    """
    if total_staked == 0:
        return 0.0
    return round((total_pnl / total_staked) * 100, 2)


def calculate_hit_rate(wins: int, losses: int) -> float:
    """Calculate hit rate percentage.

    Args:
        wins: Number of wins
        losses: Number of losses

    Returns:
        Hit rate as a percentage
    """
    total = wins + losses
    if total == 0:
        return 0.0
    return round((wins / total) * 100, 2)
