import { describe, it, expect } from 'vitest';
import {
  americanToDecimal,
  impliedProbFromAmerican,
  profit,
  calculateUnits,
  calculateParlayOdds,
} from '../../lib/odds';

describe('Odds Utilities', () => {
  describe('americanToDecimal', () => {
    it('converts positive American odds to decimal', () => {
      expect(americanToDecimal(150)).toBe(2.5);
      expect(americanToDecimal(100)).toBe(2);
      expect(americanToDecimal(200)).toBe(3);
    });

    it('converts negative American odds to decimal', () => {
      expect(americanToDecimal(-110)).toBeCloseTo(1.909, 3);
      expect(americanToDecimal(-200)).toBe(1.5);
      expect(americanToDecimal(-150)).toBeCloseTo(1.667, 3);
    });

    it('handles zero odds', () => {
      expect(americanToDecimal(0)).toBe(1);
    });
  });

  describe('impliedProbFromAmerican', () => {
    it('calculates implied probability correctly', () => {
      expect(impliedProbFromAmerican(100)).toBe(0.5);
      expect(impliedProbFromAmerican(-110)).toBeCloseTo(0.524, 3);
      expect(impliedProbFromAmerican(150)).toBe(0.4);
    });
  });

  describe('profit', () => {
    it('calculates profit for won bet', () => {
      expect(profit(-110, 110, 'Won')).toBeCloseTo(100, 2);
      expect(profit(150, 100, 'Won')).toBeCloseTo(150, 2);
      expect(profit(200, 50, 'Won')).toBeCloseTo(100, 2);
    });

    it('calculates loss for lost bet', () => {
      expect(profit(-110, 110, 'Lost')).toBe(-110);
      expect(profit(150, 100, 'Lost')).toBe(-100);
    });

    it('returns zero for push or void', () => {
      expect(profit(-110, 110, 'Push')).toBe(0);
      expect(profit(-110, 110, 'Void')).toBe(0);
    });

    it('calculates cashout correctly', () => {
      expect(profit(-110, 100, 'Cashout', 150)).toBe(50);
      expect(profit(-110, 100, 'Cashout', 50)).toBe(-50);
    });
  });

  describe('calculateUnits', () => {
    it('calculates units from stake and base unit', () => {
      expect(calculateUnits(100, 50)).toBe(2);
      expect(calculateUnits(75, 50)).toBe(1.5);
      expect(calculateUnits(50, 50)).toBe(1);
    });

    it('handles zero base unit', () => {
      expect(calculateUnits(100, 0)).toBe(0);
    });
  });

  describe('calculateParlayOdds', () => {
    it('calculates combined parlay odds', () => {
      expect(calculateParlayOdds([2, 2])).toBe(4);
      expect(calculateParlayOdds([1.5, 2, 1.8])).toBeCloseTo(5.4, 1);
      expect(calculateParlayOdds([1.91, 1.91])).toBeCloseTo(3.648, 3);
    });
  });
});
