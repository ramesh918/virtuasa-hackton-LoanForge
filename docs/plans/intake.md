# Execution Plan — Application Intake

## Title
Application Intake (AC-01, AC-05)

## Date
2026-09-06

## Status
Done

## Goal
Let an applicant submit a loan application and create it in `SUBMITTED` state, while preventing a
second active duplicate application for the same applicant+product within a configured window.

## Touched Files
- `specs/intake_spec.md` (already committed)
- `src/api/src/domain/money.ts` — `Money`/`Decimal` helper shared across modules
- `src/api/src/domain/exceptions.ts` — `DuplicateApplicationException`
- `src/api/src/modules/intake/dto/create-application.dto.ts`
- `src/api/src/modules/intake/schema/application.schema.ts`
- `src/api/src/modules/intake/repository/intake.repository.ts`
- `src/api/src/modules/intake/service/intake.service.ts`
- `src/api/src/modules/intake/controller/intake.controller.ts`
- `src/api/src/modules/intake/intake.module.ts`
- `src/api/src/modules/intake/service/intake.service.spec.ts`

## Order of Operations
1. Add `Money` domain helper (decimal.js-backed) and `DuplicateApplicationException` to `domain/`.
2. Define the Mongoose schema for `Application` with `applicationId`, `applicantId`, `productId`,
   `amount`/`income` as decimal strings, `tenureMonths`, `purpose`, `employmentType`, `state`,
   `createdAt`.
3. Repository: `create()`, `findActiveByApplicantAndProduct()` (state not in REJECTED/CLOSED, within
   the configured window).
4. Service: `submit(dto)` — checks for an active duplicate first (AC-05), then creates the application
   in `SUBMITTED` state with a generated `applicationId` (AC-01).
5. Controller: `POST /applications` wired to the service.
6. Unit tests against the service using an in-memory repository double (no live Mongo dependency for
   this test tier).

## Tests
- `AC-01`: "creates an application in SUBMITTED state with a unique application_id [AC-01]"
- `AC-05`: "rejects a duplicate active application for the same applicant+product within the window [AC-05]"
- `AC-05`: "allows a new application when the prior one is REJECTED [AC-05]"

## Open Questions
- Exact `DUPLICATE_WINDOW_DAYS` default — set to 30 for now; revisit once underwriting SLAs are defined.

## Risks
- Duplicate check race condition under concurrent submission is not fully addressed here — NFR-06's
  transactional guarantee is built out in the underwriting feature (step8) for state transitions; intake
  creation itself is a simple insert and lower risk, but a true concurrent-duplicate-submit test is
  deferred to the coverage audit step if time allows.
