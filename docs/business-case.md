# Business Case — LoanForge

Business context for reviewers. Rewritten from `docs/raw/loanforge-brd.md` for a reader who wants the
problem, the users, and the domain rules without reading the raw business narrative.

## Problem
Nord Retail Bank currently has no self-serve way for a retail customer to apply for a loan. Every
application depends on manual, human-in-the-loop steps: intake, a credit check, an eligibility judgment,
pricing, and a payout — each one a place where decisions can be inconsistent, slow, or under-documented.
LoanForge replaces that with a platform that applies bank policy consistently and automatically wherever
it can, and routes only the genuinely ambiguous cases to a human underwriter.

## Users
- **Applicant** — a retail customer applying for a personal or auto loan. Can submit an application,
  track its status, view an offer (rate, EMI, schedule), and accept or decline it. Can only ever see
  their own applications.
- **Underwriter** — bank staff who work a queue of applications that didn't get an automatic decision.
  Can approve, decline, or request more information, and every decision they make is permanently
  recorded against their identity and a timestamp.
- **Admin / compliance** — relies on the audit trail (state changes, decisions, disbursements) being
  complete and append-only, and on role boundaries being enforced so applicants and underwriters can
  only do what their role permits.

## Success Metrics
- An applicant can go from submission to a decision (auto or queued for review) without any phone call.
- Every REJECTED or MANUAL_REVIEW outcome carries a machine-readable reason, not just "declined."
- Zero double-disbursements and zero cross-applicant data leaks, even under concurrent requests.
- Every Acceptance Criterion in `specs/app_spec.md` is independently verifiable by a test.

## Domain Rules
- **Eligibility policy**: minimum income, an acceptable age band, and an acceptable employment type must
  all pass before an application can proceed; the first rule that fails determines the rejection reason.
- **Credit & DTI ceiling**: a credit score is derived from a stubbed bureau pull plus the applicant's
  income/obligation ratios; a debt-to-income ratio above the configured ceiling auto-declines the
  application regardless of the credit score itself.
- **Risk-based pricing**: the credit score maps to an interest-rate band, and the EMI offered is computed
  from that rate — always in fixed-point arithmetic, never floating-point.
- **Lifecycle state machine**: every application moves through
  `SUBMITTED -> UNDER_REVIEW -> (APPROVED | REJECTED | MANUAL_REVIEW) -> DISBURSED / CLOSED`, and any
  transition outside that table is rejected outright rather than silently applied.
- **Append-only audit**: application state changes, underwriting decisions, and disbursement records are
  never edited or deleted after the fact — only appended to.
- **Role separation**: applicants can only access their own applications; underwriter-only actions are
  enforced at the boundary where requests enter the system, not just hidden in the UI.

## Value Proposition
LoanForge gives Nord Retail Bank a faster, more consistent, and more auditable loan origination process:
applicants get an answer without waiting on a human for every case, underwriters spend their time only on
the applications that actually need judgment, and every outcome — automatic or manual — is explainable
and permanently recorded.

## In Scope / Out of Scope
**In scope**: application intake, eligibility and credit rules, risk-based pricing, the underwriting
workflow and review queue, disbursement and its audit trail, and the applicant/underwriter-facing
screens for all of the above.

**Out of scope**: real credit-bureau integration, real KYC/identity verification, real payment or
core-banking disbursement rails, collections and repayment servicing, regulatory reporting, and
production deployment/secret management/multi-region concerns. Every external integration point in this
phase is a stub standing in for the real system it represents.
