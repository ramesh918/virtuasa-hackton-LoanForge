# Risk-Based Pricing — Feature Spec

References `specs/app_spec.md`. Runs after eligibility (`specs/eligibility_spec.md`) produces a credit
score for an application that passed policy. Maps the score to an interest-rate band, computes the
offered EMI, and persists the offer so it can be shown to the applicant later.

## Acceptance Criteria

**AC-04**: Given a credit score, the pricing engine assigns an interest-rate band from a configured
table (config: `RATE_BANDS` — score >= 750 -> 10%, 650–749 -> 14%, below 650 -> 18%). The offered EMI is
computed in fixed-point (`Decimal`) using the standard EMI formula (via the `emi-calculator` skill) and
rounded to 2 decimal places. The resulting offer (rate band, annual rate, EMI, tenure, total payable) is
persisted against the application.

## Edge Cases
- A score exactly on a band boundary (e.g. 750, 650) is inclusive on the lower bound of the higher band
  — `RATE_BANDS` is ordered so the first matching (highest) threshold wins.
- Tenure of 0 or negative is not re-validated here — intake (AC-01) is responsible for rejecting an
  invalid tenure before an application ever reaches pricing.

## Out of Scope
The underwriting decision that triggers pricing (`specs/underwriting_spec.md`), disbursement
(`specs/disbursement_spec.md`).
