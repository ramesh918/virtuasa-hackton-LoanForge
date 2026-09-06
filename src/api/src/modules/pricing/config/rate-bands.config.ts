export interface RateBand {
  minScore: number;
  annualRate: string;
  label: string;
}

/**
 * Ordered descending by minScore — assignRateBand returns the first (highest) threshold the score
 * clears, so a score exactly on a boundary lands in the higher band (AC-04 edge case).
 */
export const RATE_BANDS: RateBand[] = [
  { minScore: 750, annualRate: '0.10', label: 'PRIME' },
  { minScore: 650, annualRate: '0.14', label: 'STANDARD' },
  { minScore: 0, annualRate: '0.18', label: 'SUBPRIME' },
];
