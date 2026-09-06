# Intake — Feature Spec

References `specs/app_spec.md`. Owns application creation and duplicate-application prevention.

## Overview
An applicant submits amount, tenure, purpose, income, and employment type. The system creates an
application record with a unique `application_id`, starting in `SUBMITTED` state. Before creating a new
application, the system refuses a second active application for the same applicant and product within a
configured window.

## Acceptance Criteria

**AC-01**: Submitting valid application data (amount, tenure, purpose, income, employment) creates an
application with a unique `application_id` and `state = SUBMITTED`.

**AC-05**: Duplicate-application prevention — a second active application (state not in
`{REJECTED, CLOSED}`) for the same `applicantId` + `productId` within the configured window
(`DUPLICATE_WINDOW_DAYS`) is refused by throwing `DuplicateApplicationException`.

## Edge Cases
- Missing a required field (amount, tenure, purpose, income, employment) → validation error, no
  application created.
- Same applicant, different product → allowed, not a duplicate.
- Same applicant/product but the prior application is already `REJECTED` or `CLOSED` → allowed, not a
  duplicate.
- Amount/income are accepted and stored as fixed-point decimal strings, never native numbers (NFR-01).

## Out of Scope
Eligibility/credit checks (`specs/eligibility_spec.md`), pricing (`specs/risk_pricing_spec.md`),
underwriting decisions (`specs/underwriting_spec.md`), disbursement (`specs/disbursement_spec.md`).
