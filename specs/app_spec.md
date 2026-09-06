# LoanForge — Root Specification

## Problem
See `docs/business-case.md` for full context. In short: Nord Retail Bank needs a self-serve retail loan
origination platform that applies eligibility, credit, and pricing policy consistently, routes only
ambiguous cases to a human underwriter, and keeps a permanent, append-only record of every decision and
disbursement.

## Users & Roles
- **Applicant** — can submit applications and act only on their own applications.
- **Underwriter** — can view the review queue and record approve/decline/request-info decisions.
- **Admin** — relies on audit completeness and role enforcement; no dedicated admin UI is required for
  the mandatory scope.

Role boundaries are enforced at the controller layer (NFR-04) — an applicant must never be able to read
or act on another applicant's application, and underwriter-only actions must be rejected before they
reach any business logic if called by a non-underwriter.

## Capabilities (one per feature spec)
1. **Application Intake** — `specs/intake_spec.md`
2. **Eligibility & Credit Rules** — `specs/eligibility_spec.md`
3. **Risk-Based Pricing** — `specs/risk_pricing_spec.md`
4. **Underwriting & Approval Workflow** — `specs/underwriting_spec.md`
5. **Disbursement & Audit** — `specs/disbursement_spec.md`

## High-Level Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-01 | An applicant submits a loan application (amount, tenure, purpose, income, employment); the system creates an application with a unique application_id in SUBMITTED state. |
| AC-02 | Eligibility rules validate minimum income, age band, and employment type; a failing rule moves the application to REJECTED with a machine-readable reason. |
| AC-03 | A credit score is computed from a stubbed bureau pull plus income/obligation ratios; a debt-to-income ratio above the configured ceiling auto-declines. |
| AC-04 | Risk-based pricing assigns an interest-rate band from the score; the offered EMI is computed in fixed-point. |
| AC-05 | Duplicate-application prevention: a second active application for the same applicant and product within the configured window is refused with DuplicateApplicationException. |
| AC-06 | Loan lifecycle SUBMITTED -> UNDER_REVIEW -> (APPROVED \| REJECTED \| MANUAL_REVIEW) -> DISBURSED / CLOSED is enforced; invalid transitions raise InvalidApplicationStateException. |
| AC-07 | An underwriter can approve, decline, or request more information from a review queue; every decision is recorded with actor and timestamp. |
| AC-08 | On APPROVED and accepted, a disbursement record is generated (amount, schedule, account) via a stubbed payment adapter; the audit trail is append-only. |

Every AC-NN must be referenced by at least one test (test name or comment containing e.g. "AC-03").

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | All monetary and rate computation (EMI, interest, DTI) uses fixed-point (BigDecimal/decimal) — never floating-point. |
| NFR-02 | Application state transitions, underwriting decisions, and disbursement records are append-only. |
| NFR-03 | Applicant PII and financial data are never written to logs in clear text. |
| NFR-04 | Role separation (applicant / underwriter / admin) is enforced at the controller boundary; an applicant cannot access another applicant's application. |
| NFR-05 | At least one architecture rule is enforced as an automated test — example: the scoring engine never calls the disbursement adapter directly. |
| NFR-06 | Application assignment and state transitions are transactional — a loan cannot be disbursed or transitioned twice under concurrent requests. |

## Domain Rules Summary
- Loan lifecycle: `SUBMITTED -> UNDER_REVIEW -> (APPROVED | REJECTED | MANUAL_REVIEW) -> DISBURSED / CLOSED`.
- All money math is fixed-point (BigDecimal/decimal), never floating-point.
- All state transitions and decisions are append-only.
- Every per-feature spec below continues the `AC-NN` numbering from this document — never renumber an
  existing AC.

## Out of Scope
Real credit-bureau integration, real KYC/identity verification, real payment/core-banking disbursement,
collections and repayment servicing, regulatory reporting, production deployment/secret
management/multi-region. See `docs/business-case.md` for the full in/out-of-scope statement.
