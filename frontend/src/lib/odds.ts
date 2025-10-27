/**
 * Odds calculation utilities
 * Implements the authoritative formulas from the specification
 */

export type BetStatus = 'Pending' | 'Won' | 'Lost' | 'Push' | 'Void' | 'Cashout';

/**
 * Convert American odds to decimal odds
 * @param a American odds (e.g., -110, +150)
 * @returns Decimal odds
 */
export function americanToDecimal(a: number): number {
  if (a === 0) return 1;
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}

/**
 * Calculate implied probability from American odds
 * @param a American odds
 * @returns Implied probability as a decimal (0-1)
 */
export function impliedProbFromAmerican(a: number): number {
  return 1 / americanToDecimal(a);
}

/**
 * Calculate profit/loss for a bet
 * @param oddsAmerican American odds
 * @param stake Amount wagered
 * @param status Bet outcome status
 * @param cashoutAmount Amount received on cashout (required if status is Cashout)
 * @returns Profit (positive) or loss (negative)
 */
export function profit(
  oddsAmerican: number,
  stake: number,
  status: BetStatus,
  cashoutAmount?: number
): number {
  const dec = americanToDecimal(oddsAmerican);

  switch (status) {
    case 'Won':
      return stake * (dec - 1);
    case 'Lost':
      return -stake;
    case 'Push':
    case 'Void':
      return 0;
    case 'Cashout':
      return (cashoutAmount ?? 0) - stake;
    case 'Pending':
      return 0;
    default:
      return 0;
  }
}

/**
 * Calculate units from stake and base unit
 * @param stake Amount wagered
 * @param baseUnit Base unit size from user settings
 * @returns Number of units
 */
export function calculateUnits(stake: number, baseUnit: number): number {
  if (baseUnit === 0) return 0;
  return stake / baseUnit;
}

/**
 * Calculate combined decimal odds for a parlay
 * @param decimalOdds Array of decimal odds for each leg
 * @returns Combined parlay decimal odds
 */
export function calculateParlayOdds(decimalOdds: number[]): number {
  return decimalOdds.reduce((acc, odds) => acc * odds, 1);
}

/**
 * Calculate potential payout
 * @param stake Amount wagered
 * @param decimalOdds Decimal odds
 * @returns Total payout (stake + profit)
 */
export function calculatePayout(stake: number, decimalOdds: number): number {
  return stake * decimalOdds;
}

/**
 * Format American odds with + or - prefix
 * @param odds American odds
 * @returns Formatted string (e.g., "+150", "-110")
 */
export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

/**
 * Format implied probability as percentage
 * @param impliedProb Implied probability (0-1)
 * @returns Formatted percentage string
 */
export function formatImpliedProb(impliedProb: number): string {
  return `${(impliedProb * 100).toFixed(1)}%`;
}
