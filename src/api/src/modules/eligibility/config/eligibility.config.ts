export const eligibilityConfig = {
  MIN_INCOME: '2000.00',
  MIN_AGE: 21,
  MAX_AGE: 60,
  ELIGIBLE_EMPLOYMENT_TYPES: ['SALARIED', 'SELF_EMPLOYED'] as const,
  DTI_CEILING: '0.45',
};

export const EligibilityRejectionReason = {
  INELIGIBLE_INCOME: 'INELIGIBLE_INCOME',
  INELIGIBLE_AGE: 'INELIGIBLE_AGE',
  INELIGIBLE_EMPLOYMENT: 'INELIGIBLE_EMPLOYMENT',
  DTI_EXCEEDED: 'DTI_EXCEEDED',
} as const;

export type EligibilityRejectionReason =
  (typeof EligibilityRejectionReason)[keyof typeof EligibilityRejectionReason];
