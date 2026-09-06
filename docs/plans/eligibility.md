# Execution Plan — Eligibility & Credit Rules

## Title
Eligibility & Credit Rules (AC-02, AC-03)

## Date
2026-09-06

## Status
Done

## Goal
Evaluate an already-submitted application against policy (income/age/employment) and a stubbed credit
pull with a DTI ceiling, rejecting with a machine-readable reason when a rule fails.

## Touched Files
- `specs/eligibility_spec.md` (already committed)
- `src/api/src/modules/intake/repository/intake.repository.ts` — add `findByApplicationId`,
  `updateState`
- `src/api/src/modules/intake/service/intake.service.ts` — add `findById`, `updateState`
- `src/api/src/modules/eligibility/config/eligibility.config.ts`
- `src/api/src/modules/eligibility/schema/applicant.schema.ts` — the applicant profile collection
  (seeded by `scripts/seed.ts`), separate from the `Application` document
- `src/api/src/modules/eligibility/repository/applicant.repository.ts`
- `src/api/src/modules/eligibility/service/bureau-stub.service.ts`
- `src/api/src/modules/eligibility/service/eligibility.service.ts`
- `src/api/src/modules/eligibility/eligibility.module.ts`
- `src/api/src/modules/eligibility/service/eligibility.service.spec.ts`

## Order of Operations
1. Extend `IntakeRepository`/`IntakeService` with `findById`/`updateState` so eligibility (and later
   underwriting/disbursement) can read and transition an application without eligibility reaching into
   intake's repository directly (architecture boundary: service-to-service only).
2. Add the `Applicant` schema/repository (profile: applicantId, name, income, age, employmentType) —
   this is genuinely separate data from the per-application snapshot captured at intake.
3. Add `eligibility.config.ts` with `MIN_INCOME`, `MIN_AGE`, `MAX_AGE`, `ELIGIBLE_EMPLOYMENT_TYPES`,
   `DTI_CEILING`.
4. Add `bureau-stub.service.ts`: a deterministic hash of `applicantId` producing a credit score
   (300–850) and existing monthly obligations, with no live network call.
5. Add `eligibility.service.ts`: `evaluate(applicationId)` — runs income/age/employment checks in that
   priority order (AC-02), then on pass runs the bureau pull and DTI check (AC-03), calling
   `intakeService.updateState(id, REJECTED)` on any failure and returning the decision either way.
6. Unit tests against `EligibilityService` using fake `IntakeService`/`ApplicantRepository` doubles.

## Tests
- `AC-02`: "rejects applicant below minimum income with INELIGIBLE_INCOME"
- `AC-02`: "rejects applicant outside age band with INELIGIBLE_AGE"
- `AC-02`: "rejects ineligible employment type with INELIGIBLE_EMPLOYMENT"
- `AC-03`: "computes a credit score from the stubbed bureau pull"
- `AC-03`: "auto-declines when DTI exceeds the configured ceiling with DTI_EXCEEDED"

## Open Questions
- DTI is computed as stubbed existing obligations ÷ income, ignoring the new loan's own EMI (which
  isn't known until pricing runs in step7). Revisit if a stricter definition is needed later.

## Risks
- `IntakeService.updateState` is a narrow, unguarded state write introduced now so eligibility can
  auto-reject; it does not yet enforce the full lifecycle transition table or the NFR-06 concurrency
  guard. The underwriting feature formalizes the real state machine and both intake's and eligibility's
  callers will be re-pointed at it then — tracked as an open item for that step, not a silent gap.
