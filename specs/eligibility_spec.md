# Eligibility & Credit Rules — Feature Spec

References `specs/app_spec.md`. Runs after intake (AC-01) creates an application. Validates policy
rules, then computes a credit score and DTI, deciding auto-decline or pass-through to pricing
(`specs/risk_pricing_spec.md`). Not exposed as a public HTTP endpoint — invoked by the underwriting
orchestration built in `specs/underwriting_spec.md`.

## Acceptance Criteria

**AC-02**: Eligibility rules validate minimum income (config: `MIN_INCOME`), age band (config:
`MIN_AGE`/`MAX_AGE`, looked up from the applicant's profile), and employment type (config:
`ELIGIBLE_EMPLOYMENT_TYPES`, taken from the submitted application). A failing rule moves the
application to `REJECTED` with a machine-readable reason code — one of `INELIGIBLE_INCOME`,
`INELIGIBLE_AGE`, `INELIGIBLE_EMPLOYMENT`.

**AC-03**: A credit score is computed from a stubbed bureau pull (deterministic stub keyed by
`applicantId`) plus the applicant's income/obligation ratio. A debt-to-income ratio above the
configured ceiling (config: `DTI_CEILING`) auto-declines the application to `REJECTED` with reason
`DTI_EXCEEDED`, regardless of the credit score itself.

## Edge Cases
- Multiple eligibility rules fail simultaneously → report the first-failing rule only, in a fixed
  priority order: income, then age, then employment — keeps the rejection reason deterministic.
- Bureau stub has no synthetic record for an unknown `applicantId` → treated as the lowest score band
  (no error thrown).
- An applicant profile with no age on record fails the age-band check with `INELIGIBLE_AGE` rather than
  throwing — missing data is treated as ineligible, not an error.

## Out of Scope
Risk-based pricing (`specs/risk_pricing_spec.md`), the underwriting review queue
(`specs/underwriting_spec.md`), disbursement (`specs/disbursement_spec.md`).
